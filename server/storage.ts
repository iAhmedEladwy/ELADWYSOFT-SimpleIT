import { 
  users, type User, type InsertUser,
  employees, type Employee, type InsertEmployee,
  assets, type Asset, type InsertAsset,
  assetMaintenance, type AssetMaintenance, type InsertAssetMaintenance,
  assetSales, type AssetSale, type InsertAssetSale,
  assetSaleItems, type AssetSaleItem, type InsertAssetSaleItem,
  tickets, type Ticket, type InsertTicket,
  systemConfig, type SystemConfig, type InsertSystemConfig,
  activityLog, type ActivityLog, type InsertActivityLog,
  assetTransactions, type AssetTransaction, type InsertAssetTransaction,
  securityQuestions, type SecurityQuestion, type InsertSecurityQuestion,
  passwordResetTokens, type PasswordResetToken, type InsertPasswordResetToken,
  customAssetTypes, customAssetBrands, customAssetStatuses, serviceProviders, assetServiceProviders,
  notifications, type Notification, type InsertNotification,
  changesLog, type ChangeLog, type InsertChangeLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, desc, or, asc, gte, lt, sql } from "drizzle-orm";

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
  deleteCustomAssetType(id: number): Promise<boolean>;
  
  getCustomAssetBrands(): Promise<any[]>;
  createCustomAssetBrand(data: { name: string; description?: string }): Promise<any>;
  deleteCustomAssetBrand(id: number): Promise<boolean>;
  
  getCustomAssetStatuses(): Promise<any[]>;
  createCustomAssetStatus(data: { name: string; description?: string; color?: string }): Promise<any>;
  deleteCustomAssetStatus(id: number): Promise<boolean>;
  
  getServiceProviders(): Promise<any[]>;
  createServiceProvider(data: { name: string; contactPerson?: string; phone?: string; email?: string }): Promise<any>;
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
      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      
      // Set expiration time (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // Delete any existing tokens for this user
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
      
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
      throw error;
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
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(insertUser)
        .returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
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
      return await db.select().from(users);
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

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    try {
      const [newEmployee] = await db
        .insert(employees)
        .values(employee)
        .returning();
      return newEmployee;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  async updateEmployee(id: number, employeeData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    try {
      const [updatedEmployee] = await db
        .update(employees)
        .set({ ...employeeData, updatedAt: new Date() })
        .where(eq(employees.id, id))
        .returning();
      return updatedEmployee;
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
      return await db.select().from(employees).orderBy(asc(employees.empId));
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
      // Convert numeric buyPrice to string for database storage
      const processedAsset = {
        ...asset,
        buyPrice: asset.buyPrice ? asset.buyPrice.toString() : null
      };
      
      const [newAsset] = await db
        .insert(assets)
        .values(processedAsset)
        .returning();
      return newAsset;
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
      return await db.select().from(assets).orderBy(asc(assets.assetId));
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
        .where(eq(assets.assignedTo, employeeId))
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
      const [newTicket] = await db
        .insert(tickets)
        .values(ticket)
        .returning();
      return newTicket;
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

  async getAllTickets(): Promise<Ticket[]> {
    try {
      return await db.select().from(tickets).orderBy(desc(tickets.createdAt));
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return [];
    }
  }

  async getTicketsByStatus(status: string): Promise<Ticket[]> {
    try {
      return await db
        .select()
        .from(tickets)
        .where(eq(tickets.status, status))
        .orderBy(desc(tickets.createdAt));
    } catch (error) {
      console.error(`Error fetching tickets with status ${status}:`, error);
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

  async deleteCustomAssetStatus(id: number): Promise<boolean> {
    try {
      const result = await db.delete(customAssetStatuses).where(eq(customAssetStatuses.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting custom asset status:', error);
      return false;
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
      const [newTransaction] = await db
        .insert(assetTransactions)
        .values(transaction)
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
        assignedTo: employeeId,
        status: 'In Use'
      });
      
      // Create transaction record
      const [transaction] = await db
        .insert(assetTransactions)
        .values({
          type,
          assetId,
          employeeId,
          transactionDate: new Date(),
          conditionNotes: notes || null
        })
        .returning();
        
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
      
      const employeeId = asset.assignedTo;
      
      // Update asset to remove employee and set status to Available
      await this.updateAsset(assetId, { 
        assignedTo: null,
        status: 'Available'
      });
      
      // Create transaction record
      const [transaction] = await db
        .insert(assetTransactions)
        .values({
          type,
          assetId,
          employeeId, // Keep track of who returned it
          transactionDate: new Date(),
          actualReturnDate: new Date(),
          conditionNotes: notes || null
        })
        .returning();
        
      return transaction;
    } catch (error) {
      console.error('Error checking in asset:', error);
      throw error;
    }
  }

  // Advanced ticket management methods
  async addTicketComment(commentData: any): Promise<any> {
    try {
      const comment = {
        id: this.comments.length + 1,
        ticketId: commentData.ticketId,
        userId: commentData.userId,
        content: commentData.content,
        isPrivate: commentData.isPrivate || false,
        attachments: commentData.attachments || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.comments.push(comment);
      
      // Update ticket's last activity
      const ticket = this.tickets.find(t => t.id === commentData.ticketId);
      if (ticket) {
        ticket.lastActivityAt = new Date();
      }
      
      return comment;
    } catch (error) {
      console.error('Error adding ticket comment:', error);
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
  async removeDemoData(): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        // Remove all asset transactions
        await tx.delete(assetTransactions);
        console.log('Asset transactions removed');
        
        // Remove all asset maintenance records
        await tx.delete(assetMaintenance);
        console.log('Asset maintenance records removed');
        
        // Remove all assets
        await tx.delete(assets);
        console.log('Assets removed');
        
        // Remove all tickets
        await tx.delete(tickets);
        console.log('Tickets removed');
        
        // Remove employees except for admin-linked ones
        await tx.delete(employees);
        console.log('Employees removed');
        
        // Remove all sales and sale items
        await tx.delete(assetSaleItems);
        await tx.delete(assetSales);
        console.log('Asset sales removed');
        
        // Clear custom data
        await tx.delete(customAssetTypes);
        await tx.delete(customAssetBrands);
        await tx.delete(customAssetStatuses);
        await tx.delete(serviceProviders);
        console.log('Custom data removed');
        
        // Remove activity logs
        await tx.delete(activityLog);
        console.log('Activity logs removed');
        
        // Remove all users except admin
        await tx.delete(users).where(
          sql`${users.id} > 1`
        );
        console.log('Non-admin users removed');
        
        // Reset system config to defaults but keep custom settings
        await tx.update(systemConfig).set({
          assetIdPrefix: 'SIT-',
          currency: 'USD'
        });
        console.log('System config reset to defaults');
      });
      
      console.log('Demo data removal completed successfully');
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
}

// Use memory storage for development, PostgreSQL for production
import { MemoryStorage } from "./memory-storage";
export const storage = process.env.NODE_ENV === 'production' 
  ? new DatabaseStorage() 
  : new MemoryStorage();