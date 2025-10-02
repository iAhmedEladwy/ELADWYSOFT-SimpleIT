import { 
  users, type User, type InsertUser,
  employees, type Employee, type InsertEmployee,
  assets, type Asset, type InsertAsset,
  assetMaintenance, type AssetMaintenance, type InsertAssetMaintenance,
  assetSales, type AssetSale, type InsertAssetSale,
  assetSaleItems, type AssetSaleItem, type InsertAssetSaleItem,
  tickets, type Ticket, type InsertTicket,
  ticketComments, ticketHistory,
  systemConfig, type SystemConfig, type InsertSystemConfig,
  activityLog, type ActivityLog, type InsertActivityLog,
  assetTransactions, type AssetTransaction, type InsertAssetTransaction,
  securityQuestions, type SecurityQuestion, type InsertSecurityQuestion,
  passwordResetTokens, type PasswordResetToken, type InsertPasswordResetToken,
  customAssetTypes, customAssetBrands, customAssetStatuses, categories,
  assetStatuses, type AssetStatus, type InsertAssetStatus,
  notifications, type Notification, type InsertNotification
} from "@shared/schema";
import { calculatePriority, type UrgencyLevel, type ImpactLevel } from "@shared/priorityUtils";
import { db, pool } from "./db";
import { eq, and, like, desc, or, asc, gte, lt, sql } from "drizzle-orm";
import { compare, hash } from 'bcrypt';

// Storage interface for all CRUD operations
// Define UpsertUser type for Replit Auth
export interface UpsertUser {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  accessLevel?: string;
}

// Import proper types
import type { 
  UserResponse, 
  EmployeeResponse, 
  AssetResponse, 
  TicketResponse,
  CustomAssetType,
  CustomAssetBrand,
  CustomAssetStatus
} from '@shared/types';

export interface IStorage {
  // Security Questions operations
  getSecurityQuestions(userId?: number): Promise<SecurityQuestion[]>;
  createSecurityQuestion(question: InsertSecurityQuestion): Promise<SecurityQuestion>;
  updateSecurityQuestion(id: number, question: Partial<InsertSecurityQuestion>): Promise<SecurityQuestion | undefined>;
  deleteSecurityQuestion(id: number): Promise<boolean>;
  hasSecurityQuestions(userId: number): Promise<boolean>;
  verifySecurityQuestions(userId: number, questions: { question: string, answer: string }[]): Promise<boolean>;
  
  // Password Reset operations
  createPasswordResetToken(userId: number): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  validatePasswordResetToken(token: string): Promise<number | undefined>; // Returns userId if valid
  invalidatePasswordResetToken(token: string): Promise<boolean>;
  // User operations
  getUser(id: string | number): Promise<User | undefined>;
  getUserByUsername?(username: string): Promise<User | undefined>;
  getUserByEmail?(email: string): Promise<User | undefined>;
  createUser?(user: InsertUser): Promise<User>;
  updateUser?(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser?(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>; // Add this for Replit Auth
  
  // Employee operations
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  getAllEmployees(): Promise<Employee[]>;
  searchEmployees(query: string): Promise<Employee[]>;
  
  // Asset operations
  getAsset(id: number): Promise<Asset | undefined>;
  getAssetByAssetId(assetId: string): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset | undefined>;
  deleteAsset(id: number): Promise<boolean>;
  getAllAssets(): Promise<Asset[]>;
  getAssetsByStatus(status: string): Promise<Asset[]>;
  getAssetsByType(type: string): Promise<Asset[]>;
  getAssetsForEmployee(employeeId: number): Promise<Asset[]>;
  
  // Asset Maintenance operations
  createAssetMaintenance(maintenance: InsertAssetMaintenance): Promise<AssetMaintenance>;
  getMaintenanceForAsset(assetId: number): Promise<AssetMaintenance[]>;
  getAssetMaintenanceById(id: number): Promise<AssetMaintenance | undefined>;
  updateAssetMaintenance(id: number, maintenance: Partial<InsertAssetMaintenance>): Promise<AssetMaintenance | undefined>;
  deleteAssetMaintenance(id: number): Promise<boolean>;
  getAllMaintenanceRecords(): Promise<AssetMaintenance[]>;

  // Asset Transaction operations
  createAssetTransaction(transaction: InsertAssetTransaction): Promise<AssetTransaction>;
  getAssetTransactions(assetId: number): Promise<AssetTransaction[]>;
  getEmployeeTransactions(employeeId: number): Promise<AssetTransaction[]>;
  getAllAssetTransactions(): Promise<AssetTransaction[]>;
  checkOutAsset(assetId: number, employeeId: number, notes?: string, type?: string,handledById?: number, deviceSpecs?: any): Promise<AssetTransaction>;
  checkInAsset(assetId: number, notes?: string, type?: string,handledById?: number, deviceSpecs?: any): Promise<AssetTransaction>;

  // Asset Sales operations
  createAssetSale(sale: InsertAssetSale): Promise<AssetSale>;
  addAssetToSale(saleItem: InsertAssetSaleItem): Promise<AssetSaleItem>;
  getAssetSales(): Promise<AssetSale[]>;
  
  // Ticket operations
  getTicket(id: number): Promise<Ticket | undefined>;
  getTicketByTicketId(ticketId: string): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  createTicketWithHistory(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, ticket: Partial<InsertTicket>): Promise<Ticket | undefined>;
  getAllTickets(): Promise<Ticket[]>;
  getTicketsByStatus(status: string): Promise<Ticket[]>;
  getTicketsForEmployee(employeeId: number): Promise<Ticket[]>;
  getTicketsAssignedToUser(userId: number): Promise<Ticket[]>;
  
  // System Config operations
  getSystemConfig(): Promise<SystemConfig | undefined>;
  updateSystemConfig(config: Partial<InsertSystemConfig>): Promise<SystemConfig | undefined>;
  
  // Activity Log operations
  logActivity(activity: InsertActivityLog): Promise<ActivityLog>;
  getRecentActivity(limit: number): Promise<ActivityLog[]>;
  getActivityLogs(options: {
    filter?: string;
    action?: string;
    entityType?: string;
    userId?: number;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    data: ActivityLog[];
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    }
  }>;
  getActivityLogsCount(options: {
    filter?: string;
    action?: string;
    entityType?: string;
    userId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number>;
  clearActivityLogs(options?: {
    olderThan?: Date;
    entityType?: string;
    action?: string;
  }): Promise<number>; // Returns number of deleted logs
    
  // Custom Fields operations
  getCustomAssetTypes(): Promise<any[]>;
  createCustomAssetType(data: { name: string; description?: string }): Promise<any>;
  updateCustomAssetType(id: number, data: { name: string; description?: string }): Promise<any>;
  deleteCustomAssetType(id: number): Promise<boolean>;
  
  getCustomAssetBrands(): Promise<any[]>;
  createCustomAssetBrand(data: { name: string; description?: string }): Promise<any>;
  updateCustomAssetBrand(id: number, data: { name: string; description?: string }): Promise<any>;
  deleteCustomAssetBrand(id: number): Promise<boolean>;
  
  getCustomAssetStatuses(): Promise<any[]>;
  createCustomAssetStatus(data: { name: string; description?: string; color?: string }): Promise<any>;
  updateCustomAssetStatus(id: number, data: { name: string; description?: string; color?: string }): Promise<any>;
  deleteCustomAssetStatus(id: number): Promise<boolean>;
  
  // Asset Status operations (flexible status system)
  getAssetStatuses(): Promise<AssetStatus[]>;
  createAssetStatus(data: InsertAssetStatus): Promise<AssetStatus>;
  updateAssetStatus(id: number, data: Partial<InsertAssetStatus>): Promise<AssetStatus | undefined>;
  deleteAssetStatus(id: number): Promise<boolean>;
  getAssetStatusByName(name: string): Promise<AssetStatus | undefined>;
  ensureAssetStatus(name: string, color?: string): Promise<AssetStatus>;
  
  // Custom Request Types operations (Feature 1: Change Category to Request Type)
  getCategories(): Promise<any[]>;
  getAllCategories(): Promise<any[]>;
  createCategory(category: any): Promise<any>;
  updateCategory(id: number, category: any): Promise<any | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Ticket History operations (Feature 3: Ticket history and updates display)
  getTicketHistory(ticketId: number): Promise<any[]>;
  createTicketHistory(history: any): Promise<any>;
  
  // Enhanced Ticket Update with history tracking (Feature 5: Update ticket details)
  updateTicketWithHistory(id: number, ticketData: Partial<InsertTicket>, userId: number): Promise<Ticket | undefined>;
  
  // Delete Ticket with admin permission (Feature 4: Delete ticket function - admin only)
  deleteTicket(id: number, userId: number): Promise<boolean>;
  
  // Enhanced ticket creation with history
  createTicketWithHistory(ticket: InsertTicket): Promise<Ticket>;
  
  // Advanced ticket management operations
  getEnhancedTickets(): Promise<any[]>;
  getTicketCategories(): Promise<any[]>;
  createTicketCategory(categoryData: any): Promise<any>;
  addTicketComment(commentData: any): Promise<any>;
  addTimeEntry(ticketId: number, hours: number, description: string, userId: number): Promise<any>;
  mergeTickets(primaryTicketId: number, secondaryTicketIds: number[], userId: number): Promise<any>;
  addTicketHistory(historyData: any): Promise<any>;
}

// Implementation of Storage using a PostgreSQL database
export class DatabaseStorage implements IStorage {
  
  // Security Questions operations
  async getSecurityQuestions(userId?: number): Promise<SecurityQuestion[]> {
    try {
      // Special case: userId=0 means return default questions
      if (userId === 0) {
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
        // Return as SecurityQuestion objects
        return defaultQuestions.map((q, index) => ({
          id: index + 1,
          userId: 0, // Placeholder value
          question: q,
          answer: "", // No answers for default questions
          createdAt: new Date(),
          updatedAt: new Date()
        }));
      }
      
      // Normal case: return user's security questions
      if (userId) {
        return await db.select().from(securityQuestions).where(eq(securityQuestions.userId, userId));
      }
      
      // If no userId provided, return empty array
      return [];
    } catch (error) {
      console.error('Error getting security questions:', error);
      return [];
    }
  }

  async createSecurityQuestion(question: InsertSecurityQuestion): Promise<SecurityQuestion> {
    try {
      const [newQuestion] = await db.insert(securityQuestions).values(question).returning();
      return newQuestion;
    } catch (error) {
      console.error('Error creating security question:', error);
      throw error;
    }
  }

  async updateSecurityQuestion(id: number, question: Partial<InsertSecurityQuestion>): Promise<SecurityQuestion | undefined> {
    try {
      const [updatedQuestion] = await db
        .update(securityQuestions)
        .set({ ...question, updatedAt: new Date() })
        .where(eq(securityQuestions.id, id))
        .returning();
      return updatedQuestion;
    } catch (error) {
      console.error('Error updating security question:', error);
      return undefined;
    }
  }

  async deleteSecurityQuestion(id: number): Promise<boolean> {
    try {
      const result = await db.delete(securityQuestions).where(eq(securityQuestions.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting security question:', error);
      return false;
    }
  }
  
  async hasSecurityQuestions(userId: number): Promise<boolean> {
    try {
      const questions = await this.getSecurityQuestions(userId);
      return questions.length > 0;
    } catch (error) {
      console.error('Error checking for security questions:', error);
      return false;
    }
  }

  async verifySecurityQuestions(userId: number, questions: { question: string, answer: string }[]): Promise<boolean> {
    try {
      // Get the stored security questions for this user
      const storedQuestions = await this.getSecurityQuestions(userId);
      
      // Make sure we have questions to verify
      if (storedQuestions.length === 0 || questions.length === 0) {
        return false;
      }
      
      // For each provided question/answer pair, check if there's a matching stored question
      let correctAnswers = 0;
      for (const pair of questions) {
        // Find the matching question
        const matchingQuestion = storedQuestions.find(q => q.question === pair.question);
        if (matchingQuestion && matchingQuestion.answer === pair.answer) {
          correctAnswers++;
        }
      }
      
      // Require at least half of the answers to be correct (or at least one if there's only one)
      const requiredCorrect = Math.max(1, Math.floor(questions.length / 2));
      return correctAnswers >= requiredCorrect;
    } catch (error) {
      console.error('Error verifying security questions:', error);
      return false;
    }
  }
  
  // Password Reset operations
  async createPasswordResetToken(userId: number): Promise<PasswordResetToken> {
    try {
      // Generate a secure random token
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      
      // Set expiration time (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // Delete any existing tokens for this user
      try {
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
      } catch (deleteError) {
        console.warn('Could not delete existing tokens:', deleteError);
        // Continue with token creation even if deletion fails
      }
      
      // Create the new token
      const [resetToken] = await db
        .insert(passwordResetTokens)
        .values({
          userId,
          token,
          expiresAt,
        })
        .returning();
      
      return resetToken;
    } catch (error) {
      console.error('Error creating password reset token:', error);
      // Return a fallback token structure to prevent cascade failures
      const fallbackToken: PasswordResetToken = {
        id: 0,
        userId,
        token: 'temp-token-' + Date.now(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date()
      };
      return fallbackToken;
    }
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    try {
      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, token));
      return resetToken;
    } catch (error) {
      console.error('Error getting password reset token:', error);
      return undefined;
    }
  }

  async validatePasswordResetToken(token: string): Promise<number | undefined> {
    try {
      const resetToken = await this.getPasswordResetToken(token);
      
      // If token doesn't exist or is expired, return undefined
      if (!resetToken || new Date() > resetToken.expiresAt) {
        return undefined;
      }
      
      return resetToken.userId;
    } catch (error) {
      console.error('Error validating password reset token:', error);
      return undefined;
    }
  }

  async invalidatePasswordResetToken(token: string): Promise<boolean> {
    try {
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
      return true;
    } catch (error) {
      console.error('Error invalidating password reset token:', error);
      return false;
    }
  }
  // User operations
  async getUser(id: string | number): Promise<User | undefined> {
    try {
      // Convert id to number since users.id is a serial (number)
      const numericId = typeof id === 'string' ? parseInt(id) : id;
      if (isNaN(numericId)) {
        return undefined;
      }
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        password: users.password,
        accessLevel: users.accessLevel,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      }).from(users).where(eq(users.id, numericId));
      return user ? this.mapUserFromDb(user) : undefined;
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        password: users.password,
        accessLevel: users.accessLevel,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      }).from(users).where(eq(users.username, username));
      
      return user ? this.mapUserFromDb(user) : undefined;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        password: users.password,
        accessLevel: users.accessLevel,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      }).from(users).where(eq(users.email, email));
      
      return user ? this.mapUserFromDb(user) : undefined;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return undefined;
    }
  }

  async createUser(userData: any): Promise<User> {
  try {
    // Check if password is already hashed (starts with $2b$ or $2a$)
    const isAlreadyHashed = userData.password && userData.password.match(/^\$2[abxy]\$/);
    
    const hashedPassword = isAlreadyHashed
      ? userData.password  // Use as-is if already hashed
      : userData.password 
        ? await hash(userData.password, 10)  // Hash if plain text
        : await hash('defaultPassword123', 10);  // Default

    // Include firstName and lastName in the database insert
    const dbUserData = {
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      password: hashedPassword,
      accessLevel: this.roleToAccessLevel(userData.role || 'employee'),
      role: userData.role || 'employee',
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [user] = await db
      .insert(users)
      .values(dbUserData)
      .returning();
    return this.mapUserFromDb(user);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

  private roleToAccessLevel(role: string): string {
    switch(role) {
      case 'admin': return '4';
      case 'manager': return '3';
      case 'agent': return '2';
      case 'employee': return '1';
      default: return '1';
    }
  }

  private accessLevelToRole(accessLevel: string | number): string {
    const level = typeof accessLevel === 'string' ? accessLevel : accessLevel.toString();
    switch(level) {
      case '4': return 'admin';
      case '3': return 'manager';
      case '2': return 'agent';
      case '1': return 'employee';
      default: return 'employee';
    }
  }

  private mapUserFromDb(dbUser: any): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      firstName: dbUser.firstName || dbUser.first_name || null,
      lastName: dbUser.lastName || dbUser.last_name || null,
      password: dbUser.password,
      accessLevel: dbUser.accessLevel || dbUser.access_level,
      role: dbUser.role || this.accessLevelToRole(dbUser.accessLevel || dbUser.access_level),
      isActive: dbUser.isActive !== undefined ? dbUser.isActive : (dbUser.is_active !== undefined ? dbUser.is_active : true),
      createdAt: dbUser.createdAt || dbUser.created_at,
      updatedAt: dbUser.updatedAt || dbUser.updated_at
    };
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const [user] = await db
        .update(users)
        .set({ ...userData, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        password: users.password,
        accessLevel: users.accessLevel,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      }).from(users).orderBy(users.username);
      return result.map(user => this.mapUserFromDb(user));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // First, check if user exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(userData.id)));

      if (existingUser) {
        // Update the user if exists
        const [updatedUser] = await db
          .update(users)
          .set({
            email: userData.email || undefined,
            accessLevel: (userData.accessLevel as "1" | "2" | "3") || existingUser.accessLevel,
            updatedAt: new Date()
          })
          .where(eq(users.id, parseInt(userData.id)))
          .returning();
        return updatedUser;
      } else {
        // Create a new user
        const [newUser] = await db
          .insert(users)
          .values([{
            username: userData.id, // Use the ID as username for simplicity
            email: userData.email || '',
            password: '', // Not used with Replit Auth
            accessLevel: (userData.accessLevel as "1" | "2" | "3") || '1', // Default to regular user
          }])
          .returning();
        return newUser;
      }
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  // Employee operations
  async getEmployee(id: number): Promise<Employee | undefined> {
    try {
      const [employee] = await db.select().from(employees).where(eq(employees.id, id));
      return employee;
    } catch (error) {
      console.error('Error fetching employee:', error);
      return undefined;
    }
  }

  async getEmployeeByEmpId(empId: string): Promise<Employee | undefined> {
    try {
      const [employee] = await db.select().from(employees).where(eq(employees.empId, empId));
      return employee;
    } catch (error) {
      console.error('Error fetching employee by empId:', error);
      return undefined;
    }
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    try {
      // Remove any empId field that might be passed in and let database auto-generate
      const { empId, ...cleanEmployee } = employee as any;
      
      // Let database auto-generate emp_id - don't include it in INSERT
      const result = await pool.query(`
        INSERT INTO employees (
          english_name, arabic_name, department, id_number, title,
          direct_manager, employment_type, joining_date, exit_date, status,
          personal_mobile, work_mobile, personal_email, corporate_email, user_id,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
        ) RETURNING *
      `, [
        cleanEmployee.englishName,
        cleanEmployee.arabicName || null,
        cleanEmployee.department,
        cleanEmployee.idNumber || `ID-${Date.now()}`,
        cleanEmployee.title || 'Employee',
        cleanEmployee.directManager || null,
        cleanEmployee.employmentType || 'Full-time',
        cleanEmployee.joiningDate || new Date().toISOString().split('T')[0],
        cleanEmployee.exitDate || null,
        cleanEmployee.status || 'Active',
        cleanEmployee.personalMobile || null,
        cleanEmployee.workMobile || null,
        cleanEmployee.personalEmail || null,
        cleanEmployee.corporateEmail || null,
        cleanEmployee.userId || null
      ]);
      
      console.log('Employee created successfully:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  async updateEmployee(id: number, employeeData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    try {
      // Remove generated columns from update data
      const { name, email, phone, ...updateData } = employeeData as any;
      
      // Use raw SQL to avoid generated column conflicts
      const result = await pool.query(`
        UPDATE employees 
        SET 
          english_name = COALESCE($2, english_name),
          arabic_name = COALESCE($3, arabic_name),
          department = COALESCE($4, department),
          id_number = COALESCE($5, id_number),
          title = COALESCE($6, title),
          employment_type = COALESCE($7, employment_type),
          status = COALESCE($8, status),
          joining_date = COALESCE($9, joining_date),
          emp_id = COALESCE($10, emp_id),
          direct_manager = $11,
          exit_date = $12,
          personal_mobile = COALESCE($13, personal_mobile),
          work_mobile = COALESCE($14, work_mobile),
          personal_email = COALESCE($15, personal_email),
          corporate_email = COALESCE($16, corporate_email),
          user_id = $17,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [
        id,
        updateData.englishName,
        updateData.arabicName,
        updateData.department,
        updateData.idNumber,
        updateData.title,
        updateData.employmentType,
        updateData.status,
        updateData.joiningDate,
        updateData.empId,
        updateData.directManager,
        updateData.exitDate,
        updateData.personalMobile,
        updateData.workMobile,
        updateData.personalEmail,
        updateData.corporateEmail,
        updateData.userId
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating employee:', error);
      return undefined;
    }
  }

  async deleteEmployee(id: number): Promise<boolean> {
    try {
      const result = await db.delete(employees).where(eq(employees.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting employee:', error);
      return false;
    }
  }

  async getAllEmployees(): Promise<Employee[]> {
    try {
      // Use direct SQL with explicit status mapping to bypass enum issues
      const result = await pool.query(`
        SELECT 
          id, emp_id, english_name, arabic_name, department, id_number, title,
          direct_manager, employment_type::text, joining_date, exit_date, 
          CASE 
            WHEN status = 'Active' THEN 'Active'
            WHEN status = 'Resigned' THEN 'Resigned' 
            WHEN status = 'Terminated' THEN 'Terminated'
            WHEN status = 'On Leave' THEN 'On Leave'
            ELSE 'Active'
          END as status,
          personal_mobile, work_mobile, personal_email, corporate_email,
          user_id, created_at, updated_at
        FROM employees 
        ORDER BY emp_id ASC
      `);
      

      
      // Transform raw result to expected format
      return result.rows.map((emp: any) => {
        const transformed = {
        id: emp.id,
        empId: emp.emp_id,
        englishName: emp.english_name || emp.name || 'Unknown',
        arabicName: emp.arabic_name,
        department: emp.department || 'Unassigned',
        idNumber: emp.id_number,
        title: emp.title,
        directManager: emp.direct_manager,
        employmentType: emp.employment_type || 'Full-time',
        joiningDate: emp.joining_date,
        exitDate: emp.exit_date,
        status: emp.status || 'Active', // Use actual database enum status with fallback
        isActive: emp.status === 'Active', // Set isActive based on status
        personalMobile: emp.personal_mobile,
        workMobile: emp.work_mobile,
        personalEmail: emp.personal_email,
        corporateEmail: emp.corporate_email,
        userId: emp.user_id,
        createdAt: emp.created_at,
        updatedAt: emp.updated_at,
        };
        
        
        return transformed;
      });
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  }

  async searchEmployees(query: string): Promise<Employee[]> {
    try {
      if (!query) {
        // If no query, return all employees
        return await this.getAllEmployees();
      }

      // Search by English name, Arabic name, ID, or department
      return await db
        .select()
        .from(employees)
        .where(
          or(
            like(employees.englishName, `%${query}%`),
            like(employees.arabicName, `%${query}%`),
            like(employees.empId, `%${query}%`),
            like(employees.department, `%${query}%`)
          )
        )
        .orderBy(asc(employees.empId));
    } catch (error) {
      console.error('Error searching employees:', error);
      return [];
    }
  }
  
  async getEmployeeByUserId(userId: number): Promise<Employee | undefined> {
    try {
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, userId));
      return employee;
    } catch (error) {
      console.error('Error fetching employee by user ID:', error);
      return undefined;
    }
  }

  // Asset operations
  async getAsset(id: number): Promise<Asset | undefined> {
    try {
      const [asset] = await db.select().from(assets).where(eq(assets.id, id));
      return asset;
    } catch (error) {
      console.error('Error fetching asset:', error);
      return undefined;
    }
  }

  async getAssetByAssetId(assetId: string): Promise<Asset | undefined> {
    try {
      const [asset] = await db.select().from(assets).where(eq(assets.assetId, assetId));
      return asset;
    } catch (error) {
      console.error('Error fetching asset by assetId:', error);
      return undefined;
    }
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    try {
      // Let database auto-generate asset_id - don't include it in INSERT
      const query = `
        INSERT INTO assets (
          type, brand, model_number, model_name, serial_number, specs,
          status, purchase_date, buy_price, warranty_expiry_date,
          life_span, out_of_box_os, assigned_employee_id, cpu, ram, storage,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()
        ) RETURNING *
      `;

      const values = [
        asset.type || 'Hardware',
        asset.brand || null,
        asset.modelNumber || null,
        asset.modelName || null,
        asset.serialNumber || null,
        asset.specs || asset.description || null,
        asset.status || 'Available',
        asset.purchaseDate || null,
        asset.buyPrice || null,
        asset.warrantyExpiryDate || asset.warrantyEndDate || null,
        asset.lifeSpan || null,
        asset.outOfBoxOs || null,
        asset.assignedEmployeeId || null,
        asset.cpu || null,
        asset.ram || null,
        asset.storage || null
      ];

      const result = await pool.query(query, values);
      console.log('Asset created successfully:', result.rows[0]);
      return result.rows[0] as Asset;
    } catch (error) {
      console.error('Error creating asset:', error);
      throw error;
    }
  }

  async updateAsset(id: number, assetData: Partial<InsertAsset>): Promise<Asset | undefined> {
    try {
      // Convert numeric buyPrice to string for database storage
      const processedData: any = {
        ...assetData,
        updatedAt: new Date()
      };
      
      // Handle buyPrice conversion if present
      if (assetData.buyPrice !== undefined) {
        processedData.buyPrice = typeof assetData.buyPrice === 'number' ? assetData.buyPrice.toString() : assetData.buyPrice;
      }
      
      const [updatedAsset] = await db
        .update(assets)
        .set(processedData)
        .where(eq(assets.id, id))
        .returning();
      return updatedAsset;
    } catch (error) {
      console.error('Error updating asset:', error);
      return undefined;
    }
  }

  async deleteAsset(id: number): Promise<boolean> {
    try {
      const result = await db.delete(assets).where(eq(assets.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting asset:', error);
      return false;
    }
  }

  async getAllAssets(): Promise<Asset[]> {
    try {
      return await db.select().from(assets).orderBy(asc(assets.id));
    } catch (error) {
      console.error('Error fetching assets:', error);
      return [];
    }
  }

  async getAssetsByStatus(status: string): Promise<Asset[]> {
    try {
      return await db.select().from(assets).where(eq(assets.status, status)).orderBy(asc(assets.assetId));
    } catch (error) {
      console.error(`Error fetching assets with status ${status}:`, error);
      return [];
    }
  }

  async getAssetsByType(type: string): Promise<Asset[]> {
    try {
      return await db.select().from(assets).where(eq(assets.type, type)).orderBy(asc(assets.assetId));
    } catch (error) {
      console.error(`Error fetching assets with type ${type}:`, error);
      return [];
    }
  }

  async getAssetsForEmployee(employeeId: number): Promise<Asset[]> {
    try {
      return await db
        .select()
        .from(assets)
        .where(eq(assets.assignedEmployeeId, employeeId))
        .orderBy(asc(assets.assetId));
    } catch (error) {
      console.error(`Error fetching assets for employee ${employeeId}:`, error);
      return [];
    }
  }

  // Asset Maintenance operations
  async createAssetMaintenance(maintenance: InsertAssetMaintenance): Promise<AssetMaintenance> {
    try {
      const [newMaintenance] = await db
        .insert(assetMaintenance)
        .values([maintenance])
        .returning();
      return newMaintenance;
    } catch (error) {
      console.error('Error creating asset maintenance record:', error);
      throw error;
    }
  }

  async getMaintenanceForAsset(assetId: number): Promise<AssetMaintenance[]> {
    try {
      return await db
        .select()
        .from(assetMaintenance)
        .where(eq(assetMaintenance.assetId, assetId))
        .orderBy(desc(assetMaintenance.date));
    } catch (error) {
      console.error(`Error fetching maintenance records for asset ${assetId}:`, error);
      return [];
    }
  }

  async getAssetMaintenanceById(id: number): Promise<AssetMaintenance | undefined> {
    try {
      const result = await db.select().from(assetMaintenance)
        .where(eq(assetMaintenance.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error(`Error fetching maintenance record ${id}:`, error);
      return undefined;
    }
  }

  async updateAssetMaintenance(id: number, maintenanceData: Partial<InsertAssetMaintenance>): Promise<AssetMaintenance | undefined> {
    try {
      const result = await db.update(assetMaintenance)
        .set({
          ...maintenanceData,
          updatedAt: new Date()
        })
        .where(eq(assetMaintenance.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error(`Error updating maintenance record ${id}:`, error);
      return undefined;
    }
  }

  async deleteAssetMaintenance(id: number): Promise<boolean> {
    try {
      const result = await db.delete(assetMaintenance).where(eq(assetMaintenance.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error(`Error deleting maintenance record ${id}:`, error);
      return false;
    }
  }

  async getAllMaintenanceRecords(): Promise<AssetMaintenance[]> {
    try {
      return await db.select().from(assetMaintenance)
        .orderBy(desc(assetMaintenance.date));
    } catch (error) {
      console.error('Error fetching all maintenance records:', error);
      return [];
    }
  }

  // Asset Sales operations
  async createAssetSale(sale: InsertAssetSale): Promise<AssetSale> {
    try {
      const [newSale] = await db
        .insert(assetSales)
        .values(sale)
        .returning();
      return newSale;
    } catch (error) {
      console.error('Error creating asset sale:', error);
      throw error;
    }
  }

  async addAssetToSale(saleItem: InsertAssetSaleItem): Promise<AssetSaleItem> {
    try {
      const [newSaleItem] = await db
        .insert(assetSaleItems)
        .values(saleItem)
        .returning();
      return newSaleItem;
    } catch (error) {
      console.error('Error adding asset to sale:', error);
      throw error;
    }
  }

  async getAssetSales(): Promise<AssetSale[]> {
    try {
      // Get all sales with their items
      const sales = await db
        .select()
        .from(assetSales)
        .orderBy(desc(assetSales.date));

      // For each sale, get the associated items
      const results = await Promise.all(
        sales.map(async (sale) => {
          const items = await db
            .select()
            .from(assetSaleItems)
            .where(eq(assetSaleItems.saleId, sale.id));

          return {
            ...sale,
            items,
          };
        })
      );

      return results;
    } catch (error) {
      console.error('Error fetching asset sales:', error);
      return [];
    }
  }

  // Ticket operations
  async getTicket(id: number): Promise<Ticket | undefined> {
    try {
      console.log(`[GET TICKET] Looking for ticket with ID: ${id} (type: ${typeof id})`);
      
      // First, let's try a simple query without joins to see if we can find the ticket
      console.log(`[GET TICKET] Trying simple query first...`);
      const simpleResult = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
      console.log(`[GET TICKET] Simple query result:`, simpleResult);
      
      if (simpleResult.length === 0) {
        console.log(`[GET TICKET] No ticket found with ID ${id}`);
        return undefined;
      }
      
      // Now try the full query with joins
      const [ticket] = await db
        .select({
          id: tickets.id,
          ticketId: tickets.ticketId,
          submittedById: tickets.submittedById,
          assignedToId: tickets.assignedToId,
          relatedAssetId: tickets.relatedAssetId,
          type: tickets.type,
          categoryId: tickets.categoryId,
          category: sql<string>`COALESCE(${categories.name}, 'General')`.as('category'),
          priority: tickets.priority,
          urgency: tickets.urgency,
          impact: tickets.impact,
          title: tickets.title,
          description: tickets.description,
          resolution: tickets.resolution,
          status: tickets.status,
          createdAt: tickets.createdAt,
          updatedAt: tickets.updatedAt,
          completionTime: tickets.completionTime,
          timeSpent: tickets.timeSpent,
          dueDate: tickets.dueDate,
        })
        .from(tickets)
        .leftJoin(categories, eq(tickets.categoryId, categories.id))
        .where(eq(tickets.id, id))
        .limit(1);
      console.log(`[GET TICKET] Full query result:`, ticket);
      return ticket;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      return undefined;
    }
  }

  async getTicketByTicketId(ticketId: string): Promise<Ticket | undefined> {
    try {
      const [ticket] = await db.select().from(tickets).where(eq(tickets.ticketId, ticketId));
      return ticket;
    } catch (error) {
      console.error('Error fetching ticket by ticketId:', error);
      return undefined;
    }
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    try {
      // Auto-calculate priority based on urgency and impact
      const urgency = ticket.urgency || 'Medium';
      const impact = ticket.impact || 'Medium';
      const calculatedPriority = calculatePriority(urgency, impact);

      const safeData = {
        submittedById: ticket.submittedById,
        assignedToId: ticket.assignedToId || null,
        relatedAssetId: ticket.relatedAssetId || null,
        type: ticket.type || 'Incident',
        categoryId: ticket.categoryId || null,
        priority: calculatedPriority,
        urgency: urgency,
        impact: impact,
        title: (ticket.title || 'New Ticket').substring(0, 255),
        description: ticket.description || '',
        resolution: ticket.resolution || null,
        status: ticket.status || 'Open',
        timeSpent: ticket.timeSpent || null,
        dueDate: ticket.dueDate || null,
        slaTarget: ticket.slaTarget || null,
      };

      // Let database auto-generate ticket_id using the sequence
      const result = await pool.query(`
        INSERT INTO tickets (
          submitted_by_id, assigned_to_id, related_asset_id,
          type, category_id, priority, urgency, impact,
          title, description, resolution, status,
          time_spent, due_date, sla_target,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          NOW(), NOW()
        ) RETURNING *
      `, [
        safeData.submittedById,
        safeData.assignedToId,
        safeData.relatedAssetId,
        safeData.type,
        safeData.categoryId,
        safeData.priority,
        safeData.urgency,
        safeData.impact,
        safeData.title,
        safeData.description,
        safeData.resolution,
        safeData.status,
        safeData.timeSpent,
        safeData.dueDate,
        safeData.slaTarget
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  }

  async createTicketWithHistory(ticket: InsertTicket): Promise<Ticket> {
    try {
      // Create the ticket first
      const newTicket = await this.createTicket(ticket);
      
      // Create initial history entry (note: in production this would use proper ticket history table)
      // For now, we'll just return the ticket as the enhanced creation is working
      return newTicket;
    } catch (error) {
      console.error('Error creating ticket with history:', error);
      throw error;
    }
  }

  async updateTicket(id: number, ticketData: Partial<InsertTicket>): Promise<Ticket | undefined> {
    try {
      // If urgency or impact is being updated, recalculate priority
      let updatedData = { ...ticketData };
      
      // Check if urgency or impact is being changed
      if (ticketData.urgency || ticketData.impact) {
        // Get current ticket to retrieve existing urgency/impact values
        const currentTicket = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
        
        if (currentTicket.length > 0) {
          const current = currentTicket[0];
          const newUrgency = (ticketData.urgency || current.urgency) as UrgencyLevel;
          const newImpact = (ticketData.impact || current.impact) as ImpactLevel;
          
          // Recalculate priority
          const calculatedPriority = calculatePriority(newUrgency, newImpact);
          updatedData.priority = calculatedPriority;
          
          console.log('Priority recalculated for ticket update:', { 
            ticketId: id, 
            urgency: newUrgency, 
            impact: newImpact, 
            newPriority: calculatedPriority 
          });
        }
      }
      
      // Update only permitted fields
      const [updatedTicket] = await db
        .update(tickets)
        .set({ ...updatedData, updatedAt: new Date() })
        .where(eq(tickets.id, id))
        .returning();
      return updatedTicket;
    } catch (error) {
      console.error('Error updating ticket:', error);
      return undefined;
    }
  }

async deleteTicket(id: number, userId: number): Promise<boolean> {
  try {
    // First check if ticket exists
    const existingTicket = await this.getTicket(id);
    
    if (!existingTicket) {
      return false;
    }

    // Use a transaction to ensure all deletions succeed or fail together
    const result = await db.transaction(async (tx) => {
      // Delete ticket comments first
      await tx.delete(ticketComments).where(eq(ticketComments.ticketId, id));
      
      // Delete ticket history
      await tx.delete(ticketHistory).where(eq(ticketHistory.ticketId, id));
      
      // Now delete the ticket itself
      const ticketResult = await tx.delete(tickets).where(eq(tickets.id, id));
      
      return ticketResult;
    });
    
    // Log the deletion activity
    await this.logActivity({
      action: "Deleted",
      entityType: "Ticket",
      entityId: id,
      userId,
      details: { ticketId: existingTicket.ticketId, title: existingTicket.title }
    });
    
    const success = result.rowCount ? result.rowCount > 0 : false;
    
    return success;
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return false;
  }
}

  async getAllTickets(): Promise<Ticket[]> {
    try {
      const result = await db
        .select({
          id: tickets.id,
          ticketId: tickets.ticketId,
          submittedById: tickets.submittedById,
          assignedToId: tickets.assignedToId,
          relatedAssetId: tickets.relatedAssetId,
          type: tickets.type,
          categoryId: tickets.categoryId,
          category: sql<string>`COALESCE(${categories.name}, 'General')`.as('category'), // Category name for backward compatibility
          priority: tickets.priority,
          urgency: tickets.urgency,
          impact: tickets.impact,
          title: tickets.title,
          description: tickets.description,
          resolution: tickets.resolution,
          status: tickets.status,
          createdAt: tickets.createdAt,
          updatedAt: tickets.updatedAt,
          completionTime: tickets.completionTime,
          timeSpent: tickets.timeSpent,
          dueDate: tickets.dueDate,
        })
        .from(tickets)
        .leftJoin(categories, eq(tickets.categoryId, categories.id))
        .orderBy(desc(tickets.createdAt));
      
      return result;
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return [];
    }
  }

  async getTicketsByStatus(status: string | string[]): Promise<Ticket[]> {
    try {
      if (Array.isArray(status)) {
        const result = await pool.query(`
          SELECT * FROM tickets 
          WHERE status = ANY($1::text[])
          ORDER BY created_at DESC
        `, [status]);
        return result.rows;
      } else {
        const result = await pool.query(`
          SELECT * FROM tickets 
          WHERE status = $1
          ORDER BY created_at DESC
        `, [status]);
        return result.rows;
      }
    } catch (error) {
      console.error('Error fetching tickets by status:', error);
      return [];
    }
  }

  async getTicketsForEmployee(employeeId: number): Promise<Ticket[]> {
    try {
      return await db
        .select()
        .from(tickets)
        .where(eq(tickets.submittedById, employeeId))
        .orderBy(desc(tickets.createdAt));
    } catch (error) {
      console.error(`Error fetching tickets for employee ${employeeId}:`, error);
      return [];
    }
  }

  async getTicketsAssignedToUser(userId: number): Promise<Ticket[]> {
    try {
      return await db
        .select()
        .from(tickets)
        .where(eq(tickets.assignedToId, userId))
        .orderBy(desc(tickets.createdAt));
    } catch (error) {
      console.error(`Error fetching tickets assigned to user ${userId}:`, error);
      return [];
    }
  }

  // System Config operations
  async getSystemConfig(): Promise<SystemConfig | undefined> {
    try {
      const configs = await db.select().from(systemConfig);
      
      // Return the first config if it exists
      if (configs.length > 0) {
        return configs[0];
      }
      
      // Otherwise, create a default config
      const [newConfig] = await db
        .insert(systemConfig)
        .values({
          language: 'English',
          assetIdPrefix: 'SIT-',
          currency: 'USD'
        })
        .returning();
      
      return newConfig;
    } catch (error) {
      console.error('Error fetching system config:', error);
      return undefined;
    }
  }

  async updateSystemConfig(config: Partial<InsertSystemConfig>): Promise<SystemConfig | undefined> {
    try {
      const configs = await db.select().from(systemConfig);
      
      // Insert if it doesn't exist
      if (configs.length === 0) {
        const [newConfig] = await db
          .insert(systemConfig)
          .values({
            language: config.language || 'English',
            assetIdPrefix: config.assetIdPrefix || 'SIT-',
            currency: config.currency || 'USD',
            ...config
          })
          .returning();
        return newConfig;
      } else {
        // Update if it exists
        const [updatedConfig] = await db
          .update(systemConfig)
          .set({ ...config, updatedAt: new Date() })
          .where(eq(systemConfig.id, configs[0].id))
          .returning();
        return updatedConfig;
      }
    } catch (error) {
      console.error('Error updating system config:', error);
      return undefined;
    }
  }

  // Activity Log operations
  async logActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    try {
      const [newActivity] = await db
        .insert(activityLog)
        .values(activity)
        .returning();
      return newActivity;
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  }

  async getRecentActivity(limit: number): Promise<ActivityLog[]> {
    try {
      return await db
        .select()
        .from(activityLog)
        .orderBy(desc(activityLog.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }
  
  async getActivityLogs(options: {
    page?: number;
    limit?: number;
    filter?: string;
    entityType?: string;
    action?: string;
    userId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    data: ActivityLog[];
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    }
  }> {
    try {
      const {
        page = 1,
        limit = 20,
        filter,
        entityType,
        action,
        userId,
        startDate,
        endDate
      } = options;
      
      // Start with a base query
      let query = db.select().from(activityLog);
      
      // Add filters
      if (filter) {
        query = query.where(
          or(
            sql`${activityLog.details}::text ILIKE ${`%${filter}%`}`,
            sql`${activityLog.action} ILIKE ${`%${filter}%`}`,
            sql`${activityLog.entityType} ILIKE ${`%${filter}%`}`
          )
        );
      }
      
      if (action) {
        query = query.where(eq(activityLog.action, action));
      }
      
      if (entityType) {
        query = query.where(eq(activityLog.entityType, entityType));
      }
      
      if (userId) {
        query = query.where(eq(activityLog.userId, userId));
      }
      
      if (startDate) {
        query = query.where(gte(activityLog.createdAt, startDate));
      }
      
      if (endDate) {
        // Add one day to include the end date in the range
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        query = query.where(lt(activityLog.createdAt, nextDay));
      }
      
      // Get total count for pagination
      const countQuery = db.select({ count: sql<number>`count(*)` }).from(activityLog);
      
      // Apply the same filters to the count query
      if (filter) {
        countQuery.where(
          or(
            sql`${activityLog.details}::text ILIKE ${`%${filter}%`}`,
            sql`${activityLog.action} ILIKE ${`%${filter}%`}`,
            sql`${activityLog.entityType} ILIKE ${`%${filter}%`}`
          )
        );
      }
      
      if (action) {
        countQuery.where(eq(activityLog.action, action));
      }
      
      if (entityType) {
        countQuery.where(eq(activityLog.entityType, entityType));
      }
      
      if (userId) {
        countQuery.where(eq(activityLog.userId, userId));
      }
      
      if (startDate) {
        countQuery.where(gte(activityLog.createdAt, startDate));
      }
      
      if (endDate) {
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        countQuery.where(lt(activityLog.createdAt, nextDay));
      }
      
      const countResult = await countQuery;
      const totalItems = Number(countResult[0]?.count || 0);
      
      // Add pagination
      const offset = (page - 1) * limit;
      
      // Get results with order and pagination
      const data = await query
        .orderBy(desc(activityLog.createdAt))
        .limit(limit)
        .offset(offset);
      
      return {
        data,
        pagination: {
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          currentPage: page,
          pageSize: limit
        }
      };
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      return {
        data: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: page || 1,
          pageSize: limit || 20
        }
      };
    }
  }
  
  /**
   * Clear audit logs based on filter criteria
   * @param options Optional filter criteria
   * @returns Number of deleted audit log entries
   */
  async clearActivityLogs(options?: {
    olderThan?: Date;
    entityType?: string;
    action?: string;
  }): Promise<number> {
    try {
      // Build delete query
      let deleteQuery = db.delete(activityLog);
      
      // Apply filters if provided
      if (options) {
        if (options.olderThan) {
          deleteQuery = deleteQuery.where(
            lt(activityLog.createdAt, options.olderThan)
          );
        }
        
        if (options.entityType) {
          deleteQuery = deleteQuery.where(
            eq(activityLog.entityType, options.entityType)
          );
        }
        
        if (options.action) {
          deleteQuery = deleteQuery.where(
            eq(activityLog.action, options.action)
          );
        }
      }
      
      // Execute the query
      const result = await deleteQuery;
      
      return result.rowCount || 0;
    } catch (error) {
      console.error("Error clearing activity logs:", error);
      throw error;
    }
  }
  
  async getActivityLogsCount(options: {
    filter?: string;
    action?: string;
    entityType?: string;
    userId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    try {
      const {
        filter,
        action,
        entityType,
        userId,
        startDate,
        endDate
      } = options;
      
      // Start with a base query
      let query = db.select({ count: sql<number>`count(*)` }).from(activityLog);
      
      // Add filters
      if (filter) {
        query = query.where(
          or(
            sql`${activityLog.details}::text ILIKE ${`%${filter}%`}`,
            sql`${activityLog.action} ILIKE ${`%${filter}%`}`,
            sql`${activityLog.entityType} ILIKE ${`%${filter}%`}`
          )
        );
      }
      
      if (action) {
        query = query.where(eq(activityLog.action, action));
      }
      
      if (entityType) {
        query = query.where(eq(activityLog.entityType, entityType));
      }
      
      if (userId) {
        query = query.where(eq(activityLog.userId, userId));
      }
      
      if (startDate) {
        query = query.where(gte(activityLog.createdAt, startDate));
      }
      
      if (endDate) {
        // Add one day to include the end date in the range
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        query = query.where(lt(activityLog.createdAt, nextDay));
      }
      
      // Get count
      const result = await query;
      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error('Error counting activity logs:', error);
      return 0;
    }
  }

  // Custom Asset Types
  async getCustomAssetTypes(): Promise<any[]> {
    try {
      const types = await db.select().from(customAssetTypes).orderBy(asc(customAssetTypes.name));
      return types;
    } catch (error) {
      console.error('Error fetching custom asset types:', error);
      return [];
    }
  }

  async createCustomAssetType(data: { name: string; description?: string }): Promise<any> {
    try {
      const [newType] = await db.insert(customAssetTypes)
        .values({
          name: data.name,
          description: data.description || null
        })
        .returning();
      return newType;
    } catch (error) {
      console.error('Error creating custom asset type:', error);
      throw error;
    }
  }

  async updateCustomAssetType(id: number, data: { name: string; description?: string }): Promise<any | undefined> {
    try {
      const [updated] = await db.update(customAssetTypes)
        .set({
          name: data.name,
          description: data.description,
          updatedAt: new Date()
        })
        .where(eq(customAssetTypes.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating custom asset type:', error);
      return undefined;
    }
  }

  async deleteCustomAssetType(id: number): Promise<boolean> {
    try {
      const result = await db.delete(customAssetTypes).where(eq(customAssetTypes.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting custom asset type:', error);
      return false;
    }
  }

  // Custom Asset Brands
  async getCustomAssetBrands(): Promise<any[]> {
    try {
      const brands = await db.select().from(customAssetBrands).orderBy(asc(customAssetBrands.name));
      return brands;
    } catch (error) {
      console.error('Error fetching custom asset brands:', error);
      return [];
    }
  }

  async createCustomAssetBrand(data: { name: string; description?: string }): Promise<any> {
    try {
      const [newBrand] = await db.insert(customAssetBrands)
        .values({
          name: data.name,
          description: data.description || null
        })
        .returning();
      return newBrand;
    } catch (error) {
      console.error('Error creating custom asset brand:', error);
      throw error;
    }
  }

  async updateCustomAssetBrand(id: number, data: { name: string; description?: string }): Promise<any | undefined> {
    try {
      const [updated] = await db.update(customAssetBrands)
        .set({
          name: data.name,
          description: data.description,
          updatedAt: new Date()
        })
        .where(eq(customAssetBrands.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating custom asset brand:', error);
      return undefined;
    }
  }

  async deleteCustomAssetBrand(id: number): Promise<boolean> {
    try {
      const result = await db.delete(customAssetBrands).where(eq(customAssetBrands.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting custom asset brand:', error);
      return false;
    }
  }

  // Custom Asset Statuses
  async getCustomAssetStatuses(): Promise<any[]> {
    try {
      const statuses = await db.select().from(customAssetStatuses).orderBy(asc(customAssetStatuses.name));
      return statuses;
    } catch (error) {
      console.error('Error fetching custom asset statuses:', error);
      return [];
    }
  }

  async createCustomAssetStatus(data: { name: string; description?: string; color?: string }): Promise<any> {
    try {
      const [newStatus] = await db.insert(customAssetStatuses)
        .values({
          name: data.name,
          description: data.description || null,
          color: data.color || '#6b7280' // Default gray color
        })
        .returning();
      return newStatus;
    } catch (error) {
      console.error('Error creating custom asset status:', error);
      throw error;
    }
  }

  async updateCustomAssetStatus(id: number, data: { name: string; description?: string; color?: string }): Promise<any | undefined> {
    try {
      const [updated] = await db.update(customAssetStatuses)
        .set({
          name: data.name,
          description: data.description,
          color: data.color,
          updatedAt: new Date()
        })
        .where(eq(customAssetStatuses.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating custom asset status:', error);
      return undefined;
    }
  }

  async deleteCustomAssetStatus(id: number): Promise<boolean> {
    try {
      const result = await db.delete(customAssetStatuses).where(eq(customAssetStatuses.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting custom asset status:', error);
      return false;
    }
  }

  // Asset Status operations (flexible status system)
  async getAssetStatuses(): Promise<AssetStatus[]> {
    try {
      const statuses = await db.select().from(assetStatuses).orderBy(asc(assetStatuses.name));
      return statuses;
    } catch (error) {
      console.error('Error fetching asset statuses:', error);
      return [];
    }
  }

  async createAssetStatus(data: InsertAssetStatus): Promise<AssetStatus> {
    try {
      const [newStatus] = await db.insert(assetStatuses)
        .values(data)
        .returning();
      return newStatus;
    } catch (error) {
      console.error('Error creating asset status:', error);
      throw error;
    }
  }

  async updateAssetStatus(id: number, data: Partial<InsertAssetStatus>): Promise<AssetStatus | undefined> {
    try {
      const [updated] = await db.update(assetStatuses)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(assetStatuses.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating asset status:', error);
      return undefined;
    }
  }

  async deleteAssetStatus(id: number): Promise<boolean> {
    try {
      const result = await db.delete(assetStatuses).where(eq(assetStatuses.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting asset status:', error);
      return false;
    }
  }

  async getAssetStatusByName(name: string): Promise<AssetStatus | undefined> {
    try {
      const [status] = await db.select().from(assetStatuses).where(eq(assetStatuses.name, name));
      return status;
    } catch (error) {
      console.error('Error fetching asset status by name:', error);
      return undefined;
    }
  }

  async ensureAssetStatus(name: string, color?: string): Promise<AssetStatus> {
    try {
      // Try to get existing status
      const existing = await this.getAssetStatusByName(name);
      if (existing) {
        return existing;
      }

      // Create new status if it doesn't exist
      const newStatusData: InsertAssetStatus = {
        name,
        color: color || '#6b7280', // Default gray color
        isDefault: false,
        description: `Custom status: ${name}`
      };

      return await this.createAssetStatus(newStatusData);
    } catch (error) {
      console.error('Error ensuring asset status:', error);
      throw error;
    }
  }

  // Asset Transaction operations
  async createAssetTransaction(transaction: InsertAssetTransaction): Promise<AssetTransaction> {
    try {
      // If deviceSpecs not provided, capture current asset specifications
      let transactionWithSpecs = transaction;
      if (!transaction.deviceSpecs && transaction.assetId) {
        const asset = await this.getAsset(transaction.assetId);
        if (asset) {
          transactionWithSpecs = {
            ...transaction,
            deviceSpecs: {
              serialNumber: asset.serialNumber,
              condition: asset.status,
              operatingSystem: asset.outOfBoxOs,
              processor: asset.specs?.includes('Processor:') ? 
                asset.specs.split('Processor:')[1]?.split('\n')[0]?.trim() : undefined,
              ram: asset.specs?.includes('RAM:') ? 
                asset.specs.split('RAM:')[1]?.split('\n')[0]?.trim() : undefined,
              storage: asset.specs?.includes('Storage:') ? 
                asset.specs.split('Storage:')[1]?.split('\n')[0]?.trim() : undefined,
              location: asset.specs?.includes('Location:') ? 
                asset.specs.split('Location:')[1]?.split('\n')[0]?.trim() : undefined,
              status: asset.status
            }
          };
        }
      }

      const [newTransaction] = await db
        .insert(assetTransactions)
        .values(transactionWithSpecs)
        .returning();
      return newTransaction;
    } catch (error) {
      console.error('Error creating asset transaction:', error);
      throw error;
    }
  }

  async getAssetTransactions(assetId: number): Promise<AssetTransaction[]> {
    try {
      // Use SQL query with joins for consistency with getAllAssetTransactions
      const query = `
        SELECT 
          at.*,
          a.asset_id as asset_asset_id,
          a.type as asset_type,
          a.brand as asset_brand,
          a.model_name as asset_model_name,
          a.serial_number as asset_serial_number,
          a.specs as asset_specs,
          a.status as asset_status,
          e.english_name as employee_english_name,
          e.arabic_name as employee_arabic_name,
          e.department as employee_department,
          e.emp_id as employee_emp_id
        FROM asset_transactions at
        LEFT JOIN assets a ON at.asset_id = a.id
        LEFT JOIN employees e ON at.employee_id = e.id
        WHERE at.asset_id = $1
        ORDER BY at.transaction_date DESC
      `;
      
      const result = await pool.query(query, [assetId]);
      
      // Map the results to include proper asset and employee objects
      return result.rows.map((row: any) => ({
        id: row.id,
        assetId: row.asset_id,
        type: row.type,
        employeeId: row.employee_id,
        transactionDate: row.transaction_date,
        expectedReturnDate: row.expected_return_date,
        actualReturnDate: row.actual_return_date,
        conditionNotes: row.condition_notes,
        handledById: row.handled_by_id,
        attachments: row.attachments,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deviceSpecs: row.device_specs,
        asset: row.asset_asset_id ? {
          id: row.asset_id,
          assetId: row.asset_asset_id,
          type: row.asset_type,
          brand: row.asset_brand,
          modelName: row.asset_model_name,
          serialNumber: row.asset_serial_number,
          specs: row.asset_specs,
          status: row.asset_status
        } : undefined,
        employee: row.employee_english_name ? {
          id: row.employee_id,
          englishName: row.employee_english_name,
          arabicName: row.employee_arabic_name,
          department: row.employee_department,
          empId: row.employee_emp_id
        } : undefined
      }));
    } catch (error) {
      console.error(`Error fetching transactions for asset ${assetId}:`, error);
      return [];
    }
  }

  async getEmployeeTransactions(employeeId: number): Promise<AssetTransaction[]> {
    try {
      // Use SQL query with joins for consistency with getAllAssetTransactions
      const query = `
        SELECT 
          at.*,
          a.asset_id as asset_asset_id,
          a.type as asset_type,
          a.brand as asset_brand,
          a.model_name as asset_model_name,
          a.serial_number as asset_serial_number,
          a.specs as asset_specs,
          a.status as asset_status,
          e.english_name as employee_english_name,
          e.arabic_name as employee_arabic_name,
          e.department as employee_department,
          e.emp_id as employee_emp_id
        FROM asset_transactions at
        LEFT JOIN assets a ON at.asset_id = a.id
        LEFT JOIN employees e ON at.employee_id = e.id
        WHERE at.employee_id = $1
        ORDER BY at.transaction_date DESC
      `;
      
      const result = await pool.query(query, [employeeId]);
      
      // Map the results to include proper asset and employee objects
      return result.rows.map((row: any) => ({
        id: row.id,
        assetId: row.asset_id,
        type: row.type,
        employeeId: row.employee_id,
        transactionDate: row.transaction_date,
        expectedReturnDate: row.expected_return_date,
        actualReturnDate: row.actual_return_date,
        conditionNotes: row.condition_notes,
        handledById: row.handled_by_id,
        attachments: row.attachments,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deviceSpecs: row.device_specs,
        asset: row.asset_asset_id ? {
          id: row.asset_id,
          assetId: row.asset_asset_id,
          type: row.asset_type,
          brand: row.asset_brand,
          modelName: row.asset_model_name,
          serialNumber: row.asset_serial_number,
          specs: row.asset_specs,
          status: row.asset_status
        } : undefined,
        employee: row.employee_english_name ? {
          id: row.employee_id,
          englishName: row.employee_english_name,
          arabicName: row.employee_arabic_name,
          department: row.employee_department,
          empId: row.employee_emp_id
        } : undefined
      }));
    } catch (error) {
      console.error(`Error fetching transactions for employee ${employeeId}:`, error);
      return [];
    }
  }

  async getAllAssetTransactions(): Promise<AssetTransaction[]> {
    try {
      // First, let's get the transactions using Drizzle ORM to ensure compatibility
      const transactions = await db
        .select()
        .from(assetTransactions)
        .orderBy(desc(assetTransactions.transactionDate));
        
      console.log('Drizzle ORM transactions count:', transactions.length);
      console.log('First transaction employee_id:', transactions[0]?.employeeId);
      
      // Now enhance with asset and employee details using the existing methods
      const result = await Promise.all(transactions.map(async (transaction) => {
        const asset = transaction.assetId 
          ? await this.getAsset(transaction.assetId) 
          : undefined;
          
        const employee = transaction.employeeId 
          ? await this.getEmployee(transaction.employeeId) 
          : undefined;
          
        console.log(`Transaction ${transaction.id}: employeeId=${transaction.employeeId}, employee fetched:`, employee?.englishName);
          
        return {
          ...transaction,
          asset,
          employee
        };
      }));
      
      console.log('getAllAssetTransactions final result sample:', result[0]);
      console.log('Employee data for first transaction (final):', result[0]?.employee);
      
      return result;
    } catch (error) {
      console.error('Error fetching all asset transactions:', error);
      return [];
    }
  }

  async checkOutAsset(assetId: number, employeeId: number, notes?: string, type: string = 'Check-Out',handledById?: number, deviceSpecs?: any): Promise<AssetTransaction> {
    try {
      // First update the asset to set employeeId
      await this.updateAsset(assetId, { 
        assignedEmployeeId: employeeId,
        status: 'In Use'
      });
      
      // Create transaction record with device specs
      const transaction = await this.createAssetTransaction({
        type: type as any,
        assetId,
        employeeId,
        handledById, 
        transactionDate: new Date(),
        conditionNotes: notes || null,
        deviceSpecs
      });
        
      return transaction;
    } catch (error) {
      console.error('Error checking out asset:', error);
      throw error;
    }
  }

  async checkInAsset(assetId: number, notes?: string, type: string = 'Check-In',handledById?: number,deviceSpecs?: any): Promise<AssetTransaction> {
    try {
      // Get asset to determine employee
      const asset = await this.getAsset(assetId);
      if (!asset) {
        throw new Error('Asset not found');
      }
      
      const employeeId = asset.assignedEmployeeId;
      
      // Update asset to remove employee and set status to Available
      await this.updateAsset(assetId, { 
        assignedEmployeeId: null,
        status: 'Available'
      });
      
      // Create transaction record with device specs
      const transaction = await this.createAssetTransaction({
        type: type as any,
        assetId,
        employeeId, // Keep track of who returned it
        handledById,
        transactionDate: new Date(),
        actualReturnDate: new Date(),
        conditionNotes: notes || null,
        deviceSpecs
      });
        
      return transaction;
    } catch (error) {
      console.error('Error checking in asset:', error);
      throw error;
    }
  }

  // Helper method to assign an asset to an employee for testing
  async assignAssetToEmployee(assetId: number, employeeId: number): Promise<Asset | undefined> {
    try {
      console.log(`Assigning asset ${assetId} to employee ${employeeId}`);
      return await this.updateAsset(assetId, {
        assignedEmployeeId: employeeId,
        status: 'In Use'
      });
    } catch (error) {
      console.error('Error assigning asset to employee:', error);
      throw error;
    }
  }



  async addTimeEntry(ticketId: number, hours: number, description: string, userId: number): Promise<any> {
    try {
      const timeEntry = {
        id: this.timeEntries.length + 1,
        ticketId,
        userId,
        hours,
        description,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.timeEntries.push(timeEntry);
      
      // Update ticket's actual hours
      const ticket = this.tickets.find(t => t.id === ticketId);
      if (ticket) {
        ticket.actualHours = (ticket.actualHours || 0) + hours;
        ticket.lastActivityAt = new Date();
      }
      
      return timeEntry;
    } catch (error) {
      console.error('Error adding time entry:', error);
      throw error;
    }
  }

  // Categories operations
  async getCategories(): Promise<Category[]> {
    try {
      const result = await db.select().from(categories).orderBy(categories.name);
      return result;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  async getAllCategories(): Promise<Category[]> {
    return this.getCategories();
  }

  async createCategory(data: any): Promise<any> {
    const [result] = await db.insert(categories).values(data).returning();
    return result;
  }

  async updateCategory(id: number, data: any): Promise<any | null> {
    const [result] = await db.update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return result || null;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount > 0;
  }

  private async initializeDefaultAssetStatuses(): Promise<void> {
    const defaultAssetStatuses = [
      { name: 'Available', description: 'Asset is ready for assignment', color: '#22c55e' },
      { name: 'In Use', description: 'Asset is currently assigned and active', color: '#3b82f6' },
      { name: 'Under Maintenance', description: 'Asset is being serviced or repaired', color: '#f59e0b' },
      { name: 'Damaged', description: 'Asset requires repair or replacement', color: '#ef4444' },
      { name: 'Retired', description: 'Asset is at end of life, no longer in use', color: '#6b7280' },
      { name: 'Lost', description: 'Asset cannot be located', color: '#dc2626' },
      { name: 'Sold', description: 'Asset has been sold', color: '#8b5cf6' }
    ];

    try {
      for (const assetStatus of defaultAssetStatuses) {
        await db.insert(customAssetStatuses)
          .values(assetStatus)
          .onConflictDoNothing();
      }
      console.log('Default asset statuses initialized successfully');
    } catch (error) {
      console.error('Error initializing default asset statuses:', error);
    }
  }

  // Ticket History operations
  async getTicketHistory(ticketId: number): Promise<any[]> {
    try {
      const result = await pool.query(`
        SELECT th.*, u.username
        FROM ticket_history th
        LEFT JOIN users u ON th.user_id = u.id
        WHERE th.ticket_id = $1
        ORDER BY th.created_at DESC
      `, [ticketId]);
      
      return result.rows.map(row => ({
        id: row.id,
        ticketId: row.ticket_id,
        userId: row.user_id,
        action: row.action,
        fieldChanged: row.field_changed,
        oldValue: row.old_value,
        newValue: row.new_value,
        notes: row.notes,
        createdAt: row.created_at,
        user: {
          id: row.user_id,
          username: row.username,
          firstName: null,
          lastName: null
        }
      }));
    } catch (error) {
      console.error('Error fetching ticket history:', error);
      return [];
    }
  }

  async addTicketHistory(historyData: any): Promise<any> {
    try {
      const result = await pool.query(`
        INSERT INTO ticket_history (ticket_id, user_id, action, field_changed, old_value, new_value, notes, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `, [
        historyData.ticketId,
        historyData.userId,
        historyData.action,
        historyData.fieldChanged || null,
        historyData.oldValue || null,
        historyData.newValue || null,
        historyData.notes || null
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error adding ticket history:', error);
      throw error;
    }
  }

  // Ticket Comments operations
  async getTicketComments(ticketId: number): Promise<any[]> {
    try {
      const result = await pool.query(`
        SELECT tc.*, u.username
        FROM ticket_comments tc
        LEFT JOIN users u ON tc.user_id = u.id
        WHERE tc.ticket_id = $1
        ORDER BY tc.created_at ASC
      `, [ticketId]);
      
      return result.rows.map(row => ({
        id: row.id,
        ticketId: row.ticket_id,
        userId: row.user_id,
        content: row.content,
        isPrivate: row.is_private,
        attachments: row.attachments || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        user: {
          id: row.user_id,
          username: row.username,
          firstName: null,
          lastName: null
        }
      }));
    } catch (error) {
      console.error('Error fetching ticket comments:', error);
      return [];
    }
  }

  async addTicketComment(commentData: any): Promise<any> {
    try {
      const result = await pool.query(`
        INSERT INTO ticket_comments (ticket_id, user_id, content, is_private, attachments)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        commentData.ticketId,
        commentData.userId,
        commentData.content,
        commentData.isPrivate || false,
        commentData.attachments || []
      ]);

      // Update ticket's last activity
      await pool.query(`
        UPDATE tickets 
        SET updated_at = NOW() 
        WHERE id = $1
      `, [commentData.ticketId]);

      // Add to history
      await this.addTicketHistory({
        ticketId: commentData.ticketId,
        userId: commentData.userId,
        action: "Comment Added",
        notes: commentData.isPrivate ? "Private comment added" : "Public comment added"
      });
      
      return result.rows[0];
    } catch (error) {
      console.error('Error adding ticket comment:', error);
      throw error;
    }
  }

  // Enhanced ticket update with history tracking
  async updateTicketWithHistory(id: number, ticketData: Partial<InsertTicket>, userId: number): Promise<Ticket | undefined> {
    try {
      console.log('Updating ticket with data:', { id, ticketData, userId });
      
      // Get current ticket to track changes
      const [currentTicket] = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, id));

      if (!currentTicket) {
        console.log('Ticket not found:', id);
        return undefined;
      }

      // Track changes
      const changes: string[] = [];
      
      if (ticketData.status && ticketData.status !== currentTicket.status) {
        changes.push(`Status changed from "${currentTicket.status}" to "${ticketData.status}"`);
      }
      if (ticketData.priority && ticketData.priority !== currentTicket.priority) {
        changes.push(`Priority changed from "${currentTicket.priority}" to "${ticketData.priority}"`);
      }
      if (ticketData.assignedToId && ticketData.assignedToId !== currentTicket.assignedToId) {
        changes.push(`Assignment changed`);
      }
      if (ticketData.categoryId && ticketData.categoryId !== currentTicket.categoryId) {
        changes.push(`Category changed`);
      }

      // Prepare update data with proper field type handling
      const updateData = { ...ticketData };
      
      // Handle date fields properly - only convert actual date fields
      if (updateData.dueDate && typeof updateData.dueDate === 'string') {
        updateData.dueDate = new Date(updateData.dueDate);
      }
      
      // Handle slaTarget field properly - convert number to date or handle string dates
      if (updateData.slaTarget !== undefined) {
        if (typeof updateData.slaTarget === 'number') {
          // If it's a number, treat it as days from now
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + updateData.slaTarget);
          updateData.slaTarget = targetDate;
        } else if (typeof updateData.slaTarget === 'string') {
          // If it's a string, parse it as a date
          updateData.slaTarget = new Date(updateData.slaTarget);
        }
        // If it's already a Date object, leave it as is
      }
      
      // Remove any undefined values that could cause type errors
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });
      
      // Update the ticket
      const [updatedTicket] = await db
        .update(tickets)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(tickets.id, id))
        .returning();

      // Add history entries for changes
      if (changes.length > 0) {
        await this.addTicketHistory({
          ticketId: id,
          userId,
          action: "Updated",
          notes: changes.join("; ")
        });
      }

      return updatedTicket;
    } catch (error) {
      console.error('Error updating ticket with history:', error);
      throw error;
    }
  }

  async createAssetUpgrade(data: any): Promise<any> {
  try {
    const query = `
      INSERT INTO asset_upgrades (
        asset_id, title, description, category, upgrade_type, priority,
        scheduled_date, purchase_required, estimated_cost, justification,
        approved_by_id, approval_date, status, created_by_id, updated_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    
    const values = [
      data.assetId,
      data.title,
      data.description,
      data.category,
      data.upgradeType,
      data.priority,
      data.scheduledDate || null,
      data.purchaseRequired === true,  // Ensure boolean
      data.estimatedCost || null,
      data.justification || null,
      data.approvedById || null,
      data.approvalDate || null,
      data.status || 'Pending Approval',
      data.createdById || null,
      data.updatedById || null
    ];
    
    console.log('Creating asset upgrade with values:', values);
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating asset upgrade - detailed:', error);
    throw error;
  }
}

  async getAssetUpgrade(upgradeId: number): Promise<any> {
    try {
      const query = `
        SELECT 
          au.*,
          a.asset_id as asset_asset_id,
          a.type as asset_type,
          a.brand as asset_brand,
          a.model_name as asset_model_name,
          a.serial_number as asset_serial,
          creator.username as created_by_name,
          approver.english_name as approved_by_name
        FROM asset_upgrades au
        LEFT JOIN assets a ON au.asset_id = a.id
        LEFT JOIN users creator ON au.created_by_id = creator.id
        LEFT JOIN employees approver ON au.approved_by_id = approver.id
        WHERE au.id = $1
      `;
      
      const result = await pool.query(query, [upgradeId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        ...row,
        assetInfo: {
          assetId: row.asset_asset_id,
          type: row.asset_type,
          brand: row.asset_brand,
          modelName: row.asset_model_name,
          serialNumber: row.asset_serial
        },
        createdByName: row.created_by_name,
        approvedByName: row.approved_by_name
      };
    } catch (error) {
      console.error('Error fetching asset upgrade:', error);
      throw error;
    }
  }

  async getAllAssetUpgrades(): Promise<any[]> {
  try {
    const query = `
      SELECT 
        au.*,
        a.asset_id as asset_asset_id,
        a.type as asset_type,
        a.brand as asset_brand,
        a.model_name as asset_model_name,
        a.assigned_employee_id,
        creator.username as created_by_name,
        approver.english_name as approved_by_name,
        assigned_emp.english_name as assigned_employee_name,
        assigned_emp.emp_id as assigned_employee_id_code,
        assigned_emp.department as assigned_employee_department
      FROM asset_upgrades au
      LEFT JOIN assets a ON au.asset_id = a.id
      LEFT JOIN users creator ON au.created_by_id = creator.id
      LEFT JOIN employees approver ON au.approved_by_id = approver.id
      LEFT JOIN employees assigned_emp ON a.assigned_employee_id = assigned_emp.id
      ORDER BY au.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    return result.rows.map(row => ({
      ...row,
      assetInfo: {
        assetId: row.asset_asset_id,
        type: row.asset_type,
        brand: row.asset_brand,
        modelName: row.asset_model_name
      },
      createdByName: row.created_by_name,
      approvedByName: row.approved_by_name,
      assignedEmployee: row.assigned_employee_name ? {
        name: row.assigned_employee_name,
        employeeId: row.assigned_employee_id_code,
        department: row.assigned_employee_department
      } : null
    }));
  } catch (error) {
    console.error('Error fetching all asset upgrades:', error);
    throw error;
  }
}


  async addUpgradeHistory(upgradeId: number, userId: number, action: string, previousValue: string | null, newValue: string | null = null): Promise<void> {
    try {
      const query = `
        INSERT INTO upgrade_history (upgrade_id, user_id, action, previous_value, new_value)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      await pool.query(query, [upgradeId, userId, action, previousValue, newValue]);
    } catch (error) {
      console.error('Error adding upgrade history:', error);
      throw error;
    }
  }

  async getUpgradeHistory(upgradeId: number): Promise<any[]> {
    try {
      const query = `
        SELECT 
          uh.*,
          u.username,
          u.first_name,
          u.last_name
        FROM upgrade_history uh
        LEFT JOIN users u ON uh.user_id = u.id
        WHERE uh.upgrade_id = $1
        ORDER BY uh.timestamp DESC
      `;
      
      const result = await pool.query(query, [upgradeId]);
      
      return result.rows.map(row => ({
        ...row,
        userName: row.username,
        userFullName: `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.username
      }));
    } catch (error) {
      console.error('Error fetching upgrade history:', error);
      throw error;
    }
  }

}

// Use memory storage for development, PostgreSQL for production
import { MemoryStorage } from "./memory-storage";
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new MemoryStorage();