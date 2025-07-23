import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage-factory";

const storage = getStorage();
import * as schema from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { ValidationError, NotFoundError, UnauthorizedError, createErrorResponse } from "@shared/errors";
import type { UserResponse, EmployeeResponse, AssetResponse, TicketResponse } from "@shared/types";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { compare, hash } from "bcryptjs";
import ConnectPgSimple from "connect-pg-simple";
import multer from "multer";
import MemoryStore from "memorystore";
import { errorHandler, asyncHandler } from "./middleware/error-handler";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { stringify as csvStringify } from "csv-stringify";
import { createHash, randomBytes } from "crypto";

import { emailService } from "./emailService";
import { exportToCSV, importFromCSV, parseCSV } from "@shared/csvUtils";
import { getValidationRules, getExportColumns } from "@shared/importExportRules";

// Helper function to generate IDs
const generateId = (prefix: string, num: number) => {
  return `${prefix}${num.toString().padStart(5, "0")}`;
};

// Helper function to validate request body against schema
function validateBody<T>(schema: schema.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
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
  if (req.session && 'user' in req.session) {
    return next();
  }
  
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
