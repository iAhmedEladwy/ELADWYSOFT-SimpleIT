import { IStorage, UpsertUser } from "./storage";
import * as schema from "@shared/schema";
import { hash } from "bcryptjs";

// Temporary memory storage implementation to bypass database connection issues
export class MemoryStorage implements IStorage {
  private users: schema.User[] = [];
  private employees: schema.Employee[] = [];
  private assets: schema.Asset[] = [];
  private tickets: schema.Ticket[] = [];
  private activityLogs: schema.ActivityLog[] = [];
  private changesLogs: schema.ChangeLog[] = [];
  private securityQuestions: schema.SecurityQuestion[] = [];
  private passwordResetTokens: schema.PasswordResetToken[] = [];
  private assetTransactions: schema.AssetTransaction[] = [];
  private assetMaintenance: schema.AssetMaintenance[] = [];
  private assetSales: schema.AssetSale[] = [];
  private assetSaleItems: schema.AssetSaleItem[] = [];
  private systemConfig: schema.SystemConfig | undefined;
  
  // Custom asset management data
  private customAssetTypes: any[] = [];
  private customAssetBrands: any[] = [];
  private customAssetStatuses: any[] = [];
  private serviceProviders: any[] = [];
  
  private idCounters = {
    users: 1,
    employees: 1,
    assets: 1,
    tickets: 1,
    activityLogs: 1,
    changesLogs: 1,
    securityQuestions: 1,
    passwordResetTokens: 1,
    assetTransactions: 1,
    assetMaintenance: 1,
    assetSales: 1,
    assetSaleItems: 1,
    customAssetTypes: 1,
    customAssetBrands: 1,
    customAssetStatuses: 1,
    serviceProviders: 1
  };

  constructor() {
    // Initialize with admin user
    this.initializeAdminUser();
    this.initializeDefaultData();
  }

  private async initializeAdminUser() {
    const hashedPassword = await hash("admin123", 10);
    this.users.push({
      id: this.idCounters.users++,
      username: "admin",
      password: hashedPassword,
      email: "admin@simpleit.com",
      accessLevel: "3",
      firstName: "System",
      lastName: "Administrator",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  private initializeDefaultData() {
    // Initialize system config
    this.systemConfig = {
      id: 1,
      companyName: "ELADWYSOFT",
      companyAddress: "123 Business Street",
      companyPhone: "+1-555-0123",
      companyEmail: "info@eladwysoft.com",
      systemVersion: "1.0.0",
      currency: "USD",
      timezone: "UTC",
      theme: "light",
      maintenanceMode: false,
      backupFrequency: "daily",
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordPolicy: JSON.stringify({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false
      }),
      emailSettings: JSON.stringify({
        smtpHost: "",
        smtpPort: 587,
        smtpUser: "",
        smtpPassword: "",
        fromEmail: "noreply@eladwysoft.com"
      }),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add some sample data for demonstration
    this.addSampleData();
  }

  private addSampleData() {
    // Add sample employee
    this.employees.push({
      id: this.idCounters.employees++,
      name: "John Doe",
      email: "john.doe@eladwysoft.com",
      phone: "+1-555-0101",
      department: "IT",
      position: "System Administrator",
      employeeId: "EMP001",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Add sample assets
    this.assets.push({
      id: this.idCounters.assets++,
      assetId: "AST001",
      name: "Dell Laptop",
      type: "Laptop",
      brand: "Dell",
      model: "Inspiron 15",
      serialNumber: "DL123456789",
      status: "Available",
      purchasePrice: "999.99",
      purchaseDate: new Date("2024-01-15"),
      warrantyExpiry: new Date("2027-01-15"),
      location: "IT Storage",
      notes: "Standard business laptop",
      employeeId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Add sample change log
    this.changesLogs.push({
      id: this.idCounters.changesLogs++,
      version: "1.0.0",
      changeType: "Feature",
      description: "Initial system setup with core asset management functionality",
      status: "Completed",
      implementationDate: new Date(),
      notes: "System initialized with basic features",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Initialize custom asset management data
    this.initializeCustomAssetData();
  }

  private initializeCustomAssetData() {
    // Default asset types
    this.customAssetTypes = [
      { id: this.idCounters.customAssetTypes++, name: "Laptops", description: "Laptop computers", createdAt: new Date(), updatedAt: new Date() },
      { id: this.idCounters.customAssetTypes++, name: "Desktop", description: "Desktop computers", createdAt: new Date(), updatedAt: new Date() },
      { id: this.idCounters.customAssetTypes++, name: "Mobile", description: "Mobile devices", createdAt: new Date(), updatedAt: new Date() },
      { id: this.idCounters.customAssetTypes++, name: "Monitor", description: "Computer monitors", createdAt: new Date(), updatedAt: new Date() }
    ];

    // Default asset brands
    this.customAssetBrands = [
      { id: this.idCounters.customAssetBrands++, name: "Dell", description: "Dell Technologies", createdAt: new Date(), updatedAt: new Date() },
      { id: this.idCounters.customAssetBrands++, name: "HP", description: "HP Inc.", createdAt: new Date(), updatedAt: new Date() },
      { id: this.idCounters.customAssetBrands++, name: "Lenovo", description: "Lenovo Group", createdAt: new Date(), updatedAt: new Date() },
      { id: this.idCounters.customAssetBrands++, name: "Apple", description: "Apple Inc.", createdAt: new Date(), updatedAt: new Date() }
    ];

    // Default asset statuses
    this.customAssetStatuses = [
      { id: this.idCounters.customAssetStatuses++, name: "Available", description: "Asset is available for assignment", color: "#10b981", createdAt: new Date(), updatedAt: new Date() },
      { id: this.idCounters.customAssetStatuses++, name: "In Use", description: "Asset is currently assigned", color: "#3b82f6", createdAt: new Date(), updatedAt: new Date() },
      { id: this.idCounters.customAssetStatuses++, name: "Maintenance", description: "Asset is under maintenance", color: "#f59e0b", createdAt: new Date(), updatedAt: new Date() },
      { id: this.idCounters.customAssetStatuses++, name: "Damaged", description: "Asset is damaged", color: "#ef4444", createdAt: new Date(), updatedAt: new Date() }
    ];

    // Default service providers
    this.serviceProviders = [
      { 
        id: this.idCounters.serviceProviders++, 
        name: "Tech Solutions Inc", 
        contactPerson: "John Smith",
        phone: "+1-555-0199",
        email: "support@techsolutions.com",
        address: "123 Tech Street, IT City",
        serviceType: "Hardware Maintenance",
        notes: "Primary hardware service provider",
        createdAt: new Date(), 
        updatedAt: new Date() 
      }
    ];
  }

  // Security Questions operations
  async getSecurityQuestions(userId?: number): Promise<schema.SecurityQuestion[]> {
    if (userId) {
      return this.securityQuestions.filter(q => q.userId === userId);
    }
    return this.securityQuestions;
  }

  async createSecurityQuestion(question: schema.InsertSecurityQuestion): Promise<schema.SecurityQuestion> {
    const newQuestion: schema.SecurityQuestion = {
      id: this.idCounters.securityQuestions++,
      ...question,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.securityQuestions.push(newQuestion);
    return newQuestion;
  }

  async updateSecurityQuestion(id: number, question: Partial<schema.InsertSecurityQuestion>): Promise<schema.SecurityQuestion | undefined> {
    const index = this.securityQuestions.findIndex(q => q.id === id);
    if (index === -1) return undefined;
    
    this.securityQuestions[index] = {
      ...this.securityQuestions[index],
      ...question,
      updatedAt: new Date()
    };
    return this.securityQuestions[index];
  }

  async deleteSecurityQuestion(id: number): Promise<boolean> {
    const index = this.securityQuestions.findIndex(q => q.id === id);
    if (index === -1) return false;
    
    this.securityQuestions.splice(index, 1);
    return true;
  }

  async hasSecurityQuestions(userId: number): Promise<boolean> {
    return this.securityQuestions.some(q => q.userId === userId);
  }

  async verifySecurityQuestions(userId: number, questions: { question: string, answer: string }[]): Promise<boolean> {
    const userQuestions = this.securityQuestions.filter(q => q.userId === userId);
    
    for (const inputQ of questions) {
      const found = userQuestions.find(q => 
        q.question === inputQ.question && 
        q.answer.toLowerCase() === inputQ.answer.toLowerCase()
      );
      if (!found) return false;
    }
    return true;
  }

  // Password Reset operations
  async createPasswordResetToken(userId: number): Promise<schema.PasswordResetToken> {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    const resetToken: schema.PasswordResetToken = {
      id: this.idCounters.passwordResetTokens++,
      userId,
      token,
      expiresAt,
      used: false,
      createdAt: new Date()
    };
    
    this.passwordResetTokens.push(resetToken);
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<schema.PasswordResetToken | undefined> {
    return this.passwordResetTokens.find(t => t.token === token);
  }

  async validatePasswordResetToken(token: string): Promise<number | undefined> {
    const resetToken = this.passwordResetTokens.find(t => 
      t.token === token && 
      !t.used && 
      t.expiresAt > new Date()
    );
    return resetToken?.userId;
  }

  async invalidatePasswordResetToken(token: string): Promise<boolean> {
    const resetToken = this.passwordResetTokens.find(t => t.token === token);
    if (!resetToken) return false;
    
    resetToken.used = true;
    return true;
  }

  // User operations
  async getUser(id: string | number): Promise<schema.User | undefined> {
    const userId = typeof id === "string" ? parseInt(id) : id;
    return this.users.find(u => u.id === userId);
  }

  async getUserByUsername(username: string): Promise<schema.User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async createUser(user: schema.InsertUser): Promise<schema.User> {
    const newUser: schema.User = {
      id: this.idCounters.users++,
      ...user,
      isActive: user.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<schema.InsertUser>): Promise<schema.User | undefined> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    
    this.users[index] = {
      ...this.users[index],
      ...userData,
      updatedAt: new Date()
    };
    return this.users[index];
  }

  async deleteUser(id: number): Promise<boolean> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    
    this.users.splice(index, 1);
    return true;
  }

  async getAllUsers(): Promise<schema.User[]> {
    return this.users;
  }

  async upsertUser(userData: UpsertUser): Promise<schema.User> {
    const existingUser = this.users.find(u => u.id === parseInt(userData.id));
    
    if (existingUser) {
      const updatedUser = {
        ...existingUser,
        email: userData.email || existingUser.email,
        firstName: userData.firstName || existingUser.firstName,
        lastName: userData.lastName || existingUser.lastName,
        profileImageUrl: userData.profileImageUrl || existingUser.profileImageUrl,
        accessLevel: userData.accessLevel || existingUser.accessLevel,
        updatedAt: new Date()
      };
      
      const index = this.users.findIndex(u => u.id === parseInt(userData.id));
      this.users[index] = updatedUser;
      return updatedUser;
    } else {
      const newUser: schema.User = {
        id: parseInt(userData.id),
        username: userData.email || `user_${userData.id}`,
        password: "", // Will be set later
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        accessLevel: userData.accessLevel || "1",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.users.push(newUser);
      return newUser;
    }
  }

  // Employee operations
  async getEmployee(id: number): Promise<schema.Employee | undefined> {
    return this.employees.find(e => e.id === id);
  }

  async createEmployee(employee: schema.InsertEmployee): Promise<schema.Employee> {
    const newEmployee: schema.Employee = {
      id: this.idCounters.employees++,
      ...employee,
      isActive: employee.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.employees.push(newEmployee);
    return newEmployee;
  }

  async updateEmployee(id: number, employeeData: Partial<schema.InsertEmployee>): Promise<schema.Employee | undefined> {
    const index = this.employees.findIndex(e => e.id === id);
    if (index === -1) return undefined;
    
    this.employees[index] = {
      ...this.employees[index],
      ...employeeData,
      updatedAt: new Date()
    };
    return this.employees[index];
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const index = this.employees.findIndex(e => e.id === id);
    if (index === -1) return false;
    
    this.employees.splice(index, 1);
    return true;
  }

  async getAllEmployees(): Promise<schema.Employee[]> {
    return this.employees;
  }

  async searchEmployees(query: string): Promise<schema.Employee[]> {
    const lowerQuery = query.toLowerCase();
    return this.employees.filter(e => 
      e.name.toLowerCase().includes(lowerQuery) ||
      e.email.toLowerCase().includes(lowerQuery) ||
      e.department.toLowerCase().includes(lowerQuery) ||
      e.position.toLowerCase().includes(lowerQuery) ||
      e.employeeId.toLowerCase().includes(lowerQuery)
    );
  }

  // Asset operations
  async getAsset(id: number): Promise<schema.Asset | undefined> {
    return this.assets.find(a => a.id === id);
  }

  async getAssetByAssetId(assetId: string): Promise<schema.Asset | undefined> {
    return this.assets.find(a => a.assetId === assetId);
  }

  async createAsset(asset: schema.InsertAsset): Promise<schema.Asset> {
    const newAsset: schema.Asset = {
      id: this.idCounters.assets++,
      ...asset,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.assets.push(newAsset);
    return newAsset;
  }

  async updateAsset(id: number, assetData: Partial<schema.InsertAsset>): Promise<schema.Asset | undefined> {
    const index = this.assets.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    
    this.assets[index] = {
      ...this.assets[index],
      ...assetData,
      updatedAt: new Date()
    };
    return this.assets[index];
  }

  async deleteAsset(id: number): Promise<boolean> {
    const index = this.assets.findIndex(a => a.id === id);
    if (index === -1) return false;
    
    this.assets.splice(index, 1);
    return true;
  }

  async getAllAssets(): Promise<schema.Asset[]> {
    return this.assets;
  }

  async getAssetsByStatus(status: string): Promise<schema.Asset[]> {
    return this.assets.filter(a => a.status === status);
  }

  async getAssetsByType(type: string): Promise<schema.Asset[]> {
    return this.assets.filter(a => a.type === type);
  }

  async getAssetsForEmployee(employeeId: number): Promise<schema.Asset[]> {
    return this.assets.filter(a => a.employeeId === employeeId);
  }

  // Asset Maintenance operations
  async createAssetMaintenance(maintenance: schema.InsertAssetMaintenance): Promise<schema.AssetMaintenance> {
    const newMaintenance: schema.AssetMaintenance = {
      id: this.idCounters.assetMaintenance++,
      ...maintenance,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.assetMaintenance.push(newMaintenance);
    
    // Log maintenance activity
    const asset = this.assets.find(a => a.id === maintenance.assetId);
    await this.logActivity({
      userId: 1,
      action: 'CREATE',
      entityType: 'ASSET_MAINTENANCE',
      entityId: maintenance.assetId,
      details: {
        assetId: asset?.assetId,
        maintenanceType: maintenance.type,
        description: maintenance.description,
        cost: maintenance.cost
      }
    });
    
    return newMaintenance;
  }

  async getMaintenanceForAsset(assetId: number): Promise<schema.AssetMaintenance[]> {
    return this.assetMaintenance.filter(m => m.assetId === assetId);
  }

  // Asset Transaction operations
  async createAssetTransaction(transaction: schema.InsertAssetTransaction): Promise<schema.AssetTransaction> {
    const newTransaction: schema.AssetTransaction = {
      id: this.idCounters.assetTransactions++,
      ...transaction,
      createdAt: new Date()
    };
    this.assetTransactions.push(newTransaction);
    
    // Log the transaction activity
    const asset = this.assets.find(a => a.id === transaction.assetId);
    const employee = transaction.employeeId ? this.employees.find(e => e.id === transaction.employeeId) : null;
    
    await this.logActivity({
      userId: 1, // System user for automated transactions
      action: transaction.type === 'Check-Out' ? 'CHECK_OUT' : 'CHECK_IN',
      entityType: 'ASSET',
      entityId: transaction.assetId,
      details: {
        assetId: asset?.assetId,
        employeeName: employee?.name,
        notes: transaction.notes
      }
    });
    
    return newTransaction;
  }

  async getAssetTransactions(assetId: number): Promise<schema.AssetTransaction[]> {
    return this.assetTransactions.filter(t => t.assetId === assetId);
  }

  async getEmployeeTransactions(employeeId: number): Promise<schema.AssetTransaction[]> {
    return this.assetTransactions.filter(t => t.employeeId === employeeId);
  }

  async getAllAssetTransactions(): Promise<schema.AssetTransaction[]> {
    return this.assetTransactions;
  }

  async checkOutAsset(assetId: number, employeeId: number, notes?: string, type: string = 'Check-Out'): Promise<schema.AssetTransaction> {
    const asset = await this.getAsset(assetId);
    if (!asset) throw new Error('Asset not found');

    // Update asset status and assignment
    await this.updateAsset(assetId, {
      status: 'In Use',
      employeeId: employeeId
    });

    // Create transaction with proper ID generation
    const newTransaction: schema.AssetTransaction = {
      id: this.idCounters.assetTransactions++,
      assetId,
      employeeId,
      type,
      notes: notes || `Asset checked out to employee ${employeeId}`,
      transactionDate: new Date(),
      createdAt: new Date()
    };
    
    this.assetTransactions.push(newTransaction);
    
    // Log activity
    const employee = this.employees.find(e => e.id === employeeId);
    await this.logActivity({
      userId: 1,
      action: 'CHECK_OUT',
      entityType: 'ASSET',
      entityId: assetId,
      details: {
        assetId: asset.assetId,
        employeeName: employee?.name,
        notes: notes
      }
    });
    
    return newTransaction;
  }

  async checkInAsset(assetId: number, notes?: string, type: string = 'Check-In'): Promise<schema.AssetTransaction> {
    const asset = await this.getAsset(assetId);
    if (!asset) throw new Error('Asset not found');

    const employeeId = asset.employeeId;

    // Update asset status and remove assignment
    await this.updateAsset(assetId, {
      status: 'Available',
      employeeId: null
    });

    // Create transaction
    return this.createAssetTransaction({
      assetId,
      employeeId: employeeId || 0,
      type,
      notes: notes || `Asset checked in`,
      transactionDate: new Date()
    });
  }

  // Asset Sales operations
  async createAssetSale(sale: schema.InsertAssetSale): Promise<schema.AssetSale> {
    const newSale: schema.AssetSale = {
      id: this.idCounters.assetSales++,
      ...sale,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.assetSales.push(newSale);
    return newSale;
  }

  async addAssetToSale(saleItem: schema.InsertAssetSaleItem): Promise<schema.AssetSaleItem> {
    const newSaleItem: schema.AssetSaleItem = {
      id: this.idCounters.assetSaleItems++,
      ...saleItem,
      createdAt: new Date()
    };
    this.assetSaleItems.push(newSaleItem);
    return newSaleItem;
  }

  async getAssetSales(): Promise<schema.AssetSale[]> {
    return this.assetSales;
  }

  // Ticket operations
  async getTicket(id: number): Promise<schema.Ticket | undefined> {
    return this.tickets.find(t => t.id === id);
  }

  async getTicketByTicketId(ticketId: string): Promise<schema.Ticket | undefined> {
    return this.tickets.find(t => t.ticketId === ticketId);
  }

  async createTicket(ticket: schema.InsertTicket): Promise<schema.Ticket> {
    const newTicket: schema.Ticket = {
      id: this.idCounters.tickets++,
      ...ticket,
      status: ticket.status || 'Open',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tickets.push(newTicket);
    return newTicket;
  }

  async updateTicket(id: number, ticketData: Partial<schema.InsertTicket>): Promise<schema.Ticket | undefined> {
    const index = this.tickets.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    
    this.tickets[index] = {
      ...this.tickets[index],
      ...ticketData,
      updatedAt: new Date()
    };
    return this.tickets[index];
  }

  async getAllTickets(): Promise<schema.Ticket[]> {
    return this.tickets;
  }

  async getTicketsByStatus(status: string): Promise<schema.Ticket[]> {
    return this.tickets.filter(t => t.status === status);
  }

  async getTicketsForEmployee(employeeId: number): Promise<schema.Ticket[]> {
    return this.tickets.filter(t => t.submittedById === employeeId);
  }

  async getTicketsAssignedToUser(userId: number): Promise<schema.Ticket[]> {
    return this.tickets.filter(t => t.assignedToId === userId);
  }

  // System Config operations
  async getSystemConfig(): Promise<schema.SystemConfig | undefined> {
    return this.systemConfig;
  }

  async updateSystemConfig(config: Partial<schema.InsertSystemConfig>): Promise<schema.SystemConfig | undefined> {
    if (!this.systemConfig) return undefined;
    
    this.systemConfig = {
      ...this.systemConfig,
      ...config,
      updatedAt: new Date()
    };
    return this.systemConfig;
  }

  // Activity Log operations
  async logActivity(activity: schema.InsertActivityLog): Promise<schema.ActivityLog> {
    const newActivity: schema.ActivityLog = {
      id: this.idCounters.activityLogs++,
      ...activity,
      createdAt: new Date()
    };
    this.activityLogs.push(newActivity);
    return newActivity;
  }

  async getRecentActivity(limit: number): Promise<schema.ActivityLog[]> {
    return this.activityLogs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getActivityLogs(options: any): Promise<any> {
    let filtered = [...this.activityLogs];

    if (options.filter) {
      const lowerFilter = options.filter.toLowerCase();
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(lowerFilter) ||
        log.entityType.toLowerCase().includes(lowerFilter) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(lowerFilter))
      );
    }

    if (options.action) {
      filtered = filtered.filter(log => log.action === options.action);
    }

    if (options.entityType) {
      filtered = filtered.filter(log => log.entityType === options.entityType);
    }

    if (options.userId) {
      filtered = filtered.filter(log => log.userId === options.userId);
    }

    if (options.startDate) {
      filtered = filtered.filter(log => log.createdAt >= options.startDate);
    }

    if (options.endDate) {
      filtered = filtered.filter(log => log.createdAt <= options.endDate);
    }

    const totalItems = filtered.length;
    const page = options.page || 1;
    const limit = options.limit || 50;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const data = filtered
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(startIndex, endIndex);

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

  async getActivityLogsCount(options: any): Promise<number> {
    let filtered = [...this.activityLogs];

    if (options.filter) {
      const lowerFilter = options.filter.toLowerCase();
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(lowerFilter) ||
        log.entityType.toLowerCase().includes(lowerFilter) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(lowerFilter))
      );
    }

    return filtered.length;
  }

  async clearActivityLogs(options?: any): Promise<number> {
    const originalLength = this.activityLogs.length;
    
    if (options?.olderThan) {
      this.activityLogs = this.activityLogs.filter(log => log.createdAt >= options.olderThan);
    } else if (options?.entityType) {
      this.activityLogs = this.activityLogs.filter(log => log.entityType !== options.entityType);
    } else if (options?.action) {
      this.activityLogs = this.activityLogs.filter(log => log.action !== options.action);
    } else {
      this.activityLogs = [];
    }
    
    return originalLength - this.activityLogs.length;
  }

  // Changes Log operations
  async getChangesLog(options: any): Promise<any> {
    let filtered = [...this.changesLogs];

    if (options.version) {
      filtered = filtered.filter(log => log.version === options.version);
    }

    if (options.changeType) {
      filtered = filtered.filter(log => log.changeType === options.changeType);
    }

    if (options.status) {
      filtered = filtered.filter(log => log.status === options.status);
    }

    const totalItems = filtered.length;
    const page = options.page || 1;
    const limit = options.limit || 50;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const data = filtered
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(startIndex, endIndex);

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

  async createChangeLog(changeLog: schema.InsertChangeLog): Promise<schema.ChangeLog> {
    const newChangeLog: schema.ChangeLog = {
      id: this.idCounters.changesLogs++,
      ...changeLog,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.changesLogs.push(newChangeLog);
    return newChangeLog;
  }

  async updateChangeLog(id: number, changeLog: Partial<schema.InsertChangeLog>): Promise<schema.ChangeLog | undefined> {
    const index = this.changesLogs.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    
    this.changesLogs[index] = {
      ...this.changesLogs[index],
      ...changeLog,
      updatedAt: new Date()
    };
    return this.changesLogs[index];
  }

  async deleteChangeLog(id: number): Promise<boolean> {
    const index = this.changesLogs.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    this.changesLogs.splice(index, 1);
    return true;
  }

  // Custom Fields operations - only user-defined data from System Configuration
  private customAssetTypes = [
    { id: 1, name: "Laptop", description: "Portable computer devices" },
    { id: 2, name: "Desktop", description: "Desktop computer systems" },
    { id: 3, name: "Monitor", description: "Display screens and monitors" },
    { id: 4, name: "Printer", description: "Printing devices" },
    { id: 5, name: "Server", description: "Server equipment" },
    { id: 6, name: "Network", description: "Networking equipment" }
  ];

  private customAssetBrands = [
    { id: 1, name: "Dell", description: "Dell Technologies" },
    { id: 2, name: "HP", description: "Hewlett-Packard" },
    { id: 3, name: "Lenovo", description: "Lenovo Group" },
    { id: 4, name: "Apple", description: "Apple Inc." }
  ];

  private customAssetStatuses = [
    { id: 1, name: "Available", description: "Ready for assignment", color: "#28a745" },
    { id: 2, name: "In Use", description: "Currently assigned", color: "#007bff" },
    { id: 3, name: "Maintenance", description: "Under maintenance", color: "#ffc107" },
    { id: 4, name: "Damaged", description: "Needs repair", color: "#dc3545" },
    { id: 5, name: "Retired", description: "End of life", color: "#6c757d" }
  ];

  private serviceProviders = [
    { id: 1, name: "Tech Solutions Inc", contactPerson: "John Smith", phone: "555-0101", email: "john@techsolutions.com" },
    { id: 2, name: "Hardware Express", contactPerson: "Sarah Johnson", phone: "555-0102", email: "sarah@hardwareexpress.com" },
    { id: 3, name: "IT Services Pro", contactPerson: "Mike Brown", phone: "555-0103", email: "mike@itservices.com" }
  ];

  async getCustomAssetTypes(): Promise<any[]> {
    return this.customAssetTypes;
  }

  async createCustomAssetType(data: { name: string; description?: string }): Promise<any> {
    const newType = { id: Date.now(), ...data };
    this.customAssetTypes.push(newType);
    return newType;
  }

  async updateCustomAssetType(id: number, data: { name: string; description?: string }): Promise<any | undefined> {
    const index = this.customAssetTypes.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    this.customAssetTypes[index] = { ...this.customAssetTypes[index], ...data };
    return this.customAssetTypes[index];
  }

  async deleteCustomAssetType(id: number): Promise<boolean> {
    const index = this.customAssetTypes.findIndex(t => t.id === id);
    if (index === -1) return false;
    this.customAssetTypes.splice(index, 1);
    return true;
  }

  async getCustomAssetBrands(): Promise<any[]> {
    return this.customAssetBrands;
  }

  async createCustomAssetBrand(data: { name: string; description?: string }): Promise<any> {
    const newBrand = { id: Date.now(), ...data };
    this.customAssetBrands.push(newBrand);
    return newBrand;
  }

  async updateCustomAssetBrand(id: number, data: { name: string; description?: string }): Promise<any | undefined> {
    const index = this.customAssetBrands.findIndex(b => b.id === id);
    if (index === -1) return undefined;
    this.customAssetBrands[index] = { ...this.customAssetBrands[index], ...data };
    return this.customAssetBrands[index];
  }

  async deleteCustomAssetBrand(id: number): Promise<boolean> {
    const index = this.customAssetBrands.findIndex(b => b.id === id);
    if (index === -1) return false;
    this.customAssetBrands.splice(index, 1);
    return true;
  }

  async getCustomAssetStatuses(): Promise<any[]> {
    return this.customAssetStatuses;
  }

  async createCustomAssetStatus(data: { name: string; description?: string; color?: string }): Promise<any> {
    const newStatus = { id: Date.now(), color: "#007bff", ...data };
    this.customAssetStatuses.push(newStatus);
    return newStatus;
  }

  async updateCustomAssetStatus(id: number, data: { name: string; description?: string; color?: string }): Promise<any | undefined> {
    const index = this.customAssetStatuses.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    this.customAssetStatuses[index] = { ...this.customAssetStatuses[index], ...data };
    return this.customAssetStatuses[index];
  }

  async deleteCustomAssetStatus(id: number): Promise<boolean> {
    const index = this.customAssetStatuses.findIndex(s => s.id === id);
    if (index === -1) return false;
    this.customAssetStatuses.splice(index, 1);
    return true;
  }

  async getServiceProviders(): Promise<any[]> {
    return this.serviceProviders;
  }

  async createServiceProvider(data: { name: string; contactPerson?: string; phone?: string; email?: string }): Promise<any> {
    const newProvider = { id: Date.now(), ...data };
    this.serviceProviders.push(newProvider);
    return newProvider;
  }

  async updateServiceProvider(id: number, data: { name: string; contactPerson?: string; phone?: string; email?: string }): Promise<any | undefined> {
    const index = this.serviceProviders.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    this.serviceProviders[index] = { ...this.serviceProviders[index], ...data };
    return this.serviceProviders[index];
  }

  async deleteServiceProvider(id: number): Promise<boolean> {
    const index = this.serviceProviders.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.serviceProviders.splice(index, 1);
    return true;
  }

  // Custom Asset Types operations
  async getCustomAssetTypes(): Promise<any[]> {
    return this.customAssetTypes;
  }

  async createCustomAssetType(type: any): Promise<any> {
    const newType = {
      id: this.idCounters.customAssetTypes++,
      ...type,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.customAssetTypes.push(newType);
    return newType;
  }

  async updateCustomAssetType(id: number, type: any): Promise<any | undefined> {
    const index = this.customAssetTypes.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    
    this.customAssetTypes[index] = {
      ...this.customAssetTypes[index],
      ...type,
      updatedAt: new Date()
    };
    return this.customAssetTypes[index];
  }

  async deleteCustomAssetType(id: number): Promise<boolean> {
    const index = this.customAssetTypes.findIndex(t => t.id === id);
    if (index === -1) return false;
    this.customAssetTypes.splice(index, 1);
    return true;
  }

  // Custom Asset Brands operations
  async getCustomAssetBrands(): Promise<any[]> {
    return this.customAssetBrands;
  }

  async createCustomAssetBrand(brand: any): Promise<any> {
    const newBrand = {
      id: this.idCounters.customAssetBrands++,
      ...brand,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.customAssetBrands.push(newBrand);
    return newBrand;
  }

  async updateCustomAssetBrand(id: number, brand: any): Promise<any | undefined> {
    const index = this.customAssetBrands.findIndex(b => b.id === id);
    if (index === -1) return undefined;
    
    this.customAssetBrands[index] = {
      ...this.customAssetBrands[index],
      ...brand,
      updatedAt: new Date()
    };
    return this.customAssetBrands[index];
  }

  async deleteCustomAssetBrand(id: number): Promise<boolean> {
    const index = this.customAssetBrands.findIndex(b => b.id === id);
    if (index === -1) return false;
    this.customAssetBrands.splice(index, 1);
    return true;
  }

  // Custom Asset Statuses operations
  async getCustomAssetStatuses(): Promise<any[]> {
    return this.customAssetStatuses;
  }

  async createCustomAssetStatus(status: any): Promise<any> {
    const newStatus = {
      id: this.idCounters.customAssetStatuses++,
      ...status,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.customAssetStatuses.push(newStatus);
    return newStatus;
  }

  async updateCustomAssetStatus(id: number, status: any): Promise<any | undefined> {
    const index = this.customAssetStatuses.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    
    this.customAssetStatuses[index] = {
      ...this.customAssetStatuses[index],
      ...status,
      updatedAt: new Date()
    };
    return this.customAssetStatuses[index];
  }

  async deleteCustomAssetStatus(id: number): Promise<boolean> {
    const index = this.customAssetStatuses.findIndex(s => s.id === id);
    if (index === -1) return false;
    this.customAssetStatuses.splice(index, 1);
    return true;
  }

  async removeDemoData(): Promise<void> {
    // Keep only admin user and system config
    const adminUser = this.users.find(u => u.username === "admin");
    this.users = adminUser ? [adminUser] : [];
    this.employees = [];
    this.assets = [];
    this.tickets = [];
    this.activityLogs = [];
    this.changesLogs = [];
    this.securityQuestions = [];
    this.passwordResetTokens = [];
    this.assetTransactions = [];
    this.assetMaintenance = [];
    this.assetSales = [];
    this.assetSaleItems = [];
  }
}