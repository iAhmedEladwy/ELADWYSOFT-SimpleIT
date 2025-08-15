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
  customAssetTypes, customAssetBrands, customAssetStatuses, customRequestTypes, serviceProviders, assetServiceProviders,
  assetStatuses, type AssetStatus, type InsertAssetStatus,
  notifications, type Notification, type InsertNotification,
  changesLog, type ChangeLog, type InsertChangeLog
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, like, desc, or, asc, gte, lt, sql } from "drizzle-orm";
import bcrypt from 'bcryptjs';

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
  CustomAssetStatus,
  ServiceProvider
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
  checkOutAsset(assetId: number, employeeId: number, notes?: string, type?: string): Promise<AssetTransaction>;
  checkInAsset(assetId: number, notes?: string, type?: string): Promise<AssetTransaction>;

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
  
  // Changes Log operations
  getChangesLog(options?: {
    version?: string;
    changeType?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: ChangeLog[];
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    }
  }>;
  createChangeLog(changeLog: InsertChangeLog): Promise<ChangeLog>;
  updateChangeLog(id: number, changeLog: Partial<InsertChangeLog>): Promise<ChangeLog | undefined>;
  deleteChangeLog(id: number): Promise<boolean>;
  
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
  
  getServiceProviders(): Promise<any[]>;
  createServiceProvider(data: { name: string; contactPerson?: string; phone?: string; email?: string }): Promise<any>;
  updateServiceProvider(id: number, data: { name: string; contactPerson?: string; phone?: string; email?: string }): Promise<any>;
  deleteServiceProvider(id: number): Promise<boolean>;
  
  // Custom Request Types operations (Feature 1: Change Category to Request Type)
  getCustomRequestTypes(): Promise<any[]>;
  getAllCustomRequestTypes(): Promise<any[]>;
  createCustomRequestType(requestType: any): Promise<any>;
  updateCustomRequestType(id: number, requestType: any): Promise<any | undefined>;
  deleteCustomRequestType(id: number): Promise<boolean>;
  
  // Enhanced Ticket operations with time tracking (Feature 2: Manual time tracking)
  startTicketTimeTracking(ticketId: number, userId: number): Promise<Ticket | undefined>;
  stopTicketTimeTracking(ticketId: number, userId: number): Promise<Ticket | undefined>;
  
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
  
  // Remove Demo Data
  removeDemoData(): Promise<void>;
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
      const [user] = await db.select().from(users).where(eq(users.id, numericId));
      return user;
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
        password: users.password,
        accessLevel: users.accessLevel,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      }).from(users).where(eq(users.username, username));
      return user ? this.mapUserFromDb(user) : undefined;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
  }

  async createUser(userData: any): Promise<User> {
    try {
      const hashedPassword = userData.password 
        ? await bcrypt.hash(userData.password, 10)
        : await bcrypt.hash('defaultPassword123', 10);

      // Map to database schema (snake_case columns)
      const dbUserData = {
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        accessLevel: this.roleToAccessLevel(userData.role || 'employee'),
        role: userData.role || 'employee',
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
      password: dbUser.password,
      role: dbUser.role || this.accessLevelToRole(dbUser.accessLevel || dbUser.access_level),
      firstName: null,
      lastName: null,
      profileImageUrl: null,
      employeeId: null,
      managerId: null,
      isActive: true,
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
        password: users.password,
        accessLevel: users.accessLevel,
        role: users.role,
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
          user_id, created_at, updated_at, name, email, phone, position
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
        // Backward compatibility fields
        name: emp.name || emp.english_name || 'Unknown',
        email: emp.email || emp.personal_email || emp.corporate_email,
        phone: emp.phone || emp.personal_mobile,
        position: emp.position || emp.title
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
      const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
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
      // Log the data being inserted to identify the problematic field
      console.log('Creating ticket with data:', {
        summary: ticket.summary?.length || 0,
        description: ticket.description?.length || 0,
        requestType: ticket.requestType?.length || 0,
        category: ticket.category?.length || 0,
        priority: ticket.priority,
        urgency: ticket.urgency?.length || 0,
        impact: ticket.impact?.length || 0,
        status: ticket.status
      });
      
      // Ensure field length limits are respected
      const safeData = {
        summary: (ticket.summary || 'Ticket').substring(0, 255),
        description: ticket.description || '',
        requestType: (ticket.requestType || 'Other').substring(0, 100),
        category: (ticket.category || 'Incident').substring(0, 100),
        priority: ticket.priority || 'Medium',
        urgency: (ticket.urgency || 'Medium').substring(0, 20),
        impact: (ticket.impact || 'Medium').substring(0, 20),
        status: ticket.status || 'Open',
        submittedById: ticket.submittedById,
        assignedToId: ticket.assignedToId || null,
        relatedAssetId: ticket.relatedAssetId || null,
        resolution: ticket.resolution || null,
        resolutionNotes: ticket.resolutionNotes || null,
        dueDate: ticket.dueDate || null,
        slaTarget: ticket.slaTarget || null,
        escalationLevel: (ticket.escalationLevel || '0').toString().substring(0, 10),
        tags: ticket.tags || null,
        privateNotes: ticket.privateNotes || null,
        timeSpent: ticket.timeSpent || 0,
        isTimeTracking: ticket.isTimeTracking || false,
        timeTrackingStartedAt: ticket.timeTrackingStartedAt || null
      };
      
      console.log('Safe data after truncation:', {
        summary: safeData.summary.length,
        requestType: safeData.requestType.length,
        category: safeData.category.length,
        urgency: safeData.urgency.length,
        impact: safeData.impact.length,
        escalationLevel: safeData.escalationLevel.length
      });
      
      // Let database auto-generate ticket_id - don't include it in INSERT
      const result = await pool.query(`
        INSERT INTO tickets (
          summary, description, request_type, category, priority,
          urgency, impact, status, submitted_by_id, assigned_to_id, related_asset_id,
          resolution, resolution_notes, due_date, sla_target, escalation_level,
          tags, private_notes, time_spent, is_time_tracking, time_tracking_started_at,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, NOW(), NOW()
        ) RETURNING *
      `, [
        safeData.summary,
        safeData.description,
        safeData.requestType,
        safeData.category,
        safeData.priority,
        safeData.urgency,
        safeData.impact,
        safeData.status,
        safeData.submittedById,
        safeData.assignedToId,
        safeData.relatedAssetId,
        safeData.resolution,
        safeData.resolutionNotes,
        safeData.dueDate,
        safeData.slaTarget,
        safeData.escalationLevel,
        safeData.tags,
        safeData.privateNotes,
        safeData.timeSpent,
        safeData.isTimeTracking,
        safeData.timeTrackingStartedAt
      ]);
      
      console.log('Ticket created successfully:', result.rows[0]);
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
      // Update only permitted fields
      const [updatedTicket] = await db
        .update(tickets)
        .set({ ...ticketData, updatedAt: new Date() })
        .where(eq(tickets.id, id))
        .returning();
      return updatedTicket;
    } catch (error) {
      console.error('Error updating ticket:', error);
      return undefined;
    }
  }

  // Add this method to your DatabaseStorage class in storage.ts
// Place it with the other ticket methods around line 1800+

async deleteTicket(id: number): Promise<boolean> {
  try {
    const result = await db.delete(tickets).where(eq(tickets.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return false;
  }
}

  async getAllTickets(): Promise<Ticket[]> {
    try {
      return await db.select().from(tickets).orderBy(desc(tickets.createdAt));
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

  // Service Providers
  async getServiceProviders(): Promise<any[]> {
    try {
      const providers = await db.select().from(serviceProviders).orderBy(asc(serviceProviders.name));
      return providers;
    } catch (error) {
      console.error('Error fetching service providers:', error);
      return [];
    }
  }

  async createServiceProvider(data: { name: string; contactPerson?: string; phone?: string; email?: string }): Promise<any> {
    try {
      const [newProvider] = await db.insert(serviceProviders)
        .values({
          name: data.name,
          contactPerson: data.contactPerson || null,
          phone: data.phone || null,
          email: data.email || null
        })
        .returning();
      return newProvider;
    } catch (error) {
      console.error('Error creating service provider:', error);
      throw error;
    }
  }

  async updateServiceProvider(id: number, data: { name: string; contactPerson?: string; phone?: string; email?: string }): Promise<any | undefined> {
    try {
      const [updated] = await db.update(serviceProviders)
        .set({
          name: data.name,
          contactPerson: data.contactPerson,
          phone: data.phone,
          email: data.email,
          updatedAt: new Date()
        })
        .where(eq(serviceProviders.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating service provider:', error);
      return undefined;
    }
  }

  async deleteServiceProvider(id: number): Promise<boolean> {
    try {
      const result = await db.delete(serviceProviders).where(eq(serviceProviders.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting service provider:', error);
      return false;
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
      return await db
        .select()
        .from(assetTransactions)
        .where(eq(assetTransactions.assetId, assetId))
        .orderBy(desc(assetTransactions.transactionDate));
    } catch (error) {
      console.error(`Error fetching transactions for asset ${assetId}:`, error);
      return [];
    }
  }

  async getEmployeeTransactions(employeeId: number): Promise<AssetTransaction[]> {
    try {
      return await db
        .select()
        .from(assetTransactions)
        .where(eq(assetTransactions.employeeId, employeeId))
        .orderBy(desc(assetTransactions.transactionDate));
    } catch (error) {
      console.error(`Error fetching transactions for employee ${employeeId}:`, error);
      return [];
    }
  }

  async getAllAssetTransactions(): Promise<AssetTransaction[]> {
    try {
      const transactions = await db
        .select()
        .from(assetTransactions)
        .orderBy(desc(assetTransactions.transactionDate));
        
      // Enhance with asset and employee details
      const result = await Promise.all(transactions.map(async (transaction) => {
        const asset = transaction.assetId 
          ? await this.getAsset(transaction.assetId) 
          : undefined;
          
        const employee = transaction.employeeId 
          ? await this.getEmployee(transaction.employeeId) 
          : undefined;
          
        return {
          ...transaction,
          asset,
          employee
        };
      }));
      
      return result;
    } catch (error) {
      console.error('Error fetching all asset transactions:', error);
      return [];
    }
  }

  async checkOutAsset(assetId: number, employeeId: number, notes?: string, type: string = 'Check-Out'): Promise<AssetTransaction> {
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
        transactionDate: new Date(),
        conditionNotes: notes || null
      });
        
      return transaction;
    } catch (error) {
      console.error('Error checking out asset:', error);
      throw error;
    }
  }

  async checkInAsset(assetId: number, notes?: string, type: string = 'Check-In'): Promise<AssetTransaction> {
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
        transactionDate: new Date(),
        actualReturnDate: new Date(),
        conditionNotes: notes || null
      });
        
      return transaction;
    } catch (error) {
      console.error('Error checking in asset:', error);
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

  /**
   * Removes all demo data from the database, keeping only the admin user
   * and essential system configuration
   */
  // Custom request types operations
  async getCustomRequestTypes(): Promise<CustomRequestType[]> {
    try {
      const result = await db.select().from(customRequestTypes).orderBy(customRequestTypes.name);
      return result;
    } catch (error) {
      console.error('Error fetching custom request types:', error);
      return [];
    }
  }

  async createCustomRequestType(data: InsertCustomRequestType): Promise<CustomRequestType> {
    const [result] = await db.insert(customRequestTypes).values(data).returning();
    return result;
  }

  async updateCustomRequestType(id: number, data: Partial<InsertCustomRequestType>): Promise<CustomRequestType | null> {
    const [result] = await db.update(customRequestTypes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customRequestTypes.id, id))
      .returning();
    return result || null;
  }

  async deleteCustomRequestType(id: number): Promise<boolean> {
    const result = await db.delete(customRequestTypes).where(eq(customRequestTypes.id, id));
    return result.rowCount > 0;
  }

  // Initialize default request types in database
  private async initializeDefaultRequestTypes(): Promise<void> {
    const defaultRequestTypes = [
      { name: 'Hardware', description: 'Hardware related requests and issues' },
      { name: 'Software', description: 'Software installation and support requests' },
      { name: 'Network', description: 'Network connectivity and infrastructure issues' },
      { name: 'Access Control', description: 'User access and permission requests' },
      { name: 'Security', description: 'Security incidents and compliance issues' }
    ];

    try {
      for (const requestType of defaultRequestTypes) {
        await db.insert(customRequestTypes)
          .values(requestType)
          .onConflictDoNothing();
      }
    } catch (error) {
      console.error('Error initializing default request types:', error);
    }
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

  async removeDemoData(): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        console.log('Starting demo data removal (excluding system configuration data)...');
        
        // Step 1: Remove dependent records first (proper cascade order)
        
        // Remove asset sale items first (depends on asset sales)
        await tx.delete(assetSaleItems);
        console.log('Asset sale items removed');
        
        // Remove asset sales
        await tx.delete(assetSales);
        console.log('Asset sales removed');
        
        // Remove asset transactions (depends on assets and employees)
        await tx.delete(assetTransactions);
        console.log('Asset transactions removed');
        
        // Remove asset maintenance records (depends on assets)
        await tx.delete(assetMaintenance);
        console.log('Asset maintenance records removed');
        
        // Remove ticket comments and history first (depends on tickets)
        await tx.delete(ticketComments);
        console.log('Ticket comments removed');
        
        await tx.delete(ticketHistory);
        console.log('Ticket history removed');
        
        // Remove tickets (depends on employees for assignment)
        await tx.delete(tickets);
        console.log('Tickets removed');
        
        // Remove assets (depends on employees for assignment)
        await tx.delete(assets);
        console.log('Assets removed');
        
        // Remove employees (no dependencies)
        await tx.delete(employees);
        console.log('Employees removed');
        
        // Remove activity logs (no critical dependencies)
        await tx.delete(activityLog);
        console.log('Activity logs removed');
        
        // Remove all users except admin (no dependencies)
        await tx.delete(users).where(
          sql`${users.id} > 1`
        );
        console.log('Non-admin users removed');
        
        // PRESERVE SYSTEM CONFIGURATION DATA:
        // - DO NOT delete customAssetTypes (system config)
        // - DO NOT delete customAssetBrands (system config)
        // - DO NOT delete customAssetStatuses (system config)
        // - DO NOT delete serviceProviders (system config)
        // - DO NOT delete customRequestTypes (system config)
        // - DO NOT modify systemConfig table (General, Employees, Assets, Tickets, Email, Users settings)
        
        console.log('System configuration data preserved (General, Employees, Assets, Tickets, Email, Users settings)');
      });
      
      console.log('Demo data removal completed successfully - system configuration preserved');
    } catch (error) {
      console.error('Error removing demo data:', error);
      throw error;
    }
  }

  // Changes Log operations
  async getChangesLog(options: {
    version?: string;
    changeType?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    data: ChangeLog[];
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    }
  }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    try {
      let query = db.select().from(changesLog);
      let countQuery = db.select({ count: sql<number>`count(*)` }).from(changesLog);

      // Apply filters
      const conditions = [];
      if (options.version) {
        conditions.push(like(changesLog.version, `%${options.version}%`));
      }
      if (options.changeType) {
        conditions.push(eq(changesLog.changeType, options.changeType));
      }
      if (options.status) {
        conditions.push(eq(changesLog.status, options.status));
      }

      if (conditions.length > 0) {
        const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
        query = query.where(whereCondition);
        countQuery = countQuery.where(whereCondition);
      }

      // Get total count
      const [{ count: totalItems }] = await countQuery;

      // Get paginated data
      const data = await query
        .orderBy(desc(changesLog.releaseDate), desc(changesLog.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        data,
        pagination: {
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          currentPage: page,
          pageSize: limit,
        }
      };
    } catch (error) {
      console.error('Error fetching changes log:', error);
      return {
        data: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: page,
          pageSize: limit,
        }
      };
    }
  }

  async createChangeLog(changeLog: InsertChangeLog): Promise<ChangeLog> {
    try {
      const [result] = await db.insert(changesLog).values(changeLog).returning();
      return result;
    } catch (error) {
      console.error('Error creating change log:', error);
      throw error;
    }
  }

  async updateChangeLog(id: number, changeLog: Partial<InsertChangeLog>): Promise<ChangeLog | undefined> {
    try {
      const [result] = await db
        .update(changesLog)
        .set({ ...changeLog, updatedAt: new Date() })
        .where(eq(changesLog.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating change log:', error);
      throw error;
    }
  }

  async deleteChangeLog(id: number): Promise<boolean> {
    try {
      const result = await db.delete(changesLog).where(eq(changesLog.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting change log:', error);
      return false;
    }
  }

  // Enhanced Ticket operations with time tracking
  async startTicketTimeTracking(ticketId: number, userId: number): Promise<Ticket | undefined> {
    try {
      console.log('Starting time tracking for ticket:', ticketId);
      
      // Use raw SQL to avoid schema issues and get reliable results
      const result = await pool.query(`
        UPDATE tickets 
        SET is_time_tracking = true, start_time = NOW(), last_activity_at = NOW(), updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [ticketId]);
      
      const updatedTicket = result.rows[0];
      
      if (updatedTicket) {
        console.log('Time tracking started:', {
          id: updatedTicket.id,
          is_time_tracking: updatedTicket.is_time_tracking,
          start_time: updatedTicket.start_time
        });

        // Add to history
        await this.addTicketHistory({
          ticketId,
          userId,
          action: "Started Time Tracking",
          notes: "Timer started for this ticket"
        });
      }

      return updatedTicket;
    } catch (error) {
      console.error('Error starting ticket time tracking:', error);
      return undefined;
    }
  }

  async stopTicketTimeTracking(ticketId: number, userId: number): Promise<Ticket | undefined> {
    try {
      console.log('Stopping time tracking for ticket:', ticketId);
      
      // Use raw SQL to get accurate time data
      const timeResult = await pool.query(
        'SELECT start_time, time_spent FROM tickets WHERE id = $1',
        [ticketId]
      );
      
      if (!timeResult.rows[0]?.start_time) {
        console.log('No start time found for ticket:', ticketId);
        return undefined;
      }

      const startTime = new Date(timeResult.rows[0].start_time);
      const endTime = new Date();
      const timeDiffMs = endTime.getTime() - startTime.getTime();
      const sessionMinutes = Math.max(1, Math.round(timeDiffMs / (1000 * 60))); // At least 1 minute for any session
      const previousTimeSpent = timeResult.rows[0].time_spent || 0;
      const totalTimeSpent = previousTimeSpent + sessionMinutes;

      console.log('Time calculation:', {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        sessionMinutes,
        previousTimeSpent,
        totalTimeSpent
      });

      // Update using raw SQL for reliability
      const result = await pool.query(
        'UPDATE tickets SET is_time_tracking = false, completion_time = NOW(), time_spent = $2, last_activity_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *',
        [ticketId, totalTimeSpent]
      );

      const updatedTicket = result.rows[0];
      
      if (updatedTicket) {
        console.log('Updated ticket state:', {
          id: updatedTicket.id,
          is_time_tracking: updatedTicket.is_time_tracking,
          time_spent: updatedTicket.time_spent
        });

        // Add to history
        await this.addTicketHistory({
          ticketId,
          userId,
          action: "Stopped Time Tracking", 
          notes: `Timer stopped. Session: ${sessionMinutes} minutes. Total time: ${totalTimeSpent} minutes`
        });
      }

      return updatedTicket;
    } catch (error) {
      console.error('Error stopping ticket time tracking:', error);
      return undefined;
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
      await db
        .update(tickets)
        .set({ lastActivityAt: new Date(), updatedAt: new Date() })
        .where(eq(tickets.id, commentData.ticketId));

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
      if (ticketData.requestType && ticketData.requestType !== currentTicket.requestType) {
        changes.push(`Request type changed from "${currentTicket.requestType}" to "${ticketData.requestType}"`);
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

  // ITIL-Compliant Asset Upgrade Management Methods
  async createAssetUpgrade(upgradeData: any): Promise<any> {
    try {
      const upgradeId = `UPG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const query = `
        INSERT INTO asset_upgrades (
          upgrade_id, asset_id, requested_by_id, title, description, 
          business_justification, upgrade_type, priority, risk, 
          current_configuration, new_configuration, impact_assessment, 
          backout_plan, success_criteria, estimated_cost, 
          planned_start_date, planned_end_date, downtime_required, 
          estimated_downtime
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *
      `;
      
      const values = [
        upgradeId,
        upgradeData.assetId,
        upgradeData.requestedById,
        upgradeData.title,
        upgradeData.description,
        upgradeData.businessJustification,
        upgradeData.upgradeType,
        upgradeData.priority || 'Medium',
        upgradeData.risk || 'Medium',
        JSON.stringify(upgradeData.currentConfiguration || {}),
        JSON.stringify(upgradeData.newConfiguration || {}),
        upgradeData.impactAssessment,
        upgradeData.backoutPlan,
        upgradeData.successCriteria,
        upgradeData.estimatedCost || 0,
        upgradeData.plannedStartDate || null,
        upgradeData.plannedEndDate || null,
        upgradeData.downtimeRequired || false,
        upgradeData.estimatedDowntime || null
      ];
      
      const result = await this.pool.query(query, values);
      
      // Log the upgrade creation in history
      await this.addUpgradeHistory(result.rows[0].id, upgradeData.requestedById, 'Upgrade Created', null, 'Upgrade request submitted');
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating asset upgrade:', error);
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
          req.username as requested_by_name,
          app.username as approved_by_name,
          imp.username as implemented_by_name
        FROM asset_upgrades au
        LEFT JOIN assets a ON au.asset_id = a.id
        LEFT JOIN users req ON au.requested_by_id = req.id
        LEFT JOIN users app ON au.approved_by_id = app.id
        LEFT JOIN users imp ON au.implemented_by_id = imp.id
        WHERE au.id = $1
      `;
      
      const result = await this.pool.query(query, [upgradeId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        ...row,
        currentConfiguration: row.current_configuration,
        newConfiguration: row.new_configuration,
        assetInfo: {
          assetId: row.asset_asset_id,
          type: row.asset_type,
          brand: row.asset_brand,
          modelName: row.asset_model_name,
          serialNumber: row.asset_serial
        },
        requestedByName: row.requested_by_name,
        approvedByName: row.approved_by_name,
        implementedByName: row.implemented_by_name
      };
    } catch (error) {
      console.error('Error fetching asset upgrade:', error);
      throw error;
    }
  }

  async updateAssetUpgrade(upgradeId: number, updateData: any, userId: number): Promise<any> {
    try {
      // Get current upgrade for history tracking
      const currentUpgrade = await this.getAssetUpgrade(upgradeId);
      
      const fields = [];
      const values = [];
      let paramCount = 1;
      
      Object.keys(updateData).forEach(key => {
        if (key !== 'id' && updateData[key] !== undefined) {
          let dbKey = key;
          // Convert camelCase to snake_case for database
          dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          
          fields.push(`${dbKey} = $${paramCount}`);
          values.push(key.includes('onfiguration') ? JSON.stringify(updateData[key]) : updateData[key]);
          paramCount++;
        }
      });
      
      if (fields.length === 0) {
        return currentUpgrade;
      }
      
      fields.push(`updated_at = NOW()`);
      values.push(upgradeId);
      
      const query = `
        UPDATE asset_upgrades 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await this.pool.query(query, values);
      
      // Log status changes in history
      if (updateData.status && updateData.status !== currentUpgrade.status) {
        await this.addUpgradeHistory(upgradeId, userId, 'Status Changed', currentUpgrade.status, updateData.status);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating asset upgrade:', error);
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
          req.username as requested_by_name,
          app.username as approved_by_name
        FROM asset_upgrades au
        LEFT JOIN assets a ON au.asset_id = a.id
        LEFT JOIN users req ON au.requested_by_id = req.id
        LEFT JOIN users app ON au.approved_by_id = app.id
        ORDER BY au.created_at DESC
      `;
      
      const result = await this.pool.query(query);
      
      return result.rows.map(row => ({
        ...row,
        currentConfiguration: row.current_configuration,
        newConfiguration: row.new_configuration,
        assetInfo: {
          assetId: row.asset_asset_id,
          type: row.asset_type,
          brand: row.asset_brand,
          modelName: row.asset_model_name
        },
        requestedByName: row.requested_by_name,
        approvedByName: row.approved_by_name
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
      
      await this.pool.query(query, [upgradeId, userId, action, previousValue, newValue]);
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
      
      const result = await this.pool.query(query, [upgradeId]);
      
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