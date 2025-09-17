import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage-factory";
import { db } from "./db";
import { 
  users, employees, assets, tickets, assetUpgrades, assetTransactions,
  ticketUrgencyEnum, ticketImpactEnum, ticketTypeEnum, ticketPriorityEnum, ticketStatusEnum,
  type InsertTicket
} from "../shared/schema";
import { eq } from "drizzle-orm";
import { calculatePriority, validatePriority } from "../shared/priorityUtils";
import { BackupService } from './services/backupService';


// Authenticated user type (from auth middleware)
interface AuthUser {
  id: number;
  username: string;
  role: string;
  employeeId?: number;
}

type ValueOf<T> = T[keyof T];
type TicketCreateInput = Omit<InsertTicket, 'id' | 'createdAt' | 'updatedAt'> & {
  submittedById: string | number;
  assignedToId?: string | number;
  relatedAssetId?: string | number;
  timeSpent?: string | number;
  urgency?: keyof typeof ticketUrgencyEnum;
  impact?: keyof typeof ticketImpactEnum;
  type?: keyof typeof ticketTypeEnum;
  priority?: keyof typeof ticketPriorityEnum;
  status?: keyof typeof ticketStatusEnum;
};

const storage = getStorage();
import * as schema from "@shared/schema";
import { ZodError, type ZodSchema } from "zod";
import { fromZodError } from "zod-validation-error";
import { ValidationError, NotFoundError, UnauthorizedError, createErrorResponse } from "@shared/errors";
import type { UserResponse, EmployeeResponse, AssetResponse, TicketResponse } from "@shared/types";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { compare, hash } from "bcrypt";
import ConnectPgSimple from "connect-pg-simple";
import multer from "multer";
import MemoryStore from "memorystore";
import { errorHandler, asyncHandler } from "./middleware/error-handler";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { stringify as csvStringify } from "csv-stringify";
import { createHash, randomBytes } from "crypto";
import { auditLogMiddleware, logActivity, AuditAction, EntityType } from "./auditLogger";
import { emailService } from "./emailService";
import { calculatePriority, validatePriority, type UrgencyLevel, type ImpactLevel } from "@shared/priorityUtils";
import { exportToCSV, importFromCSV, parseCSV, parseDate, cleanEmploymentType } from "@shared/csvUtils";
import { getValidationRules, getExportColumns } from "@shared/importExportRules";


// Initialize backup service
const backupService = new BackupService();


// Enhanced ID generation with system config support
const generateId = async (entityType: 'asset' | 'employee' | 'ticket', customNumber?: number) => {
  try {
    let prefix: string;
    let nextNumber: number;
    
    // Get system config for prefixes
    try {
      const config = await storage.getSystemConfig();
      switch (entityType) {
        case 'asset':
          prefix = config?.assetIdPrefix || 'AST-';
          break;
        case 'employee':
          prefix = config?.empIdPrefix || 'EMP-';
          break;
        case 'ticket':
          prefix = config?.ticketIdPrefix || 'TKT-';
          break;
        default:
          prefix = 'ID-';
      }
    } catch (error) {
      console.warn('Could not load system config for prefixes, using defaults:', error);
      // Use reliable fallback prefixes to avoid database dependency issues during import
      switch (entityType) {
        case 'asset':
          prefix = 'AST-';
          break;
        case 'employee':
          prefix = 'EMP-';
          break;
        case 'ticket':
          prefix = 'TKT-';
          break;
        default:
          prefix = 'ID-';
      }
    }
    
    console.log('generateId called with entityType:', entityType, 'prefix:', prefix);
    
    if (customNumber) {
      nextNumber = customNumber;
    } else {
      // Get next available number by checking existing IDs
      const existingItems = await (async () => {
        switch (entityType) {
          case 'asset': return await storage.getAllAssets();
          case 'employee': return await storage.getAllEmployees();
          case 'ticket': return await storage.getAllTickets();
          default: return [];
        }
      })();
      
      // Find highest number with this prefix
      let maxNumber = 0;
      console.log('Checking existing items for prefix:', prefix, 'total items:', existingItems.length);
      existingItems.forEach((item: any) => {
        let itemId: string;
        switch (entityType) {
          case 'asset':
            itemId = item.assetId || item.id;
            break;
          case 'employee':
            itemId = item.empId || item.id;
            break;
          case 'ticket':
            itemId = item.ticketId || item.id;
            break;
          default:
            itemId = item.id;
        }
        
        if (itemId && itemId.startsWith(prefix)) {
          const numberPart = itemId.replace(prefix, '');
          const num = parseInt(numberPart);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
          console.log('Found existing item with id:', itemId, 'extracted number:', num);
        }
      });
      
      console.log('Max number found:', maxNumber);
      
      nextNumber = maxNumber + 1;
    }
    
    return `${prefix}${nextNumber.toString().padStart(5, "0")}`;
  } catch (error) {
    console.error('Error generating ID:', error);
    // Fallback to timestamp + random for unique IDs during import
    const prefixMap = { asset: 'AST-', employee: 'EMP-', ticket: 'TKT-' };
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const uniqueNum = (timestamp % 10000) * 1000 + random;
    return `${prefixMap[entityType]}${uniqueNum.toString().padStart(8, "0")}`;
  }
};

// Helper function to validate request body against schema
function validateBody<T>(zodSchema: ZodSchema<T>, data: unknown): T {
  try {
    return zodSchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(fromZodError(error).message);
    }
    throw error;
  }
}

// Authentication middleware
const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  // Check emergency session first
  // if (req.session && 'user' in req.session) {
  //   return next();
  // }
  
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
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
    // const emergencyUser = (req as any).session?.user;
    // if (emergencyUser && emergencyUser.role === 'admin') {
    //   return next();
    // }
    
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
  
  // Audit logging middleware disabled for import/export operations as per user requirements
  // app.use(auditLogMiddleware);

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
    } catch (error: unknown) {
      console.error("Error checking system status:", error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      console.error("Error during setup:", error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
      let hashMethod = 'bcrypt';
      
      try {
        // Primary method: bcrypt
        hashedPassword = await hash(newPassword, 10);
        const verificationTest = await compare(newPassword, hashedPassword);
        if (!verificationTest) {
          throw new Error('bcrypt verification failed');
        }
      } catch (bcryptError) {
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
      
    } catch (error: unknown) {
      console.error("Emergency password reset error:", error);
      res.status(500).json({ message: "Password reset failed" });
    }
  });

 // Production environment authentication status endpoint
  app.get("/api/auth/status", async (req, res) => {
    try {
      const adminUser = await storage.getUserByUsername('admin');
      const hasAdmin = !!adminUser;
      
      // Test bcrypt functionality
      let bcryptWorking = false;
      
      try {
        const testHash = await hash('test123', 10);
        bcryptWorking = await compare('test123', testHash);
      } catch (e) {
        console.log('bcrypt test failed:', e.message);
      }
      
      res.json({
        hasAdmin,
        bcryptWorking,
        environment: process.env.NODE_ENV || 'development',
        authenticationMethods: ['password'],
        authenticationStatus: bcryptWorking ? 'healthy' : 'degraded'
      });
    } catch (error: unknown) {
      console.error('Auth status check error:', error);
      res.status(500).json({ message: 'Failed to check authentication status' });
    }
  });

  app.post("/api/login", async (req, res, next) => {
    console.log('Login attempt for username:', req.body.username);
       
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
    // if ((req as any).session?.user) {
    //   const { password: _, ...userWithoutPassword } = (req as any).session.user;
    //   return res.json(userWithoutPassword);
    // }
    
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error("Error setting up security questions:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // User CRUD routes
  app.get("/api/users", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(400).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // User update route removed - duplicate of the one later in the file

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
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // Employee CRUD routes
  app.get("/api/employees", authenticateUser, async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      

      
      // Map storage format to frontend format - use direct field mapping
      const mappedEmployees = employees.map(emp => {
        const mapped = {
        id: emp.id,
        englishName: emp.englishName || emp.name,
        arabicName: emp.arabicName || null,
        empId: emp.empId || emp.employeeId,
        department: emp.department,
        title: emp.title || emp.position,
        employmentType: emp.employmentType || 'Full-time',
        status: emp.status, // Direct status mapping from storage
        isActive: emp.isActive,
        joiningDate: emp.joiningDate || null,
        exitDate: emp.exitDate || null,
        personalEmail: emp.personalEmail,
        corporateEmail: emp.corporateEmail || null,
        personalMobile: emp.personalMobile || emp.phone,
        workMobile: emp.workMobile || null,
        directManager: emp.directManager || null,
        idNumber: emp.idNumber || null,
        userId: emp.userId || null,
        createdAt: emp.createdAt,
        updatedAt: emp.updatedAt,
        };
        

        
        return mapped;
      });
      
      res.json(mappedEmployees);
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  app.get("/api/employees/with-assets", authenticateUser, async (req, res) => {
    try {
      // Get all employees
      const allEmployees = await storage.getAllEmployees();
      
      // Get all assets to check assignments
      const allAssets = await storage.getAllAssets();
      
      // Create a Set of employee IDs who have assets for O(1) lookup
      const employeeIdsWithAssets = new Set<number>();
      
      // Check all possible assignment fields in assets
      for (const asset of allAssets) {
        if (asset.assignedEmployeeId) {
          employeeIdsWithAssets.add(asset.assignedEmployeeId);
        }
        // Also check other possible fields for backward compatibility
        if (asset.assignedTo && typeof asset.assignedTo === 'number') {
          employeeIdsWithAssets.add(asset.assignedTo);
        }
        if (asset.assignedToId) {
          employeeIdsWithAssets.add(asset.assignedToId);
        }
      }
      
      // Filter employees who have assets assigned
      const employeesWithAssets = allEmployees.filter((emp: any) => 
        employeeIdsWithAssets.has(emp.id)
      );
      
      res.json(employeesWithAssets);
    } catch (error) {
      console.error('Error fetching employees with assets:', error);
      res.status(500).json({ 
        error: 'Failed to fetch employees with assets',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Employee export endpoint - MUST be before /:id route
  app.get("/api/employees/export", authenticateUser, async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      
      // Map to CSV format with all fields
      const csvData = employees.map(emp => ({
        'Employee ID': emp.empId,
        'English Name': emp.englishName || '',
        'Arabic Name': emp.arabicName || '',
        'Department': emp.department,
        'Position': emp.title,
        'Employment Type': emp.employmentType || 'Full-time',
        'Status': emp.status || (emp.isActive ? 'Active' : 'Inactive'),
        'Joining Date': emp.joiningDate || '',
        'Exit Date': emp.exitDate || '',
        'Personal Email': emp.personal || '',
        'Corporate Email': emp.corporateEmail || '',
        'Personal Mobile': emp.personalMobile || '',
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
    } catch (error: unknown) {
      console.error('Employee export error:', error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // Standardized CSV Template Generation (MUST BE BEFORE PARAMETERIZED ROUTES)
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
            'Type*': 'Laptop',
            'Brand*': 'Dell',
            'Model Number': 'Latitude 5520',
            'Model Name': 'Dell Latitude 15',
            'Serial Number*': 'DL123456789',
            'Specifications': '16GB RAM, 512GB SSD, Intel Core i7-11800H',
            'Status': 'Available',
            'Purchase Date': '2023-01-15',
            'Buy Price': '1200.00',
            'Warranty Expiry Date': '2025-01-15',
            'Life Span': '36',
            'Out of Box OS': 'Windows 11 Pro',
            'Assigned Employee ID': '1001'
          }];
          break;
        case 'employees':
          templateData = [{
            'englishName': 'John Smith (Required: Full name in English)',
            'arabicName': 'جون سميث (Optional: Name in Arabic)',
            'department': 'IT (Required: IT, HR, Finance, Marketing, etc.)',
            'email': 'john.smith@company.com (Required: Work email address)',
            'idNumber': 'ID123456789 (Required: National/Company ID)',
            'title': 'Software Engineer (Required: Job title)',
            'directManager': '1001 (Optional: Manager employee ID)',
            'employmentType': 'Full-time (Full-time, Part-time, Contract, Intern)',
            'joiningDate': '2023-01-15 (Required: Format YYYY-MM-DD or MM/DD/YYYY)',
            'exitDate': '2024-01-15 (Optional: Format YYYY-MM-DD or MM/DD/YYYY)',
            'status': 'Active (Active, Resigned, Terminated, On Leave)',
            'personalMobile': '+1234567890 (Optional: Personal phone)',
            'personalEmail': 'john@personal.com (Optional: Personal email)'
          }];
          break;
        case 'tickets':
          templateData = [{
            'Title*': 'Computer not starting (Required: Brief ticket title)',
            'Description*': 'Employee computer fails to boot up after power outage (Required: Detailed description)',
            'Category': 'Hardware (Hardware, Software, Network, Security, Access)',
            'Request Type': 'Incident (Service Request, Incident, Problem, Change)',
            'Priority': 'Medium (Low, Medium, High, Critical)',
            'Urgency': 'High (Low, Medium, High, Critical)',
            'Impact': 'Medium (Low, Medium, High, Critical)',
            'Status': 'Open (Open, In Progress, Resolved, Closed)',
            'Submitted By ID*': '1001 (Required: Employee ID who submitted)',
            'Assigned To ID': '1002 (Optional: User ID for assignment)',
            'Related Asset ID': '501 (Optional: Asset ID if related)',
            'Due Date': '2024-01-20 (Optional: Format YYYY-MM-DD or MM/DD/YYYY)',
            'Tags': 'urgent,hardware (Optional: Comma-separated tags)'
          }];
          break;
        default:
          return res.status(400).json({ error: "Template not available for this entity" });
      }

      // Generate CSV content directly using csv-stringify
      csvStringify(templateData, { header: true }, (err, output) => {
        if (err) {
          throw new Error('Error generating CSV template');
        }
        
        // Set proper headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${entity}-template.csv"`);
        
        // Send CSV content
        res.send(output);
      });
    } catch (error: unknown) {
      console.error('Error generating template:', error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // Raw endpoint for employee creation, bypassing schema validation
  app.post("/api/employees/create-raw", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      console.log("Creating new employee with data:", req.body);
      
      // Extract fields from request body - DO NOT manually generate empId, let database handle it
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
      
      // Create employee using storage interface - empId will be auto-generated by database
      const employeeData = {
        // empId is excluded - let database auto-generate it
        englishName,
        arabicName: arabicName || null,
        department,
        idNumber,
        title,
        directManager: directManager || null,
        employmentType: employmentType || 'Full-time',
        joiningDate,
        exitDate: exitDate || null,
        status: status || 'Active',
        personalMobile: personalMobile || null,
        workMobile: workMobile || null,
        personalEmail: personalEmail || null,
        corporateEmail: corporateEmail || null,
        userId: userId || null
      };
      
      const employee = await storage.createEmployee(employeeData);
      
      console.log("Successfully created employee with auto-generated ID:", employee);
      
      // Skip audit logging for better performance and cleaner logs
      // Activity logging can be re-enabled if needed for compliance
      
      res.status(201).json(employee);
    } catch (error: unknown) {
      console.error("Employee creation error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create employee" });
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
    } catch (error: unknown) {
      res.status(400).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });



  // Helper function to map employee status from import data
  function mapEmployeeStatus(status: string): string {
    if (!status) return 'Active';
    
    const statusMap: Record<string, string> = {
      'Active': 'Active',
      'Inactive': 'Resigned', // Map Inactive to Resigned
      'Resigned': 'Resigned',
      'Terminated': 'Terminated',
      'On Leave': 'On Leave',
      'Leave': 'On Leave'
    };
    
    return statusMap[status] || 'Active';
  }

  // Assets Export/Import
  app.get("/api/assets/export", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const assets = await storage.getAllAssets();
      
      // Transform asset data for export with proper field mapping
      const csvData = assets.map(asset => ({
        'ID': asset.id,
        'Asset ID': asset.assetId,
        'Type': asset.type,
        'Brand': asset.brand,
        'Model Number': asset.modelNumber || '',
        'Model Name': asset.modelName || '',
        'Serial Number': asset.serialNumber,
        'Specifications': asset.specs || '',
        'CPU': asset.cpu || '',
        'RAM': asset.ram || '',
        'Storage': asset.storage || '',
        'Status': asset.status,
        'Purchase Date': asset.purchaseDate || '',
        'Buy Price': asset.buyPrice || '',
        'Warranty Expiry Date': asset.warrantyExpiryDate || '',
        'Life Span': asset.lifeSpan || '',
        'Out of Box OS': asset.outOfBoxOs || '',
        'Assigned To ID': asset.assignedToId || '',
        'Created At': asset.createdAt ? new Date(asset.createdAt).toISOString() : '',
        'Updated At': asset.updatedAt ? new Date(asset.updatedAt).toISOString() : ''
      }));
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="assets.csv"');
      
      const csv = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      res.send(csv);
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  app.post("/api/assets/import", authenticateUser, hasAccess(3), upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const csvString = req.file.buffer.toString('utf-8');
      const parsedData = await parseCSV(csvString);
      
      if (parsedData.length === 0) {
        return res.status(400).json({ message: "Empty file or no valid data found" });
      }

      // Removed hardcoded column validation - allow flexible column mapping
      
      const importResults = [];
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // Get config once outside the loop for efficiency
      const config = await storage.getSystemConfig();
      const assetIdPrefix = config?.assetIdPrefix || 'AST';
      const existingAssets = await storage.getAllAssets();
      let nextAssetNumber = existingAssets.length + 1;

      // Process each row with comprehensive validation
      for (const [index, row] of parsedData.entries()) {
        try {
          // Database will auto-generate asset_id, no need to generate manually
          const assetData: any = {
            // assetId removed - database will auto-generate
            type: row['Type*'] || row['Type'] || row.type || null,
            brand: row['Brand*'] || row['Brand'] || row.brand || 'Unknown',
            modelNumber: row['Model Number'] || row.modelNumber || null,
            modelName: row['Model Name'] || row.modelName || null,
            serialNumber: row['Serial Number*'] || row['Serial Number'] || row.serialNumber || 'N/A',
            specs: row['Specifications'] || row.specs || null,
            cpu: row['CPU'] || row.cpu || null,
            ram: row['RAM'] || row.ram || null,
            storage: row['Storage'] || row.storage || null,
            status: row['Status'] || row.status || 'Available',
            purchaseDate: row['Purchase Date'] || row.purchaseDate || null,
            buyPrice: row['Buy Price'] || row.buyPrice || null,
            warrantyExpiryDate: row['Warranty Expiry Date'] || row.warrantyExpiryDate || null,
            lifeSpan: row['Life Span'] || row['Life Span (months)'] || row.lifeSpan || row.life_span || null,
            outOfBoxOs: row['Out of Box OS'] || row['Factory OS'] || row['Out-of-Box OS'] || row.outOfBoxOs || row.factory_os || row.out_of_box_os || null,
            assignedEmployeeId: row['Assigned Employee ID'] || row['Assigned To ID'] || row['Assigned To'] || row.assignedEmployeeId || row.assigned_to || row.assignedTo || null
          };

          // Validate and clean data using enhanced parsing
          if (assetData.purchaseDate && assetData.purchaseDate !== '') {
            const date = parseDate(assetData.purchaseDate);
            assetData.purchaseDate = date ? date.toISOString().split('T')[0] : null;
          } else {
            assetData.purchaseDate = null;
          }
          
          if (assetData.warrantyExpiryDate && assetData.warrantyExpiryDate !== '') {
            const date = parseDate(assetData.warrantyExpiryDate);
            assetData.warrantyExpiryDate = date ? date.toISOString().split('T')[0] : null;
          } else {
            assetData.warrantyExpiryDate = null;
          }

          // Clean and validate numeric fields
          if (assetData.buyPrice && assetData.buyPrice !== '') {
            const price = parseFloat(assetData.buyPrice);
            if (!isNaN(price) && price >= 0) {
              assetData.buyPrice = price;
            } else {
              assetData.buyPrice = null;
              warnings.push(`Row ${index + 1}: Invalid buy price "${assetData.buyPrice}", set to null`);
            }
          } else {
            assetData.buyPrice = null;
          }

          if (assetData.lifeSpan && assetData.lifeSpan !== '') {
            const lifeSpan = parseInt(assetData.lifeSpan);
            if (!isNaN(lifeSpan) && lifeSpan > 0) {
              assetData.lifeSpan = lifeSpan;
            } else {
              assetData.lifeSpan = null;
              warnings.push(`Row ${index + 1}: Invalid life span "${assetData.lifeSpan}", set to null`);
            }
          } else {
            assetData.lifeSpan = null;
          }

          if (assetData.assignedEmployeeId && assetData.assignedEmployeeId !== '') {
            const employeeId = parseInt(assetData.assignedEmployeeId);
            if (!isNaN(employeeId) && employeeId > 0) {
              // Optional: Verify employee exists
              try {
                const employees = await storage.getAllEmployees();
                const employeeExists = employees.some(emp => emp.id === employeeId);
                if (employeeExists) {
                  assetData.assignedEmployeeId = employeeId;
                } else {
                  assetData.assignedEmployeeId = null;
                  warnings.push(`Row ${index + 1}: Employee ID ${employeeId} not found, assignment cleared`);
                }
              } catch (error) {
                assetData.assignedEmployeeId = employeeId; // Keep the ID even if validation fails
                warnings.push(`Row ${index + 1}: Could not validate employee ID ${employeeId}`);
              }
            } else {
              assetData.assignedEmployeeId = null;
              warnings.push(`Row ${index + 1}: Invalid employee ID "${assetData.assignedEmployeeId}", set to null`);
            }
            } else {
            assetData.assignedEmployeeId = null;
          }

          // Validate required fields with fallback values
          if (!assetData.type || assetData.type.trim() === '') {
            assetData.type = 'Other'; // Default type instead of failing
            warnings.push(`Row ${index + 1}: Missing type, defaulted to "Other"`);
          }

          // Ensure asset status exists (flexible status system)
          if (assetData.status && assetData.status.trim() !== '') {
            try {
              await storage.ensureAssetStatus(assetData.status);
            } catch (error) {
              console.warn(`Could not ensure status "${assetData.status}" for row ${index + 1}:`, error);
              warnings.push(`Row ${index + 1}: Status "${assetData.status}" will be created if not exists`);
            }
          } else {
            assetData.status = 'Available'; // Default fallback
            warnings.push(`Row ${index + 1}: Missing status, defaulted to "Available"`);
          }
          
          const result = await storage.createAsset(assetData);
          importResults.push(result);
        } catch (error: any) {
          errors.push(`Row ${index + 1}: ${error.message}`);
        }
      }
      
      res.json({
        message: `Imported ${importResults.length} assets successfully`,
        imported: importResults.length,
        failed: errors.length,
        total: parsedData.length,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        success: errors.length === 0
      });
    } catch (error: any) {
      res.status(500).json({ error: "Asset import failed", details: error.message });
    }
  });

  // Employees Export/Import  
  app.post("/api/employees/import", authenticateUser, hasAccess(3), upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const csvString = req.file.buffer.toString('utf-8');
      const parsedData = await parseCSV(csvString);
      
      const importResults = [];
      const errors: string[] = [];
      
      for (const [index, row] of parsedData.entries()) {
        try {
          // Generate empId using enhanced system
          const generatedEmpId = await generateId('employee');

          // Validate and clean employment type BEFORE creating employee data
          const rawEmploymentType = row['Employment Type'] || row.employmentType || row['employment_type'] || '';
          const cleanedEmploymentType = cleanEmploymentType(rawEmploymentType);
          
          // Validate and parse date BEFORE creating employee data
          const rawJoiningDate = row['Start Date'] || row.startDate || row['joining_date'] || '';
          let joiningDateStr = null;
          if (rawJoiningDate) {
            const parsedDate = parseDate(rawJoiningDate);
            if (parsedDate) {
              joiningDateStr = parsedDate.toISOString().split('T')[0];
            } else {
              console.warn(`Invalid date format for employee ${row['English Name'] || row.englishName}: ${rawJoiningDate}`);
            }
          }

          const rawExitDate = row['Exit Date'] || row.exitDate || row['exit_date'] || '';
          let exitDateStr = null;
          if (rawExitDate && rawExitDate.trim() !== '') {
            const parsedExitDate = parseDate(rawExitDate);
            if (parsedExitDate) {
              exitDateStr = parsedExitDate.toISOString().split('T')[0];
            } else {
              console.warn(`Invalid exit date format for employee ${row['English Name'] || row.englishName}: ${rawExitDate}`);
            }
          }

          // Debug: Log available columns and data (can be removed in production)
          // console.log('Available columns in row:', Object.keys(row));
          // console.log('Row data:', JSON.stringify(row, null, 2));
          
          // Special handling for generic column names
          if (Object.keys(row).includes('_0')) {
            // console.log('Detected generic column names, accessing by index'); // Debug logging
            const englishName = row._0;
            const email = row._1;
            
            // Skip header row
            if (englishName === 'englishName' || email === 'email') {
              console.log('Skipping header row');
              continue;
            }
            
            if (!englishName || englishName.trim() === '') {
              throw new Error('English Name is required but missing or empty');
            }
            
            if (!email || email.trim() === '') {
              throw new Error('Email is required but missing or empty');
            }
            
            const employeeData: any = {
              empId: await generateId('employee'),
              englishName: englishName.trim(),
              arabicName: null,
              department: row._2 || 'General',
              idNumber: await generateId('employee'),
              title: row._3 || 'Employee',
              directManager: null,
              employmentType: 'Full-time',
              joiningDate: null,
              exitDate: null,
              status: 'Active',
              personalMobile: null,
              workMobile: null,
              personalEmail: email.trim(),
              corporateEmail: null,
              userId: null
            };
            
            const result = await storage.createEmployee(employeeData);
            importResults.push(result);
            continue;
          }
          
          // Validate required fields first  
          const englishName = row.englishName || row['English Name'] || row.name || row['Name'];
          const email = row.email || row['Email'] || row.emailAddress || row['email_address'];
          
          if (!englishName || englishName.trim() === '') {
            throw new Error('English Name is required but missing or empty');
          }
          
          if (!email || email.trim() === '') {
            throw new Error('Email is required but missing or empty');
          }

          const employeeData: any = {
            empId: row['Employee ID'] || row.empId || generatedEmpId,
            englishName: englishName.trim(),
            arabicName: row['Arabic Name'] || row.arabicName || null,
            department: row['Department'] || row.department || 'General', // Required field with default
            idNumber: row['ID Number'] || row.idNumber || row['national_id'] || generatedEmpId, // Required field with fallback
            title: row['Title'] || row.title || row['Position'] || row.position || 'Employee', // Required field with default
            directManager: null,
            employmentType: cleanedEmploymentType,
            joiningDate: joiningDateStr, // Use validated date
            exitDate: exitDateStr,
            status: row['Status'] || row.status || 'Active',
            personalMobile: row['Personal Mobile'] || row.personalMobile || row['Phone'] || row.phone || null,
            workMobile: row['Work Mobile'] || row.workMobile || null,
            personalEmail: row['Personal Email'] || row.personalEmail || email.trim(),
            corporateEmail: row['Corporate Email'] || row.corporateEmail || null,
            userId: null
          };

          // Handle manager ID if provided
          if (row['Manager ID'] || row.managerId) {
            const managerId = parseInt(row['Manager ID'] || row.managerId);
            employeeData.directManager = !isNaN(managerId) ? managerId : null;
          }
          
          const result = await storage.createEmployee(employeeData);
          importResults.push(result);
        } catch (error: any) {
          const errorMsg = error.message || String(error);
          console.error(`Employee import error for row ${index + 1}:`, errorMsg);
          errors.push(`Row ${index + 1}: ${errorMsg}`);
        }
      }
      
      res.json({
        message: `Imported ${importResults.length} employees successfully`,
        imported: importResults.length,
        failed: errors.length,
        total: parsedData.length,
        errors: errors.length > 0 ? errors : undefined,
        success: errors.length === 0
      });
    } catch (error: any) {
      res.status(500).json({ error: "Employee import failed", details: error.message });
    }
  });

  app.get("/api/tickets/export", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const tickets = await storage.getAllTickets();
      
      const csvData = tickets.map(ticket => ({
        'ID': ticket.id,
        'Ticket ID': ticket.ticketId,
        'Title': ticket.title || '',                     // ✅ Fixed: was Summary
        'Description': ticket.description || '',
        'Type': ticket.type || '',                       // ✅ Already correct
        'Category': ticket.category || '',
        'Urgency': ticket.urgency || '',
        'Impact': ticket.impact || '',
        'Priority': ticket.priority || '',
        'Status': ticket.status,
        'Submitted By ID': ticket.submittedById || '',
        'Assigned To ID': ticket.assignedToId || '',
        'Related Asset ID': ticket.relatedAssetId || '',
        'Time Spent': ticket.timeSpent || 0,             // ✅ Added: new schema field
        'Due Date': ticket.dueDate || '',
        'SLA Target': ticket.slaTarget || '',
        'Completion Time': ticket.completionTime || '',  // ✅ Added: new schema field
        'Resolution': ticket.resolution || '',
        'Created At': ticket.createdAt ? new Date(ticket.createdAt).toISOString() : '',
        'Updated At': ticket.updatedAt ? new Date(ticket.updatedAt).toISOString() : ''
        // ✅ Removed deprecated fields: Escalation Level, Tags, Root Cause, Workaround, Resolution Notes, Private Notes
      }));
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="tickets.csv"');
      
      const csv = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      res.send(csv);
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  app.post("/api/tickets/import", authenticateUser, hasAccess(3), upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const csvString = req.file.buffer.toString('utf-8');
      const parsedData = await parseCSV(csvString);
      
      const importResults = [];
      const errors: string[] = [];
      
      for (const [index, row] of parsedData.entries()) {
        try {
          console.log(`Processing ticket row ${index + 1}:`, Object.keys(row));
          
          // Handle CSV with generic column names or proper headers
          if (Object.keys(row).includes('_0')) {
            // Skip header row if detected
            if (row._0 === 'ticketId' || row._0 === 'summary' || row._0 === 'Summary') {
              console.log('Skipping ticket header row');
              continue;
            }
            
            // ticketId will be auto-generated by database - no need to generate manually
            
            // Find an active employee for submitted_by_id
            const employees = await storage.getAllEmployees();
            console.log(`Found ${employees.length} employees for ticket assignment`);
            
            if (employees.length === 0) {
              throw new Error('No employees found in the system to assign as ticket submitter');
            }
            
            const activeEmployee = employees.find(emp => emp.status === 'Active') || employees[0];
            console.log(`Using employee ID ${activeEmployee.id} for ticket submitter`);
            
            // Map CSV fields correctly - fixing the column mapping issue
            // Don't pass ticketId - let the database auto-generate it
            const ticketData: any = {
              // ticketId is auto-generated by database, don't pass it
              summary: (row._1 || 'Imported Ticket').substring(0, 255),        // Limit to 255 chars
              description: row._2 || 'No description',     // Description is text field, no limit
              category: (row._3 || 'Incident').substring(0, 100),              // Limit to 100 chars
              type: (row._4 || 'Hardware').substring(0, 100),           // Limit to 100 chars
              urgency: (row._5 || 'Medium').substring(0, 20),                 // Limit to 20 chars 
              impact: (row._6 || 'Medium').substring(0, 20),                  // Limit to 20 chars
              priority: row._7 || 'Medium',                // Enum field
              status: row._8 || 'Open',                    // Enum field
              submittedById: activeEmployee.id,
              assignedToId: null,
              relatedAssetId: null,
              dueDate: null,
              slaTarget: null,
              escalationLevel: 0,
              tags: null,
              rootCause: null,
              workaround: null,
              resolution: null,
              resolutionNotes: null,
              privateNotes: null
            };
            
            // Validate enum values before creating ticket
            const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
            const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed', 'Cancelled'];
            
            if (!validPriorities.includes(ticketData.priority)) {
              ticketData.priority = 'Medium';
            }
            if (!validStatuses.includes(ticketData.status)) {
              ticketData.status = 'Open';
            }
            
            const result = await storage.createTicket(ticketData);
            importResults.push(result);
            continue;
          }
          
          // Don't generate ticketId manually - let database auto-generate it
          // Generate ticket ID is not needed - database handles this automatically
          
          const ticketData: any = {
            // ticketId is auto-generated by database, don't pass it
            summary: (row['Summary'] || row.summary || 'Imported Ticket').substring(0, 255),
            description: row['Description'] || row.description || 'No description provided',
            category: (row['Category'] || row.category || 'Incident').substring(0, 100),
            type: (row['Type'] || row.type || 'Hardware').substring(0, 100),
            urgency: (row['Urgency'] || row.urgency || 'Medium').substring(0, 20),
            impact: (row['Impact'] || row.impact || 'Medium').substring(0, 20),
            priority: row['Priority'] || row.priority || 'Medium',
            status: row['Status'] || row.status || 'Open',
            submittedById: null, // Will be set below with proper validation
            assignedToId: null,
            relatedAssetId: null,
            dueDate: null,
            slaTarget: row['SLA Target'] || row.slaTarget || null,
            escalationLevel: row['Escalation Level'] || row.escalationLevel || 0,
            tags: row['Tags'] || row.tags || null,
            rootCause: row['Root Cause'] || row.rootCause || null,
            workaround: row['Workaround'] || row.workaround || null,
            resolution: row['Resolution'] || row.resolution || null,
            resolutionNotes: row['Resolution Notes'] || row.resolutionNotes || null,
            privateNotes: row['Private Notes'] || row.privateNotes || null
          };

          // Validate enum values to prevent database errors
          const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
          const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed', 'Cancelled'];
          
          if (!validPriorities.includes(ticketData.priority)) {
            console.warn(`Invalid priority "${ticketData.priority}", defaulting to "Medium"`);
            ticketData.priority = 'Medium';
          }
          if (!validStatuses.includes(ticketData.status)) {
            console.warn(`Invalid status "${ticketData.status}", defaulting to "Open"`);
            ticketData.status = 'Open';
          }

          // Parse IDs properly - find valid employee for submitted_by_id
          if (row['Submitted By ID'] || row.submittedById) {
            const submittedById = parseInt(row['Submitted By ID'] || row.submittedById);
            if (!isNaN(submittedById)) {
              // Verify the employee exists
              const employee = await storage.getEmployee(submittedById);
              ticketData.submittedById = employee ? submittedById : null;
            }
          }
          
          // If no valid submittedById found, find any active employee
          if (!ticketData.submittedById) {
            const employees = await storage.getAllEmployees();
            console.log(`Found ${employees.length} employees. Looking for active employee...`);
            
            if (employees.length > 0) {
              // Log first few employees for debugging
              console.log('First 3 employees:', employees.slice(0, 3).map(emp => ({ id: emp.id, status: emp.status, name: emp.name })));
              
              // First try to find an active employee
              let activeEmployee = employees.find(emp => emp.status === 'Active');
              
              // If no active employee found, use the first available employee
              if (!activeEmployee) {
                activeEmployee = employees[0];
                console.log(`No active employee found, using first employee: ID ${activeEmployee.id}, status: ${activeEmployee.status}`);
              } else {
                console.log(`Found active employee: ID ${activeEmployee.id}, status: ${activeEmployee.status}`);
              }
              
              ticketData.submittedById = activeEmployee.id;
              console.log(`Final submittedById assigned: ${ticketData.submittedById}`);
            } else {
              throw new Error('No employees found in the system to assign as ticket submitter');
            }
          }

          if (row['Assigned To ID'] || row.assignedToId) {
            const assignedToId = parseInt(row['Assigned To ID'] || row.assignedToId);
            ticketData.assignedToId = !isNaN(assignedToId) ? assignedToId : null;
          }

          if (row['Related Asset ID'] || row.relatedAssetId) {
            const relatedAssetId = parseInt(row['Related Asset ID'] || row.relatedAssetId);
            ticketData.relatedAssetId = !isNaN(relatedAssetId) ? relatedAssetId : null;
          }

          // Parse due date
          if (row['Due Date'] || row.dueDate) {
            const date = parseDate(row['Due Date'] || row.dueDate);
            ticketData.dueDate = date ? date.toISOString().split('T')[0] : null;
          }
          
          const result = await storage.createTicket(ticketData);
          importResults.push(result);
        } catch (error: any) {
          errors.push(`Row ${index + 1}: ${error.message}`);
        }
      }
      
      res.json({
        message: `Imported ${importResults.length} tickets successfully`,
        imported: importResults.length,
        failed: errors.length,
        total: parsedData.length,
        errors: errors.length > 0 ? errors : undefined,
        success: errors.length === 0
      });
    } catch (error: any) {
      res.status(500).json({ error: "Ticket import failed", details: error.message });
    }
  });

  // Enhanced Import/Export API endpoints for better field mapping and validation
  
  // Import the schema routes
  const importSchemaRoutes = await import('./routes/import-schema.js');
  app.use('/api/import', importSchemaRoutes.default);
  
  // Legacy schema endpoint (keeping for compatibility)
  app.get("/api/import/schema/:entityType", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const { entityType } = req.params;
      
      const schemas = {
        assets: {
          required: ['assetId', 'type', 'status'],
          optional: ['brand', 'modelNumber', 'modelName', 'serialNumber', 'specs', 'cpu', 'ram', 'storage', 
                   'purchaseDate', 'buyPrice', 'warrantyExpiryDate', 'lifeSpan', 'outOfBoxOs', 'assignedEmployeeId'],
          autoGenerated: ['id', 'createdAt', 'updatedAt'],
          enums: {
            status: ['Available', 'In Use', 'Under Maintenance', 'Retired', 'Lost', 'Stolen']
          }
        },
        employees: {
          required: ['empId', 'englishName', 'email'],
          optional: ['arabicName', 'phone', 'department', 'position', 'employmentType', 'startDate', 
                   'salary', 'status', 'address', 'emergencyContact', 'nationalId', 'managerId'],
          autoGenerated: ['id', 'createdAt', 'updatedAt'],
          enums: {
            employmentType: ['Full-time', 'Part-time', 'Contract', 'Intern'],
            status: ['Active', 'Inactive', 'Terminated', 'On Leave']
          }
        },
        tickets: {
          required: ['ticketId', 'summary', 'submittedById'],
          optional: ['description', 'category', 'type', 'urgency', 'impact', 'priority', 
                   'status', 'assignedToId', 'relatedAssetId', 'dueDate', 'slaTarget', 'escalationLevel',
                   'tags', 'rootCause', 'workaround', 'resolution', 'resolutionNotes', 'privateNotes'],
          autoGenerated: ['id', 'createdAt', 'updatedAt'],
          enums: {
            status: ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed', 'Cancelled'],
            priority: ['Low', 'Medium', 'High', 'Critical'],
            urgency: ['Low', 'Medium', 'High', 'Critical'],
            impact: ['Low', 'Medium', 'High', 'Critical']
          }
        }
      };
      
      const schema = schemas[entityType as keyof typeof schemas];
      if (!schema) {
        return res.status(400).json({ error: 'Invalid entity type' });
      }
      
      res.json(schema);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get schema', details: error.message });
    }
  });

  // Preview uploaded file and analyze structure
  app.post("/api/import/preview", authenticateUser, hasAccess(3), upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const csvString = req.file.buffer.toString('utf-8');
      const parsedData = await parseCSV(csvString);
      
      if (parsedData.length === 0) {
        return res.status(400).json({ message: "Empty file or invalid format" });
      }
      
      // Analyze file structure
      const headers = Object.keys(parsedData[0]);
      const preview = parsedData.slice(0, 5); // First 5 rows
      const rowCount = parsedData.length;
      
      // Detect likely entity type based on headers
      let detectedEntityType = 'unknown';
      if (headers.some(h => h.toLowerCase().includes('asset'))) {
        detectedEntityType = 'assets';
      } else if (headers.some(h => h.toLowerCase().includes('employee') || h.toLowerCase().includes('emp'))) {
        detectedEntityType = 'employees';
      } else if (headers.some(h => h.toLowerCase().includes('ticket'))) {
        detectedEntityType = 'tickets';
      }
      
      res.json({
        headers,
        preview,
        rowCount,
        detectedEntityType,
        fileInfo: {
          name: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: "File preview failed", details: error.message });
    }
  });

  // Process import data with mapping
  app.post("/api/import/process", authenticateUser, hasAccess(3), upload.none(), async (req, res) => {
    try {
      console.log('Raw request body:', req.body);
      console.log('Request headers:', req.headers);
      
      // Handle both JSON and FormData formats
      let entityType, data, mapping;
      
      if (req.headers['content-type']?.includes('application/json')) {
        ({ entityType, data, mapping } = req.body);
      } else {
        // Handle FormData format from the frontend
        console.log('FormData fields available:', Object.keys(req.body));
        entityType = req.body.entityType;
        console.log('Raw entityType:', entityType);
        console.log('Raw data field:', req.body.data);
        console.log('Raw mapping field:', req.body.mapping);
        
        try {
          data = req.body.data ? JSON.parse(req.body.data) : null;
        } catch (e) {
          console.error('Failed to parse data field:', e);
          data = null;
        }
        
        try {
          mapping = req.body.mapping ? JSON.parse(req.body.mapping) : null;
        } catch (e) {
          console.error('Failed to parse mapping field:', e);
          mapping = null;
        }
      }
      
      console.log('Parsed values:', { entityType, dataLength: data?.length, mapping });
      
      if (!entityType || !Array.isArray(data) || !mapping) {
        return res.status(400).json({ 
          message: "Missing required fields: entityType, data, or mapping",
          received: {
            entityType: !!entityType,
            data: Array.isArray(data) ? `array with ${data.length} items` : typeof data,
            mapping: !!mapping
          }
        });
      }

      console.log(`Processing import for ${entityType} with ${data.length} records`);
      console.log('Sample record:', data[0]);
      console.log('Mapping object:', mapping);
      
      let successful = 0;
      let failed = 0;
      const errors: string[] = [];

      
      // Process each record with field mapping
      for (const [index, record] of data.entries()) {
        try {
          // Apply field mapping to transform the record
          const mappedRecord: any = {};
          
        Object.entries(mapping).forEach(([dbField, csvField]) => {
          if (csvField && record[csvField as string] !== undefined) {
           // For specifications field, preserve the complete content
            if (dbField === 'specs' && csvField === 'Specifications') {
            mappedRecord[dbField] = record[csvField as string];
            console.log(`Mapped ${csvField} -> ${dbField}: ${record[csvField as string]}`);
           }
            // For CPU, RAM, Storage - always map them if they have values
           else if (['cpu', 'ram', 'storage'].includes(dbField)) {
            mappedRecord[dbField] = record[csvField as string];
            console.log(`Mapped ${csvField} -> ${dbField}: ${record[csvField as string]}`);
           }
           else {
            mappedRecord[dbField] = record[csvField as string];
            console.log(`Mapped ${csvField} -> ${dbField}: ${record[csvField as string]}`);
           }
          }
        });

        if (entityType === 'employees') {
  
          // Parse exitDate if present
          if (mappedRecord.exitDate) {
            console.log(`Row ${index + 1} - Raw exitDate: "${mappedRecord.exitDate}"`);
            const parsedExitDate = parseDate(mappedRecord.exitDate);
            console.log(`Row ${index + 1} - Parsed exitDate:`, parsedExitDate);
            
            if (parsedExitDate) {
              mappedRecord.exitDate = parsedExitDate.toISOString().split('T')[0];
              console.log(`Row ${index + 1} - Final exitDate: "${mappedRecord.exitDate}"`);
            } else {
              console.warn(`Row ${index + 1} - Invalid exit date format "${mappedRecord.exitDate}"`);
              mappedRecord.exitDate = null;
            }
          }
        }

          // Process based on entity type
          switch (entityType) {
            case 'employees':
              await storage.createEmployee({
                englishName: mappedRecord.englishName || `Employee ${index + 1}`,
                arabicName: mappedRecord.arabicName || null,
                department: mappedRecord.department || 'General',
                idNumber: mappedRecord.idNumber || `ID${Date.now()}${index}`,
                title: mappedRecord.title || 'Employee',
                directManager: mappedRecord.directManager || null,
                employmentType: mappedRecord.employmentType || 'Full-time',
                joiningDate: mappedRecord.joiningDate || new Date().toISOString().split('T')[0],
                exitDate: mappedRecord.exitDate || null,
                status: mappedRecord.status || 'Active',
                personalMobile: mappedRecord.personalMobile || null,
                workMobile: mappedRecord.workMobile || null,
                personalEmail: mappedRecord.personalEmail || null,
                corporateEmail: mappedRecord.corporateEmail || `employee${index + 1}@company.com`
               
              });
              break;

            case 'assets':
              // Helper function to parse dates safely
              const parseDate = (dateStr: string): string | null => {
                if (!dateStr || typeof dateStr !== 'string') return null;
                dateStr = dateStr.trim();
                if (dateStr === '' || dateStr.includes('(Optional') || dateStr.includes('Format:')) return null;
                
                // Try common date formats
                const dateFormats = [
                  /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
                  /^\d{1,2}\/\d{1,2}\/\d{4}$/,  // MM/DD/YYYY or M/D/YYYY
                  /^\d{1,2}-\d{1,2}-\d{4}$/   // MM-DD-YYYY
                ];
                
                for (const format of dateFormats) {
                  if (format.test(dateStr)) {
                    try {
                      const date = new Date(dateStr);
                      if (!isNaN(date.getTime())) {
                        return date.toISOString().split('T')[0];
                      }
                    } catch (e) {
                      // Continue to next format
                    }
                  }
                }
                return null;
              };

              // Helper function to normalize asset type using system config
              const normalizeAssetType = async (type: string): Promise<string> => {
                if (!type || typeof type !== 'string') return type || 'Unknown';
                
                // Get available asset types from system config ONLY
                const customTypes = await storage.getCustomAssetTypes();
                const availableTypes = customTypes.map(t => t.name);
                
                // If no custom types are configured, use the input as-is
                if (availableTypes.length === 0) {
                  return type.trim();
                }
                
                const normalized = type.trim();
                
                // First try exact match (case insensitive)
                const exactMatch = availableTypes.find(t => 
                  t.toLowerCase() === normalized.toLowerCase()
                );
                if (exactMatch) return exactMatch;
                
                // Then try common mappings only to configured types
                const typeMapping: Record<string, string[]> = {
                  'smartphone': ['Phone', 'Mobile', 'Device'],
                  'mobile': ['Phone', 'Mobile', 'Device'],
                  'router': ['Network', 'Router', 'Equipment'],
                  'switch': ['Network', 'Switch', 'Equipment'],
                  'keyboard': ['Accessories', 'Peripheral', 'Input'],
                  'mouse': ['Accessories', 'Peripheral', 'Input'],
                  'headset': ['Accessories', 'Audio', 'Peripheral'],
                  'webcam': ['Accessories', 'Camera', 'Peripheral'],
                  'laptop': ['Laptop', 'Computer', 'Device'],
                  'desktop': ['Desktop', 'Computer', 'PC']
                };
                
                const possibleMappings = typeMapping[normalized.toLowerCase()] || [];
                for (const mapping of possibleMappings) {
                  if (availableTypes.some(t => t.toLowerCase() === mapping.toLowerCase())) {
                    return availableTypes.find(t => t.toLowerCase() === mapping.toLowerCase())!;
                  }
                }
                
                // If no mapping found, use the original input as-is (fully dynamic)
                return normalized;
              };

              // Parse purchase price properly
              const parseBuyPrice = (priceStr: string): number | null => {
                if (!priceStr || typeof priceStr !== 'string') return null;
                const cleanPrice = priceStr.replace(/[^\d.-]/g, ''); // Remove currency symbols and spaces
                const price = parseFloat(cleanPrice);
                return !isNaN(price) ? price : null;
              };

              console.log('Asset data being created:', {
                type: await normalizeAssetType(mappedRecord.type),
                brand: mappedRecord.brand || 'Unknown',
                serialNumber: mappedRecord.serialNumber || `SN${Date.now()}${index}`,
                specs: mappedRecord.specs || null,
                buyPrice: parseBuyPrice(mappedRecord.buyPrice),
                status: mappedRecord.status || 'Available'
              });

              await storage.createAsset({
                type: await normalizeAssetType(mappedRecord.type),
                brand: mappedRecord.brand || 'Unknown',
                modelNumber: mappedRecord.modelNumber || null,
                modelName: mappedRecord.modelName || null,
                serialNumber: mappedRecord.serialNumber || `SN${Date.now()}${index}`,
                specs: mappedRecord.specs || null,
                cpu: mappedRecord.cpu || null, // Save individual CPU field if provided
                ram: mappedRecord.ram || null, // Save individual RAM field if provided
                storage: mappedRecord.storage || null, // Save individual Storage field if provided
                status: mappedRecord.status || 'Available',
                purchaseDate: parseDate(mappedRecord.purchaseDate),
                buyPrice: parseBuyPrice(mappedRecord.buyPrice)?.toString() || null,
                warrantyExpiryDate: parseDate(mappedRecord.warrantyExpiryDate),
                lifeSpan: mappedRecord.lifeSpan && !isNaN(parseInt(mappedRecord.lifeSpan)) ? parseInt(mappedRecord.lifeSpan) : null,
                outOfBoxOs: mappedRecord.outOfBoxOs || null,
                assignedEmployeeId: mappedRecord.assignedEmployeeId && !isNaN(parseInt(mappedRecord.assignedEmployeeId)) ? parseInt(mappedRecord.assignedEmployeeId) : null
              });
              break;

            case 'tickets':
              // Find a default employee for submittedById
              const employees = await storage.getAllEmployees();
              const defaultEmployee = employees.find(emp => emp.status === 'Active') || employees[0];
              
              if (!defaultEmployee) {
                throw new Error('No employees found to assign as ticket submitter');
              }

              await storage.createTicket({
                summary: mappedRecord.summary || `Imported Ticket ${index + 1}`,
                description: mappedRecord.description || 'No description provided',
                category: mappedRecord.category || 'General',
                categoryId: mappedRecord.categoryId ? parseInt(mappedRecord.categoryId) : null,
                urgency: mappedRecord.urgency || 'Medium',
                impact: mappedRecord.impact || 'Medium',
                priority: mappedRecord.priority || 'Medium',
                status: mappedRecord.status || 'Open',
                submittedById: defaultEmployee.id,
                assignedToId: mappedRecord.assignedToId ? parseInt(mappedRecord.assignedToId) : null,
                relatedAssetId: mappedRecord.relatedAssetId ? parseInt(mappedRecord.relatedAssetId) : null,
                dueDate: mappedRecord.dueDate || null,
                slaTarget: mappedRecord.slaTarget || null,
                escalationLevel: mappedRecord.escalationLevel ? parseInt(mappedRecord.escalationLevel) : 0,
                tags: mappedRecord.tags ? JSON.parse(mappedRecord.tags) : null,
                rootCause: mappedRecord.rootCause || null,
                workaround: mappedRecord.workaround || null,
                resolution: mappedRecord.resolution || null,
                resolutionNotes: mappedRecord.resolutionNotes || null,
                privateNotes: mappedRecord.privateNotes || null
              });
              break;

            default:
              throw new Error(`Unsupported entity type: ${entityType}`);
          }

          successful++;
        } catch (error: any) {
          failed++;
          errors.push(`Row ${index + 1}: ${error.message}`);
          console.error(`Import error for row ${index + 1}:`, error.message);
        }
      }

      res.json({
        total: data.length,
        imported: successful,
        failed,
        errors: errors.slice(0, 10) // Limit to first 10 errors to avoid huge responses
      });

    } catch (error: any) {
      console.error('Import process error:', error);
      res.status(500).json({ error: "Import process failed", details: error.message });
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
          'Specifications': asset.specs || '',
          'CPU': asset.cpu || '', // New hardware field
          'RAM': asset.ram || '', // New hardware field  
          'Storage': asset.storage || '', // New hardware field
          'Status': asset.status,
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
    } catch (error: unknown) {
      console.error('Error exporting assets to CSV:', error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // Asset CRUD routes with pagination

    app.get("/api/assets/paginated", authenticateUser, async (req, res) => {
      try {
        // Get pagination parameters from query
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50; // Default 50 items per page
        const offset = (page - 1) * limit;
        
        // Get filter parameters
        const filters = {
          type: req.query.type as string,
          status: req.query.status as string,
          brand: req.query.brand as string,
          search: req.query.search as string,
          maintenanceDue: req.query.maintenanceDue as string,
          assignedTo: req.query.assignedTo as string,
          model: req.query.model as string,
        };
        
        console.log('Assets API - Filters:', filters, 'Page:', page, 'Limit:', limit);
        
        // Get all assets (we'll filter then paginate)
        const allAssets = await storage.getAllAssets();
        
        // Apply filters before pagination
        let filteredAssets = allAssets;
        
        // Apply search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredAssets = filteredAssets.filter(asset => 
            asset.assetId?.toLowerCase().includes(searchLower) ||
            asset.type?.toLowerCase().includes(searchLower) ||
            asset.brand?.toLowerCase().includes(searchLower) ||
            asset.modelName?.toLowerCase().includes(searchLower) ||
            asset.serialNumber?.toLowerCase().includes(searchLower) ||
            asset.location?.toLowerCase().includes(searchLower) ||
            asset.specs?.toLowerCase().includes(searchLower)
          );
        }
        
        // Apply other filters
        if (filters.type) {
          filteredAssets = filteredAssets.filter(asset => asset.type === filters.type);
        }
        if (filters.status) {
          filteredAssets = filteredAssets.filter(asset => asset.status === filters.status);
        }
        if (filters.brand) {
          filteredAssets = filteredAssets.filter(asset => asset.brand === filters.brand);
        }
        if (filters.model) {
          filteredAssets = filteredAssets.filter(asset => asset.modelName === filters.model);
        }
        
        // Apply assignment filter
        if (filters.assignedTo) {
          if (filters.assignedTo === 'unassigned') {
            filteredAssets = filteredAssets.filter(asset => !asset.assignedEmployeeId);
          } else {
            filteredAssets = filteredAssets.filter(asset => 
              asset.assignedEmployeeId?.toString() === filters.assignedTo
            );
          }
        }
        
        // For maintenance filter, we need to check maintenance records
        // For maintenance filter, we need to check maintenance records
        let assetsAfterMaintenanceFilter = filteredAssets; // Changed variable name

        if (filters.maintenanceDue) {
          // Get maintenance status for all filtered assets
          const assetsWithMaintenanceStatus = await Promise.all(
            filteredAssets.map(async (asset) => {  // Use filteredAssets instead of assets
              const maintenanceRecords = await storage.getMaintenanceForAsset(asset.id);
              
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              const hasScheduled = maintenanceRecords.some(m => {
                if (m.status !== 'Scheduled') return false;
                
                const maintenanceDate = new Date(m.date);
                maintenanceDate.setHours(0, 0, 0, 0);
                
                // Include maintenance scheduled for today or future dates
                return maintenanceDate >= today;
              });
              
              const hasInProgress = maintenanceRecords.some(m => m.status === 'In Progress');
              const hasCompleted = maintenanceRecords.some(m => m.status === 'Completed');
              
              // Check for overdue (scheduled but past date)
              const hasOverdue = maintenanceRecords.some(m => {
                if (m.status !== 'Scheduled') return false;
                const maintenanceDate = new Date(m.date);
                maintenanceDate.setHours(0, 0, 0, 0);
                return maintenanceDate < today;
              });
              
              return {
                ...asset,
                hasScheduledMaintenance: hasScheduled,
                hasInProgressMaintenance: hasInProgress,
                hasCompletedMaintenance: hasCompleted,
                hasOverdueMaintenance: hasOverdue
              };
            })
          );

      // Filter based on maintenance status
        assetsAfterMaintenanceFilter = assetsWithMaintenanceStatus.filter(asset => {
          if (filters.maintenanceDue === 'scheduled') return asset.hasScheduledMaintenance;
          if (filters.maintenanceDue === 'inProgress') return asset.hasInProgressMaintenance;
          if (filters.maintenanceDue === 'completed') return asset.hasCompletedMaintenance;
          if (filters.maintenanceDue === 'overdue') return asset.hasOverdueMaintenance;
          return true;
        });
      }
        
        // Get total count after all filters
        const totalCount = assetsAfterMaintenanceFilter.length;
        const totalPages = Math.ceil(totalCount / limit);
        // Apply pagination
        const paginatedAssets = assetsAfterMaintenanceFilter.slice(offset, offset + limit); 
               
        // Enrich ONLY the paginated assets with full maintenance data
        const enrichedAssets = await Promise.all(
          paginatedAssets.map(async (asset) => {
            try {
              const maintenanceRecords = await storage.getMaintenanceForAsset(asset.id);
              
              // Get employee data if assigned
              let assignedEmployee = null;
              if (asset.assignedEmployeeId) {
                assignedEmployee = await storage.getEmployee(asset.assignedEmployeeId);
              }
              
              // Calculate maintenance dates
              const completedMaintenance = maintenanceRecords
                .filter(m => m.status === 'Completed')
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              
              const inProgressMaintenance = maintenanceRecords
                .filter(m => m.status === 'In Progress');
              
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              const scheduledMaintenance = maintenanceRecords
                .filter(m => {
                  const maintenanceDate = new Date(m.date);
                  return m.status === 'Scheduled' && maintenanceDate >= today;
                })
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
              
              return {
                ...asset,
                assignedEmployee,
                lastMaintenanceDate: completedMaintenance[0]?.date || null,
                nextMaintenanceDate: scheduledMaintenance[0]?.date || inProgressMaintenance[0]?.date || null,
                currentMaintenanceStatus: inProgressMaintenance.length > 0 ? 'inProgress' : 
                                        scheduledMaintenance.length > 0 ? 'scheduled' : 'none',
                hasScheduledMaintenance: scheduledMaintenance.length > 0,
                hasInProgressMaintenance: inProgressMaintenance.length > 0,
                hasCompletedMaintenance: completedMaintenance.length > 0,
                maintenanceCount: maintenanceRecords.length
              };
            } catch (error) {
              console.error(`Error enriching asset ${asset.id}:`, error);
              return {
                ...asset,
                assignedEmployee: null,
                lastMaintenanceDate: null,
                nextMaintenanceDate: null,
                currentMaintenanceStatus: 'none',
                hasScheduledMaintenance: false,
                hasInProgressMaintenance: false,
                hasCompletedMaintenance: false,
                maintenanceCount: 0
              };
            }
          })
        );
        
        console.log(`Returning ${enrichedAssets.length} assets (page ${page} of ${totalPages})`);
        
        // Send paginated response
        res.json({
          data: enrichedAssets,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages,
            hasMore: page < totalPages
          }
        });
      } catch (error: unknown) {
        console.error('Error fetching assets:', error);
        res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
      }
    });

    // Assets without pagination
    app.get("/api/assets", authenticateUser, async (req, res) => {
      try {
        const user = req.user as schema.User;
        const userRoleLevel = getUserRoleLevel(user);
        
        let assets;
        if (userRoleLevel === 1) { // Employee role
          const allAssets = await storage.getAllAssets();
          // Only show Available and In Use assets
          assets = allAssets.filter(asset => 
            asset.status === 'Available' || asset.status === 'In Use'
          );
        } else {
          // Admin/Manager can see all assets
          assets = await storage.getAllAssets();
        }
        
        // Return simple array without pagination
        res.json(assets);
      } catch (error: unknown) {
        res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  app.post("/api/assets", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      console.log('Asset creation request received:', req.body);
      
      // Get the request data but omit assetId as we'll auto-generate it
      let requestData = { ...req.body };
      delete requestData.assetId;
      
      // Clean up undefined and empty values
      Object.keys(requestData).forEach(key => {
        if (requestData[key] === undefined || requestData[key] === '') {
          requestData[key] = null;
        }
      });
      
      console.log('Processed request data:', requestData);
      
      // Remove manual asset ID generation - let database handle it
      console.log('Creating asset with auto-generated ID from database');
      
      // Ensure required fields have values
      if (!requestData.type) requestData.type = 'Other';
      if (!requestData.brand) requestData.brand = 'Unknown';
      if (!requestData.serialNumber) requestData.serialNumber = `SN-${Date.now()}`;
      if (!requestData.status) requestData.status = 'Available';
      
      console.log('Final asset data before validation:', requestData);
      
      // Direct creation without schema validation to bypass validation errors
      const asset = await storage.createAsset(requestData);
      
      console.log('Asset created successfully:', asset);
      
      // Log activity
      if (req.user) {
        try {
          await storage.logActivity({
            userId: (req.user as schema.User).id,
            action: "Create",
            entityType: "Asset",
            entityId: asset.id,
            details: { assetId: asset.assetId, type: asset.type, brand: asset.brand }
          });
        } catch (logError) {
          console.warn('Could not log activity:', logError);
        }
      }
      
      res.status(201).json(asset);
    } catch (error: unknown) {
      console.error('Asset creation error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error details:', errorMessage);
      res.status(400).json({ 
        error: 'Asset creation failed', 
        message: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      });
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
    } catch (error: unknown) {
      res.status(400).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // Quick asset assignment for testing (temporary route)
  app.post("/api/assets/:id/quick-assign", authenticateUser, async (req, res) => {
    try {
      const assetId = parseInt(req.params.id);
      const { employeeId } = req.body;
      
      console.log(`Quick assign request: Asset ${assetId} to Employee ${employeeId}`);
      
      // Use the helper method we just created
      const updatedAsset = await storage.assignAssetToEmployee(assetId, parseInt(employeeId));
      
      if (!updatedAsset) {
        return res.status(404).json({ message: "Asset or Employee not found" });
      }
      
      res.json({ 
        message: "Asset assigned successfully", 
        asset: updatedAsset 
      });
    } catch (error: unknown) {
      console.error('Error in quick assign:', error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
      if (asset.status === 'Maintenance') {
        const existingMaintenance = await storage.getMaintenanceForAsset(assetId);
        const activeMaintenance = existingMaintenance.find(m => 
          m.type !== 'Completed' && m.type !== 'Cancelled'
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
        requestData.cost = '0';
      } else if (typeof requestData.cost === 'number') {
        requestData.cost = requestData.cost.toString();
      }
      
      const maintenanceData = validateBody<schema.InsertAssetMaintenance>(
        schema.insertAssetMaintenanceSchema, 
        {  assetId: assetId,
      date: requestData.date,
      type: requestData.type || 'Preventive', // type is maintenance type (Preventive, Corrective, etc.)
      description: requestData.description,
      cost: requestData.cost,
      providerType: requestData.providerType,
      providerName: requestData.providerName,
      status: requestData.status, // status is Scheduled, In Progress, or Completed
      performedBy: (req.user as schema.User).id
      }
      );

      if (!requestData.status) {
      requestData.status = 'Completed';
       }

    // Update asset status if maintenance is in progress
    if (requestData.status === 'In Progress') {
      await storage.updateAsset(assetId, { status: 'Under Maintenance' });
    }
      
      const maintenance = await storage.createAssetMaintenance(maintenanceData);
      
      // Create a transaction record for the maintenance
      await storage.createAssetTransaction({
        assetId: assetId,
        type: 'Maintenance',
        employeeId: null, // Maintenance doesn't need employee assignment
        transactionDate: new Date(requestData.date),
        handledById: (req.user as schema.User).id,
        conditionNotes: `${requestData.type}: ${requestData.description}`,
        deviceSpecs: {
          maintenanceId: maintenance.id,
          maintenanceType: requestData.type,
          cost: requestData.cost,
          provider: requestData.providerName,
          status: requestData.status
        }
      });

      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Create",
          entityType: "Asset Maintenance",
          entityId: maintenance.id,
          details: { 
            assetId: asset.assetId,
            maintenanceType: maintenance.type,
            maintenanceStatus: maintenance.status,
            description: maintenance.description,
            statusChanged: asset.status !== 'Maintenance'
          }
        });
      }
      
      res.status(201).json(maintenance);
    } catch (error: unknown) {
      res.status(400).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // Get maintenance records for an asset
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
            canEdit: record.type !== 'Completed' && record.type !== 'Cancelled'
          };
        })
      );
      
      res.json(enrichedMaintenance);
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // Update maintenance record
  app.put("/api/maintenance/:id", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const maintenanceId = parseInt(req.params.id);
      
      // Get existing maintenance record (need to add this method to storage)
      const existingMaintenance = await storage.getAssetMaintenanceById(maintenanceId);
      if (!existingMaintenance) {
        return res.status(404).json({ message: "Maintenance record not found" });
      }
      
      // Validate request data
      let requestData = { ...req.body };
      if (requestData.cost === undefined || requestData.cost === null || requestData.cost === '') {
        requestData.cost = existingMaintenance.cost;
      }
      
      const maintenanceData = validateBody<Partial<schema.InsertAssetMaintenance>>(
        schema.insertAssetMaintenanceSchema.partial(), 
        requestData
      );
      
      const updatedMaintenance = await storage.updateAssetMaintenance(maintenanceId, maintenanceData);
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Update",
          entityType: "Asset Maintenance",
          entityId: maintenanceId,
          details: { 
            maintenanceId,
            changes: requestData,
            updatedBy: (req.user as schema.User).username
          }
        });
      }
      
      res.json(updatedMaintenance);
    } catch (error: unknown) {
      res.status(400).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // Delete maintenance record
  app.delete("/api/maintenance/:id", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const maintenanceId = parseInt(req.params.id);
      
      // Get existing maintenance record to validate it exists
      const existingMaintenance = await storage.getAssetMaintenanceById(maintenanceId);
      if (!existingMaintenance) {
        return res.status(404).json({ message: "Maintenance record not found" });
      }
      
      // Delete the maintenance record
      const result = await storage.deleteAssetMaintenance(maintenanceId);
      
      if (result) {
        // Log activity
        if (req.user) {
          await storage.logActivity({
            userId: (req.user as schema.User).id,
            action: "Delete",
            entityType: "Asset Maintenance",
            entityId: maintenanceId,
            details: { 
              maintenanceId,
              assetId: existingMaintenance.assetId,
              deletedBy: (req.user as schema.User).username
            }
          });
        }
        
        res.json({ message: "Maintenance record deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete maintenance record" });
      }
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // Get all maintenance records (for maintenance management page)
  app.get("/api/maintenance", authenticateUser, async (req, res) => {
    try {
      const maintenance = await storage.getAllMaintenanceRecords();
      
      // Enrich with asset and performer details
      const enrichedMaintenance = await Promise.all(
        maintenance.map(async (record) => {
          const asset = await storage.getAsset(record.assetId);
          const performer = record.performedBy ? await storage.getUser(record.performedBy) : null;
          
          return {
            ...record,
            assetInfo: asset ? {
              assetId: asset.assetId,
              type: asset.type,
              brand: asset.brand,
              modelName: asset.modelName
            } : null,
            performerName: performer ? performer.username : 'System',
            canEdit: record.type !== 'Completed' && record.type !== 'Cancelled'
          };
        })
      );
      
      res.json(enrichedMaintenance);
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

// ============================================
// SIMPLIFIED ASSET UPGRADE ROUTES
// ============================================

 // Create upgrade request
  app.post('/api/assets/:id/upgrade', authenticateUser, async (req, res) => {
    try {
      const assetId = parseInt(req.params.id);
      const user = req.user as schema.User;
      
      // Validate asset exists
      const asset = await storage.getAsset(assetId);
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      
      // Validate approvedById as employees.id only (no userId mapping)
      let approvedEmployeeId: number | null = null;
      if (req.body.approvedById !== undefined && req.body.approvedById !== null) {
        const idNum = Number(req.body.approvedById);
        if (Number.isNaN(idNum)) {
          return res.status(400).json({ message: 'approvedById must be a valid employee id' });
        }
        const approver = await storage.getEmployee(idNum);
        if (!approver) {
          return res.status(400).json({ message: 'Approver employee not found' });
        }
        approvedEmployeeId = approver.id;
      }

      // Create upgrade request
      const upgradeData = {
        assetId,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        upgradeType: req.body.upgradeType,
        priority: req.body.priority,
        scheduledDate: req.body.scheduledDate,
        purchaseRequired: req.body.purchaseRequired || false,
        estimatedCost: req.body.estimatedCost || null,
        justification: req.body.justification,
        approvedById: approvedEmployeeId,
        approvalDate: req.body.approvalDate || null,
        status: approvedEmployeeId ? 'Approved' : 'Pending Approval',
        createdById: user.id,
        updatedById: user.id,
      };
      
      const upgrade = await storage.createAssetUpgrade(upgradeData);
      
      // Get the asset to find assigned employee
      const assetForUpgrade = await storage.getAsset(assetId);
      
      // Create a transaction record for the upgrade with the assigned employee
      await storage.createAssetTransaction({
        assetId: assetId,
        type: 'Upgrade',
        employeeId: assetForUpgrade?.assignedEmployeeId || null, // Include assigned employee for history context
        transactionDate: new Date(),
        handledById: user.id,
        conditionNotes: `${req.body.title} (Status: ${upgradeData.status})`,
        deviceSpecs: {
          upgradeId: upgrade.id,
          title: req.body.title,
          category: req.body.category,
          upgradeType: req.body.upgradeType,
          priority: req.body.priority,
          status: upgradeData.status,
          estimatedCost: req.body.estimatedCost,
          description: req.body.description
        }
      });
      
      // Log activity (following maintenance pattern)
      if (req.user) {
        await storage.logActivity({
          userId: user.id,
          action: "Create",
          entityType: "Asset Upgrade",
          entityId: upgrade.id,
          details: {
            assetId: asset.assetId,
            upgradeTitle: upgrade.title,
            upgradePriority: upgrade.priority,
            upgradeStatus: upgrade.status
          }
        });
      }
      
      res.json(upgrade);
    } catch (error: unknown) {
      console.error('Error creating upgrade request:', error);
      res.status(500).json({ message: 'Error creating upgrade request' });
    }
  });

// Get all upgrades
app.get('/api/upgrades', authenticateUser, async (req, res) => {
  try {
    // Check if the storage method exists
    if (typeof storage.getAllAssetUpgrades === 'function') {
      // Use the storage method if it exists
      const allUpgrades = await storage.getAllAssetUpgrades();
      
      // Apply filters
      let filteredUpgrades = allUpgrades;
      const { status, category, priority, search } = req.query;
      
      if (status && status !== 'all') {
        filteredUpgrades = filteredUpgrades.filter(u => u.status === status);
      }
      
      if (category && category !== 'all') {
        filteredUpgrades = filteredUpgrades.filter(u => u.category === category);
      }
      
      if (priority && priority !== 'all') {
        filteredUpgrades = filteredUpgrades.filter(u => u.priority === priority);
      }
      
      if (search) {
        const searchLower = String(search).toLowerCase();
        filteredUpgrades = filteredUpgrades.filter(u => 
          u.title?.toLowerCase().includes(searchLower) ||
          u.description?.toLowerCase().includes(searchLower) ||
          u.assetInfo?.assetId?.toLowerCase().includes(searchLower)
        );
      }
      
      res.json(filteredUpgrades);
    } else {
      // Fallback: return empty array for now
      console.log('getAllAssetUpgrades method not found, returning empty array');
      res.json([]);
    }
  } catch (error: unknown) {
    console.error('Error fetching upgrades:', error);
    // Return empty array instead of error to keep the page working
    res.json([]);
  }
});

// Get single upgrade
app.get('/api/upgrades/:id', authenticateUser, async (req, res) => {
  try {
    const upgradeId = parseInt(req.params.id);
    
    const query = `
      SELECT 
        u.*,
        a.asset_id as asset_code,
        a.type as asset_type,
        a.brand as asset_brand,
        a.model_name as asset_model,
        creator.username as created_by_name,
        approver.name as approved_by_name
      FROM asset_upgrades u
      LEFT JOIN assets a ON u.asset_id = a.id
      LEFT JOIN users creator ON u.created_by_id = creator.id
      LEFT JOIN employees approver ON u.approved_by_id = approver.id
      WHERE u.id = $1
    `;
    
    const result = await storage.pool.query(query, [upgradeId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Upgrade not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error: unknown) {
    console.error('Error fetching upgrade:', error);
    res.status(500).json({ message: 'Error fetching upgrade' });
  }
});

// Update upgrade
app.put('/api/upgrades/:id', authenticateUser, hasAccess(2), async (req, res) => {
  try {
    const upgradeId = parseInt(req.params.id);
    const user = req.user as schema.User;
    
    // Check if upgrade exists
    const existingQuery = 'SELECT * FROM asset_upgrades WHERE id = $1';
    const existingResult = await storage.pool.query(existingQuery, [upgradeId]);
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Upgrade not found' });
    }
    
    const existing = existingResult.rows[0];
    
    // Check if status allows editing
    if (!['Draft', 'Pending Approval'].includes(existing.status) && !req.body.status) {
      return res.status(400).json({ message: 'Cannot edit upgrade in current status' });
    }
    
    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;
    
    const allowedFields = [
      'title', 'description', 'category', 'upgradeType', 'priority',
      'scheduledDate', 'purchaseRequired', 'estimatedCost', 'justification',
      'approvedById', 'approvalDate', 'status'
    ];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        paramCount++;
        updates.push(`${field.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${paramCount}`);
        values.push(req.body[field]);
      }
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    paramCount++;
    updates.push(`updated_by_id = $${paramCount}`);
    values.push(user.id);
    
    updates.push('updated_at = NOW()');
    
    paramCount++;
    values.push(upgradeId);
    
    const updateQuery = `
      UPDATE asset_upgrades 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await storage.pool.query(updateQuery, values);
        
    res.json(result.rows[0]);
  } catch (error: unknown) {
    console.error('Error updating upgrade:', error);
    res.status(500).json({ message: 'Error updating upgrade' });
  }
});

// Delete upgrade (only drafts)
app.delete('/api/upgrades/:id', authenticateUser, hasAccess(2), async (req, res) => {
  try {
    const upgradeId = parseInt(req.params.id);
    const user = req.user as schema.User;
    
    // Check if upgrade exists and is a draft
    const checkQuery = 'SELECT * FROM asset_upgrades WHERE id = $1';
    const checkResult = await storage.pool.query(checkQuery, [upgradeId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Upgrade not found' });
    }
    
    if (checkResult.rows[0].status !== 'Draft') {
      return res.status(400).json({ message: 'Can only delete draft upgrades' });
    }
    
    // Delete upgrade
    await storage.pool.query('DELETE FROM asset_upgrades WHERE id = $1', [upgradeId]);
    
 
    
    res.json({ message: 'Upgrade deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting upgrade:', error);
    res.status(500).json({ message: 'Error deleting upgrade' });
  }
});

// Quick status update
app.post('/api/upgrades/:id/status', authenticateUser, hasAccess(2), async (req, res) => {
  try {
    const upgradeId = parseInt(req.params.id);
    const user = req.user as schema.User;
    const { status, notes } = req.body;
    
    console.log('Updating upgrade status:', { upgradeId, status, userId: user.id });
    
    const validStatuses = ['Draft', 'Pending Approval', 'Approved', 'In Progress', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // First get the upgrade request details
    const upgradeRequest = await db
      .select()
      .from(assetUpgrades)
      .where(eq(assetUpgrades.id, upgradeId))
      .limit(1);

    if (upgradeRequest.length === 0) {
      return res.status(404).json({ message: 'Upgrade request not found' });
    }

    const upgrade = upgradeRequest[0];

    // Update the upgrade status
    const result = await db
      .update(assetUpgrades)
      .set({ 
        status: status,
        updatedById: user.id,
        updatedAt: new Date()
      })
      .where(eq(assetUpgrades.id, upgradeId))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ message: 'Upgrade not found' });
    }

    // Create asset transaction record for certain status changes
    const shouldCreateTransaction = ['Approved', 'Completed', 'Cancelled'].includes(status);
    
    if (shouldCreateTransaction) {
      try {
        // Query the asset to get the assigned employee information
        const assetQuery = await db
          .select({
            assignedEmployeeId: assets.assignedEmployeeId
          })
          .from(assets)
          .where(eq(assets.id, upgrade.assetId))
          .limit(1);

        const assignedEmployeeId = assetQuery.length > 0 ? assetQuery[0].assignedEmployeeId : null;

        const transactionData = {
          assetId: upgrade.assetId,
          type: 'Upgrade' as const,
          employeeId: assignedEmployeeId, // Use the assigned employee from the asset
          transactionDate: new Date(),
          conditionNotes: `Upgrade Request: ${upgrade.title}\nCategory: ${upgrade.category}\nType: ${upgrade.upgradeType}\nStatus: ${status}\nJustification: ${upgrade.justification}${notes ? `\nReview Notes: ${notes}` : ''}`,
          handledById: user.id,
          deviceSpecs: null // Will be auto-populated by createAssetTransaction
        };

        const transaction = await storage.createAssetTransaction(transactionData);
        console.log('Created asset transaction for upgrade:', transaction.id);
        if (assignedEmployeeId) {
          console.log('Transaction linked to assigned employee:', assignedEmployeeId);
        }
      } catch (transactionError) {
        console.error('Error creating asset transaction:', transactionError);
        // Don't fail the upgrade status update if transaction creation fails
        // Log the error but continue
      }
    }

    console.log('Upgrade status updated successfully:', result[0]);
    res.json(result[0]);
  } catch (error: unknown) {
    console.error('Error updating upgrade status - detailed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({ message: 'Error updating upgrade status', error: error instanceof Error ? error.message : 'Unknown error' });
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
    
    // Get transactions for this asset
    const transactions = await storage.getAssetTransactions(assetId);
    
    // Enhance transactions with asset and employee details
    let enhancedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const enhanced: any = { ...transaction };
        
        // Add asset details if not already present
        if (!enhanced.asset && transaction.assetId) {
          enhanced.asset = await storage.getAsset(transaction.assetId);
        }
        
        // Add employee details if not already present
        if (!enhanced.employee && transaction.employeeId) {
          enhanced.employee = await storage.getEmployee(transaction.employeeId);
        }
        
        // Parse deviceSpecs if it's a string
        if (enhanced.deviceSpecs && typeof enhanced.deviceSpecs === 'string') {
          try {
            enhanced.deviceSpecs = JSON.parse(enhanced.deviceSpecs);
          } catch (e) {
            console.error('Error parsing deviceSpecs:', e);
          }
        }
        
        return enhanced;
      })
    );
    
    // REMOVED: Complex upgrade merging logic - upgrades are now in assetTransactions
    
    // Sort by date
    enhancedTransactions.sort((a, b) => {
      const dateA = new Date(a.transactionDate || a.date || 0);
      const dateB = new Date(b.transactionDate || b.date || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Return array directly for backward compatibility
    res.json(enhancedTransactions);
    
  } catch (error: unknown) {
    console.error('Error fetching asset transactions:', error);
    res.status(500).json({ 
      message: 'Error fetching transactions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
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
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });
  // Bulk Check-Out endpoint
app.post("/api/assets/bulk/check-out", authenticateUser, hasAccess(2), async (req, res) => {
  try {
    const { assetIds, employeeId, reason, notes } = req.body;
    const handledById = req.user.id;
    
    // Validate inputs
    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return res.status(400).json({ message: "Asset IDs are required" });
    }
    
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }
    
    if (!reason) {
      return res.status(400).json({ message: "Reason is required" });
    }
    
    // Check if employee exists
    const employee = await storage.getEmployee(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
      transactions: [] as any[]
    };
    
    // Process each asset
    for (const assetId of assetIds) {
      try {
        // Get asset details
        const asset = await storage.getAsset(assetId);
        if (!asset) {
          results.failed++;
          results.errors.push(`Asset ${assetId} not found`);
          continue;
        }
        
        // Check if asset is available
        if (asset.status !== 'Available') {
          results.failed++;
          results.errors.push(`Asset ${asset.assetId} is not available (current status: ${asset.status})`);
          continue;
        }
        
        // Combine reason and notes into conditionNotes field
        const conditionNotes = `Reason: ${reason}${notes ? ` | Notes: ${notes}` : ''}`;
        
        // Build device specs object (matching your existing pattern)
        const deviceSpecs = {
          cpu: asset.cpu,
          ram: asset.ram,
          storage: asset.storage,
          specs: asset.specs
        };
        
        // Create transaction using existing checkOutAsset method
        // The conditionNotes will be stored in the existing field
        const transaction = await storage.checkOutAsset(
          assetId, 
          employeeId, 
          conditionNotes,  // Using conditionNotes field for reason + notes
          'Check-Out', 
          handledById, 
          deviceSpecs
        );
        
        results.successful++;
        results.transactions.push(transaction);
        
        // Log activity
        await storage.logActivity({
          userId: handledById,
          action: "BULK_CHECK_OUT",
          entityType: "ASSET",
          entityId: assetId,
          details: {
            assetId: asset.assetId,
            employeeId: employeeId,
            employeeName: employee.englishName,
            reason: reason,
            notes: notes,
            transactionId: transaction.id
          }
        });
        
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Asset ${assetId}: ${error.message}`);
        console.error(`Error checking out asset ${assetId}:`, error);
      }
    }
    
    // Return results
    const message = results.successful > 0 
      ? `Successfully checked out ${results.successful} asset(s)` 
      : 'No assets were checked out';
    
    res.status(results.successful > 0 ? 200 : 400).json({
      message,
      successful: results.successful,
      failed: results.failed,
      errors: results.errors,
      transactions: results.transactions
    });
    
  } catch (error: unknown) {
    console.error("Error in bulk check-out:", error);
    res.status(500).json({ 
      message: "Internal server error during bulk check-out",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Bulk Check-In endpoint
  app.post("/api/assets/bulk/check-in", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const { assetIds, reason, notes } = req.body;
      const handledById = req.user.id;
      
      console.log('Bulk check-in request received:', { assetIds, reason, notes });
      
      // Validate inputs
      if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
        return res.status(400).json({ message: "Asset IDs are required" });
      }
      
      if (!reason) {
        return res.status(400).json({ message: "Reason is required" });
      }
      
      const results = {
        successful: 0,
        failed: 0,
        errors: [] as string[],
        transactions: [] as any[]
      };
      
      // Process each asset
      for (let i = 0; i < assetIds.length; i++) {
        const rawAssetId = assetIds[i];
        console.log(`Processing asset ${i + 1}/${assetIds.length}: rawAssetId =`, rawAssetId, 'type =', typeof rawAssetId);
        
        try {
          // Ensure assetId is a number
          let parsedAssetId: number;
          if (typeof rawAssetId === 'number') {
            parsedAssetId = rawAssetId;
          } else if (typeof rawAssetId === 'string') {
            parsedAssetId = parseInt(rawAssetId, 10);
          } else {
            throw new Error(`Invalid asset ID type: ${typeof rawAssetId}`);
          }
          
          // Check if parsing was successful
          if (isNaN(parsedAssetId)) {
            results.failed++;
            results.errors.push(`Invalid asset ID: ${rawAssetId}`);
            console.error(`Invalid asset ID: ${rawAssetId} parsed to NaN`);
            continue;
          }
          
          console.log(`Fetching asset with ID: ${parsedAssetId}`);
          
          // Get asset details with the parsed ID
          const asset = await storage.getAsset(parsedAssetId);
          if (!asset) {
            results.failed++;
            results.errors.push(`Asset with ID ${parsedAssetId} not found`);
            console.error(`Asset not found: ${parsedAssetId}`);
            continue;
          }
          
          console.log(`Found asset: ${asset.assetId}, status: ${asset.status}`);
          
          // Check if asset is checked out
          if (asset.status !== 'In Use') {
            results.failed++;
            results.errors.push(`Asset ${asset.assetId} is not checked out (current status: ${asset.status})`);
            continue;
          }
          
          // Get employee info for logging
          let employeeName = 'Unknown';
          if (asset.assignedEmployeeId) {
            const employee = await storage.getEmployee(asset.assignedEmployeeId);
            if (employee) {
              employeeName = employee.englishName || employee.name;
            }
          }
          
          // Build device specs object
          const deviceSpecs = {
            cpu: asset.cpu,
            ram: asset.ram,
            storage: asset.storage,
            specs: asset.specs
          };
          
          // Combine reason and notes into conditionNotes field
          const conditionNotes = `Reason: ${reason}${notes ? ` | Notes: ${notes}` : ''}`;
          
          console.log(`Checking in asset ${asset.assetId}...`);
          
          // Create transaction using existing checkInAsset method
          const transaction = await storage.checkInAsset(
            parsedAssetId,
            conditionNotes,
            'Check-In', 
            handledById,
            deviceSpecs
          );
          
          results.successful++;
          results.transactions.push(transaction);
          
          console.log(`Successfully checked in asset ${asset.assetId}`);
          
          // Log activity
          await storage.logActivity({
            userId: handledById,
            action: "BULK_CHECK_IN",
            entityType: "ASSET",
            entityId: parsedAssetId,
            details: {
              assetId: asset.assetId,
              previousEmployeeId: asset.assignedEmployeeId,
              previousEmployeeName: employeeName,
              reason: reason,
              notes: notes,
              transactionId: transaction.id
            }
          });
          
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Asset ${rawAssetId}: ${error.message}`);
          console.error(`Error checking in asset ${rawAssetId}:`, error);
        }
      }
      
      console.log('Bulk check-in completed:', results);
      
      // Return results
      const message = results.successful > 0 
        ? `Successfully checked in ${results.successful} asset(s)` 
        : 'No assets were checked in';
      
      res.status(results.successful > 0 ? 200 : 400).json({
        message,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors,
        transactions: results.transactions
      });
      
    } catch (error: unknown) {
      console.error("Error in bulk check-in:", error);
      res.status(500).json({ 
        message: "Internal server error during bulk check-in",
        error: error instanceof Error ? error.message : String(error)
      });
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
      
       // Build device specs object
      const deviceSpecs = {
        cpu: asset.cpu,
        ram: asset.ram, 
        storage: asset.storage,
        specs: asset.specs
      };
      
      // Check if employee exists
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const handledById = req.user.id;
      console.log("Checking out asset with data:", { assetId, employeeId, notes, type, handledById, deviceSpecs });
      
      // Pass the transaction type to the storage method
      const transaction = await storage.checkOutAsset(assetId, employeeId, notes, type, handledById, deviceSpecs);
      
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
    } catch (error: unknown) {
      console.error("Error checking out asset:", error);
      res.status(400).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
      
       // Build device specs object
      const deviceSpecs = {
        cpu: asset.cpu,
        ram: asset.ram,
        storage: asset.storage, 
        specs: asset.specs
      };

      const handledById = req.user.id;

      console.log("Checking in asset with data:", { assetId, notes, type, handledById, deviceSpecs });
      
      // Pass the transaction type to the storage method
      const transaction = await storage.checkInAsset(assetId, notes, type, handledById, deviceSpecs);
      
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
    } catch (error: unknown) {
      console.error("Error checking in asset:", error);
      res.status(400).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(400).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  app.get("/api/asset-sales", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const sales = await storage.getAssetSales();
      res.json(sales);
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

    // ✅ FIXED /api/tickets POST endpoint - Schema v0.4.0 aligned
    app.post("/api/tickets", authenticateUser, async (req: Request<unknown, unknown, TicketCreateInput>, res: Response) => {
      try {
        console.log("Creating ticket:", req.body);
        
        // Validate required fields per schema
        const { title, description, type, submittedById } = req.body;
        if (!title || !description || !type || !submittedById) {
          return res.status(400).json({ 
            message: "Missing required fields: title, description, type, and submittedById are required" 
          });
        }

        // Get request data with defaults from schema
        const ticketData: InsertTicket = {
          submittedById: parseInt(submittedById.toString()),
          assignedToId: req.body.assignedToId ? parseInt(req.body.assignedToId.toString()) : null,
          relatedAssetId: req.body.relatedAssetId ? parseInt(req.body.relatedAssetId.toString()) : null,
          type: (req.body.type || 'Incident') as ValueOf<typeof ticketTypeEnum>,
          category: req.body.category || 'General',
          title: req.body.title,                             // ✅ Fixed: using title
          description: req.body.description,
          urgency: (req.body.urgency || 'Medium') as ValueOf<typeof ticketUrgencyEnum>,
          impact: (req.body.impact || 'Medium') as ValueOf<typeof ticketImpactEnum>,
          timeSpent: req.body.timeSpent ? parseInt(req.body.timeSpent.toString()) : null,
          dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
          slaTarget: req.body.slaTarget ? new Date(req.body.slaTarget) : null,
          priority: 'Medium' as ValueOf<typeof ticketPriorityEnum>, // Will be updated based on urgency × impact
          status: 'Open' as ValueOf<typeof ticketStatusEnum>
        };

        // Validate employee exists (submittedById validation)
        const employeeId = parseInt(submittedById.toString());
        const employees = await storage.getAllEmployees();
        const employeeRecord = employees.find(emp => emp.id === employeeId);
        
        if (!employeeRecord) {
          return res.status(400).json({ 
            message: `No employee record found for employee ID ${employeeId}. Please contact administrator.` 
          });
        }

        // Auto-calculate priority based on urgency and impact
        if (ticketData.urgency && ticketData.impact) {
          const calculatedPriority = calculatePriority(
            ticketData.urgency as UrgencyLevel, 
            ticketData.impact as ImpactLevel
          );
          ticketData.priority = calculatedPriority as ValueOf<typeof ticketPriorityEnum>;
        }

        // Create the ticket
        const newTicket = await storage.createTicket(ticketData);
        
        // Log activity
        await storage.logActivity({
          action: "Created",
          entityType: "Ticket",
          entityId: newTicket.id,
          userId: req.user?.id || employeeId,
          details: { 
            ticketId: newTicket.ticketId, 
            title: newTicket.title,
            type: newTicket.type,
            priority: newTicket.priority 
          }
        });
        
        console.log("Ticket created successfully:", newTicket);
        res.status(201).json(newTicket);
      } catch (error: unknown) {
        console.error("Create ticket error:", error);
        res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
      }
    });

    app.delete("/api/tickets/:id", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }
      
      const userId = req.user.id;
      
      const success = await storage.deleteTicket(ticketId, userId);
      if (!success) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Log deletion activity
      await storage.logActivity({
        action: "Deleted",
        entityType: "Ticket",
        entityId: ticketId,
        userId,
        details: { ticketId }
      });
      
      res.json({ success: true, message: "Ticket deleted successfully" });
    } catch (error: unknown) {
      if (error.message && error.message.includes("Unauthorized")) {
        return res.status(403).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
      }
      console.error("Delete ticket error:", error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  app.put("/api/tickets/:id", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticketData = req.body;
      
      // Validate priority calculation if urgency, impact, or priority is being updated
      if (ticketData.urgency || ticketData.impact || ticketData.priority) {
        // Get current ticket to check existing values
        const currentTicket = await storage.getTicket(id);
        if (!currentTicket) {
          return res.status(404).json({ message: "Ticket not found" });
        }
        
        const newUrgency = (ticketData.urgency || currentTicket.urgency) as UrgencyLevel;
        const newImpact = (ticketData.impact || currentTicket.impact) as ImpactLevel;
        const calculatedPriority = calculatePriority(newUrgency, newImpact);
        
        // If priority is provided, validate it matches the calculated value
        if (ticketData.priority && !validatePriority(newUrgency, newImpact, ticketData.priority)) {
          return res.status(400).json({ 
            message: `Priority "${ticketData.priority}" is invalid. Based on urgency "${newUrgency}" and impact "${newImpact}", priority should be "${calculatedPriority}".`,
            expectedPriority: calculatedPriority,
            providedPriority: ticketData.priority
          });
        }
        
        // Auto-set the correct priority (this ensures consistency even if not provided)
        ticketData.priority = calculatedPriority;
      }
      
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
    } catch (error: unknown) {
      res.status(400).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // System Configuration
  app.get("/api/system-config", authenticateUser, async (req, res) => {
    try {
      const config = await storage.getSystemConfig();
      res.json(config || { language: "English", assetIdPrefix: "BOLT-" });
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(400).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });
  
  // Activity Log
  app.get("/api/activity-log", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const activities = await storage.getRecentActivity(limit);
      res.json(activities);
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // New Unified Import/Export Routes
  // Export routes
  app.get("/api/export/employees", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const data = await storage.getAllEmployees();
      
      const csvData = data.map(item => ({
        englishName: item.englishName || '',
        arabicName: item.arabicName || '',
        department: item.department || '',
        idNumber: item.idNumber || '',
        title: item.title || '',
        directManager: item.directManager || '',
        employmentType: item.employmentType || '',
        joiningDate: item.joiningDate || '',
        status: item.status || '',
        personalMobile: item.personalMobile || '',
        personalEmail: item.personalEmail || ''
      }));
      
      const csv = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="employees_export.csv"');
      res.send(csv);
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  app.get("/api/export/assets", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const data = await storage.getAllAssets();
      
      const csvData = data.map(item => ({
        assetId: item.assetId || '',
        type: item.type || '',
        brand: item.brand || '',
        modelNumber: item.modelNumber || '',
        modelName: item.modelName || '',
        serialNumber: item.serialNumber || '',
        specs: item.specs || '',
        cpu: item.cpu || '',
        ram: item.ram || '',
        storage: item.storage || '',
        status: item.status || '',
        purchaseDate: item.purchaseDate || '',
        buyPrice: item.buyPrice || '',
        warrantyExpiryDate: item.warrantyExpiryDate || '',
        lifeSpan: item.lifeSpan || '',
        outOfBoxOs: item.outOfBoxOs || '',
        assignedEmployeeId: item.assignedEmployeeId || ''
      }));
      
      const csv = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="assets_export.csv"');
      res.send(csv);
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });


  // Import routes
  app.post("/api/import/employees", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const { data } = req.body;
      if (!Array.isArray(data)) {
        return res.status(400).json({ message: "Invalid data format" });
      }

      let successful = 0;
      const errors = [];

      for (const item of data) {
        try {
          // Ensure all required fields have values - no need to generate empId anymore
          const idNumber = item.idNumber || item.id_number || `ID-${Date.now()}`;
          const title = item.title || 'Employee';
          
          const result = await storage.createEmployee({
            // empId removed - database will auto-generate
            englishName: item.englishName,
            arabicName: item.arabicName || null,
            department: item.department || 'General',
            idNumber: idNumber,
            title: title,
            directManager: item.directManager ? parseInt(item.directManager) : null,
            employmentType: item.employmentType || 'Full-time',
            joiningDate: item.joiningDate || new Date().toISOString().split('T')[0],
            exitDate: item.exitDate || null,
            status: item.status || 'Active',
            personalMobile: item.personalMobile || null,
            personalEmail: item.personalEmail || null,
            corporateEmail: item.workEmail || item.corporateEmail || null, 
            workMobile: item.workMobile || null
          });
          successful++;
        } catch (error: any) {
          errors.push(`Employee ${item.englishName}: ${error.message}`);
        }
      }

      res.json({ successful, failed: errors.length, errors });
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  app.post("/api/import/assets", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const { data } = req.body;
      if (!Array.isArray(data)) {
        return res.status(400).json({ message: "Invalid data format" });
      }

      let successful = 0;
      const errors = [];

      for (const item of data) {
        try {
          // Database will auto-generate asset_id, no need to generate manually
          const result = await storage.createAsset({
            // assetId removed - database will auto-generate
            type: item.type || 'Hardware',
            brand: item.brand || null,
            modelNumber: item.modelNumber || item.model || null,
            modelName: item.modelName || item.name || null,
            serialNumber: item.serialNumber || null,
            specs: item.specs || item.description || null,
            status: item.status || 'Available',
            purchaseDate: item.purchaseDate || null,
            buyPrice: item.buyPrice || item.purchasePrice ? parseFloat((item.buyPrice || item.purchasePrice).toString()) : null,
            warrantyExpiryDate: item.warrantyExpiryDate || item.warrantyEndDate || null,
            lifeSpan: item.lifeSpan ? parseInt(item.lifeSpan.toString()) : null,
            outOfBoxOs: item.outOfBoxOs || null,
            assignedEmployeeId: item.assignedEmployeeId || item.assignedTo ? parseInt((item.assignedEmployeeId || item.assignedTo).toString()) : null,
            cpu: item.cpu || null,
            ram: item.ram || null,
            storage: item.storage || null
          });
          successful++;
        } catch (error: any) {
          errors.push(`Asset ${item.name || item.modelName || 'Unknown'}: ${error.message}`);
        }
      }

      res.json({ successful, failed: errors.length, errors });
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  app.post("/api/import/tickets", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const { data } = req.body;
      if (!Array.isArray(data)) {
        return res.status(400).json({ message: "Invalid data format" });
      }

      let successful = 0;
      const errors = [];

      // Find a default employee for tickets without submittedById
      const employees = await storage.getAllEmployees();
      const defaultEmployee = employees.find(emp => emp.status === 'Active') || employees[0];
      
      if (!defaultEmployee) {
        return res.status(400).json({ message: "No employees found to assign as ticket submitter" });
      }

      for (const item of data) {
        try {
          // Create ticket with proper field mapping
          const result = await storage.createTicket({
            // Database will auto-generate ticketId
            title: item.title || item.summary || 'Imported Ticket',           // ✅ Fixed: title with fallback
            description: item.description || 'No description provided',
            type: item.type || 'Incident',                                    // ✅ Fixed: removed requestType fallback
            categoryId: item.categoryId ? parseInt(item.categoryId.toString()) : null,
            urgency: item.urgency || 'Medium',
            impact: item.impact || 'Medium',
            priority: item.priority || 'Medium',                              // Will be auto-calculated
            status: item.status || 'Open',
            submittedById: item.submittedById ? parseInt(item.submittedById.toString()) : defaultEmployee.id,
            assignedToId: item.assignedToId ? parseInt(item.assignedToId.toString()) : null,
            relatedAssetId: item.relatedAssetId ? parseInt(item.relatedAssetId.toString()) : null,
            timeSpent: item.timeSpent ? parseInt(item.timeSpent.toString()) : null,    // ✅ Added: new field
            dueDate: item.dueDate || null,
            slaTarget: item.slaTarget || null,
            resolution: item.resolution || null                                        // ✅ Added: new field
            // ✅ Removed deprecated fields: tags, escalationLevel, rootCause, etc.
          });
          successful++;
        } catch (error: any) {
          errors.push(`Ticket ${item.title || item.summary || 'Unknown'}: ${error.message}`);
        }
      }

      res.json({ 
        successful, 
        failed: errors.length, 
        errors,
        message: `Successfully imported ${successful} tickets with ${errors.length} failures`
      });
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // Dashboard Summary with Historical Comparisons
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const employees = await storage.getAllEmployees();
    const assets = await storage.getAllAssets();
    const allTickets = await storage.getAllTickets();
    const users = await storage.getAllUsers();
      // Get all maintenance records - ADD THIS SECTION
    let allMaintenanceRecords = [];
    try {
      // Try to use getAllMaintenanceRecords if available
      if (storage.getAllMaintenanceRecords) {
        allMaintenanceRecords = await storage.getAllMaintenanceRecords();
      } else {
        // Fallback: collect maintenance for each asset
        for (const asset of assets) {
          const assetMaintenance = await storage.getMaintenanceForAsset(asset.id);
          allMaintenanceRecords = allMaintenanceRecords.concat(assetMaintenance);
        }
      }
    } catch (error) {
      console.log('Error fetching maintenance records:', error);
      // Continue with empty array if maintenance fetch fails
    }
    
    // Get current date references
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Enhanced Employee Metrics
    const fullTimeEmployees = employees.filter(emp => 
      emp.employmentType === 'Full-time' && emp.status === 'Active'
    );
    const partTimeEmployees = employees.filter(emp => 
      emp.employmentType === 'Part-time' && emp.status === 'Active'
    );
    const activeEmployees = employees.filter(emp => emp.status === 'Active');
    
    const newEmployeesThisMonth = employees.filter(emp => {
      const joiningDate = emp.joiningDate ? new Date(emp.joiningDate) : null;
      return joiningDate && joiningDate >= startOfMonth;
    });
    
    // Fixed: Employees pending offboarding - includes those with future exit dates or resigned/terminated with assets
    const employeesWithAssets = new Set(
      assets.filter(a => a.assignedTo || a.assignedEmployeeId || a.assignedToId)
        .map(a => a.assignedTo || a.assignedEmployeeId || a.assignedToId)
    );
    
    // Pending offboarding employees calculation - match custom filter logic
    const pendingOffboarding = employees.filter(emp => {
      // Check if employee has assigned assets
      const hasAssignedAssets = assets.some(asset => 
        (asset.assignedTo === emp.id) || 
        (asset.assignedEmployeeId === emp.id) || 
        (asset.assignedToId === emp.id) ||
        (asset.assignedTo === emp.empId)
      );
      
      // Match the "offboardedWithAssets" filter logic:
      // Resigned or Terminated employees who still have assets
      const isOffboarded = emp.status === 'Resigned' || emp.status === 'Terminated';
      
      return isOffboarded && hasAssignedAssets;
    });
    // Enhanced Asset Metrics
    const excludedStatuses = ['Gifted', 'Lost', 'Retired', 'Sold', 'Missing', 'Damaged', 'Disposed', 'Pending Disposal'];
    
    const totalValidAssets = assets.filter(asset => 
      !excludedStatuses.includes(asset.status)
    );
    
    const availableLaptops = assets.filter(asset => 
      asset.type === 'Laptop' && asset.status === 'Available'
    );
    
    const reservedLaptops = assets.filter(asset => 
      asset.type === 'Laptop' && asset.status === 'Reserved'
    );
    
    // Fixed: Assets under maintenance - check actual status field
    const assetsUnderMaintenance = assets.filter(asset => 
      asset.status === 'Under Maintenance' || 
      asset.status === 'Maintenance' ||
      asset.status === 'Repairing'
    );

    // Recently updated assets (last 7 days)
    const recentlyUpdatedAssets = assets
      .filter(asset => {
        const updatedAt = asset.updatedAt ? new Date(asset.updatedAt) : null;
        return updatedAt && updatedAt >= oneWeekAgo;
      })
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 10);

      // Employees leaving who still have assets (need to return)
const leavingEmployeesWithAssets = employees.filter(emp => {
  // Check if employee is leaving (has exit date OR not active)
  const hasExitDate = emp.exitDate !== null && emp.exitDate !== undefined;
  const isNotActive = emp.status !== 'Active';
  const isLeaving = hasExitDate || isNotActive;
  
  // Check if has assets assigned
  const hasAssets = assets.some(asset => 
    (asset.assignedTo === emp.id) || 
    (asset.assignedEmployeeId === emp.id) || 
    (asset.assignedToId === emp.id) ||
    (asset.assignedTo === emp.empId)
  );
  
  return isLeaving && hasAssets;
});
    // Enhanced Ticket Metrics
    const activeTickets = allTickets.filter(ticket => 
      ticket.status === 'Open' || ticket.status === 'In Progress'
    );
    
    const resolvedTicketsThisMonth = allTickets.filter(ticket => {
      const resolvedDate = ticket.updatedAt ? new Date(ticket.updatedAt) : null;
      return (ticket.status === 'Resolved' || ticket.status === 'Closed') && 
             resolvedDate && resolvedDate >= startOfMonth;
    });

    // Ticket breakdown by priority
    const ticketsByPriority = {
      critical: activeTickets.filter(t => t.priority === 'Critical').length,
      high: activeTickets.filter(t => t.priority === 'High').length,
      medium: activeTickets.filter(t => t.priority === 'Medium').length,
      low: activeTickets.filter(t => t.priority === 'Low').length
    };

      const ticketsByDepartment: Record<string, number> = {};
    
    // Initialize all departments with 0 tickets
    const allDepartments = new Set<string>();
    employees.forEach(emp => {
      if (emp.department) {
        allDepartments.add(emp.department);
        ticketsByDepartment[emp.department] = 0;
      }
    });
    
    // Count tickets by the department of the employee who submitted them
    allTickets.forEach(ticket => {
      // Only count active tickets (Open or In Progress)
      if (ticket.status === 'Open' || ticket.status === 'In Progress') {
        // Find the employee who submitted the ticket
        const submittedBy = employees.find(emp => emp.id === ticket.submittedById);
        if (submittedBy && submittedBy.department) {
          ticketsByDepartment[submittedBy.department] = (ticketsByDepartment[submittedBy.department] || 0) + 1;
        } else {
          // Count tickets without department as "Unassigned"
          ticketsByDepartment['Unassigned'] = (ticketsByDepartment['Unassigned'] || 0) + 1;
        }
      }
    });

 // Fixed: Maintenance Counts - count ASSETS with maintenance, not maintenance records
    const assetsMaintenanceStatus = await Promise.all(
      assets.map(async (asset) => {
        const maintenanceRecords = await storage.getMaintenanceForAsset(asset.id);
        
        // Skip assets with no maintenance records
        if (!maintenanceRecords || maintenanceRecords.length === 0) {
          return null;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Check for scheduled maintenance (future dates)
        const hasScheduled = maintenanceRecords.some(m => {
          if (m.status !== 'Scheduled' && m.status !== 'scheduled') return false;
          const maintenanceDate = new Date(m.date);
          maintenanceDate.setHours(0, 0, 0, 0);
          return maintenanceDate >= today; // Future or today
        });
        
        // Check for in-progress maintenance
        const hasInProgress = maintenanceRecords.some(m => 
          m.status === 'In Progress' || m.status === 'in_progress' || m.status === 'InProgress'
        );
        
        // Check for overdue maintenance
        const hasOverdue = maintenanceRecords.some(m => {
          if (m.status !== 'Scheduled' && m.status !== 'scheduled') return false;
          const maintenanceDate = new Date(m.date);
          maintenanceDate.setHours(0, 0, 0, 0);
          return maintenanceDate < today; // Past date but still scheduled
        });
        
        return {
          assetId: asset.id,
          hasScheduled,
          hasInProgress,
          hasOverdue,
          hasAnyMaintenance: true
        };
      })
    );

    // Filter out nulls (assets without maintenance) and count
    const assetsWithMaintenance = assetsMaintenanceStatus.filter(a => a !== null);

    // Count unique assets with each maintenance status
    const maintenanceCounts = {
      scheduled: assetsWithMaintenance.filter(a => a.hasScheduled).length,
      inProgress: assetsWithMaintenance.filter(a => a.hasInProgress).length,
      overdue: assetsWithMaintenance.filter(a => a.hasOverdue).length
    };

    // Calculate total asset value (excluding disposed assets)
    const totalAssetValue = totalValidAssets.reduce((sum, asset) => {
      const price = typeof asset.buyPrice === 'string' 
        ? parseFloat(asset.buyPrice) 
        : (asset.buyPrice || 0);
      return sum + (isNaN(price) ? 0 : price);
    }, 0);

       // Department Distribution (live data) - FIXED VERSION
    const departmentDistribution = {
      employees: employees.reduce((acc, emp) => {
        if (emp.status === 'Active') {
          const dept = emp.department || 'Unassigned';
          acc[dept] = (acc[dept] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
      assets: assets.reduce((acc, asset) => {
        // IMPORTANT: Only count valid assets, exclude disposed/sold/lost/etc
        if (!excludedStatuses.includes(asset.status)) {
          // Check multiple possible assignment fields
          const assignedId = asset.assignedTo || asset.assignedEmployeeId || asset.assignedToId;
          if (assignedId) {
            const employee = employees.find(e => 
              e.id === assignedId || 
              e.empId === String(assignedId) // Handle string/number mismatch
            );
            const dept = employee?.department || 'Unassigned';
            acc[dept] = (acc[dept] || 0) + 1;
          }
          // Don't count unassigned assets if they're in excluded statuses
          // Only count truly available/in-use unassigned assets
        }
        return acc;
      }, {} as Record<string, number>)
    };

    // Assets by type (excluding disposed)
    const assetsByType = totalValidAssets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get recent items for dashboard widgets
    const recentAssets = assets
      .filter(a => !excludedStatuses.includes(a.status))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5);
    
    const recentTickets = allTickets
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5);

          // Fixed: Quick Actions availability with correct counts
        const quickActions = {
          canAddEmployee: getUserRoleLevel(req.user) >= 2,
          canAddAsset: getUserRoleLevel(req.user) >= 2,
          canOpenTicket: getUserRoleLevel(req.user) >= 1,
          pendingActions: {
            employeesNeedToReturnAssets: leavingEmployeesWithAssets.length, // Clear name
            assetsNeedingMaintenance: allMaintenanceRecords.filter(m => 
              m.status === 'Scheduled' || m.status === 'scheduled'
            ).length,
            ticketsNearingSLA: activeTickets.filter(t => {
              const createdAt = new Date(t.createdAt || 0);
              const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
              return hoursSinceCreation > 40 && hoursSinceCreation < 48;
            }).length
          }
        };

    // Calculate percentage changes
    const calculatePercentageChange = (current: number, previous: number): string => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    // Get comparison data
    const employeesLastMonth = employees.filter(emp => {
      const joiningDate = emp.joiningDate ? new Date(emp.joiningDate) : null;
      return joiningDate && joiningDate < startOfMonth;
    }).filter(emp => emp.status === 'Active').length;

    const assetsLastMonth = assets.filter(asset => {
      const createdAt = asset.createdAt ? new Date(asset.createdAt) : null;
      return createdAt && createdAt < startOfMonth && !excludedStatuses.includes(asset.status);
    }).length;

    const ticketsLastWeek = allTickets.filter(t => {
      const created = new Date(t.createdAt || 0);
      return created < oneWeekAgo && (t.status === 'Open' || t.status === 'In Progress');
    }).length;

    res.json({
      // Employee Metrics
      employees: {
        total: activeEmployees.length,
        fullTime: fullTimeEmployees.length,
        partTime: partTimeEmployees.length,
        newThisMonth: newEmployeesThisMonth.length,
        pendingOffboarding: pendingOffboarding.length,
        byDepartment: departmentDistribution.employees,
        changes: {
          monthly: calculatePercentageChange(activeEmployees.length, employeesLastMonth),
          newHires: newEmployeesThisMonth.length
        }
      },
      
      // Asset Metrics
      assets: {
        total: totalValidAssets.length,
        totalValue: totalAssetValue,
        availableLaptops: availableLaptops.length,
        reservedLaptops: reservedLaptops.length,
        underMaintenance: assetsUnderMaintenance.length,
        recentlyUpdated: recentlyUpdatedAssets,
        byType: assetsByType,
        byDepartment: departmentDistribution.assets,
        changes: {
          monthly: calculatePercentageChange(totalValidAssets.length, assetsLastMonth)
        }
      },
      
      // Ticket Metrics
      tickets: {
        active: activeTickets.length,
        resolvedThisMonth: resolvedTicketsThisMonth.length,
        byPriority: ticketsByPriority,
        byDepartment: ticketsByDepartment,  
        recent: recentTickets,
        changes: {
          weekly: calculatePercentageChange(activeTickets.length, ticketsLastWeek)
        }
      },
      
      // Maintenance Overview
      maintenance: maintenanceCounts,
      
      // Quick Actions Data
      quickActions,
      
      // Recent Items
      recentAssets,
      recentTickets,
      
      // Department Distribution
      departmentDistribution,
      
      // Legacy fields for backward compatibility
      counts: {
        employees: activeEmployees.length,
        assets: totalValidAssets.length,
        activeTickets: activeTickets.length,
        totalAssetValue,
        users: users.length
      },
      maintenanceCounts,
      changes: {
        employees: calculatePercentageChange(activeEmployees.length, employeesLastMonth),
        assets: calculatePercentageChange(totalValidAssets.length, assetsLastMonth),
        activeTickets: calculatePercentageChange(activeTickets.length, ticketsLastWeek),
        totalAssetValue: '+5.2%' // Placeholder
      },
      assetsByType,
      employeesByDepartment: departmentDistribution.employees
    });
  } catch (error: unknown) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

  app.get("/api/asset-transactions", authenticateUser, async (req, res) => {
  try {
    const { 
      assetId, 
      employeeId, 
      search, 
      type, 
      dateFrom, 
      dateTo, 
      page = '1', 
      limit = '10',
      include 
    } = req.query;
    
    let transactions;
    if (assetId) {
      transactions = await storage.getAssetTransactions(Number(assetId));
      // Enhance individual asset transactions with details if needed
      if (transactions && Array.isArray(transactions)) {
        transactions = await Promise.all(
          transactions.map(async (transaction) => {
            const enhanced: any = { ...transaction };
            
            // Add asset details if not already present
            if (!enhanced.asset && transaction.assetId) {
              enhanced.asset = await storage.getAsset(transaction.assetId);
            }
            
            // Add employee details if not already present
            if (!enhanced.employee && transaction.employeeId) {
              enhanced.employee = await storage.getEmployee(transaction.employeeId);
            }
            
            return enhanced;
          })
        );
      }
    } else if (employeeId) {
      transactions = await storage.getEmployeeTransactions(Number(employeeId));
      // Enhance individual employee transactions with details if needed
      if (transactions && Array.isArray(transactions)) {
        transactions = await Promise.all(
          transactions.map(async (transaction) => {
            const enhanced: any = { ...transaction };
            
            // Add asset details if not already present
            if (!enhanced.asset && transaction.assetId) {
              enhanced.asset = await storage.getAsset(transaction.assetId);
            }
            
            // Add employee details if not already present
            if (!enhanced.employee && transaction.employeeId) {
              enhanced.employee = await storage.getEmployee(transaction.employeeId);
            }
            
            return enhanced;
          })
        );
      }
    } else {
      // Check what's actually in the database first
      try {
        const directDbQuery = `SELECT id, asset_id, employee_id, type, transaction_date FROM asset_transactions LIMIT 5`;
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const directResult = await pool.query(directDbQuery);
        console.log('Direct DB query result for asset_transactions:', directResult.rows);
        
        // Check if any have employee_id
        const withEmployees = directResult.rows.filter(row => row.employee_id);
        console.log('Transactions with employee_id:', withEmployees.length);
      } catch (dbError) {
        console.error('Direct DB query error:', dbError);
      }
      
      // getAllAssetTransactions now includes asset and employee data via JOINs
      transactions = await storage.getAllAssetTransactions();
      console.log('Asset transactions route - transactions length:', transactions?.length);
      console.log('Asset transactions route - first transaction employee:', transactions?.[0]?.employee);
    }
    
    // Parse deviceSpecs if it's a string for all transactions
    if (transactions && Array.isArray(transactions)) {
      transactions = transactions.map(transaction => {
        const enhanced: any = { ...transaction };
        
        // Parse deviceSpecs if it's a string
        if (enhanced.deviceSpecs && typeof enhanced.deviceSpecs === 'string') {
          try {
            enhanced.deviceSpecs = JSON.parse(enhanced.deviceSpecs);
          } catch (e) {
            console.error('Error parsing deviceSpecs:', e);
          }
        }
        
        return enhanced;
      });
      console.log('Asset transactions route - final enhanced first transaction employee:', transactions?.[0]?.employee);
    }
    
    // REMOVED: Complex upgrade merging logic - upgrades are now in assetTransactions
    
    // SAFETY CHECK: Ensure transactions is always an array
    if (!transactions || !Array.isArray(transactions)) {
      console.warn('Transactions data is invalid:', transactions);
      transactions = [];
    }
    
    // Sort all transactions by date
    transactions.sort((a, b) => {
      const dateA = new Date(a.transactionDate || a.date || 0);
      const dateB = new Date(b.transactionDate || b.date || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Apply filters
    let filteredTransactions = [...transactions];
    
    // Search filter
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filteredTransactions = filteredTransactions.filter(transaction => 
        transaction.id?.toString().includes(searchLower) ||
        transaction.asset?.assetId?.toLowerCase().includes(searchLower) ||
        transaction.asset?.type?.toLowerCase().includes(searchLower) ||
        transaction.employee?.englishName?.toLowerCase().includes(searchLower) ||
        transaction.employee?.arabicName?.toLowerCase().includes(searchLower) ||
        transaction.notes?.toLowerCase().includes(searchLower) ||
        transaction.conditionNotes?.toLowerCase().includes(searchLower)
      );
    }
    
    // Type filter
    if (type && typeof type === 'string' && type !== '') {
      filteredTransactions = filteredTransactions.filter(transaction => 
        transaction.type === type
      );
    }
    
    // Date range filter
    if (dateFrom && typeof dateFrom === 'string') {
      const fromDate = new Date(dateFrom);
      filteredTransactions = filteredTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.transactionDate || transaction.date || 0);
        return transactionDate >= fromDate;
      });
    }
    
    if (dateTo && typeof dateTo === 'string') {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filteredTransactions = filteredTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.transactionDate || transaction.date || 0);
        return transactionDate <= toDate;
      });
    }
    
    // Calculate pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const totalItems = filteredTransactions.length;
    const totalPages = Math.ceil(totalItems / limitNum);
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    // ALWAYS return the expected format with transactions and pagination
    res.json({
      transactions: paginatedTransactions,
      pagination: {
        totalItems,
        totalPages,
        currentPage: pageNum,
        itemsPerPage: limitNum
      }
    });
    
  } catch (error: unknown) {
    console.error('Error fetching asset transactions:', error);
    res.status(500).json({
      transactions: [],
      pagination: {
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        itemsPerPage: 10
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    });
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
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
      
      // Tickets by Type
      const ticketsByType: Record<string, number> = {};
      tickets.forEach(ticket => {
        ticketsByType[ticket.type] = (ticketsByType[ticket.type] || 0) + 1;
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
        ticketsByType,
        recentTicketsCount: recentTickets.length,
        averageResolutionTime: averageResolutionTime.toFixed(2) + " hours"
      });
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });
  
  // Custom Asset Types API
  app.get('/api/custom-asset-types', authenticateUser, async (req, res) => {
    try {
      const types = await storage.getCustomAssetTypes();
      res.json(types);
    } catch (error: unknown) {
      console.error('Error fetching custom asset types:', error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });
  
  app.post('/api/custom-asset-types', authenticateUser, async (req, res) => {
    try {
      const newType = await storage.createCustomAssetType({
        name: req.body.name,
        description: req.body.description
      });
      res.status(201).json(newType);
    } catch (error: unknown) {
      console.error('Error creating custom asset type:', error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      console.error('Error updating custom asset type:', error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      console.error('Error deleting custom asset type:', error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });
  
  // Custom Asset Brands API
  app.get('/api/custom-asset-brands', authenticateUser, async (req, res) => {
    try {
      const brands = await storage.getCustomAssetBrands();
      res.json(brands);
    } catch (error: unknown) {
      console.error('Error fetching custom asset brands:', error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });
  
  app.post('/api/custom-asset-brands', authenticateUser, async (req, res) => {
    try {
      const newBrand = await storage.createCustomAssetBrand({
        name: req.body.name,
        description: req.body.description
      });
      res.status(201).json(newBrand);
    } catch (error: unknown) {
      console.error('Error creating custom asset brand:', error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      console.error('Error updating custom asset brand:', error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      console.error('Error deleting custom asset brand:', error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });
  
  // Custom Asset Statuses API
  app.get('/api/custom-asset-statuses', authenticateUser, async (req, res) => {
    try {
      const statuses = await storage.getCustomAssetStatuses();
      res.json(statuses);
    } catch (error: unknown) {
      console.error('Error fetching custom asset statuses:', error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      console.error('Error creating custom asset status:', error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      console.error('Error updating custom asset status:', error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      console.error('Error deleting custom asset status:', error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // Asset Status API routes (flexible status system)
  app.get('/api/asset-statuses', authenticateUser, async (req, res) => {
    try {
      const statuses = await storage.getAssetStatuses();
      res.json(statuses);
    } catch (error: any) {
      console.error('Error fetching asset statuses:', error);
      res.status(500).json({ error: 'Failed to fetch asset statuses', details: error.message });
    }
  });

  app.post('/api/asset-statuses', authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const { name, color, description } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Status name is required' });
      }

      const statusData = {
        name: name.trim(),
        color: color || '#6b7280',
        description: description || `Custom status: ${name.trim()}`,
        isDefault: false
      };

      const newStatus = await storage.createAssetStatus(statusData);
      res.status(201).json(newStatus);
    } catch (error: any) {
      console.error('Error creating asset status:', error);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        res.status(409).json({ error: 'Asset status with this name already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create asset status', details: error.message });
      }
    }
  });

  app.put('/api/asset-statuses/:id', authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const { name, color, description } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Status name is required' });
      }

      const updateData = {
        name: name.trim(),
        color: color || '#6b7280',
        description: description
      };

      const updatedStatus = await storage.updateAssetStatus(id, updateData);
      if (updatedStatus) {
        res.json(updatedStatus);
      } else {
        res.status(404).json({ error: 'Asset status not found' });
      }
    } catch (error: any) {
      console.error('Error updating asset status:', error);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        res.status(409).json({ error: 'Asset status with this name already exists' });
      } else {
        res.status(500).json({ error: 'Failed to update asset status', details: error.message });
      }
    }
  });

  app.delete('/api/asset-statuses/:id', authenticateUser, hasAccess(4), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      // Check if this is a default status
      const status = await storage.getAssetStatuses();
      const targetStatus = status.find(s => s.id === id);
      
      if (targetStatus?.isDefault) {
        return res.status(400).json({ error: 'Cannot delete default asset status' });
      }

      const success = await storage.deleteAssetStatus(id);
      if (success) {
        res.json({ message: 'Asset status deleted successfully' });
      } else {
        res.status(404).json({ error: 'Asset status not found' });
      }
    } catch (error: any) {
      console.error('Error deleting asset status:', error);
      res.status(500).json({ error: 'Failed to delete asset status', details: error.message });
    }
  });
  
  // Service Providers API
  app.get('/api/service-providers', authenticateUser, async (req, res) => {
    try {
      const providers = await storage.getServiceProviders();
      res.json(providers);
    } catch (error: unknown) {
      console.error('Error fetching service providers:', error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      console.error('Error creating service provider:', error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      console.error('Error updating service provider:', error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      console.error('Error deleting service provider:', error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // Enhanced employees export with all new schema fields
  app.get("/api/export/employees", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      const csvData = employees.map(emp => ({
        'Employee ID': emp.empId,
        'English Name': emp.englishName,
        'Arabic Name': emp.arabicName || '',
        'Department': emp.department || '',
        'ID Number': emp.idNumber || '', // New field
        'Title': emp.title || '', // New field
        'Employment Type': emp.employmentType || '',
        'Joining Date': emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '', // New field
        'Exit Date': emp.exitDate ? new Date(emp.exitDate).toISOString().split('T')[0] : '', // New field
        'Status': emp.status,
        'Personal Mobile': emp.personalMobile || '', // New field
        'Work Mobile': emp.workMobile || '', // New field
        'Personal Email': emp.personalEmail || '', // New field
        'Corporate Email': emp.corporateEmail || '', // New field
        'User ID': emp.userId || '', // New field
        'Direct Manager ID': emp.directManager || '', // New field
        'Created Date': emp.createdAt ? new Date(emp.createdAt).toISOString().split('T')[0] : '',
        'Last Updated': emp.updatedAt ? new Date(emp.updatedAt).toISOString().split('T')[0] : ''
      }));
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
      
      const csv = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${val || ''}"`).join(','))
      ].join('\n');
      
      res.send(csv);
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  app.get("/api/export/assets", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const assets = await storage.getAllAssets();
      const csvData = assets.map(asset => ({
        'Asset ID': asset.assetId,
        'Name': asset.modelName,
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
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

app.get("/api/export/tickets", authenticateUser, hasAccess(2), async (req, res) => {
  try {
    const data = await storage.getAllTickets();
    
    const csvData = data.map(item => ({
      ticketId: item.ticketId || '',
      title: item.title || '',                    // ✅ Fixed: was summary
      description: item.description || '',
      type: item.type || '',                      // ✅ Fixed: was requestType
      categoryId: item.categoryId || '',          // ✅ Fixed: use categoryId instead of category
      urgency: item.urgency || '',
      impact: item.impact || '',
      priority: item.priority || '',
      status: item.status || '',
      submittedById: item.submittedById || '',
      assignedToId: item.assignedToId || '',
      relatedAssetId: item.relatedAssetId || '',
      timeSpent: item.timeSpent || 0,             // ✅ Added: new schema field
      dueDate: item.dueDate || '',
      slaTarget: item.slaTarget || '',
      completionTime: item.completionTime || '',  // ✅ Added: new schema field
      resolution: item.resolution || '',
      createdAt: item.createdAt || '',
      updatedAt: item.updatedAt || ''
      // ✅ Removed deprecated fields: escalationLevel, tags, rootCause, workaround, resolutionNotes, privateNotes
    }));
    
    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tickets_export.csv"');
    res.send(csv);
  } catch (error: unknown) {
    res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(400).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(400).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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



app.get("/api/tickets/:id/history", authenticateUser, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    if (isNaN(ticketId)) {
      return res.status(400).json({ message: "Invalid ticket ID" });
    }
    
    const history = await storage.getTicketHistory(ticketId);
    res.json(history);
  } catch (error: unknown) {
    console.error("Get ticket history error:", error);
    res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
  }
});

  // Get ticket comments
  app.get("/api/tickets/:id/comments", authenticateUser, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const comments = await storage.getTicketComments(ticketId);
      res.json(comments);
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      res.status(400).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // Comprehensive ticket update endpoint with history tracking
  app.patch("/api/tickets/:id", authenticateUser, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const updateData = req.body;
      const userId = (req.user as schema.User)?.id;
      
      // Check if user is authenticated
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Use updateTicketWithHistory to ensure proper tracking
      const updatedTicket = await storage.updateTicketWithHistory(ticketId, updateData, userId);
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
    } catch (error: unknown) {
      console.error("Update ticket error:", error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  app.post("/api/tickets/:id/time", authenticateUser, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }
      
      const { hours, description } = req.body;
      
      if (!hours || hours <= 0) {
        return res.status(400).json({ message: "Valid hours value is required" });
      }
      
      const userId = req.user.id;
      
      const timeEntry = await storage.addTimeEntry(ticketId, hours, description || '', userId);
      
      res.status(201).json(timeEntry);
    } catch (error: unknown) {
      console.error("Add time entry error:", error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      console.error("Assign ticket error:", error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // Get ticket categories
  app.get("/api/tickets/categories", authenticateUser, async (req, res) => {
    try {
      const categories = await storage.getTicketCategories();
      res.json(categories);
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error("Error creating ticket category:", error);
      res.status(500).json({ message: "Failed to create ticket category" });
    }
  });

  app.post("/api/tickets/comments", authenticateUser, async (req, res) => {
    try {
      const { ticketId, content, isPrivate, attachments } = req.body;
      
      if (!ticketId || !content) {
        return res.status(400).json({ message: "Ticket ID and content are required" });
      }
      
      const userId = req.user.id;
      
      const comment = await storage.addTicketComment({
        ticketId: parseInt(ticketId),
        content,
        userId,
        isPrivate: isPrivate || false,
        attachments: attachments || []
      });
      
      res.status(201).json(comment);
    } catch (error: unknown) {
      console.error("Add comment error:", error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });



  // Categories CRUD routes  
  app.get("/api/categories", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      let categories = await storage.getCategories();
      
      // If no categories exist, create default ones
      if (categories.length === 0) {
        const defaultCategories = [
          { name: "Hardware", description: "Hardware-related issues and requests" },
          { name: "Software", description: "Software installation and application support" },
          { name: "Network", description: "Network connectivity and infrastructure issues" },
          { name: "Access Control", description: "User access and permission requests" },
          { name: "Security", description: "Security incidents and compliance issues" }
        ];
        
        for (const category of defaultCategories) {
          await storage.createCategory(category);
        }
        
        categories = await storage.getCategories();
      }
      
      res.json(categories);
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  app.post("/api/categories", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Name is required" });
      }
      
      const category = await storage.createCategory({
        name: name.trim(),
        description: description?.trim() || null
      });
      
      res.status(201).json(category);
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  app.put("/api/categories/:id", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, description } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Name is required" });
      }
      
      const category = await storage.updateCategory(id, {
        name: name.trim(),
        description: description?.trim() || null
      });
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  app.delete("/api/categories/:id", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCategory(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json({ message: "Category deleted successfully" });
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // User CRUD routes (admin only)
  app.get("/api/users", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      console.log("GET /api/users - Raw users from storage:", JSON.stringify(users, null, 2));
      res.json(users);
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  app.post("/api/users", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const userData = req.body;
      
      // Hash password if provided
      if (userData.password) {
        userData.password = await hash(userData.password, 10);
      }
      
      const newUser = await storage.createUser(userData);
      res.status(201).json(newUser);
    } catch (error: unknown) {
      console.error("User creation error:", error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  app.put("/api/users/:id", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      
      // Get current user data for activity logging
      const currentUser = await storage.getUser(id);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Hash password if provided
      if (userData.password) {
        userData.password = await hash(userData.password, 10);
      }
      
      const updatedUser = await storage.updateUser(id, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Log activity for status changes
      if (req.user && userData.isActive !== undefined && userData.isActive !== currentUser.isActive) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: userData.isActive ? "Activate User" : "Deactivate User",
          entityType: "User",
          entityId: id,
          details: { 
            username: currentUser.username,
            statusChange: `${currentUser.isActive ? 'Active' : 'Inactive'} → ${userData.isActive ? 'Active' : 'Inactive'}`
          }
        });
      }
      
      res.json(updatedUser);
    } catch (error: unknown) {
      console.error("User update error:", error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
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
    } catch (error: unknown) {
      console.error("User deletion error:", error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // Change user password endpoint
  app.put("/api/users/:id/change-password", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      // Get current user for activity logging
      const currentUser = await storage.getUser(id);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Hash the new password
      const hashedPassword = await hash(password, 10);
      
      // Update only the password
      const updatedUser = await storage.updateUser(id, { password: hashedPassword });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Change User Password",
          entityType: "User",
          entityId: id,
          details: { 
            username: currentUser.username,
            changedByUser: (req.user as schema.User).username
          }
        });
      }
      
      res.json({ message: "Password changed successfully" });
    } catch (error: unknown) {
      console.error("Password change error:", error);
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });

  // Bulk Asset Operations
  
  // Sell multiple assets
  app.post("/api/assets/sell", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const { assetIds, buyer, saleDate, totalAmount, notes } = req.body;
      
      if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
        return res.status(400).json({ message: "Asset IDs are required" });
      }
      
      if (!buyer || !saleDate || !totalAmount) {
        return res.status(400).json({ message: "Buyer, sale date, and total amount are required" });
      }
      
      const updatedAssets = [];
      
      for (const assetId of assetIds) {
        const asset = await storage.getAsset(assetId);
        if (!asset) {
          continue; // Skip non-existent assets
        }
        
        // Update asset status to Sold
        const updatedAsset = await storage.updateAsset(assetId, {
          status: 'Sold',
          assignedEmployeeId: null // Clear assignment when sold
        });
        
        updatedAssets.push(updatedAsset);

        // Create transaction record for the sale
        await storage.createAssetTransaction({
          assetId: assetId,
          type: 'Sale',
          employeeId: null,
          transactionDate: new Date(saleDate),
          handledById: (req.user as schema.User).id,
          conditionNotes: `Sold to ${buyer}`,
          deviceSpecs: {
            buyer: buyer,
            saleDate: saleDate,
            salePrice: totalAmount / assetIds.length, // Divided equally
            totalAmount: totalAmount,
            notes: notes
          }
        });
        
        // Log activity
        if (req.user) {
          await storage.logActivity({
            userId: (req.user as schema.User).id,
            action: "Sell",
            entityType: "Asset",
            entityId: assetId,
            details: { 
              assetId: asset.assetId,
              buyer,
              saleDate,
              totalAmount,
              notes
            }
          });
        }
      }
      
      res.json({ 
        message: `Successfully sold ${updatedAssets.length} assets`,
        updatedAssets 
      });
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });
  
  // Retire multiple assets
  app.post("/api/assets/retire", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const { assetIds, reason, retirementDate } = req.body;
      
      if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
        return res.status(400).json({ message: "Asset IDs are required" });
      }
      
      const updatedAssets = [];
      
      for (const assetId of assetIds) {
        const asset = await storage.getAsset(assetId);
        if (!asset) {
          continue; // Skip non-existent assets
        }
        
        // Update asset status to Retired
        const updatedAsset = await storage.updateAsset(assetId, {
          status: 'Retired',
          assignedEmployeeId: null // Clear assignment when retired
        });
        
        updatedAssets.push(updatedAsset);

        // Create transaction record for retirement
        await storage.createAssetTransaction({
          assetId: assetId,
          type: 'Retirement',
          employeeId: null,
          transactionDate: new Date(retirementDate),
          handledById: (req.user as schema.User).id,
          conditionNotes: `Retired: ${reason}`,
          deviceSpecs: {
            retirementReason: reason,
            retirementDate: retirementDate,
            notes: notes || null
          }
        });
        
        // Log activity
        if (req.user) {
          await storage.logActivity({
            userId: (req.user as schema.User).id,
            action: "Retire",
            entityType: "Asset",
            entityId: assetId,
            details: { 
              assetId: asset.assetId,
              reason: reason || 'Bulk retirement',
              retirementDate: retirementDate || new Date().toISOString()
            }
          });
        }
      }
      
      res.json({ 
        message: `Successfully retired ${updatedAssets.length} assets`,
        updatedAssets 
      });
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });
  
  // Delete multiple assets
  app.delete("/api/assets/bulk-delete", authenticateUser, hasAccess(4), async (req, res) => {
    try {
      const { assetIds } = req.body;
      
      if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
        return res.status(400).json({ message: "Asset IDs are required" });
      }
      
      const deletedAssets = [];
      
      for (const assetId of assetIds) {
        const asset = await storage.getAsset(assetId);
        if (!asset) {
          continue; // Skip non-existent assets
        }
        
        // Delete the asset
        await storage.deleteAsset(assetId);
        deletedAssets.push(asset);
        
        // Log activity
        if (req.user) {
          await storage.logActivity({
            userId: (req.user as schema.User).id,
            action: "Delete",
            entityType: "Asset",
            entityId: assetId,
            details: { 
              assetId: asset.assetId,
              type: asset.type,
              brand: asset.brand,
              deletedReason: 'Bulk deletion'
            }
          });
        }
      }
      
      res.json({ 
        message: `Successfully deleted ${deletedAssets.length} assets`,
        deletedAssets 
      });
    } catch (error: unknown) {
      res.status(500).json(createErrorResponse(error instanceof Error ? error : new Error(String(error))));
    }
  });



//Bulk Status change
app.post("/api/assets/bulk/status", authenticateUser, hasAccess(2), async (req, res) => {
  try {
    const { assetIds, status } = req.body;
    
    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return res.status(400).json({ message: "Asset IDs are required" });
    }
    
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }
    
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    for (const assetId of assetIds) {
      try {
        await storage.updateAsset(assetId, { status });
        results.successful++;
        
        // Log activity
        await storage.logActivity({
          userId: req.user.id,
          action: "STATUS_CHANGE",
          entityType: "ASSET",
          entityId: assetId,
          details: {
            newStatus: status,
            bulkOperation: true
          }
        });
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Asset ${assetId}: ${error.message}`);
      }
    }
    
    res.json({
      message: `Changed status for ${results.successful} assets`,
      successful: results.successful,
      failed: results.failed,
      errors: results.errors
    });
  } catch (error: unknown) {
    console.error("Error in bulk status change:", error);
    res.status(500).json({ 
      message: "Failed to change status",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Optional: Get check-in/out reasons (for frontend dropdowns)
app.get("/api/assets/transaction-reasons", authenticateUser, async (req, res) => {
  try {
    const checkOutReasons = [
      'Assigned for work use',
      'Temporary loan',
      'Replacement for faulty asset',
      'Project-based use',
      'Remote work setup',
      'New employee onboarding'
    ];
    
    const checkInReasons = [
      'End of assignment',
      'Employee exit',
      'Asset not needed anymore',
      'Asset upgrade/replacement',
      'Faulty/Needs repair',
      'Loan period ended'
    ];
    
    res.json({
      checkOut: checkOutReasons,
      checkIn: checkInReasons
    });
  } catch (error: unknown) {
    console.error("Error fetching transaction reasons:", error);
    res.status(500).json({ 
      message: "Failed to fetch transaction reasons",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});


  // Add global error handler at the end
  app.use(errorHandler({ 
    showStackTrace: process.env.NODE_ENV === 'development',
    logErrors: true 
  }));

  // Bulk Operations Endpoints
  app.post('/api/assets/bulk/status', authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const { assetIds, status } = req.body;
      
      if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
        return res.status(400).json({ error: 'Asset IDs array is required' });
      }
      
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }
      
      const results = await Promise.allSettled(
        assetIds.map(id => storage.updateAsset(id, { status }))
      );
      
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason?.message || 'Unknown error');
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Bulk Update",
          entityType: "Asset",
          entityId: null,
          details: { 
            operation: 'status_change',
            assetIds,
            newStatus: status,
            succeeded,
            failed
          }
        });
      }
      
      res.json({
        success: true,
        message: `Updated ${succeeded} assets to ${status}`,
        details: {
          succeeded,
          failed,
          errors
        }
      });
    } catch (error: any) {
      console.error('Bulk status update error:', error);
      res.status(500).json({ 
        error: 'Failed to update asset statuses',
        message: error.message 
      });
    }
  });



  app.post('/api/assets/bulk/delete', authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const { assetIds } = req.body;
      
      if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
        return res.status(400).json({ error: 'Asset IDs array is required' });
      }
      
      if (assetIds.length > 10) {
        return res.status(400).json({ error: 'Cannot delete more than 10 assets at once' });
      }
      
      const results = await Promise.allSettled(
        assetIds.map(id => storage.deleteAsset(id))
      );
      
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason?.message || 'Unknown error');
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Bulk Delete",
          entityType: "Asset",
          entityId: null,
          details: { 
            operation: 'delete',
            assetIds,
            succeeded,
            failed
          }
        });
      }
      
      res.json({
        success: true,
        message: `Deleted ${succeeded} assets`,
        details: {
          succeeded,
          failed,
          errors
        }
      });
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      res.status(500).json({ 
        error: 'Failed to delete assets',
        message: error.message 
      });
    }
  });

  app.post('/api/assets/bulk/maintenance', authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const { assetIds, type, description, scheduledDate, estimatedCost, priority, notes } = req.body;
      
      if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
        return res.status(400).json({ error: 'Asset IDs array is required' });
      }
      
      if (!type || !description || !scheduledDate) {
        return res.status(400).json({ error: 'Type, description, and scheduled date are required' });
      }
      
      const results = await Promise.allSettled(
        assetIds.map(assetId => 
          storage.createAssetMaintenance({
            assetId,
            type,
            description,
            scheduledDate: new Date(scheduledDate),
            estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
            priority: priority || 'Medium',
            notes: notes || '',
            status: 'Scheduled',
            createdById: (req.user as schema.User).id,
            updatedById: (req.user as schema.User).id
          })
        )
      );
      
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason?.message || 'Unknown error');
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Bulk Maintenance Schedule",
          entityType: "Asset",
          entityId: null,
          details: { 
            operation: 'maintenance_schedule',
            assetIds,
            type,
            scheduledDate,
            priority,
            succeeded,
            failed
          }
        });
      }
      
      res.json({
        success: true,
        message: `Successfully scheduled maintenance for ${succeeded} assets`,
        details: {
          succeeded,
          failed,
          errors: failed > 0 ? errors : undefined
        }
      });
    } catch (error: any) {
      console.error('Bulk maintenance error:', error);
      res.status(500).json({ 
        error: 'Failed to schedule maintenance',
        message: error.message 
      });
    }
  });

  // GET /api/admin/backups - Get list of backups
app.get('/api/admin/backups', requireAuth, requireAdmin, async (req, res) => {
  try {
    const backups = await backupService.getBackupList();
    res.json(backups);
  } catch (error) {
    console.error('Failed to get backup list:', error);
    res.status(500).json({ error: 'Failed to get backup list' });
  }
});

// POST /api/admin/backups - Create manual backup
app.post('/api/admin/backups', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { description } = req.body;
    const userId = req.session.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await backupService.createManualBackup(userId, description);
    
    if (result.success) {
      res.json({ message: 'Backup created successfully', backupId: result.backupId });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Failed to create backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// POST /api/admin/restore/:backupId - Restore from backup
app.post('/api/admin/restore/:backupId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const backupId = parseInt(req.params.backupId);
    const userId = req.session.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(backupId)) {
      return res.status(400).json({ error: 'Invalid backup ID' });
    }

    const result = await backupService.restoreFromBackup(backupId, userId);
    
    if (result.success) {
      res.json({ 
        message: 'Database restored successfully', 
        recordsRestored: result.recordsRestored 
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Failed to restore backup:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

// DELETE /api/admin/backups/:id - Delete backup
app.delete('/api/admin/backups/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const backupId = parseInt(req.params.id);
    
    if (isNaN(backupId)) {
      return res.status(400).json({ error: 'Invalid backup ID' });
    }

    const result = await backupService.deleteBackup(backupId);
    
    if (result.success) {
      res.json({ message: 'Backup deleted successfully' });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Failed to delete backup:', error);
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

// GET /api/admin/system-health - Get system health metrics
app.get('/api/admin/system-health', requireAuth, requireAdmin, async (req, res) => {
  try {
    const healthMetrics = await backupService.getSystemHealth();
    res.json(healthMetrics);
  } catch (error) {
    console.error('Failed to get system health:', error);
    res.status(500).json({ error: 'Failed to get system health' });
  }
});

// GET /api/admin/system-overview - Get system overview statistics
app.get('/api/admin/system-overview', requireAuth, requireAdmin, async (req, res) => {
  try {
    const systemOverview = await backupService.getSystemOverview();
    res.json(systemOverview);
  } catch (error) {
    console.error('Failed to get system overview:', error);
    res.status(500).json({ error: 'Failed to get system overview' });
  }
});

// GET /api/admin/restore-history - Get restore history
app.get('/api/admin/restore-history', requireAuth, requireAdmin, async (req, res) => {
  try {
    const history = await backupService.getRestoreHistory();
    res.json(history);
  } catch (error) {
    console.error('Failed to get restore history:', error);
    res.status(500).json({ error: 'Failed to get restore history' });
  }
});

// Helper function to check admin access
function requireAdmin(req: any, res: any, next: any) {
  if (!req.session.user || req.session.user.accessLevel !== 4) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

  const httpServer = createServer(app);
  return httpServer;
}
