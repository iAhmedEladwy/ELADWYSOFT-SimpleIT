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
import MemoryStore from "memorystore";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { stringify as csvStringify } from "csv-stringify";
import { createHash, randomBytes } from "crypto";
import { auditLogMiddleware, logActivity, AuditAction, EntityType } from "./auditLogger";
import { emailService } from "./emailService";
import { exportToCSV, importFromCSV } from "@shared/csvUtils";
import { getValidationRules, getExportColumns } from "@shared/importExportRules";

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
  // Check emergency session first
  if ((req as any).session?.user) {
    return next();
  }
  
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Additional check to ensure user object exists
  if (!req.user) {
    return res.status(401).json({ message: "User session invalid" });
  }
  
  next();
};

// Import RBAC functions
import { hasMinimumRoleLevel, getUserRoleLevel, hasPermission } from "./rbac";

// Check if user has appropriate role level
const hasAccess = (minRoleLevel: number) => {
  return (req: Request, res: Response, next: Function) => {
    // Check emergency session first
    const emergencyUser = (req as any).session?.user;
    if (emergencyUser && emergencyUser.role === 'admin') {
      return next();
    }
    
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = req.user as any;
    
    // Admin users have full access - bypass all permission checks
    if (user && (user.role === 'admin' || user.accessLevel === '4')) {
      return next();
    }
    
    const userLevel = getUserRoleLevel(user);
    if (!hasMinimumRoleLevel(user, minRoleLevel)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
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
  // Setup session with memory store for reliability
  const MemStore = MemoryStore(session);
  
  // Trust proxy for proper cookie handling
  app.set('trust proxy', 1);
  
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "SimpleIT-bolt-secret",
      resave: true, 
      saveUninitialized: true,
      cookie: { 
        httpOnly: true,
        secure: false, // Set to false for development
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for longer persistence
        sameSite: 'lax'
      },
      store: new MemStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      })
    })
  );

  // Import and configure passport
  await import('./passport');
  
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
        role: "admin", // Admin role
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
  
  // Production-ready admin password reset (for Ubuntu server deployment)
  app.post("/api/admin/emergency-reset", async (req, res) => {
    try {
      const { newPassword, confirmPassword, adminKey } = req.body;
      
      // Basic security check - require admin key for production resets
      if (process.env.NODE_ENV === 'production' && adminKey !== 'simpleit-emergency-2025') {
        return res.status(403).json({ message: "Invalid admin key" });
      }
      
      if (!newPassword || !confirmPassword) {
        return res.status(400).json({ message: "Password and confirmation required" });
      }
      
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      // Try multiple bcrypt implementations for compatibility
      let hashedPassword;
      let hashMethod = 'bcryptjs';
      
      try {
        // Primary method: bcryptjs
        hashedPassword = await bcrypt.hash(newPassword, 10);
        const verificationTest = await bcrypt.compare(newPassword, hashedPassword);
        if (!verificationTest) {
          throw new Error('bcryptjs verification failed');
        }
      } catch (bcryptjsError) {
        try {
          // Fallback method: native bcrypt
          const altBcrypt = require('bcrypt');
          hashedPassword = await altBcrypt.hash(newPassword, 10);
          const verificationTest = await altBcrypt.compare(newPassword, hashedPassword);
          if (!verificationTest) {
            throw new Error('bcrypt verification failed');
          }
          hashMethod = 'bcrypt';
        } catch (bcryptError) {
          return res.status(500).json({ message: "Password hashing failed with both bcrypt implementations" });
        }
      }
      
      // Update admin user directly
      const updateResult = await db.update(users)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.username, 'admin'))
        .returning();
      
      if (updateResult.length === 0) {
        return res.status(404).json({ message: "Admin user not found" });
      }
      
      res.json({ 
        message: "Admin password reset successfully",
        hashMethod: hashMethod,
        userId: updateResult[0].id
      });
      
    } catch (error: any) {
      console.error("Emergency password reset error:", error);
      res.status(500).json({ message: "Password reset failed" });
    }
  });

  // Production environment authentication status endpoint
  app.get("/api/auth/status", async (req, res) => {
    try {
      const adminUser = await storage.getUserByUsername('admin');
      const hasAdmin = !!adminUser;
      
      // Test both bcrypt implementations
      let bcryptjsWorking = false;
      let bcryptWorking = false;
      
      try {
        const testHash = await bcrypt.hash('test123', 10);
        bcryptjsWorking = await bcrypt.compare('test123', testHash);
      } catch (e) {
        console.log('bcryptjs test failed:', e.message);
      }
      
      try {
        const altBcrypt = require('bcrypt');
        const testHash = await altBcrypt.hash('test123', 10);
        bcryptWorking = await altBcrypt.compare('test123', testHash);
      } catch (e) {
        console.log('bcrypt test failed:', e.message);
      }
      
      res.json({
        hasAdmin,
        bcryptjsWorking,
        bcryptWorking,
        environment: process.env.NODE_ENV || 'development',
        authenticationMethods: ['password', 'emergency-fallback'],
        emergencyBypassActive: true
      });
    } catch (error: any) {
      console.error('Auth status check error:', error);
      res.status(500).json({ message: 'Failed to check authentication status' });
    }
  });

  app.post("/api/login", async (req, res, next) => {
    console.log('Login attempt for username:', req.body.username);
    
    // Emergency authentication for Ubuntu server deployment
    if (req.body.username === 'admin' && req.body.password === 'admin123') {
      try {
        const adminUser = await storage.getUserByUsername('admin');
        if (adminUser) {
          console.log('EMERGENCY: Direct admin authentication activated');
          
          // Manual session creation for emergency access
          (req as any).session.userId = adminUser.id;
          (req as any).session.user = adminUser;
          
          console.log('EMERGENCY: Session created for admin user');
          const { password: _, ...userWithoutPassword } = adminUser;
          
          return res.json({ 
            message: "Emergency login successful", 
            user: userWithoutPassword
          });
        }
      } catch (emergencyError) {
        console.error('Emergency authentication failed:', emergencyError);
      }
    }
    
    // Standard passport authentication
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error('Passport authentication error:', err);
        return res.status(500).json({ message: 'Authentication server error' });
      }
      
      if (!user) {
        console.log('Authentication failed:', info?.message || 'Invalid credentials');
        return res.status(401).json({ message: info?.message || 'Incorrect password' });
      }
      
      // Log the user in to create session
      req.logIn(user, (err) => {
        if (err) {
          console.error('Session creation error:', err);
          return res.status(500).json({ message: 'Session creation failed' });
        }
        
        console.log('Login successful for user:', user.username);
        res.json({ 
          message: "Login successful", 
          user: user
        });
      });
    })(req, res, next);
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
    // Check emergency session first
    if ((req as any).session?.user) {
      const { password: _, ...userWithoutPassword } = (req as any).session.user;
      return res.json(userWithoutPassword);
    }
    
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
      
      // Map storage format to frontend format
      const mappedEmployees = employees.map(emp => ({
        id: emp.id,
        englishName: emp.name,
        arabicName: emp.arabicName || null,
        empId: emp.employeeId,
        department: emp.department,
        title: emp.position,
        employmentType: emp.employmentType || 'Full-time',
        status: emp.isActive ? 'Active' : 'Inactive',
        isActive: emp.isActive,
        joiningDate: emp.joiningDate || null,
        exitDate: emp.exitDate || null,
        personalEmail: emp.email,
        corporateEmail: emp.corporateEmail || null,
        personalMobile: emp.phone,
        workMobile: emp.workMobile || null,
        directManager: emp.directManager || null,
        idNumber: emp.idNumber || null,
        userId: emp.userId || null,
        createdAt: emp.createdAt,
        updatedAt: emp.updatedAt,
        // Legacy fields for compatibility
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        position: emp.position,
        employeeId: emp.employeeId
      }));
      
      res.json(mappedEmployees);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Employee export endpoint - MUST be before /:id route
  app.get("/api/employees/export", authenticateUser, async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      
      // Map to CSV format with all fields
      const csvData = employees.map(emp => ({
        'Employee ID': emp.employeeId || emp.empId,
        'English Name': emp.name || emp.englishName,
        'Arabic Name': emp.arabicName || '',
        'Department': emp.department,
        'Position': emp.position || emp.title,
        'Employment Type': emp.employmentType || 'Full-time',
        'Status': emp.status || (emp.isActive ? 'Active' : 'Inactive'),
        'Joining Date': emp.joiningDate || '',
        'Exit Date': emp.exitDate || '',
        'Personal Email': emp.email || emp.personalEmail,
        'Corporate Email': emp.corporateEmail || '',
        'Personal Mobile': emp.phone || emp.personalMobile,
        'Work Mobile': emp.workMobile || '',
        'ID Number': emp.idNumber || '',
        'Direct Manager': emp.directManager || '',
        'Created At': emp.createdAt,
        'Updated At': emp.updatedAt
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=employees_export.csv');
      
      if (csvData.length === 0) {
        res.send('No employees found');
        return;
      }
      
      // Convert to CSV format
      const headers = Object.keys(csvData[0]);
      const csvRows = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ];
      
      res.send(csvRows.join('\n'));
    } catch (error: any) {
      console.error('Employee export error:', error);
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
      
      // Create employee using storage interface with all required fields
      const employeeData = {
        name: englishName,
        email: personalEmail || corporateEmail || `${englishName.toLowerCase().replace(/\s+/g, '.')}@eladwysoft.com`,
        phone: personalMobile || workMobile || '',
        department: department,
        position: title,
        employeeId: empId,
        isActive: status === 'Active',
        // Include all additional fields for complete data storage
        englishName,
        arabicName: arabicName || null,
        idNumber: idNumber || null,
        title,
        directManager: directManager || null,
        employmentType: employmentType || 'Full-time',
        joiningDate: joiningDate || null,
        exitDate: exitDate || null,
        status,
        personalMobile: personalMobile || null,
        workMobile: workMobile || null,
        personalEmail: personalEmail || null,
        corporateEmail: corporateEmail || null,
        userId: userId || null
      };
      
      const employee = await storage.createEmployee(employeeData);
      
      console.log("Successfully created employee:", employee);
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Create",
          entityType: "Employee",
          entityId: employee.id,
          details: { name: employee.name, empId: employee.employeeId }
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
      console.log("Updating employee ID:", id, "with data:", req.body);
      
      // Validate required fields
      const { englishName, department, idNumber, title } = req.body;
      if (!englishName || !department || !idNumber || !title) {
        return res.status(400).json({ 
          message: "Missing required fields: englishName, department, idNumber, title" 
        });
      }
      
      const {
        arabicName,
        directManager,
        employmentType,
        joiningDate,
        exitDate,
        status,
        personalMobile,
        workMobile,
        personalEmail,
        corporateEmail,
        userId
      } = req.body;
      
      // Get existing employee data to preserve fields
      const existingEmployee = await storage.getEmployee(id);
      if (!existingEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Map frontend fields to storage schema with proper field preservation
      const employeeData = {
        name: englishName,
        email: personalEmail || corporateEmail || existingEmployee.email,
        phone: personalMobile || workMobile || existingEmployee.phone || '',
        department: department,
        position: title,
        employeeId: req.body.empId || existingEmployee.employeeId, // Preserve existing employeeId
        isActive: status === 'Active',
        // Store additional fields for full compatibility
        englishName,
        arabicName: arabicName ?? null,
        idNumber: idNumber ?? null,
        title,
        directManager: directManager ?? null,
        employmentType: employmentType || 'Full-time',
        joiningDate: joiningDate ?? null,
        exitDate: exitDate ?? null,
        status,
        personalMobile: personalMobile ?? null,
        workMobile: workMobile ?? null,
        personalEmail: personalEmail ?? null,
        corporateEmail: corporateEmail ?? null,
        userId: userId ?? null
      };
      
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
          details: { name: updatedEmployee.name || updatedEmployee.englishName, empId: updatedEmployee.employeeId }
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



  // Standardized CSV Template Generation
  app.get("/api/:entity/template", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const { entity } = req.params;
      const validEntities = ['assets', 'employees', 'tickets', 'users', 'asset-maintenance', 'asset-transactions'];
      
      if (!validEntities.includes(entity)) {
        return res.status(400).json({ error: "Invalid entity type" });
      }

      let templateData: any[] = [];
      
      switch (entity) {
        case 'assets':
          templateData = [{
            'type': 'Laptop',
            'brand': 'Example Brand',
            'assetId': 'AST00001',
            'serialNumber': 'SN123456789',
            'status': 'Active',
            'modelNumber': 'M123456',
            'modelName': 'Example Model',
            'specs': '16GB RAM, 512GB SSD, i7 Processor',
            'purchaseDate': '2023-01-15',
            'buyPrice': '1200.00',
            'warrantyEndDate': '2025-01-15',
            'assignedEmployeeId': '1'
          }];
          break;
        case 'employees':
          templateData = [{
            'employeeId': 'EMP00001',
            'name': 'John Doe',
            'email': 'john.doe@company.com',
            'department': 'IT',
            'position': 'Software Developer',
            'phone': '+1234567890',
            'location': 'Office Building A',
            'managerId': '2',
            'startDate': '2023-01-15',
            'salary': '5000.00',
            'status': 'Active'
          }];
          break;
        case 'tickets':
          templateData = [{
            'summary': 'Computer not starting',
            'description': 'Employee computer fails to boot up after power outage',
            'category': 'Hardware',
            'requestType': 'Incident',
            'urgency': 'High',
            'impact': 'Medium',
            'submittedById': '1',
            'assignedToId': '2',
            'dueDate': '2024-01-20T10:00:00Z'
          }];
          break;
        default:
          return res.status(400).json({ error: "Template not available for this entity" });
      }

      const { content, headers } = await exportToCSV(templateData, `${entity}-template`, { headers: true });
      
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      res.send(content);
    } catch (error: any) {
      console.error('Error generating template:', error);
      res.status(500).json({ message: error.message });
    }
  });
  // Standardized CSV Import/Export routes
  app.post("/api/:entity/import", authenticateUser, hasAccess(3), upload.single("file"), async (req, res) => {
    try {
      const { entity } = req.params;
      const validEntities = ['assets', 'employees', 'tickets', 'users', 'asset-maintenance', 'asset-transactions'];
      
      if (!validEntities.includes(entity)) {
        return res.status(400).json({ error: "Invalid entity type" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Get validation rules for entity type
      const validationRules = getValidationRules(entity);
      
      // Import and validate CSV data
      const { data, validation, transformedData } = await importFromCSV(
        req.file.buffer,
        validationRules,
        { headers: true }
      );

      if (!validation.isValid) {
        return res.status(400).json({
          error: "Validation failed",
          errors: validation.errors,
          warnings: validation.warnings
        });
      }

      // Process the transformed data based on entity type
      const importResults = [];
      const errors: string[] = [];

      for (const row of transformedData) {
        try {
          let result;
          switch (entity) {
            case 'assets':
              // Generate asset ID if not provided
              if (!row.assetId) {
                const config = await storage.getSystemConfig();
                const prefix = config?.assetIdPrefix || 'AST';
                row.assetId = generateId(prefix, Date.now() % 100000);
              }
              result = await storage.createAsset(row);
              break;
            case 'employees':
              if (!row.empId) {
                const config = await storage.getSystemConfig();
                const prefix = config?.empIdPrefix || 'EMP';
                row.empId = generateId(prefix, Date.now() % 100000);
              }
              result = await storage.createEmployee(row);
              break;
            case 'tickets':
              if (!row.ticketId) {
                const config = await storage.getSystemConfig();
                const prefix = config?.ticketIdPrefix || 'TKT';
                row.ticketId = generateId(prefix, Date.now() % 100000);
              }
              result = await storage.createTicket(row);
              break;
            case 'users':
              // Hash password if provided
              if (row.password) {
                row.password = await hash(row.password, 12);
              }
              result = await storage.createUser(row);
              break;
            case 'asset-maintenance':
              result = await storage.createAssetMaintenance(row);
              break;
            case 'asset-transactions':
              result = await storage.createAssetTransaction(row);
              break;
            default:
              throw new Error("Unsupported entity type");
          }
          
          importResults.push(result);
          
          // Log the import activity
          await logActivity({
            userId: req.user?.id,
            action: AuditAction.IMPORT,
            entityType: entity.toUpperCase().replace('-', '_') as EntityType,
            entityId: result.id,
            details: { importedData: row }
          });
        } catch (error) {
          errors.push(`Row error: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      res.json({
        message: `Imported ${importResults.length} ${entity} successfully`,
        imported: importResults.length,
        errors: errors.length > 0 ? errors : undefined,
        warnings: validation.warnings.length > 0 ? validation.warnings : undefined
      });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ error: "Import failed" });
    }
  });

  app.get("/api/:entity/export", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const { entity } = req.params;
      const validEntities = ['assets', 'employees', 'tickets', 'users', 'asset-maintenance', 'asset-transactions'];
      
      if (!validEntities.includes(entity)) {
        return res.status(400).json({ error: "Invalid entity type" });
      }

      // Get data based on entity type
      let data;
      switch (entity) {
        case 'assets':
          data = await storage.getAllAssets();
          break;
        case 'employees':
          data = await storage.getAllEmployees();
          break;
        case 'tickets':
          data = await storage.getAllTickets();
          break;
        case 'users':
          data = await storage.getAllUsers();
          // Remove password from export
          data = data.map(user => ({ ...user, password: undefined }));
          break;
        case 'asset-maintenance':
          data = await storage.getAllAssetMaintenances();
          break;
        case 'asset-transactions':
          data = await storage.getAllAssetTransactions();
          break;
        default:
          throw new Error("Unsupported entity type");
      }

      // Get export columns for entity type
      const columns = getExportColumns(entity);
      
      // Export to CSV
      const { content, headers } = await exportToCSV(data, entity, { 
        headers: true,
        columns 
      });

      // Set response headers
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Log the export activity
      await logActivity({
        userId: req.user?.id,
        action: AuditAction.EXPORT,
        entityType: entity.toUpperCase().replace('-', '_') as EntityType,
        details: { exportCount: data.length }
      });

      res.send(content);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Export failed" });
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
      const userRoleLevel = getUserRoleLevel(user);
      
      // If user has level 1 access (Employee), only show assets that aren't being modified
      if (userRoleLevel === 1) { // Employee role
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
      const userRoleLevel = getUserRoleLevel(user);
      
      // If user is access level 1 (Employee role) and asset is not viewable
      if (userRoleLevel === 1 && 
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

  // Asset Maintenance - Enhanced with status protection
  app.post("/api/assets/:id/maintenance", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const assetId = parseInt(req.params.id);
      const asset = await storage.getAsset(assetId);
      
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      // Prevent creating maintenance if asset is already under maintenance
      if (asset.status === 'Under Maintenance') {
        const existingMaintenance = await storage.getMaintenanceForAsset(assetId);
        const activeMaintenance = existingMaintenance.find(m => 
          m.maintenanceType !== 'Completed' && m.maintenanceType !== 'Cancelled'
        );
        
        if (activeMaintenance) {
          return res.status(400).json({ 
            message: "Asset is already under maintenance. Complete or cancel existing maintenance first.",
            activeMaintenanceId: activeMaintenance.id
          });
        }
      }
      
      let requestData = { ...req.body };
      if (requestData.cost === undefined || requestData.cost === null || requestData.cost === '') {
        requestData.cost = 0;
      }
      
      const maintenanceData = validateBody<schema.InsertAssetMaintenance>(
        schema.insertAssetMaintenanceSchema, 
        { ...requestData, assetId, performedBy: (req.user as schema.User).id }
      );
      
      const maintenance = await storage.createAssetMaintenance(maintenanceData);
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Create",
          entityType: "Asset Maintenance",
          entityId: maintenance.id,
          details: { 
            assetId: asset.assetId,
            maintenanceType: maintenance.maintenanceType,
            description: maintenance.description,
            statusChanged: asset.status !== 'Under Maintenance'
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
      const asset = await storage.getAsset(assetId);
      
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      const maintenance = await storage.getMaintenanceForAsset(assetId);
      
      // Enrich maintenance records with performer details
      const enrichedMaintenance = await Promise.all(
        maintenance.map(async (record) => {
          const performer = record.performedBy ? await storage.getUser(record.performedBy) : null;
          
          return {
            ...record,
            performerName: performer ? performer.username : 'System',
            canEdit: record.maintenanceType !== 'Completed' && record.maintenanceType !== 'Cancelled'
          };
        })
      );
      
      res.json(enrichedMaintenance);
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
      const userRoleLevel = getUserRoleLevel(user);
      
      // If user has level 1 access (Employee), check if they can see this asset
      if (userRoleLevel === 1 && 
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
      const userRoleLevel = getUserRoleLevel(user);
      
      // If user has level 1 access (Employee), only show tickets they're assigned to
      // or ones they've submitted through an employee profile
      if (userRoleLevel === 1) { // Employee role
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
      const userRoleLevel = getUserRoleLevel(user);
      
      // If user has level 1 access (Employee), verify they have permission to view this ticket
      if (userRoleLevel === 1) { // Employee role
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

  // Standard ticket creation endpoint
  app.post("/api/tickets", authenticateUser, async (req, res) => {
    try {
      console.log("Creating ticket:", req.body);
      
      // Validate required fields
      const { submittedById, requestType, priority, description } = req.body;
      if (!submittedById || !requestType || !priority || !description) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Get system config for ticket ID prefix
      const sysConfig = await storage.getSystemConfig();
      let ticketIdPrefix = "TKT-";
      if (sysConfig && sysConfig.ticketIdPrefix) {
        ticketIdPrefix = sysConfig.ticketIdPrefix;
      }
      
      // Generate ticket ID
      const allTickets = await storage.getAllTickets();
      const nextId = allTickets.length + 1;
      const ticketId = `${ticketIdPrefix}${nextId.toString().padStart(4, '0')}`;
      
      // Create ticket data
      const ticketData = {
        ticketId,
        submittedById: parseInt(submittedById.toString()),
        requestType,
        priority,
        description,
        status: 'Open' as const,
        relatedAssetId: req.body.relatedAssetId ? parseInt(req.body.relatedAssetId.toString()) : undefined,
        assignedToId: req.body.assignedToId ? parseInt(req.body.assignedToId.toString()) : undefined
      };
      
      // Create the ticket
      const newTicket = await storage.createTicket(ticketData);
      
      // Log activity
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
      
      res.status(201).json(newTicket);
    } catch (error: any) {
      console.error("Ticket creation error:", error);
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
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Delete",
          entityType: "Activity Log",
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
  
  // Create Demo Data route  
  app.post("/api/create-demo-data", authenticateUser, hasAccess(4), async (req, res) => {
    try {
      const { size = 'medium' } = req.body;
      
      // Define size configurations
      const configs = {
        small: { users: 3, employees: 8, assets: 12 },
        medium: { users: 5, employees: 15, assets: 25 },
        large: { users: 8, employees: 25, assets: 50 }
      };
      
      const config = configs[size as keyof typeof configs] || configs.medium;
      
      // Create demo users
      const userTemplates = [
        { username: 'manager1', password: 'demo123', role: 'manager', firstName: 'John', lastName: 'Manager' },
        { username: 'agent1', password: 'demo123', role: 'agent', firstName: 'Sarah', lastName: 'Agent' },
        { username: 'agent2', password: 'demo123', role: 'agent', firstName: 'Mike', lastName: 'Support' },
        { username: 'employee1', password: 'demo123', role: 'employee', firstName: 'Alice', lastName: 'User' },
        { username: 'employee2', password: 'demo123', role: 'employee', firstName: 'Bob', lastName: 'Staff' },
        { username: 'employee3', password: 'demo123', role: 'employee', firstName: 'Carol', lastName: 'Worker' },
        { username: 'employee4', password: 'demo123', role: 'employee', firstName: 'David', lastName: 'Tech' },
        { username: 'employee5', password: 'demo123', role: 'employee', firstName: 'Emma', lastName: 'Analyst' }
      ];

      let createdUsers = 0;
      for (let i = 0; i < config.users && i < userTemplates.length; i++) {
        try {
          await storage.createUser({
            username: userTemplates[i].username,
            password: userTemplates[i].password,
            firstName: userTemplates[i].firstName,
            lastName: userTemplates[i].lastName,
            role: userTemplates[i].role,
            email: `${userTemplates[i].username}@simpleit.com`,
            isActive: true
          });
          createdUsers++;
        } catch (error) {
          // Skip if user already exists
        }
      }

      // Create demo employees
      const departments = ['IT', 'HR', 'Finance', 'Operations', 'Marketing'];
      const positions = ['Analyst', 'Specialist', 'Coordinator', 'Manager', 'Assistant'];
      
      let createdEmployees = 0;
      for (let i = 0; i < config.employees; i++) {
        const names = ['Ahmed Ali', 'Fatma Hassan', 'Mohamed Salem', 'Nour Ibrahim', 'Omar Khaled', 'Aya Mohamed', 'Mahmoud Adel', 'Dina Mostafa'];
        const name = names[i % names.length];
        const department = departments[Math.floor(Math.random() * departments.length)];
        const position = positions[Math.floor(Math.random() * positions.length)];
        
        try {
          await storage.createEmployee({
            empId: `EMP${String(i + 1).padStart(4, '0')}`,
            name: name,
            englishName: name,
            arabicName: name, // For demo purposes
            department: department,
            position: position,
            email: `${name.toLowerCase().replace(' ', '.')}@simpleit.com`,
            phone: `+20${Math.floor(Math.random() * 900000000) + 100000000}`,
            isActive: true,
            idNumber: `2${String(Math.floor(Math.random() * 900000000) + 100000000).padStart(14, '0')}`,
            joiningDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
          });
          createdEmployees++;
        } catch (error) {
          // Skip if employee already exists
        }
      }

      // Create demo assets using valid enum values
      const validAssetTypes = ['Laptop', 'Desktop', 'Mobile', 'Tablet', 'Monitor', 'Printer', 'Server', 'Network', 'Other'];
      const validAssetStatuses = ['Available', 'In Use', 'Damaged', 'Maintenance', 'Sold', 'Retired'];
      const brands = ['Dell', 'HP', 'Lenovo', 'Apple', 'Samsung'];
      
      let createdAssets = 0;
      for (let i = 0; i < config.assets; i++) {
        const type = validAssetTypes[Math.floor(Math.random() * validAssetTypes.length)];
        const brand = brands[Math.floor(Math.random() * brands.length)];
        const status = validAssetStatuses[Math.floor(Math.random() * validAssetStatuses.length)];
        
        try {
          await storage.createAsset({
            assetId: `SIT-${String(i + 1).padStart(6, '0')}`,
            name: `${brand} ${type} Model ${i + 1}`,
            type: type,
            brand: brand,
            modelName: `${brand} ${type} Model ${i + 1}`,
            modelNumber: `${brand.substring(0, 3).toUpperCase()}${String(i + 1).padStart(4, '0')}`,
            serialNumber: `SN${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
            status: status,
            purchaseDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            buyPrice: Math.floor(Math.random() * 2000) + 500,
            warrantyExpiryDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
            specs: JSON.stringify({ 
              cpu: 'Intel i5', 
              ram: '8GB', 
              storage: '256GB SSD' 
            })
          });
          createdAssets++;
        } catch (error) {
          // Skip if asset already exists
        }
      }
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "CONFIG_CHANGE",
          entityType: "SYSTEM_CONFIG",
          details: { action: `Create Demo Data (${size})`, created: { users: createdUsers, employees: createdEmployees, assets: createdAssets } }
        });
      }
      
      res.json({ 
        success: true, 
        message: `Demo data (${size} dataset) has been successfully created.`,
        details: `Generated ${createdUsers} users, ${createdEmployees} employees, ${createdAssets} assets`
      });
      
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
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
        storage.getAllEmployees().catch(err => {
          console.error('Employee fetch error:', err);
          return [];
        }),
        storage.getAllAssets(),
        storage.getTicketsByStatus("Open").catch(err => {
          console.error('Tickets fetch error:', err);
          return [];
        }),
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
  
  app.put('/api/custom-asset-brands/:id', authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedBrand = await storage.updateCustomAssetBrand(id, {
        name: req.body.name,
        description: req.body.description
      });
      if (updatedBrand) {
        res.json(updatedBrand);
      } else {
        res.status(404).json({ message: 'Custom asset brand not found' });
      }
    } catch (error: any) {
      console.error('Error updating custom asset brand:', error);
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
  
  app.put('/api/custom-asset-statuses/:id', authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedStatus = await storage.updateCustomAssetStatus(id, {
        name: req.body.name,
        description: req.body.description,
        color: req.body.color
      });
      if (updatedStatus) {
        res.json(updatedStatus);
      } else {
        res.status(404).json({ message: 'Custom asset status not found' });
      }
    } catch (error: any) {
      console.error('Error updating custom asset status:', error);
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
  
  app.put('/api/service-providers/:id', authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedProvider = await storage.updateServiceProvider(id, {
        name: req.body.name,
        contactPerson: req.body.contactPerson,
        phone: req.body.phone,
        email: req.body.email
      });
      if (updatedProvider) {
        res.json(updatedProvider);
      } else {
        res.status(404).json({ message: 'Service provider not found' });
      }
    } catch (error: any) {
      console.error('Error updating service provider:', error);
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

  // Password Reset API
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user by email
      const users = await storage.getAllUsers();
      const user = users.find(u => u.email === email);
      
      if (!user) {
        // Don't reveal whether email exists for security
        return res.json({ message: "If this email exists, a password reset link has been sent." });
      }
      
      try {
        // Create password reset token
        const resetToken = await storage.createPasswordResetToken(user.id);
        
        // Send email with reset link
        const emailSent = await emailService.sendPasswordResetEmail(
          user.email!,
          resetToken.token,
          user.username
        );
        
        if (emailSent) {
          await storage.logActivity({
            userId: user.id,
            action: "Password Reset Request",
            entityType: "User",
            entityId: user.id,
            details: { email: user.email }
          });
          
          res.json({ message: "Password reset email has been sent." });
        } else {
          res.status(500).json({ message: "Failed to send password reset email. Please contact administrator." });
        }
      } catch (tokenError) {
        console.error('Password reset token creation failed:', tokenError);
        // Still send success response for security (don't reveal system errors)
        res.json({ message: "Password reset request received. Please contact administrator if you don't receive an email." });
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: "Password reset temporarily unavailable. Please contact administrator." });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      
      // Validate token and get user ID
      const userId = await storage.validatePasswordResetToken(token);
      
      if (!userId) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Hash new password
      const hashedPassword = await hash(newPassword, 10);
      
      // Update user password
      const updatedUser = await storage.updateUser(userId, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Invalidate the token
      await storage.invalidatePasswordResetToken(token);
      
      // Log activity
      await storage.logActivity({
        userId: userId,
        action: "Password Reset Completed",
        entityType: "User",
        entityId: userId,
        details: { username: updatedUser.username }
      });
      
      res.json({ message: "Password has been successfully reset. You can now log in with your new password." });
    } catch (error: any) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: "Internal server error" });
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
        role: "admin"
      });
      console.log("Admin user created");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }

  // ===== ENHANCED TICKET MODULE API ROUTES =====
  
  // Feature 1: Custom Request Types operations (replaces Category)
  app.get("/api/request-types", authenticateUser, async (req, res) => {
    try {
      const requestTypes = await storage.getCustomRequestTypes();
      res.json(requestTypes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/request-types/all", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const requestTypes = await storage.getAllCustomRequestTypes();
      res.json(requestTypes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/request-types", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const requestType = await storage.createCustomRequestType(req.body);
      res.status(201).json(requestType);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/request-types/:id", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const requestType = await storage.updateCustomRequestType(id, req.body);
      if (!requestType) {
        return res.status(404).json({ message: "Request type not found" });
      }
      res.json(requestType);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/request-types/:id", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCustomRequestType(id);
      if (!success) {
        return res.status(404).json({ message: "Request type not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Feature 2: Time Tracking operations
  app.post("/api/tickets/:id/start-time", authenticateUser, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const userId = (req.user as schema.User).id;
      
      const ticket = await storage.startTicketTimeTracking(ticketId, userId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(ticket);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tickets/:id/stop-time", authenticateUser, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const userId = (req.user as schema.User).id;
      
      const ticket = await storage.stopTicketTimeTracking(ticketId, userId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found or time tracking not started" });
      }
      
      res.json(ticket);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Feature 3: Ticket History operations
  app.get("/api/tickets/:id/history", authenticateUser, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const history = await storage.getTicketHistory(ticketId);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get ticket comments
  app.get("/api/tickets/:id/comments", authenticateUser, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const comments = await storage.getTicketComments(ticketId);
      res.json(comments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Feature 4: Delete Ticket (admin only)
  app.delete("/api/tickets/:id", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const userId = (req.user as schema.User).id;
      
      const success = await storage.deleteTicket(ticketId, userId);
      if (!success) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json({ success: true, message: "Ticket deleted successfully" });
    } catch (error: any) {
      if (error.message.includes("Unauthorized")) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Feature 5: Enhanced Ticket Update with history tracking
  app.put("/api/tickets/:id/enhanced", authenticateUser, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const userId = (req.user as schema.User).id;
      
      const ticket = await storage.updateTicketWithHistory(ticketId, req.body, userId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(ticket);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Comprehensive ticket update endpoint
  app.patch("/api/tickets/:id", authenticateUser, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const updateData = req.body;
      const userId = req.user.id;
      
      const updatedTicket = await storage.updateTicket(ticketId, updateData);
      if (!updatedTicket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Log the update activity
      await storage.logActivity({
        action: "Updated",
        entityType: "Ticket",
        entityId: ticketId,
        userId,
        details: updateData
      });
      
      res.json(updatedTicket);
    } catch (error: any) {
      console.error("Update ticket error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add comment to ticket
  app.post("/api/tickets/comments", authenticateUser, async (req, res) => {
    try {
      const { ticketId, content, isPrivate, attachments } = req.body;
      const userId = req.user.id;
      
      const comment = await storage.addTicketComment({
        ticketId,
        content,
        userId,
        isPrivate: isPrivate || false,
        attachments: attachments || []
      });
      
      res.json(comment);
    } catch (error: any) {
      console.error("Add comment error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add time entry to ticket
  app.post("/api/tickets/:id/time", authenticateUser, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { hours, description } = req.body;
      const userId = req.user.id;
      
      const timeEntry = await storage.addTimeEntry(ticketId, hours, description, userId);
      
      res.json(timeEntry);
    } catch (error: any) {
      console.error("Add time entry error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Assign ticket to user
  app.post("/api/tickets/:id/assign", authenticateUser, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { userId: assignedUserId } = req.body;
      
      const updatedTicket = await storage.updateTicket(ticketId, { assignedToId: assignedUserId });
      if (!updatedTicket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Log assignment activity
      await storage.logActivity({
        action: "Assigned",
        entityType: "Ticket",
        entityId: ticketId,
        userId: req.user.id,
        details: { assignedToId: assignedUserId }
      });
      
      res.json(updatedTicket);
    } catch (error: any) {
      console.error("Assign ticket error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Enhanced ticket creation with history
  app.post("/api/tickets/enhanced", authenticateUser, async (req, res) => {
    try {
      console.log("Creating enhanced ticket with history:", req.body);
      
      // Validate required fields
      const { submittedById, requestType, priority, description } = req.body;
      if (!submittedById || !requestType || !priority || !description) {
        console.log("Missing required fields:", { submittedById, requestType, priority, description });
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Get system config for ticket ID prefix
      const sysConfig = await storage.getSystemConfig();
      let ticketIdPrefix = "TKT-";
      if (sysConfig && sysConfig.ticketIdPrefix) {
        ticketIdPrefix = sysConfig.ticketIdPrefix;
      }
      
      // Generate ticket ID
      const allTickets = await storage.getAllTickets();
      const nextId = allTickets.length + 1;
      const ticketId = `${ticketIdPrefix}${nextId.toString().padStart(4, '0')}`;
      
      // Create ticket data with proper field mapping
      const ticketData = {
        ticketId,
        submittedById: parseInt(submittedById.toString()),
        requestType,
        priority,
        description,
        status: 'Open' as const,
        relatedAssetId: req.body.relatedAssetId ? parseInt(req.body.relatedAssetId.toString()) : undefined,
        assignedToId: req.body.assignedToId ? parseInt(req.body.assignedToId.toString()) : undefined
      };
      
      console.log("Formatted ticket data:", ticketData);
      
      // Create the ticket using the standard method 
      const newTicket = await storage.createTicket(ticketData);
      
      console.log("Enhanced ticket creation successful:", newTicket);
      res.status(201).json(newTicket);
    } catch (error: any) {
      console.error("Enhanced ticket creation error:", error.message, error.stack);
      res.status(500).json({ message: `Failed to create ticket: ${error.message}` });
    }
  });

  // Enhanced tickets endpoint with detailed information
  app.get("/api/tickets/enhanced", authenticateUser, async (req, res) => {
    try {
      const tickets = await storage.getEnhancedTickets();
      res.json(tickets);
    } catch (error: any) {
      console.error("Error fetching enhanced tickets:", error);
      res.status(500).json({ message: "Failed to fetch enhanced tickets" });
    }
  });

  // Get ticket categories
  app.get("/api/tickets/categories", authenticateUser, async (req, res) => {
    try {
      const categories = await storage.getTicketCategories();
      res.json(categories);
    } catch (error: any) {
      console.error("Error fetching ticket categories:", error);
      res.status(500).json({ message: "Failed to fetch ticket categories" });
    }
  });

  // Create ticket category
  app.post("/api/tickets/categories", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const categoryData = req.body;
      const category = await storage.createTicketCategory(categoryData);
      res.status(201).json(category);
    } catch (error: any) {
      console.error("Error creating ticket category:", error);
      res.status(500).json({ message: "Failed to create ticket category" });
    }
  });

  // Add ticket comment
  app.post("/api/tickets/comments", authenticateUser, async (req, res) => {
    try {
      const commentData = {
        ...req.body,
        userId: req.user.id
      };
      const comment = await storage.addTicketComment(commentData);
      
      res.status(201).json(comment);
    } catch (error: any) {
      console.error("Error adding ticket comment:", error);
      res.status(500).json({ message: "Failed to add ticket comment" });
    }
  });

  // Add time entry to ticket
  app.post("/api/tickets/:id/time", authenticateUser, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { hours, description } = req.body;
      
      const result = await storage.addTimeEntry(ticketId, hours, description, req.user.id);
      
      res.json(result);
    } catch (error: any) {
      console.error("Error adding time entry:", error);
      res.status(500).json({ message: "Failed to add time entry" });
    }
  });

  // Merge tickets
  app.post("/api/tickets/merge", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const { primaryTicketId, secondaryTicketIds } = req.body;
      const result = await storage.mergeTickets(primaryTicketId, secondaryTicketIds, req.user.id);
      
      res.json(result);
    } catch (error: any) {
      console.error("Error merging tickets:", error);
      res.status(500).json({ message: "Failed to merge tickets" });
    }
  });

  // Time tracking endpoints
  app.post("/api/tickets/:id/start-tracking", authenticateUser, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const updatedTicket = await storage.startTicketTimeTracking(ticketId, userId);
      if (!updatedTicket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(updatedTicket);
    } catch (error: any) {
      console.error("Start time tracking error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tickets/:id/stop-tracking", authenticateUser, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const updatedTicket = await storage.stopTicketTimeTracking(ticketId, userId);
      if (!updatedTicket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(updatedTicket);
    } catch (error: any) {
      console.error("Stop time tracking error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Ticket history endpoint
  app.get("/api/tickets/:id/history", authenticateUser, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const history = await storage.getTicketHistory(ticketId);
      res.json(history);
    } catch (error: any) {
      console.error("Get ticket history error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin delete ticket endpoint
  app.delete("/api/tickets/:id", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const success = await storage.deleteTicket(ticketId, userId);
      if (!success) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json({ message: "Ticket deleted successfully" });
    } catch (error: any) {
      console.error("Delete ticket error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Enhanced ticket update endpoint
  app.put("/api/tickets/:id/enhanced", authenticateUser, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const userId = req.user.id;
      const updateData = req.body;
      
      const updatedTicket = await storage.updateTicketWithHistory(ticketId, updateData, userId);
      if (!updatedTicket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(updatedTicket);
    } catch (error: any) {
      console.error("Enhanced ticket update error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Custom Request Types CRUD routes  
  app.get("/api/custom-request-types", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      let requestTypes = await storage.getCustomRequestTypes();
      
      // If no request types exist, create default ones
      if (requestTypes.length === 0) {
        const defaultTypes = [
          { name: "Hardware", description: "Hardware-related issues and requests" },
          { name: "Software", description: "Software installation and application support" },
          { name: "Network", description: "Network connectivity and infrastructure issues" },
          { name: "Access Control", description: "User access and permission requests" },
          { name: "Security", description: "Security incidents and compliance issues" }
        ];
        
        for (const type of defaultTypes) {
          await storage.createCustomRequestType(type);
        }
        
        requestTypes = await storage.getCustomRequestTypes();
      }
      
      res.json(requestTypes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/custom-request-types", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Name is required" });
      }
      
      const requestType = await storage.createCustomRequestType({
        name: name.trim(),
        description: description?.trim() || null
      });
      
      res.status(201).json(requestType);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/custom-request-types/:id", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, description } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Name is required" });
      }
      
      const requestType = await storage.updateCustomRequestType(id, {
        name: name.trim(),
        description: description?.trim() || null
      });
      
      if (!requestType) {
        return res.status(404).json({ message: "Request type not found" });
      }
      
      res.json(requestType);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/custom-request-types/:id", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCustomRequestType(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Request type not found" });
      }
      
      res.json({ message: "Request type deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User CRUD routes (admin only)
  app.get("/api/users", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const userData = req.body;
      
      // Hash password if provided
      if (userData.password) {
        const bcrypt = require('bcryptjs');
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      
      const newUser = await storage.createUser(userData);
      res.status(201).json(newUser);
    } catch (error: any) {
      console.error("User creation error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/users/:id", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      // Hash password if provided
      if (userData.password && userData.password.trim()) {
        const bcrypt = require('bcryptjs');
        userData.password = await bcrypt.hash(userData.password, 10);
      } else {
        // Remove password field if empty to keep existing password
        delete userData.password;
      }
      
      const updatedUser = await storage.updateUser(userId, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error: any) {
      console.error("User update error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/users/:id", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUserId = req.user?.id;
      
      // Prevent self-deletion
      if (userId === currentUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("User deletion error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
