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
  customAssetTypes, customAssetBrands, customAssetStatuses, serviceProviders, assetServiceProviders
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
  checkOutAsset(assetId: number, employeeId: number, notes?: string): Promise<AssetTransaction>;
  checkInAsset(assetId: number, notes?: string): Promise<AssetTransaction>;

  // Asset Sales operations
  createAssetSale(sale: InsertAssetSale): Promise<AssetSale>;
  addAssetToSale(saleItem: InsertAssetSaleItem): Promise<AssetSaleItem>;
  getAssetSales(): Promise<AssetSale[]>;
  
  // Ticket operations
  getTicket(id: number): Promise<Ticket | undefined>;
  getTicketByTicketId(ticketId: string): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id));
    return result.count > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async upsertUser(userData: UpsertUser): Promise<User> {
    // Convert string ID to number if the user ID is numeric
    const userId = userData.id;
    
    // Create default user data
    const userValues = {
      id: userId,
      username: userData.email || `user_${userId}`,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      password: "hashed_password_placeholder", // We don't use this with external auth
      profileImageUrl: userData.profileImageUrl || null,
      accessLevel: userData.accessLevel || "1",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    try {
      // Check if user exists
      const existingUser = await this.getUser(userId);
      
      if (existingUser) {
        // Update existing user
        const [updatedUser] = await db
          .update(users)
          .set({
            email: userData.email || undefined,
            firstName: userData.firstName || undefined,
            lastName: userData.lastName || undefined,
            profileImageUrl: userData.profileImageUrl || undefined,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId))
          .returning();
        return updatedUser;
      } else {
        // Create new user
        const [newUser] = await db
          .insert(users)
          .values(userValues)
          .returning();
        return newUser;
      }
    } catch (error) {
      console.error("Error upserting user:", error);
      throw error;
    }
  }

  // Employee operations
  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db
      .insert(employees)
      .values(employee)
      .returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employeeData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [employee] = await db
      .update(employees)
      .set({ ...employeeData, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return employee || undefined;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const result = await db
      .delete(employees)
      .where(eq(employees.id, id));
    return result.count > 0;
  }

  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(employees.englishName);
  }

  async searchEmployees(query: string): Promise<Employee[]> {
    return await db
      .select()
      .from(employees)
      .where(
        or(
          like(employees.englishName, `%${query}%`),
          like(employees.arabicName || '', `%${query}%`),
          like(employees.empId, `%${query}%`),
          like(employees.department, `%${query}%`)
        )
      )
      .orderBy(employees.englishName);
  }

  // Asset operations
  async getAsset(id: number): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset || undefined;
  }

  async getAssetByAssetId(assetId: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.assetId, assetId));
    return asset || undefined;
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const [newAsset] = await db
      .insert(assets)
      .values(asset)
      .returning();
    return newAsset;
  }

  async updateAsset(id: number, assetData: Partial<InsertAsset>): Promise<Asset | undefined> {
    const [asset] = await db
      .update(assets)
      .set({ ...assetData, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return asset || undefined;
  }

  async deleteAsset(id: number): Promise<boolean> {
    const result = await db
      .delete(assets)
      .where(eq(assets.id, id));
    return result.count > 0;
  }

  async getAllAssets(): Promise<Asset[]> {
    return await db.select().from(assets).orderBy(desc(assets.createdAt));
  }

  async getAssetsByStatus(status: string): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .where(eq(assets.status, status))
      .orderBy(desc(assets.createdAt));
  }

  async getAssetsByType(type: string): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .where(eq(assets.type, type))
      .orderBy(desc(assets.createdAt));
  }

  async getAssetsForEmployee(employeeId: number): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .where(eq(assets.assignedEmployeeId, employeeId))
      .orderBy(assets.assetId);
  }

  // Asset Maintenance operations
  async createAssetMaintenance(maintenance: InsertAssetMaintenance): Promise<AssetMaintenance> {
    const [newMaintenance] = await db
      .insert(assetMaintenance)
      .values(maintenance)
      .returning();
    return newMaintenance;
  }

  async getMaintenanceForAsset(assetId: number): Promise<AssetMaintenance[]> {
    return await db
      .select()
      .from(assetMaintenance)
      .where(eq(assetMaintenance.assetId, assetId))
      .orderBy(desc(assetMaintenance.date));
  }

  // Asset Sales operations
  async createAssetSale(sale: InsertAssetSale): Promise<AssetSale> {
    const [newSale] = await db
      .insert(assetSales)
      .values(sale)
      .returning();
    return newSale;
  }

  async addAssetToSale(saleItem: InsertAssetSaleItem): Promise<AssetSaleItem> {
    const [newSaleItem] = await db
      .insert(assetSaleItems)
      .values(saleItem)
      .returning();
    return newSaleItem;
  }

  async getAssetSales(): Promise<AssetSale[]> {
    return await db
      .select()
      .from(assetSales)
      .orderBy(desc(assetSales.date));
  }

  // Ticket operations
  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket || undefined;
  }

  async getTicketByTicketId(ticketId: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.ticketId, ticketId));
    return ticket || undefined;
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db
      .insert(tickets)
      .values(ticket)
      .returning();
    return newTicket;
  }

  async updateTicket(id: number, ticketData: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const [ticket] = await db
      .update(tickets)
      .set({ ...ticketData, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return ticket || undefined;
  }

  async getAllTickets(): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .orderBy(desc(tickets.createdAt));
  }

  async getTicketsByStatus(status: string): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.status, status))
      .orderBy(desc(tickets.createdAt));
  }

  async getTicketsForEmployee(employeeId: number): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.submittedById, employeeId))
      .orderBy(desc(tickets.createdAt));
  }

  async getTicketsAssignedToUser(userId: number): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.assignedToId, userId))
      .orderBy(desc(tickets.createdAt));
  }

  // System Config operations
  async getSystemConfig(): Promise<SystemConfig | undefined> {
    const configs = await db.select().from(systemConfig).orderBy(asc(systemConfig.id)).limit(1);
    return configs[0] || undefined;
  }

  async updateSystemConfig(config: Partial<InsertSystemConfig>): Promise<SystemConfig | undefined> {
    // Find the config first
    const configs = await db.select().from(systemConfig).orderBy(asc(systemConfig.id)).limit(1);
    
    if (configs.length === 0) {
      // Create if it doesn't exist
      const [newConfig] = await db
        .insert(systemConfig)
        .values({ ...config })
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
  }

  // Activity Log operations
  async logActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    const [newActivity] = await db
      .insert(activityLog)
      .values(activity)
      .returning();
    return newActivity;
  }

  async getRecentActivity(limit: number): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLog)
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
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
    const {
      page = 1,
      limit = 50,
      filter,
      entityType,
      action,
      userId,
      startDate,
      endDate
    } = options;
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Create conditions array
    const conditions = [];
    
    if (filter) {
      conditions.push(sql`(${activityLog.action} LIKE ${`%${filter}%`} OR ${activityLog.entityType} LIKE ${`%${filter}%`} OR ${activityLog.details}::text LIKE ${`%${filter}%`})`);
    }
    
    if (entityType) {
      conditions.push(sql`${activityLog.entityType} = ${entityType}`);
    }
    
    if (action) {
      conditions.push(sql`${activityLog.action} = ${action}`);
    }
    
    if (userId) {
      conditions.push(sql`${activityLog.userId} = ${userId}`);
    }
    
    if (startDate) {
      conditions.push(sql`${activityLog.createdAt} >= ${startDate}`);
    }
    
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setDate(endOfDay.getDate() + 1);
      conditions.push(sql`${activityLog.createdAt} < ${endOfDay}`);
    }
    
    // Combine conditions
    let query;
    if (conditions.length > 0) {
      const whereClause = conditions.reduce((acc, condition, index) => {
        return index === 0 ? condition : sql`${acc} AND ${condition}`;
      }, sql``);
      
      query = db
        .select()
        .from(activityLog)
        .where(whereClause);
    } else {
      query = db.select().from(activityLog);
    }
    
    // Execute count query
    const countResult = await db.execute(
      sql`SELECT COUNT(*) FROM ${activityLog} ${conditions.length > 0 ? sql`WHERE ${conditions.reduce((acc, condition, index) => {
        return index === 0 ? condition : sql`${acc} AND ${condition}`;
      }, sql``)}` : sql``}`
    );
    
    const totalItems = parseInt(countResult.rows[0]?.count || '0');
    
    // Get data with pagination
    const data = await query
      .orderBy(desc(activityLog.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalItems / limit);
    
    return {
      data,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize: limit
      }
    };
  }
  
  // Custom Asset Types
  async getCustomAssetTypes(): Promise<any[]> {
    try {
      const types = await db.select().from(customAssetTypes);
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
      const result = await db.delete(customAssetTypes)
        .where(eq(customAssetTypes.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting custom asset type:', error);
      return false;
    }
  }
  
  // Custom Asset Brands
  async getCustomAssetBrands(): Promise<any[]> {
    try {
      const brands = await db.select().from(customAssetBrands);
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
      const result = await db.delete(customAssetBrands)
        .where(eq(customAssetBrands.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting custom asset brand:', error);
      return false;
    }
  }
  
  // Custom Asset Statuses
  async getCustomAssetStatuses(): Promise<any[]> {
    try {
      const statuses = await db.select().from(customAssetStatuses);
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
          color: data.color || '#3B82F6' // Default blue color
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
      const result = await db.delete(customAssetStatuses)
        .where(eq(customAssetStatuses.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting custom asset status:', error);
      return false;
    }
  }
  
  // Service Providers
  async getServiceProviders(): Promise<any[]> {
    try {
      const providers = await db.select().from(serviceProviders);
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
      const result = await db.delete(serviceProviders)
        .where(eq(serviceProviders.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting service provider:', error);
      return false;
    }
  }

  // Asset Transaction methods
  async createAssetTransaction(transaction: InsertAssetTransaction): Promise<AssetTransaction> {
    try {
      const [newTransaction] = await db.insert(assetTransactions)
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
      return await db.select()
        .from(assetTransactions)
        .where(eq(assetTransactions.assetId, assetId))
        .orderBy(desc(assetTransactions.createdAt));
    } catch (error) {
      console.error('Error getting asset transactions:', error);
      return [];
    }
  }
  
  async getEmployeeTransactions(employeeId: number): Promise<AssetTransaction[]> {
    try {
      return await db.select()
        .from(assetTransactions)
        .where(eq(assetTransactions.employeeId, employeeId))
        .orderBy(desc(assetTransactions.createdAt));
    } catch (error) {
      console.error('Error getting employee transactions:', error);
      return [];
    }
  }
  
  async checkOutAsset(assetId: number, employeeId: number, notes?: string): Promise<AssetTransaction> {
    const asset = await this.getAsset(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }
    
    // Check if asset is already assigned
    if (asset.status === 'In Use') {
      throw new Error('Asset is already checked out');
    }
    
    try {
      // Begin transaction
      return await db.transaction(async (tx) => {
        // 1. Update asset status and assignment
        const [updatedAsset] = await tx.update(assets)
          .set({
            status: 'In Use',
            assignedEmployeeId: employeeId,
            updatedAt: new Date()
          })
          .where(eq(assets.id, assetId))
          .returning();
        
        // 2. Create transaction record
        const [transaction] = await tx.insert(assetTransactions)
          .values({
            assetId,
            employeeId,
            transactionType: 'Check-Out',
            notes: notes || `Asset checked out to employee ID ${employeeId}`,
          })
          .returning();
        
        // 3. Log the activity
        await tx.insert(activityLog)
          .values({
            userId: 1, // Default to admin user if not provided
            action: 'ASSIGN',
            entityType: 'ASSET',
            entityId: assetId,
            details: {
              assignedTo: employeeId,
              previousStatus: asset.status,
              newStatus: 'In Use',
              transactionId: transaction.id
            }
          });
        
        return transaction;
      });
    } catch (error) {
      console.error('Error checking out asset:', error);
      throw error;
    }
  }
  
  async checkInAsset(assetId: number, notes?: string): Promise<AssetTransaction> {
    const asset = await this.getAsset(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }
    
    // Check if asset is already available
    if (asset.status !== 'In Use') {
      throw new Error('Asset is not currently checked out');
    }
    
    const previousEmployeeId = asset.assignedEmployeeId;
    
    try {
      // Begin transaction
      return await db.transaction(async (tx) => {
        // 1. Update asset status and remove assignment
        const [updatedAsset] = await tx.update(assets)
          .set({
            status: 'Available',
            assignedEmployeeId: null,
            updatedAt: new Date()
          })
          .where(eq(assets.id, assetId))
          .returning();
        
        // 2. Create transaction record
        const [transaction] = await tx.insert(assetTransactions)
          .values({
            assetId,
            employeeId: previousEmployeeId,
            transactionType: 'Check-In',
            notes: notes || `Asset checked in from employee ID ${previousEmployeeId}`,
          })
          .returning();
        
        // 3. Log the activity
        await tx.insert(activityLog)
          .values({
            userId: 1, // Default to admin user if not provided
            action: 'UNASSIGN',
            entityType: 'ASSET',
            entityId: assetId,
            details: {
              unassignedFrom: previousEmployeeId,
              previousStatus: 'In Use',
              newStatus: 'Available',
              transactionId: transaction.id
            }
          });
        
        return transaction;
      });
    } catch (error) {
      console.error('Error checking in asset:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
