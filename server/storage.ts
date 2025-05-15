import { 
  users, type User, type InsertUser,
  employees, type Employee, type InsertEmployee,
  assets, type Asset, type InsertAsset,
  assetMaintenance, type AssetMaintenance, type InsertAssetMaintenance,
  assetSales, type AssetSale, type InsertAssetSale,
  assetSaleItems, type AssetSaleItem, type InsertAssetSaleItem,
  tickets, type Ticket, type InsertTicket,
  systemConfig, type SystemConfig, type InsertSystemConfig,
  activityLog, type ActivityLog, type InsertActivityLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, desc, or, asc } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
