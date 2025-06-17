import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as schema from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { compare, hash } from "bcryptjs";
import ConnectPgSimple from "connect-pg-simple";
import multer from "multer";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { stringify as csvStringify } from "csv-stringify";
import { createHash, randomBytes } from "crypto";
import { auditLogMiddleware, logActivity, AuditAction, EntityType } from "./auditLogger";

// Helper function to generate IDs
const generateId = (prefix: string, num: number) => {
  return `${prefix}${num.toString().padStart(5, "0")}`;
};

// Helper function to validate request body against schema
function validateBody<T>(schema: any, data: any): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(fromZodError(error).message);
    }
    throw error;
  }
}

// Authentication middleware
const authenticateUser = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Check if user has appropriate access level
const hasAccess = (minAccessLevel: number) => {
  return (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = req.user as schema.User;
    const userAccessLevel = parseInt(user.accessLevel);
    
    if (userAccessLevel < minAccessLevel) {
      return res.status(403).json({ message: "Forbidden: Insufficient access level" });
    }
    
    next();
  };
};

// File upload storage configuration
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session with PostgreSQL for persistence
  // Use memory store temporarily to bypass database connection issues
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "SimpleIT-bolt-secret",
      resave: false, 
      saveUninitialized: false,
      cookie: { 
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for longer persistence
        sameSite: 'lax'
      },
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Add audit logging middleware
  app.use(auditLogMiddleware);

  // Security questions list for the system
  const securityQuestionsList = [
    "What was your childhood nickname?",
    "What is your mother's maiden name?",
    "What was the name of your first pet?",
    "In what city were you born?",
    "What high school did you attend?",
    "What was the make of your first car?",
    "What is your favorite movie?",
    "What is your favorite color?",
    "What was your favorite food as a child?",
    "Who is your favorite actor/actress?"
  ];

  // Configure passport
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }

        const validPassword = await compare(password, user.password);
        if (!validPassword) {
          return done(null, false, { message: "Incorrect password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // API routes
  
  // Check if system is initialized (for first-time setup)
  app.get("/api/system-status", async (req, res) => {
    try {
      // Check if any user exists
      const users = await storage.getAllUsers();
      const hasUsers = users.length > 0;
      
      // Check if system config exists
      const systemConfig = await storage.getSystemConfig();
      
      res.json({
        initialized: hasUsers,
        config: !!systemConfig
      });
    } catch (error: any) {
      console.error("Error checking system status:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // First-time setup endpoint
  app.post("/api/setup", async (req, res) => {
    try {
      // Check if setup has already been completed
      const users = await storage.getAllUsers();
      if (users.length > 0) {
        return res.status(400).json({ message: "Setup has already been completed" });
      }
      
      const { username, password, email } = req.body;
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      if (username.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      // Hash the password
      const hashedPassword = await hash(password, 10);
      
      // Create the admin user
      const adminUser = await storage.createUser({
        username,
        password: hashedPassword,
        email: email || null,
        accessLevel: "3", // Admin level
      });
      
      // Get/create system config with defaults if it doesn't exist
      const systemConfig = await storage.getSystemConfig();
      
      // Log the setup completion
      await logActivity({
        userId: adminUser.id,
        action: AuditAction.CREATE,
        entityType: EntityType.USER,
        entityId: adminUser.id,
        details: { message: "Initial system setup completed" }
      });
      
      res.status(201).json({ 
        message: "Setup completed successfully",
        initialized: true
      });
    } catch (error: any) {
      console.error("Error during setup:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.json({ message: "Login successful", user: req.user });
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed", error: err });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
  
  // Security Questions API endpoints - combined implementation
  
  // Get default security questions for selection
  app.get("/api/security-questions", async (req, res) => {
    try {
      // Return a list of default security questions
      const defaultQuestions = [
        "What was your childhood nickname?",
        "In what city did you meet your spouse/significant other?",
        "What is the name of your favorite childhood friend?",
        "What street did you live on in third grade?",
        "What is your oldest sibling's middle name?",
        "What school did you attend for sixth grade?",
        "What was the name of your first stuffed animal?",
        "In what city or town did your mother and father meet?",
        "What was the make of your first car?",
        "What is your favorite movie?"
      ];
      
      res.json(defaultQuestions);
    } catch (error: any) {
      console.error("Error fetching default security questions:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });
  
  // Add endpoint for setting security questions for the current user
  app.post("/api/user/security-questions", authenticateUser, async (req, res) => {
    try {
      const userId = req.user?.id || 0;
      if (userId === 0) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { questions } = req.body;
      
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: "Security questions and answers are required" });
      }
      
      // First, delete any existing security questions for this user
      const existingQuestions = await storage.getSecurityQuestions(userId);
      for (const question of existingQuestions) {
        await storage.deleteSecurityQuestion(question.id);
      }
      
      // Then, add the new questions
      const savedQuestions = [];
      for (const q of questions) {
        if (!q.question || !q.answer) {
          continue;
        }
        
        const newQuestion = await storage.createSecurityQuestion({
          userId,
          question: q.question,
          answer: q.answer,
        });
        
        savedQuestions.push({
          id: newQuestion.id,
          question: newQuestion.question
        });
      }
      
      // Log the activity
      await logActivity({
        userId,
        action: AuditAction.UPDATE,
        entityType: EntityType.USER,
        entityId: userId,
        details: { message: 'Security questions updated' }
      });
      
      res.json({
        success: true,
        message: "Security questions saved successfully",
        questions: savedQuestions
      });
    } catch (error: any) {
      console.error("Error saving security questions:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });
  
  // Get current user's security questions (without answers)
  app.get("/api/user/security-questions", authenticateUser, async (req, res) => {
    try {
      const userId = req.user?.id || 0;
      if (userId === 0) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get security questions for this user
      const questions = await storage.getSecurityQuestions(userId);
      
      // Return only the questions (not the answers)
      const questionsList = questions.map(q => ({
        id: q.id,
        question: q.question
      }));
      
      res.json({ 
        questions: questionsList,
        hasSecurityQuestions: questionsList.length > 0
      });
    } catch (error) {
      console.error("Error fetching security questions:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error" });
    }
  });
  
  // The following routes are used by the forgot password flow (no authentication required)
  
  app.post("/api/forgot-password/find-user", async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get security questions for this user to check if they exist
      const questions = await storage.getSecurityQuestions(user.id);
      const hasSecurityQuestions = questions && questions.length > 0;
      
      // Return user ID without any sensitive information
      res.json({ 
        userId: user.id,
        hasSecurityQuestions
      });
    } catch (error: any) {
      console.error("Error in find user for password reset:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });
  
  // Step 2: Get security questions for a specific user
  app.get('/api/forgot-password/security-questions/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const questions = await storage.getSecurityQuestions(userId);
      
      if (!questions || questions.length === 0) {
        return res.status(404).json({ message: 'No security questions found for this user' });
      }
      
      // Return only the questions (not the answers) for security reasons
      const sanitizedQuestions = questions.map(q => ({
        id: q.id,
        question: q.question
      }));
      
      res.json({ questions: sanitizedQuestions });
    } catch (error: any) {
      console.error('Error getting security questions:', error);
      res.status(500).json({ message: error.message || 'Error getting security questions' });
    }
  });
  
  // Step 3: Verify security question answers
  app.post('/api/forgot-password/verify-answers', async (req, res) => {
    try {
      const { userId, answers } = req.body;
      
      if (!userId || !answers || !Array.isArray(answers)) {
        return res.status(400).json({ message: 'User ID and answers are required' });
      }
      
      // Verify answers
      const correctAnswers = await storage.verifySecurityQuestions(userId, answers);
      
      if (!correctAnswers) {
        return res.status(401).json({ 
          success: false, 
          message: 'Incorrect answers to security questions' 
        });
      }
      
      // Generate a reset token
      const resetToken = await storage.createPasswordResetToken(userId);
      
      res.json({
        success: true,
        token: resetToken.token
      });
    } catch (error: any) {
      console.error('Error verifying security answers:', error);
      res.status(500).json({ message: error.message || 'Error verifying security answers' });
    }
  });
  
  // Step 4: Reset password with token
  app.post('/api/forgot-password/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }
      
      // Validate token and get the associated user
      const userId = await storage.validatePasswordResetToken(token);
      
      if (!userId) {
        return res.status(404).json({ 
          success: false, 
          message: 'Invalid or expired token' 
        });
      }
      
      // Hash the new password
      const hashedPassword = await hash(newPassword, 10);
      
      // Update the user's password
      const updated = await storage.updateUser(userId, { password: hashedPassword });
      
      if (!updated) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to update password' 
        });
      }
      
      // Delete the used token
      await storage.invalidatePasswordResetToken(token);
      
      // Log the activity
      await logActivity({
        userId: userId,
        action: AuditAction.UPDATE,
        entityType: EntityType.USER,
        entityId: userId,
        details: { message: 'Password was reset using forgot password flow' }
      });
      
      res.json({
        success: true,
        message: 'Password has been reset successfully'
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: error.message || 'Error resetting password' });
    }
  });
  
  // Set up Security Questions for a user
  app.post("/api/security-questions/setup", authenticateUser, async (req, res) => {
    try {
      const userId = (req.user as schema.User).id;
      const { questions } = req.body;
      
      if (!questions || !Array.isArray(questions) || questions.length < 3) {
        return res.status(400).json({ message: "At least 3 security questions with answers are required" });
      }
      
      // Delete any existing security questions for this user
      const existingQuestions = await storage.getSecurityQuestions(userId);
      for (const question of existingQuestions) {
        await storage.deleteSecurityQuestion(question.id);
      }
      
      // Create new security questions
      const createdQuestions = [];
      for (const q of questions) {
        if (!q.question || !q.answer) {
          return res.status(400).json({ message: "Each security question must have both a question and an answer" });
        }
        
        const newQuestion = await storage.createSecurityQuestion({
          userId,
          question: q.question,
          answer: q.answer
        });
        
        createdQuestions.push({
          id: newQuestion.id,
          question: newQuestion.question
        });
      }
      
      // Log activity
      await storage.logActivity({
        userId,
        action: "Update",
        entityType: "User",
        entityId: userId,
        details: { action: "Set up security questions" }
      });
      
      res.json({ 
        success: true, 
        questionsCount: createdQuestions.length,
        questions: createdQuestions
      });
    } catch (error: any) {
      console.error("Error setting up security questions:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // User CRUD routes
  app.get("/api/users", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/:id", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const userData = validateBody<schema.InsertUser>(schema.insertUserSchema, req.body);
      
      // Hash the password
      const hashedPassword = await hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Create",
          entityType: "User",
          entityId: user.id,
          details: { username: user.username }
        });
      }
      
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/users/:id", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      
      // If password is being updated, hash it
      if (userData.password) {
        userData.password = await hash(userData.password, 10);
      }
      
      const updatedUser = await storage.updateUser(id, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Update",
          entityType: "User",
          entityId: updatedUser.id,
          details: { username: updatedUser.username }
        });
      }
      
      res.json(updatedUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/users/:id", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get user before deletion for activity log
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Delete",
          entityType: "User",
          entityId: id,
          details: { username: user.username }
        });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Employee CRUD routes
  app.get("/api/employees", authenticateUser, async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/employees/:id", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Raw endpoint for employee creation, bypassing schema validation
  app.post("/api/employees/create-raw", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      console.log("Creating new employee with data:", req.body);
      
      // Get prefix from system config
      const sysConfig = await storage.getSystemConfig();
      let empIdPrefix = "EMP-";
      if (sysConfig && sysConfig.empIdPrefix) {
        empIdPrefix = sysConfig.empIdPrefix;
      }
      
      // Use storage interface to get the next employee number
      const allEmployees = await storage.getAllEmployees();
      const nextId = allEmployees.length + 1;
      const empId = `${empIdPrefix}${nextId.toString().padStart(4, '0')}`;
      
      console.log(`Generated employee ID: ${empId}`);
      
      // Extract fields from request body
      const {
        englishName,
        arabicName = null,
        department,
        idNumber,
        title,
        directManager = null,
        employmentType,
        joiningDate,
        exitDate = null,
        status = 'Active',
        personalMobile = null,
        workMobile = null,
        personalEmail = null,
        corporateEmail = null,
        userId = null
      } = req.body;
      
      // Create employee with direct SQL
      const insertResult = await pool.query(`
        INSERT INTO employees (
          emp_id,
          english_name,
          arabic_name,
          department,
          id_number,
          title,
          direct_manager,
          employment_type,
          joining_date,
          exit_date,
          status,
          personal_mobile,
          work_mobile,
          personal_email,
          corporate_email,
          user_id,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
      `, [
        empId,
        englishName,
        arabicName,
        department,
        idNumber,
        title,
        directManager ? parseInt(directManager.toString()) : null,
        employmentType,
        joiningDate,
        exitDate,
        status,
        personalMobile,
        workMobile,
        personalEmail,
        corporateEmail,
        userId ? parseInt(userId.toString()) : null,
        new Date(),
        new Date()
      ]);
      
      // Get the employee from result
      const employee = insertResult.rows[0];
      
      console.log("Successfully created employee:", employee);
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Create",
          entityType: "Employee",
          entityId: employee.id,
          details: { name: employee.english_name, empId: employee.emp_id }
        });
      }
      
      res.status(201).json(employee);
    } catch (error: any) {
      console.error("Employee creation error:", error);
      res.status(400).json({ message: error.message || "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employeeData = req.body;
      
      const updatedEmployee = await storage.updateEmployee(id, employeeData);
      if (!updatedEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Update",
          entityType: "Employee",
          entityId: updatedEmployee.id,
          details: { name: updatedEmployee.englishName, empId: updatedEmployee.empId }
        });
      }
      
      res.json(updatedEmployee);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/employees/:id", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get employee before deletion for activity log
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const success = await storage.deleteEmployee(id);
      if (!success) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Delete",
          entityType: "Employee",
          entityId: id,
          details: { name: employee.englishName, empId: employee.empId }
        });
      }
      
      res.json({ message: "Employee deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Employee Import/Export
  app.post("/api/employees/import", authenticateUser, hasAccess(3), upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const results: schema.InsertEmployee[] = [];
      const errors: any[] = [];
      let counter = 0;
      
      // Convert buffer to readable stream
      const stream = Readable.from(req.file.buffer.toString());
      
      // Parse CSV
      stream
        .pipe(csvParser())
        .on('data', async (data) => {
          try {
            counter++;
            const employeeData: schema.InsertEmployee = {
              empId: data.empId || `EMP${counter.toString().padStart(5, "0")}`,
              englishName: data.englishName,
              arabicName: data.arabicName || null,
              department: data.department,
              idNumber: data.idNumber,
              title: data.title,
              directManager: data.directManager ? parseInt(data.directManager) : null,
              employmentType: data.employmentType as any,
              joiningDate: new Date(data.joiningDate),
              exitDate: data.exitDate ? new Date(data.exitDate) : null,
              status: (data.status || 'Active') as any,
              personalMobile: data.personalMobile || null,
              workMobile: data.workMobile || null,
              personalEmail: data.personalEmail || null,
              corporateEmail: data.corporateEmail || null,
              userId: data.userId ? parseInt(data.userId) : null
            };
            
            results.push(employeeData);
          } catch (error: any) {
            errors.push({ row: counter, error: error.message });
          }
        })
        .on('end', async () => {
          // Insert all valid employees
          const importedEmployees = [];
          
          for (const employee of results) {
            try {
              const newEmployee = await storage.createEmployee(employee);
              importedEmployees.push(newEmployee);
              
              // Log activity
              if (req.user) {
                await storage.logActivity({
                  userId: (req.user as schema.User).id,
                  action: "Import",
                  entityType: "Employee",
                  entityId: newEmployee.id,
                  details: { name: newEmployee.englishName, empId: newEmployee.empId }
                });
              }
            } catch (error: any) {
              errors.push({ employee: employee.englishName, error: error.message });
            }
          }
          
          res.json({ 
            message: "Import completed", 
            imported: importedEmployees.length,
            errors: errors.length > 0 ? errors : null
          });
        });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/employees/export", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      
      // Convert to CSV
      const fields = [
        'empId', 'englishName', 'arabicName', 'department', 'idNumber', 
        'title', 'directManager', 'employmentType', 'joiningDate', 'exitDate', 
        'status', 'personalMobile', 'workMobile', 'personalEmail', 'corporateEmail'
      ];
      
      let csv = fields.join(',') + '\n';
      
      employees.forEach(employee => {
        const row = fields.map(field => {
          const value = employee[field as keyof schema.Employee];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
          return value;
        }).join(',');
        csv += row + '\n';
      });
      
      // Set headers for file download
      res.setHeader('Content-Disposition', 'attachment; filename=employees.csv');
      res.setHeader('Content-Type', 'text/csv');
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Export",
          entityType: "Employee",
          details: { count: employees.length }
        });
      }
      
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Asset Template and Export Routes
  app.get("/api/assets/template", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      // Create template CSV with all the fields
      const templateData = [
        {
          'Type': 'Laptop',
          'Brand': 'Example Brand',
          'Model Number': 'M123456',
          'Model Name': 'Example Model',
          'Serial Number': 'SN123456789',
          'Specs': '16GB RAM, 512GB SSD, i7 Processor',
          'Status': 'Available',
          'Purchase Date': '2023-01-15',
          'Purchase Price': '1200.00',
          'Warranty Expiry Date': '2025-01-15',
          'Out Of Box OS': 'Windows 11',
          'Life Span (months)': '36'
        }
      ];
      
      // Convert to CSV using csv-stringify
      csvStringify(templateData, { header: true }, (err, output) => {
        if (err) {
          throw new Error('Error generating CSV template');
        }
        
        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=asset-template.csv');
        
        // Send CSV data
        res.send(output);
      });
      
    } catch (error: any) {
      console.error('Error generating asset template:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/assets/export/csv", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const assets = await storage.getAllAssets();
      
      // Get employees for mapping assignedEmployeeId to employee names
      const employees = await storage.getAllEmployees();
      const employeeMap = new Map();
      employees.forEach(emp => {
        employeeMap.set(emp.id, emp.englishName);
      });
      
      // Transform asset data for CSV export
      const csvData = assets.map(asset => {
        const assignedTo = asset.assignedEmployeeId ? 
          employeeMap.get(asset.assignedEmployeeId) || '' : '';
          
        return {
          'Asset ID': asset.assetId,
          'Type': asset.type,
          'Brand': asset.brand,
          'Model Number': asset.modelNumber || '',
          'Model Name': asset.modelName || '',
          'Serial Number': asset.serialNumber,
          'Status': asset.status,
          'Specs': asset.specs || '',
          'Purchase Date': asset.purchaseDate ? 
            new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
          'Purchase Price': asset.buyPrice || '',
          'Warranty Expiry Date': asset.warrantyExpiryDate ? 
            new Date(asset.warrantyExpiryDate).toISOString().split('T')[0] : '',
          'Life Span (months)': asset.lifeSpan || '',
          'Factory OS': asset.outOfBoxOs || '',
          'Assigned To': assignedTo,
          'Last Updated': asset.updatedAt ? 
            new Date(asset.updatedAt).toISOString().split('T')[0] : ''
        };
      });
      
      // Convert to CSV using csv-stringify
      csvStringify(csvData, { header: true }, (err, output) => {
        if (err) {
          throw new Error('Error generating CSV export');
        }
        
        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=assets-export.csv');
        
        // Send CSV data
        res.send(output);
        
        // Log activity
        if (req.user) {
          logActivity({
            userId: (req.user as schema.User).id,
            action: AuditAction.EXPORT,
            entityType: EntityType.ASSET,
            details: { count: assets.length }
          });
        }
      });
    } catch (error: any) {
      console.error('Error exporting assets to CSV:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Asset CRUD routes
  app.get("/api/assets", authenticateUser, async (req, res) => {
    try {
      const user = req.user as schema.User;
      const userAccessLevel = parseInt(user.accessLevel);
      
      // If user has level 1 access (User), only show assets that aren't being modified
      if (userAccessLevel === 1) {
        const assets = await storage.getAllAssets();
        // Filter out assets that are in maintenance, being sold, etc.
        const filteredAssets = assets.filter(asset => 
          asset.status === 'Available' || asset.status === 'In Use'
        );
        res.json(filteredAssets);
      } else {
        // Admin/Manager can see all assets
        const assets = await storage.getAllAssets();
        res.json(assets);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/assets/:id", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const asset = await storage.getAsset(id);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      const user = req.user as schema.User;
      const userAccessLevel = parseInt(user.accessLevel);
      
      // If user is access level 1 (User role) and asset is not viewable
      if (userAccessLevel === 1 && 
          asset.status !== 'Available' && 
          asset.status !== 'In Use') {
        return res.status(403).json({ 
          message: "You don't have permission to view this asset" 
        });
      }
      
      res.json(asset);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/assets", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      // Get the request data but omit assetId as we'll auto-generate it
      let requestData = { ...req.body };
      delete requestData.assetId;
      
      // Get system config for asset ID prefix
      let assetPrefix = "SIT-";
      const sysConfig = await storage.getSystemConfig();
      if (sysConfig && sysConfig.assetIdPrefix) {
        assetPrefix = sysConfig.assetIdPrefix;
      }
      
      // Find highest existing asset number to generate a new one
      const allAssets = await storage.getAllAssets();
      let highestNum = 0;
      
      allAssets.forEach(asset => {
        const parts = asset.assetId.split('-');
        if (parts.length > 2) {
          const numPart = parts[parts.length - 1];
          const num = parseInt(numPart);
          if (!isNaN(num) && num > highestNum) {
            highestNum = num;
          }
        }
      });
      
      const newAssetNum = highestNum + 1;
      
      // Add type prefix
      let typePrefix = "";
      switch (requestData.type) {
        case "Laptop": typePrefix = "LT-"; break;
        case "Desktop": typePrefix = "DT-"; break;
        case "Mobile": typePrefix = "MB-"; break;
        case "Tablet": typePrefix = "TB-"; break;
        case "Monitor": typePrefix = "MN-"; break;
        case "Printer": typePrefix = "PR-"; break;
        case "Server": typePrefix = "SV-"; break;
        case "Network": typePrefix = "NW-"; break;
        default: typePrefix = "OT-";
      }
      
      // Auto-generate the asset ID
      requestData.assetId = `${assetPrefix}${typePrefix}${newAssetNum.toString().padStart(4, "0")}`;
      
      // Validate data after adding the assetId
      const assetData = validateBody<schema.InsertAsset>(schema.insertAssetSchema, requestData);
      
      const asset = await storage.createAsset(assetData);
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Create",
          entityType: "Asset",
          entityId: asset.id,
          details: { assetId: asset.assetId, type: asset.type, brand: asset.brand }
        });
      }
      
      res.status(201).json(asset);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/assets/:id", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assetData = req.body;
      
      const updatedAsset = await storage.updateAsset(id, assetData);
      if (!updatedAsset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Update",
          entityType: "Asset",
          entityId: updatedAsset.id,
          details: { assetId: updatedAsset.assetId, type: updatedAsset.type }
        });
      }
      
      res.json(updatedAsset);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/assets/:id", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get asset before deletion for activity log
      const asset = await storage.getAsset(id);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      const success = await storage.deleteAsset(id);
      if (!success) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Delete",
          entityType: "Asset",
          entityId: id,
          details: { assetId: asset.assetId, type: asset.type }
        });
      }
      
      res.json({ message: "Asset deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Asset Assign/Unassign
  app.post("/api/assets/:id/assign", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { employeeId } = req.body;
      
      if (!employeeId) {
        return res.status(400).json({ message: "Employee ID is required" });
      }
      
      // Check if asset exists
      const asset = await storage.getAsset(id);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      // Check if employee exists
      const employee = await storage.getEmployee(parseInt(employeeId));
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Update asset
      const updatedAsset = await storage.updateAsset(id, {
        assignedEmployeeId: parseInt(employeeId),
        status: "In Use"
      });
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Assign",
          entityType: "Asset",
          entityId: id,
          details: { 
            assetId: asset.assetId, 
            type: asset.type, 
            assignedTo: employee.englishName,
            employeeId: employee.empId
          }
        });
      }
      
      res.json(updatedAsset);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/assets/:id/unassign", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if asset exists and is assigned
      const asset = await storage.getAsset(id);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      if (!asset.assignedEmployeeId) {
        return res.status(400).json({ message: "Asset is not assigned to any employee" });
      }
      
      // Get employee details for activity log
      const employee = await storage.getEmployee(asset.assignedEmployeeId);
      
      // Update asset
      const updatedAsset = await storage.updateAsset(id, {
        assignedEmployeeId: null,
        status: "Available"
      });
      
      // Log activity
      if (req.user && employee) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Unassign",
          entityType: "Asset",
          entityId: id,
          details: { 
            assetId: asset.assetId, 
            type: asset.type, 
            unassignedFrom: employee.englishName,
            employeeId: employee.empId
          }
        });
      }
      
      res.json(updatedAsset);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Asset Maintenance
  app.post("/api/assets/:id/maintenance", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const assetId = parseInt(req.params.id);
      
      // Check if asset exists
      const asset = await storage.getAsset(assetId);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      // Handle cost field properly
      let requestData = { ...req.body };
      if (requestData.cost === undefined || requestData.cost === null || requestData.cost === '') {
        requestData.cost = 0;
      }
      
      const maintenanceData = validateBody<schema.InsertAssetMaintenance>(
        schema.insertAssetMaintenanceSchema, 
        { ...requestData, assetId }
      );
      
      const maintenance = await storage.createAssetMaintenance(maintenanceData);
      
      // Update asset status if needed
      if (asset.status !== "Maintenance") {
        await storage.updateAsset(assetId, { status: "Maintenance" });
      }
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Maintenance",
          entityType: "Asset",
          entityId: assetId,
          details: { 
            assetId: asset.assetId, 
            type: asset.type,
            maintenanceType: maintenance.type,
            cost: maintenance.cost
          }
        });
      }
      
      res.status(201).json(maintenance);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/assets/:id/maintenance", authenticateUser, async (req, res) => {
    try {
      const assetId = parseInt(req.params.id);
      
      // Check if asset exists
      const asset = await storage.getAsset(assetId);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      const maintenanceRecords = await storage.getMaintenanceForAsset(assetId);
      
      res.json(maintenanceRecords);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Asset Transaction APIs
  app.get("/api/assets/:id/transactions", authenticateUser, async (req, res) => {
    try {
      const assetId = parseInt(req.params.id);
      
      // Check if asset exists
      const asset = await storage.getAsset(assetId);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      const user = req.user as schema.User;
      const userAccessLevel = parseInt(user.accessLevel);
      
      // If user has level 1 access (User), check if they can see this asset
      if (userAccessLevel === 1 && 
          asset.status !== 'Available' && 
          asset.status !== 'In Use') {
        return res.status(403).json({ 
          message: "You don't have permission to view this asset's transactions" 
        });
      }
      
      const transactions = await storage.getAssetTransactions(assetId);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get all asset transactions with optional filtering
  app.get("/api/asset-transactions", authenticateUser, async (req, res) => {
    try {
      // Get query parameters for filtering
      const assetId = req.query.assetId ? parseInt(req.query.assetId as string) : undefined;
      const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
      const type = req.query.type as string | undefined;
      
      // Get all transactions
      let transactions = await storage.getAllAssetTransactions();
      
      // Apply filters if provided
      if (assetId) {
        transactions = transactions.filter(t => t.assetId === assetId);
      }
      if (employeeId) {
        transactions = transactions.filter(t => t.employeeId === employeeId);
      }
      if (type) {
        transactions = transactions.filter(t => t.type === type);
      }
      
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/employees/:id/transactions", authenticateUser, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      
      // Check if employee exists
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const transactions = await storage.getEmployeeTransactions(employeeId);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/assets/:id/check-out", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const assetId = parseInt(req.params.id);
      const { employeeId, notes, type } = req.body;
      
      if (!employeeId) {
        return res.status(400).json({ message: "Employee ID is required" });
      }
      
      // Check if asset exists
      const asset = await storage.getAsset(assetId);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      // Check if employee exists
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      console.log("Checking out asset with data:", { assetId, employeeId, notes, type });
      
      // Pass the transaction type to the storage method
      const transaction = await storage.checkOutAsset(assetId, employeeId, notes, type);
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "ASSIGN",
          entityType: "ASSET",
          entityId: assetId,
          details: { 
            assetId: asset.assetId,
            employeeId: employeeId,
            transactionId: transaction.id,
            notes: notes || `Asset checked out to employee ${employee.englishName}`
          }
        });
      }
      
      res.status(201).json(transaction);
    } catch (error: any) {
      console.error("Error checking out asset:", error);
      res.status(400).json({ message: error.message });
    }
  });
  
  app.post("/api/assets/:id/check-in", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const assetId = parseInt(req.params.id);
      const { notes, type } = req.body;
      
      // Check if asset exists
      const asset = await storage.getAsset(assetId);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      console.log("Checking in asset with data:", { assetId, notes, type });
      
      // Pass the transaction type to the storage method
      const transaction = await storage.checkInAsset(assetId, notes, type);
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "UNASSIGN",
          entityType: "ASSET",
          entityId: assetId,
          details: { 
            assetId: asset.assetId,
            transactionId: transaction.id,
            notes: notes || "Asset checked in"
          }
        });
      }
      
      res.status(201).json(transaction);
    } catch (error: any) {
      console.error("Error checking in asset:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Asset Sales
  app.post("/api/asset-sales", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const { buyer, date, totalAmount, notes, assetIds } = req.body;
      
      if (!buyer || !date || !totalAmount || !assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Create the sale
      const saleData: schema.InsertAssetSale = {
        buyer,
        date: new Date(date),
        totalAmount,
        notes: notes || null
      };
      
      const sale = await storage.createAssetSale(saleData);
      
      // Add assets to the sale
      const assets = [];
      for (const assetId of assetIds) {
        const asset = await storage.getAsset(parseInt(assetId));
        if (!asset) {
          continue;
        }
        
        // Add to sale
        const saleItem: schema.InsertAssetSaleItem = {
          saleId: sale.id,
          assetId: asset.id,
          amount: totalAmount / assetIds.length // Distribute evenly for simplicity
        };
        
        await storage.addAssetToSale(saleItem);
        
        // Update asset status
        await storage.updateAsset(asset.id, { status: "Sold" });
        
        assets.push(asset);
      }
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Sale",
          entityType: "Asset",
          details: { 
            buyer,
            date,
            totalAmount,
            assetCount: assetIds.length,
            assetIds: assets.map(a => a.assetId).join(', ')
          }
        });
      }
      
      res.status(201).json({ sale, assetsSold: assets.length });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/asset-sales", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const sales = await storage.getAssetSales();
      res.json(sales);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Improved Asset Import handler
  app.post("/api/assets/import", authenticateUser, hasAccess(3), upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const results: schema.InsertAsset[] = [];
      const errors: any[] = [];
      let counter = 0;
      
      // Get system config for asset ID prefix
      let assetPrefix = "BOLT-";
      const sysConfig = await storage.getSystemConfig();
      if (sysConfig && sysConfig.assetIdPrefix) {
        assetPrefix = sysConfig.assetIdPrefix;
      }
      
      // Convert buffer to readable stream
      const stream = Readable.from(req.file.buffer.toString());
      
      // Parse CSV
      stream
        .pipe(csvParser())
        .on('data', async (data) => {
          try {
            counter++;
            
            // Generate asset ID if not provided
            let assetId = data.assetId;
            if (!assetId) {
              // Add type prefix
              let typePrefix = "";
              switch (data.type) {
                case "Laptop": typePrefix = "LT-"; break;
                case "Desktop": typePrefix = "DT-"; break;
                case "Mobile": typePrefix = "MB-"; break;
                case "Tablet": typePrefix = "TB-"; break;
                case "Monitor": typePrefix = "MN-"; break;
                case "Printer": typePrefix = "PR-"; break;
                case "Server": typePrefix = "SV-"; break;
                case "Network": typePrefix = "NW-"; break;
                default: typePrefix = "OT-";
              }
              
              assetId = `${assetPrefix}${typePrefix}${counter.toString().padStart(4, "0")}`;
            }
            
            const assetData: schema.InsertAsset = {
              assetId,
              type: data.type as any,
              brand: data.brand,
              modelNumber: data.modelNumber || null,
              modelName: data.modelName || null,
              serialNumber: data.serialNumber,
              specs: data.specs || null,
              status: (data.status || 'Available') as any,
              purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
              buyPrice: data.buyPrice ? parseFloat(data.buyPrice) : null,
              warrantyExpiryDate: data.warrantyExpiryDate ? new Date(data.warrantyExpiryDate) : null,
              lifeSpan: data.lifeSpan ? parseInt(data.lifeSpan) : null,
              outOfBoxOs: data.outOfBoxOs || null,
              assignedEmployeeId: data.assignedEmployeeId ? parseInt(data.assignedEmployeeId) : null
            };
            
            results.push(assetData);
          } catch (error: any) {
            errors.push({ row: counter, error: error.message });
          }
        })
        .on('end', async () => {
          // Insert all valid assets
          const importedAssets = [];
          
          for (const asset of results) {
            try {
              const newAsset = await storage.createAsset(asset);
              importedAssets.push(newAsset);
              
              // Log activity
              if (req.user) {
                await storage.logActivity({
                  userId: (req.user as schema.User).id,
                  action: "Import",
                  entityType: "Asset",
                  entityId: newAsset.id,
                  details: { assetId: newAsset.assetId, type: newAsset.type, brand: newAsset.brand }
                });
              }
            } catch (error: any) {
              errors.push({ asset: asset.assetId, error: error.message });
            }
          }
          
          res.json({ 
            message: "Import completed", 
            imported: importedAssets.length,
            errors: errors.length > 0 ? errors : null
          });
        });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/assets/export", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const assets = await storage.getAllAssets();
      
      // Convert to CSV
      const fields = [
        'assetId', 'type', 'brand', 'modelNumber', 'modelName', 
        'serialNumber', 'specs', 'status', 'purchaseDate', 'buyPrice', 
        'warrantyExpiryDate', 'lifeSpan', 'outOfBoxOs', 'assignedEmployeeId'
      ];
      
      let csv = fields.join(',') + '\n';
      
      assets.forEach(asset => {
        const row = fields.map(field => {
          const value = asset[field as keyof schema.Asset];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
          return value;
        }).join(',');
        csv += row + '\n';
      });
      
      // Set headers for file download
      res.setHeader('Content-Disposition', 'attachment; filename=assets.csv');
      res.setHeader('Content-Type', 'text/csv');
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Export",
          entityType: "Asset",
          details: { count: assets.length }
        });
      }
      
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Ticket CRUD routes
  app.get("/api/tickets", authenticateUser, async (req, res) => {
    try {
      const user = req.user as schema.User;
      const userAccessLevel = parseInt(user.accessLevel);
      
      // If user has level 1 access (User), only show tickets they're assigned to
      // or ones they've submitted through an employee profile
      if (userAccessLevel === 1) {
        const allTickets = await storage.getAllTickets();
        // Get the employee record for this user if exists
        const userEmployee = await storage.getEmployeeByUserId(user.id);
        
        const filteredTickets = allTickets.filter(ticket => {
          // Show tickets assigned to this user
          if (ticket.assignedToId === user.id) return true;
          
          // Show tickets submitted by this user through employee profile
          if (userEmployee && ticket.submittedById === userEmployee.id) return true;
          
          // Otherwise don't show the ticket
          return false;
        });
        
        res.json(filteredTickets);
      } else {
        // Admin/Manager can see all tickets
        const tickets = await storage.getAllTickets();
        res.json(tickets);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/tickets/:id", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await storage.getTicket(id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const user = req.user as schema.User;
      const userAccessLevel = parseInt(user.accessLevel);
      
      // If user has level 1 access (User), verify they have permission to view this ticket
      if (userAccessLevel === 1) {
        // Check if user is assigned to this ticket
        if (ticket.assignedToId === user.id) {
          return res.json(ticket);
        }
        
        // Check if user submitted this ticket through employee profile
        const userEmployee = await storage.getEmployeeByUserId(user.id);
        if (userEmployee && ticket.submittedById === userEmployee.id) {
          return res.json(ticket);
        }
        
        // User doesn't have permission to view this ticket
        return res.status(403).json({ 
          message: "You don't have permission to view this ticket" 
        });
      }
      
      // Admin/Manager can view any ticket
      res.json(ticket);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tickets/create-raw", authenticateUser, async (req, res) => {
    try {
      console.log("Creating new ticket with storage system:", req.body);
      
      // Get system config for ticket ID prefix
      const sysConfig = await storage.getSystemConfig();
      let ticketIdPrefix = "TKT-";
      if (sysConfig && sysConfig.ticketIdPrefix) {
        ticketIdPrefix = sysConfig.ticketIdPrefix;
      }
      
      // Use storage interface to get the next ticket number
      const allTickets = await storage.getAllTickets();
      const nextId = allTickets.length + 1;
      const ticketId = `${ticketIdPrefix}${nextId.toString().padStart(4, '0')}`;
      
      console.log(`Generated ticket ID: ${ticketId}`);
      
      // Create ticket data
      const ticketData = {
        ticketId,
        submittedById: parseInt(req.body.submittedById.toString()),
        requestType: req.body.requestType || req.body.category,
        priority: req.body.priority,
        description: req.body.description,
        status: 'Open' as const,
        relatedAssetId: req.body.relatedAssetId ? parseInt(req.body.relatedAssetId.toString()) : null,
      };
      
      // Create the ticket using storage interface
      const newTicket = await storage.createTicket(ticketData);
      
      console.log("Ticket creation successful:", newTicket);
      
      // Log the activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Create",
          entityType: "Ticket",
          entityId: newTicket.id,
          details: { 
            ticketId: newTicket.ticketId,
            requestType: newTicket.requestType, 
            priority: newTicket.priority 
          }
        });
      }
      
      res.status(201).json({
        message: "Ticket created successfully",
        ticket: newTicket
      });
    } catch (error: any) {
      console.error("Ticket creation failed:", error);
      res.status(500).json({ message: "Failed to create ticket: " + error.message });
    }
  });

  app.put("/api/tickets/:id", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticketData = req.body;
      
      const updatedTicket = await storage.updateTicket(id, ticketData);
      if (!updatedTicket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Update",
          entityType: "Ticket",
          entityId: updatedTicket.id,
          details: { 
            ticketId: updatedTicket.ticketId, 
            status: updatedTicket.status,
            assignedToId: updatedTicket.assignedToId
          }
        });
      }
      
      res.json(updatedTicket);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Ticket Assignment
  app.post("/api/tickets/:id/assign", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Check if ticket exists
      const ticket = await storage.getTicket(id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check if user exists
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update ticket
      const updatedTicket = await storage.updateTicket(id, {
        assignedToId: parseInt(userId),
        status: ticket.status === "Open" ? "In Progress" : ticket.status
      });
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Assign",
          entityType: "Ticket",
          entityId: id,
          details: { 
            ticketId: ticket.ticketId, 
            assignedTo: user.username,
            previousStatus: ticket.status,
            newStatus: updatedTicket?.status
          }
        });
      }
      
      res.json(updatedTicket);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Ticket Status Update
  app.post("/api/tickets/:id/status", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, resolutionNotes } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // Check if ticket exists
      const ticket = await storage.getTicket(id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Update ticket
      const updatedTicket = await storage.updateTicket(id, {
        status: status as any,
        resolutionNotes: status === "Resolved" || status === "Closed" ? resolutionNotes : ticket.resolutionNotes
      });
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Status Update",
          entityType: "Ticket",
          entityId: id,
          details: { 
            ticketId: ticket.ticketId, 
            previousStatus: ticket.status,
            newStatus: status,
            resolutionNotes: resolutionNotes || null
          }
        });
      }
      
      res.json(updatedTicket);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Employee's tickets
  app.get("/api/employees/:id/tickets", authenticateUser, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      
      // Check if employee exists
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const tickets = await storage.getTicketsForEmployee(employeeId);
      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Employee's assets
  app.get("/api/employees/:id/assets", authenticateUser, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      
      // Check if employee exists
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const assets = await storage.getAssetsForEmployee(employeeId);
      res.json(assets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // System Configuration
  app.get("/api/system-config", authenticateUser, async (req, res) => {
    try {
      const config = await storage.getSystemConfig();
      res.json(config || { language: "English", assetIdPrefix: "BOLT-" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Audit Logs
  app.get("/api/audit-logs", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const filter = req.query.filter as string;
      const entityType = req.query.entityType as string;
      const action = req.query.action as string;
      const userId = req.query.userId as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      const logs = await storage.getActivityLogs({
        page,
        limit,
        filter,
        entityType,
        action,
        userId: userId ? parseInt(userId) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      });
      
      // Get users for populating user information
      const users = await storage.getAllUsers();
      const userMap = users.reduce((map, user) => {
        map[user.id] = user;
        return map;
      }, {} as Record<number, schema.User>);
      
      // Enhance logs with user information
      const enhancedLogs = logs.data.map(log => ({
        ...log,
        user: log.userId ? {
          id: userMap[log.userId]?.id,
          username: userMap[log.userId]?.username
        } : null
      }));
      
      res.json({
        data: enhancedLogs,
        pagination: logs.pagination
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Clear audit logs (admin only)
  app.delete("/api/audit-logs", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const { olderThan, entityType, action } = req.body;
      
      // Parse olderThan date if provided
      const olderThanDate = olderThan ? new Date(olderThan) : undefined;
      
      // Clear logs based on provided filters
      const deletedCount = await storage.clearActivityLogs({
        olderThan: olderThanDate,
        entityType,
        action
      });
      
      // Log the clear action itself
      if (req.user) {
        await logActivity({
          userId: (req.user as any).id,
          action: AuditAction.DELETE,
          entityType: EntityType.REPORT,
          details: { 
            message: 'Audit logs cleared',
            deletedCount,
            filters: { olderThan, entityType, action }
          }
        });
      }
      
      res.json({ 
        success: true, 
        deletedCount,
        message: `Successfully cleared ${deletedCount} audit log entries` 
      });
    } catch (error: any) {
      console.error("Error clearing audit logs:", error);
      res.status(500).json({ message: error.message || "Failed to clear audit logs" });
    }
  });
  
  // Export audit logs to CSV
  app.get("/api/audit-logs/export", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      // Get all logs without pagination for export
      const filter = req.query.filter as string;
      const entityType = req.query.entityType as string;
      const action = req.query.action as string;
      const userId = req.query.userId as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      const logs = await storage.getActivityLogs({
        page: 1,
        limit: 10000, // High limit to get all logs
        filter,
        entityType,
        action,
        userId: userId ? parseInt(userId) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      });
      
      // Get users for populating user information
      const users = await storage.getAllUsers();
      const userMap = users.reduce((map, user) => {
        map[user.id] = user;
        return map;
      }, {} as Record<number, schema.User>);
      
      // CSV headers
      const headers = ['ID', 'Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Details'];
      
      // Generate CSV content
      const csvContent = [
        headers.join(','),
        ...logs.data.map(log => [
          log.id,
          new Date(log.createdAt).toISOString(),
          log.userId ? userMap[log.userId]?.username || 'Unknown' : 'System',
          log.action,
          log.entityType,
          log.entityId || '',
          log.details ? JSON.stringify(log.details).replace(/,/g, ';').replace(/"/g, '""') : ''
        ].join(','))
      ].join('\n');
      
      // Log the export activity
      if (req.user) {
        await logActivity({
          userId: (req.user as schema.User).id,
          action: AuditAction.EXPORT,
          entityType: EntityType.REPORT,
          details: { 
            type: 'Audit Logs', 
            count: logs.data.length,
            filters: { filter, entityType, action, userId, startDate, endDate }
          }
        });
      }
      
      // Set response headers for CSV download
      res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      res.setHeader('Content-Type', 'text/csv');
      res.send(csvContent);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put("/api/system-config", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const configData = req.body;
      const updatedConfig = await storage.updateSystemConfig(configData);
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Update",
          entityType: "SystemConfig",
          details: configData
        });
      }
      
      res.json(updatedConfig);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Remove Demo Data
  app.post("/api/remove-demo-data", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      // Implement a database transaction to ensure atomicity
      await storage.removeDemoData();
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "CONFIG_CHANGE",
          entityType: "SYSTEM_CONFIG",
          details: { action: "Remove Demo Data" }
        });
      }
      
      res.json({ 
        success: true, 
        message: "All demo data has been successfully removed." 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  });

  // Activity Log
  app.get("/api/activity-log", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const activities = await storage.getRecentActivity(limit);
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Dashboard Summary
  app.get("/api/dashboard/summary", authenticateUser, async (req, res) => {
    try {
      const [
        employees,
        assets,
        openTickets,
        userCount
      ] = await Promise.all([
        storage.getAllEmployees(),
        storage.getAllAssets(),
        storage.getTicketsByStatus("Open"),
        storage.getAllUsers()
      ]);
      
      // Calculate total asset value
      const totalAssetValue = assets.reduce((sum, asset) => {
        return sum + (asset.buyPrice ? parseFloat(asset.buyPrice.toString()) : 0);
      }, 0);
      
      // Count assets by type
      const assetsByType = assets.reduce((acc: Record<string, number>, asset) => {
        acc[asset.type] = (acc[asset.type] || 0) + 1;
        return acc;
      }, {});
      
      // Count assets by status
      const assetsByStatus = assets.reduce((acc: Record<string, number>, asset) => {
        acc[asset.status] = (acc[asset.status] || 0) + 1;
        return acc;
      }, {});
      
      // Count employees by department
      const employeesByDepartment = employees.reduce((acc: Record<string, number>, employee) => {
        acc[employee.department] = (acc[employee.department] || 0) + 1;
        return acc;
      }, {});
      
      // Get recent assets
      const recentAssets = assets.slice(0, 5);
      
      // Get recent tickets
      const allTickets = await storage.getAllTickets();
      const recentTickets = allTickets.slice(0, 5);
      
      // Get recent activity
      const recentActivity = await storage.getRecentActivity(5);
      
      res.json({
        counts: {
          employees: employees.length,
          assets: assets.length,
          activeTickets: openTickets.length,
          users: userCount.length,
          totalAssetValue
        },
        assetsByType,
        assetsByStatus,
        employeesByDepartment,
        recentAssets,
        recentTickets,
        recentActivity
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Asset Transactions
  app.get("/api/asset-transactions", authenticateUser, async (req, res) => {
    try {
      const { assetId, employeeId } = req.query;
      
      let transactions;
      if (assetId) {
        transactions = await storage.getAssetTransactions(Number(assetId));
      } else if (employeeId) {
        transactions = await storage.getEmployeeTransactions(Number(employeeId));
      } else {
        transactions = await storage.getAllAssetTransactions();
      }
      
      res.json(transactions);
    } catch (error: any) {
      console.error("Error fetching asset transactions:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Reports
  app.get("/api/reports/employees", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      
      // Active vs Exited Employees
      const activeEmployees = employees.filter(e => e.status === "Active");
      const exitedEmployees = employees.filter(e => e.status !== "Active");
      
      // Employee Count per Department
      const departmentCounts: Record<string, number> = {};
      employees.forEach(employee => {
        departmentCounts[employee.department] = (departmentCounts[employee.department] || 0) + 1;
      });
      
      // Employment Type Summary
      const employmentTypes: Record<string, number> = {};
      employees.forEach(employee => {
        employmentTypes[employee.employmentType] = (employmentTypes[employee.employmentType] || 0) + 1;
      });
      
      // Upcoming Exits
      const today = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(today.getDate() + 30);
      
      const upcomingExits = employees.filter(employee => {
        if (!employee.exitDate) return false;
        const exitDate = new Date(employee.exitDate);
        return exitDate >= today && exitDate <= thirtyDaysLater;
      });
      
      res.json({
        activeVsExited: {
          active: activeEmployees.length,
          exited: exitedEmployees.length
        },
        departmentCounts,
        employmentTypes,
        upcomingExits
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/reports/assets", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const assets = await storage.getAllAssets();
      
      // Asset Summary by Type
      const assetsByType: Record<string, number> = {};
      assets.forEach(asset => {
        assetsByType[asset.type] = (assetsByType[asset.type] || 0) + 1;
      });
      
      // Asset Summary by Status
      const assetsByStatus: Record<string, number> = {};
      assets.forEach(asset => {
        assetsByStatus[asset.status] = (assetsByStatus[asset.status] || 0) + 1;
      });
      
      // Assigned vs Unassigned Assets
      const assignedAssets = assets.filter(a => a.assignedEmployeeId !== null);
      const unassignedAssets = assets.filter(a => a.assignedEmployeeId === null);
      
      // Assets Nearing Warranty Expiry
      const today = new Date();
      const ninetyDaysLater = new Date();
      ninetyDaysLater.setDate(today.getDate() + 90);
      
      const nearingWarrantyExpiry = assets.filter(asset => {
        if (!asset.warrantyExpiryDate) return false;
        const warrantyDate = new Date(asset.warrantyExpiryDate);
        return warrantyDate >= today && warrantyDate <= ninetyDaysLater;
      });
      
      // Total Purchase Cost
      const totalPurchaseCost = assets.reduce((sum, asset) => {
        return sum + (asset.buyPrice ? parseFloat(asset.buyPrice.toString()) : 0);
      }, 0);
      
      // Asset Lifespan Utilization
      const assetLifespanUtilization = assets
        .filter(asset => asset.purchaseDate && asset.lifeSpan)
        .map(asset => {
          const purchaseDate = new Date(asset.purchaseDate!);
          const lifespanMonths = asset.lifeSpan!;
          const lifespanEnd = new Date(purchaseDate);
          lifespanEnd.setMonth(lifespanEnd.getMonth() + lifespanMonths);
          
          const totalLifespan = lifespanEnd.getTime() - purchaseDate.getTime();
          const usedLifespan = today.getTime() - purchaseDate.getTime();
          const utilizationPercentage = (usedLifespan / totalLifespan) * 100;
          
          return {
            assetId: asset.assetId,
            type: asset.type,
            brand: asset.brand,
            purchaseDate: asset.purchaseDate,
            lifespanMonths: asset.lifeSpan,
            utilizationPercentage: Math.min(Math.max(0, utilizationPercentage), 100).toFixed(2)
          };
        });
      
      res.json({
        assetsByType,
        assetsByStatus,
        assignedVsUnassigned: {
          assigned: assignedAssets.length,
          unassigned: unassignedAssets.length
        },
        nearingWarrantyExpiry,
        totalPurchaseCost,
        assetLifespanUtilization
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/reports/tickets", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const tickets = await storage.getAllTickets();
      
      // Tickets by Status
      const ticketsByStatus: Record<string, number> = {};
      tickets.forEach(ticket => {
        ticketsByStatus[ticket.status] = (ticketsByStatus[ticket.status] || 0) + 1;
      });
      
      // Tickets by Priority
      const ticketsByPriority: Record<string, number> = {};
      tickets.forEach(ticket => {
        ticketsByPriority[ticket.priority] = (ticketsByPriority[ticket.priority] || 0) + 1;
      });
      
      // Tickets by Request Type
      const ticketsByRequestType: Record<string, number> = {};
      tickets.forEach(ticket => {
        ticketsByRequestType[ticket.requestType] = (ticketsByRequestType[ticket.requestType] || 0) + 1;
      });
      
      // Recent Tickets (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentTickets = tickets.filter(ticket => {
        const createdAt = new Date(ticket.createdAt);
        return createdAt >= thirtyDaysAgo;
      });
      
      // Resolution Time (for resolved tickets)
      const resolvedTickets = tickets.filter(ticket => 
        ticket.status === "Resolved" || ticket.status === "Closed"
      );
      
      const averageResolutionTime = resolvedTickets.length > 0 
        ? resolvedTickets.reduce((sum, ticket) => {
          const createdAt = new Date(ticket.createdAt);
          const updatedAt = new Date(ticket.updatedAt);
          return sum + (updatedAt.getTime() - createdAt.getTime());
        }, 0) / resolvedTickets.length / (1000 * 60 * 60) // In hours
        : 0;
      
      res.json({
        ticketsByStatus,
        ticketsByPriority,
        ticketsByRequestType,
        recentTicketsCount: recentTickets.length,
        averageResolutionTime: averageResolutionTime.toFixed(2) + " hours"
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Custom Asset Types API
  app.get('/api/custom-asset-types', authenticateUser, async (req, res) => {
    try {
      const types = await storage.getCustomAssetTypes();
      res.json(types);
    } catch (error: any) {
      console.error('Error fetching custom asset types:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/custom-asset-types', authenticateUser, async (req, res) => {
    try {
      const newType = await storage.createCustomAssetType({
        name: req.body.name,
        description: req.body.description
      });
      res.status(201).json(newType);
    } catch (error: any) {
      console.error('Error creating custom asset type:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put('/api/custom-asset-types/:id', authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedType = await storage.updateCustomAssetType(id, {
        name: req.body.name,
        description: req.body.description
      });
      if (updatedType) {
        res.json(updatedType);
      } else {
        res.status(404).json({ message: 'Custom asset type not found' });
      }
    } catch (error: any) {
      console.error('Error updating custom asset type:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/custom-asset-types/:id', authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCustomAssetType(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: 'Custom asset type not found' });
      }
    } catch (error: any) {
      console.error('Error deleting custom asset type:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Custom Asset Brands API
  app.get('/api/custom-asset-brands', authenticateUser, async (req, res) => {
    try {
      const brands = await storage.getCustomAssetBrands();
      res.json(brands);
    } catch (error: any) {
      console.error('Error fetching custom asset brands:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/custom-asset-brands', authenticateUser, async (req, res) => {
    try {
      const newBrand = await storage.createCustomAssetBrand({
        name: req.body.name,
        description: req.body.description
      });
      res.status(201).json(newBrand);
    } catch (error: any) {
      console.error('Error creating custom asset brand:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete('/api/custom-asset-brands/:id', authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCustomAssetBrand(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: 'Custom asset brand not found' });
      }
    } catch (error: any) {
      console.error('Error deleting custom asset brand:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Custom Asset Statuses API
  app.get('/api/custom-asset-statuses', authenticateUser, async (req, res) => {
    try {
      const statuses = await storage.getCustomAssetStatuses();
      res.json(statuses);
    } catch (error: any) {
      console.error('Error fetching custom asset statuses:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/custom-asset-statuses', authenticateUser, async (req, res) => {
    try {
      const newStatus = await storage.createCustomAssetStatus({
        name: req.body.name,
        description: req.body.description,
        color: req.body.color
      });
      res.status(201).json(newStatus);
    } catch (error: any) {
      console.error('Error creating custom asset status:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete('/api/custom-asset-statuses/:id', authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCustomAssetStatus(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: 'Custom asset status not found' });
      }
    } catch (error: any) {
      console.error('Error deleting custom asset status:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Service Providers API
  app.get('/api/service-providers', authenticateUser, async (req, res) => {
    try {
      const providers = await storage.getServiceProviders();
      res.json(providers);
    } catch (error: any) {
      console.error('Error fetching service providers:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/service-providers', authenticateUser, async (req, res) => {
    try {
      const newProvider = await storage.createServiceProvider({
        name: req.body.name,
        contactPerson: req.body.contactPerson,
        phone: req.body.phone,
        email: req.body.email
      });
      res.status(201).json(newProvider);
    } catch (error: any) {
      console.error('Error creating service provider:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete('/api/service-providers/:id', authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteServiceProvider(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: 'Service provider not found' });
      }
    } catch (error: any) {
      console.error('Error deleting service provider:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ====== Forgot Password API endpoints ======
  
  // Step 1: Find user by username
  app.post('/api/forgot-password/find-user', async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: 'Username is required' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if user has security questions
      const hasSecurityQuestions = await storage.getSecurityQuestions(user.id).then(questions => questions.length > 0);
      
      res.json({
        userId: user.id,
        hasSecurityQuestions
      });
    } catch (error: any) {
      console.error('Error finding user:', error);
      res.status(500).json({ message: error.message || 'Error finding user' });
    }
  });
  
  // Step 2: Get security questions for a specific user
  app.get('/api/forgot-password/security-questions/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const questions = await storage.getSecurityQuestions(userId);
      
      if (!questions || questions.length === 0) {
        return res.status(404).json({ message: 'No security questions found for this user' });
      }
      
      res.json({ questions });
    } catch (error: any) {
      console.error('Error getting security questions:', error);
      res.status(500).json({ message: error.message || 'Error getting security questions' });
    }
  });
  
  // Step 3: Get all available security questions (for new setups)
  app.get('/api/security-questions', async (req, res) => {
    try {
      // For default questions, pass no userId - use 0 as a flag for default questions
      const questions = await storage.getSecurityQuestions(0);
      res.json(questions);
    } catch (error: any) {
      console.error('Error getting security questions:', error);
      res.status(500).json({ message: error.message || 'Error getting security questions' });
    }
  });
  
  // Step 4: Verify security question answers
  app.post('/api/forgot-password/verify-answers', async (req, res) => {
    try {
      const { userId, answers } = req.body;
      
      if (!userId || !answers || !Array.isArray(answers)) {
        return res.status(400).json({ message: 'User ID and answers are required' });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Verify answers
      const correctAnswers = await storage.verifySecurityQuestions(userId, answers);
      
      if (!correctAnswers) {
        return res.status(401).json({ 
          success: false, 
          message: 'Incorrect answers to security questions' 
        });
      }
      
      // Generate a reset token
      const resetToken = await storage.createPasswordResetToken(userId);
      
      res.json({
        success: true,
        token: resetToken.token
      });
    } catch (error: any) {
      console.error('Error verifying security answers:', error);
      res.status(500).json({ message: error.message || 'Error verifying security answers' });
    }
  });
  
  // Step 5: Reset password with token
  app.post('/api/forgot-password/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }
      
      // Validate token and get the associated user
      const userId = await storage.validatePasswordResetToken(token);
      
      if (!userId) {
        return res.status(404).json({ 
          success: false, 
          message: 'Invalid or expired token' 
        });
      }
      
      // Hash the new password
      const hashedPassword = await hash(newPassword, 10);
      
      // Update the user's password
      const updated = await storage.updateUser(userId, { password: hashedPassword });
      
      if (!updated) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to update password' 
        });
      }
      
      // Delete the used token
      await storage.invalidatePasswordResetToken(token);
      
      // Log the activity
      await logActivity({
        userId: userId,
        action: AuditAction.UPDATE,
        entityType: EntityType.USER,
        entityId: userId,
        details: { message: 'Password was reset using forgot password flow' }
      });
      
      res.json({
        success: true,
        message: 'Password has been reset successfully'
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: error.message || 'Error resetting password' });
    }
  });

  // Audit Logs API endpoint
  app.get("/api/audit-logs", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const filter = req.query.filter as string;
      const action = req.query.action as string;
      const entityType = req.query.entityType as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      // Get logs with pagination
      const result = await storage.getActivityLogs({
        filter,
        action: action !== 'all-actions' ? action : undefined,
        entityType: entityType !== 'all-entities' ? entityType : undefined,
        startDate,
        endDate,
        page,
        limit
      });
      
      // Enhance logs with user details
      const logsWithUserDetails = await Promise.all(
        result.data.map(async (log) => {
          let user = undefined;
          
          if (log.userId) {
            user = await storage.getUser(log.userId);
          }
          
          return {
            ...log,
            user: user ? { id: user.id, username: user.username } : undefined
          };
        })
      );
      
      res.json({
        data: logsWithUserDetails,
        pagination: result.pagination
      });
    } catch (error: any) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Changes Log Management Routes
  app.get('/api/changes-log', authenticateUser, async (req, res) => {
    try {
      const { version, changeType, status, page = 1, limit = 10 } = req.query;
      
      const result = await storage.getChangesLog({
        version: version as string,
        changeType: changeType as string,
        status: status as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching changes log:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/changes-log', authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const changeLogData = validateBody(schema.insertChangesLogSchema, {
        ...req.body,
        userId: req.user?.id
      });
      
      const changeLog = await storage.createChangeLog(changeLogData);
      
      // Log the activity
      await logActivity({
        userId: req.user?.id,
        action: AuditAction.CREATE,
        entityType: EntityType.SYSTEM_CONFIG,
        entityId: changeLog.id,
        details: { changeType: changeLog.changeType, title: changeLog.title }
      });
      
      res.status(201).json(changeLog);
    } catch (error: any) {
      console.error('Error creating change log:', error);
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/changes-log/:id', authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid change log ID' });
      }
      
      const updateData = validateBody(schema.insertChangesLogSchema.partial(), req.body);
      const changeLog = await storage.updateChangeLog(id, updateData);
      
      if (!changeLog) {
        return res.status(404).json({ message: 'Change log not found' });
      }
      
      // Log the activity
      await logActivity({
        userId: req.user?.id,
        action: AuditAction.UPDATE,
        entityType: EntityType.SYSTEM_CONFIG,
        entityId: changeLog.id,
        details: { title: changeLog.title }
      });
      
      res.json(changeLog);
    } catch (error: any) {
      console.error('Error updating change log:', error);
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/changes-log/:id', authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid change log ID' });
      }
      
      const success = await storage.deleteChangeLog(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Change log not found' });
      }
      
      // Log the activity
      await logActivity({
        userId: req.user?.id,
        action: AuditAction.DELETE,
        entityType: EntityType.SYSTEM_CONFIG,
        entityId: id,
        details: { action: 'Change log deleted' }
      });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting change log:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Export API endpoints
  app.get("/api/export/employees", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      const csvData = employees.map(emp => ({
        'Employee ID': emp.empId,
        'English Name': emp.englishName,
        'Arabic Name': emp.arabicName || '',
        'Email': emp.email,
        'Phone': emp.phone || '',
        'Department': emp.department || '',
        'Position': emp.position || '',
        'Hire Date': emp.hireDate || '',
        'Salary': emp.salary || '',
        'Status': emp.status
      }));
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
      
      const csv = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${val || ''}"`).join(','))
      ].join('\n');
      
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/export/assets", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const assets = await storage.getAllAssets();
      const csvData = assets.map(asset => ({
        'Asset ID': asset.assetId,
        'Name': asset.name,
        'Type': asset.type,
        'Brand': asset.brand || '',
        'Model': asset.model || '',
        'Serial Number': asset.serialNumber,
        'Status': asset.status,
        'Purchase Date': asset.purchaseDate || '',
        'Purchase Price': asset.buyPrice || '',
        'Warranty Expiry': asset.warrantyExpiryDate || '',
        'Location': asset.location || '',
        'Department': asset.department || '',
        'Specifications': asset.specs || ''
      }));
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="assets.csv"');
      
      const csv = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${val || ''}"`).join(','))
      ].join('\n');
      
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/export/tickets", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const tickets = await storage.getAllTickets();
      const csvData = tickets.map(ticket => ({
        'Ticket ID': ticket.ticketId,
        'Description': ticket.description,
        'Request Type': ticket.requestType,
        'Priority': ticket.priority,
        'Status': ticket.status,
        'Submitted By': ticket.submittedById,
        'Assigned To': ticket.assignedToId || '',
        'Created Date': ticket.createdAt?.toISOString() || '',
        'Resolution': ticket.resolution || '',
        'Time Spent': ticket.timeSpent || ''
      }));
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="tickets.csv"');
      
      const csv = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${val || ''}"`).join(','))
      ].join('\n');
      
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Import API endpoints
  app.post("/api/import/employees", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const { data, mapping } = req.body;
      const importedEmployees = [];
      
      for (const row of data) {
        const employeeData = {
          empId: row[mapping.empId] || '',
          englishName: row[mapping.englishName] || '',
          arabicName: row[mapping.arabicName] || '',
          email: row[mapping.email] || '',
          phone: row[mapping.phone] || '',
          department: row[mapping.department] || '',
          position: row[mapping.position] || '',
          hireDate: row[mapping.hireDate] || '',
          salary: row[mapping.salary] || '',
          status: row[mapping.status] || 'Active'
        };
        
        const employee = await storage.createEmployee(employeeData);
        importedEmployees.push(employee);
      }
      
      res.json({ 
        success: true, 
        imported: importedEmployees.length,
        employees: importedEmployees
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/import/assets", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const { data, mapping } = req.body;
      const importedAssets = [];
      
      for (const row of data) {
        const assetData = {
          assetId: row[mapping.assetId] || '',
          name: row[mapping.name] || '',
          type: row[mapping.type] || '',
          brand: row[mapping.brand] || '',
          model: row[mapping.model] || '',
          serialNumber: row[mapping.serialNumber] || '',
          status: row[mapping.status] || 'Available',
          purchaseDate: row[mapping.purchaseDate] || '',
          buyPrice: row[mapping.buyPrice] || '',
          warrantyExpiryDate: row[mapping.warrantyExpiryDate] || '',
          location: row[mapping.location] || '',
          department: row[mapping.department] || '',
          specs: row[mapping.specs] || ''
        };
        
        const asset = await storage.createAsset(assetData);
        importedAssets.push(asset);
      }
      
      res.json({ 
        success: true, 
        imported: importedAssets.length,
        assets: importedAssets
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Initialize admin user if none exists
  try {
    const users = await storage.getAllUsers();
    if (users.length === 0) {
      const hashedPassword = await hash("admin123", 10);
      await storage.createUser({
        username: "admin",
        password: hashedPassword,
        email: "admin@simpleit.com",
        accessLevel: "3"
      });
      console.log("Admin user created");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }

  const httpServer = createServer(app);
  return httpServer;
}
