import { IStorage, UpsertUser } from "./storage";
import * as schema from "@shared/schema";
import { hash } from "bcrypt";

// Temporary memory storage implementation to bypass database connection issues
export class MemoryStorage implements IStorage {
  private users: schema.User[] = [];
  private employees: schema.Employee[] = [];
  private assets: schema.Asset[] = [];
  private tickets: schema.Ticket[] = [];
  private activityLogs: schema.ActivityLog[] = [];
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
  private categories: schema.Category[] = [];
  private ticketComments: any[] = [];
  
  private idCounters = {
    users: 1,
    employees: 1,
    assets: 1,
    tickets: 1,
    activityLogs: 1,
    securityQuestions: 1,
    passwordResetTokens: 1,
    assetTransactions: 1,
    assetMaintenance: 1,
    assetSales: 1,
    assetSaleItems: 1,
    customAssetTypes: 1,
    customAssetBrands: 1,
    customAssetStatuses: 1,
    categories: 1,
    ticketComments: 1
  };

  constructor() {
    // Initialize with admin user only
    this.initializeAdminUser();
    this.initializeSystemConfig();
    this.initializeDefaultCategories();
    this.initializeDefaultAssetStatuses();
  }

  private async initializeAdminUser() {
    const hashedPassword = await hash("admin123", 10);
    this.users.push({
      id: this.idCounters.users++,
      username: "admin",
      password: hashedPassword,
      email: "admin@simpleit.com",
      firstName: "System",
      lastName: "Administrator",
      profileImageUrl: null,
      role: "admin",
      employeeId: null,
      managerId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  private initializeSystemConfig() {
    // Initialize system config with English as default language
    this.systemConfig = {
      id: 1,
      language: "en", // Default language: English
      assetIdPrefix: "AST",
      empIdPrefix: "EMP",
      ticketIdPrefix: "TKT",
      currency: "USD",
      departments: ["IT", "HR", "Finance", "Operations"],
      assetTypes: ["Hardware", "Software"],
      assetBrands: ["Dell", "HP", "Lenovo", "Apple"],
      assetStatuses: ["Available", "In Use", "Maintenance","Sold" ,"Retired"],
      emailHost: null,
      emailPort: null,
      emailUser: null,
      emailPassword: null,
      emailSecure: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private initializeDefaultCategories() {
    // Check for existing categories to prevent duplicates
    if (this.categories.length > 0) {
      return;
    }
    
    // Default categories for tickets
    this.categories = [
      {
        id: this.idCounters.categories++,
        name: "Hardware",
        description: "Hardware-related issues and requests",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.idCounters.categories++,
        name: "Software", 
        description: "Software installation and application support",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.idCounters.categories++,
        name: "Network",
        description: "Network connectivity and infrastructure issues", 
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.idCounters.categories++,
        name: "Access Control",
        description: "User access and permission requests",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.idCounters.categories++,
        name: "Security",
        description: "Security incidents and compliance issues",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  private initializeDefaultAssetStatuses() {
    // Check for existing asset statuses to prevent duplicates
    if (this.customAssetStatuses.length > 0) {
      return;
    }
    
    // Standard asset statuses with color coding
    this.customAssetStatuses = [
      {
        id: this.idCounters.customAssetStatuses++,
        name: "Available",
        description: "Asset is ready for assignment",
        color: "#22c55e", // Green
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.idCounters.customAssetStatuses++,
        name: "In Use",
        description: "Asset is currently assigned and active",
        color: "#3b82f6", // Blue
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.idCounters.customAssetStatuses++,
        name: "Under Maintenance",
        description: "Asset is being serviced or repaired",
        color: "#f59e0b", // Amber
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.idCounters.customAssetStatuses++,
        name: "Damaged",
        description: "Asset requires repair or replacement",
        color: "#ef4444", // Red
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.idCounters.customAssetStatuses++,
        name: "Retired",
        description: "Asset is at end of life, no longer in use",
        color: "#6b7280", // Gray
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.idCounters.customAssetStatuses++,
        name: "Lost",
        description: "Asset cannot be located",
        color: "#dc2626", // Dark Red
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.idCounters.customAssetStatuses++,
        name: "Sold",
        description: "Asset has been sold",
        color: "#8b5cf6", // Purple
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

  async getUserByEmail(email: string): Promise<schema.User | undefined> {
    return this.users.find(u => u.email === email);
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
        role: userData.role || existingUser.role,
        updatedAt: new Date()
      };
      
      const index = this.users.findIndex(u => u.id === parseInt(userData.id));
      this.users[index] = updatedUser;
      return updatedUser;
    } else {
      // Check for duplicate usernames or emails before creating
      const duplicateUsername = this.users.find(u => u.username === (userData.email || `user_${userData.id}`));
      const duplicateEmail = userData.email ? this.users.find(u => u.email === userData.email) : null;
      
      if (duplicateUsername || duplicateEmail) {
        throw new Error('User with this username or email already exists');
      }
      
      const newUser: schema.User = {
        id: parseInt(userData.id),
        username: userData.email || `user_${userData.id}`,
        password: "", // Will be set later
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        role: userData.role || "employee",
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

  async createEmployee(employee: any): Promise<schema.Employee> {
    // Check for duplicate employee IDs or emails
    const duplicateEmployeeId = this.employees.find(e => e.employeeId === employee.employeeId);
    const employeeEmail = employee.email || employee.personalEmail || employee.corporateEmail || `${(employee.englishName || 'employee').toLowerCase().replace(/\s+/g, '.')}@eladwysoft.com`;
    const duplicateEmail = this.employees.find(e => e.email === employeeEmail);
    
    if (duplicateEmployeeId) {
      throw new Error(`Employee with ID ${employee.employeeId} already exists`);
    }
    
    if (duplicateEmail) {
      throw new Error(`Employee with email ${employeeEmail} already exists`);
    }
    
    const newEmployee: any = {
      id: this.idCounters.employees++,
      name: employee.name || employee.englishName,
      email: employeeEmail,
      phone: employee.phone || employee.personalMobile || employee.workMobile || '',
      department: employee.department,
      position: employee.position || employee.title,
      employeeId: employee.employeeId,
      isActive: employee.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Extended fields for full compatibility - use null instead of undefined
      empId: employee.employeeId,
      englishName: employee.englishName || employee.name,
      arabicName: employee.arabicName || null,
      idNumber: employee.idNumber || null,
      title: employee.title || employee.position,
      directManager: employee.directManager || null,
      employmentType: employee.employmentType || 'Full-time',
      joiningDate: employee.joiningDate || null,
      exitDate: employee.exitDate || null,
      status: employee.status || 'Active',
      personalMobile: employee.personalMobile || null,
      workMobile: employee.workMobile || null,
      personalEmail: employee.personalEmail || employee.email || employeeEmail,
      corporateEmail: employee.corporateEmail || null,
      userId: employee.userId || null
    };
    this.employees.push(newEmployee);
    return newEmployee;
  }

  async updateEmployee(id: number, employeeData: any): Promise<schema.Employee | undefined> {
    const index = this.employees.findIndex(e => e.id === id);
    if (index === -1) return undefined;
    
    const existing = this.employees[index];
    const updated = {
      ...existing,
      name: employeeData.name || employeeData.englishName || existing.name,
      email: employeeData.email || employeeData.personalEmail || employeeData.corporateEmail || existing.email,
      phone: employeeData.phone || employeeData.personalMobile || employeeData.workMobile || existing.phone,
      department: employeeData.department || existing.department,
      position: employeeData.position || employeeData.title || existing.position,
      isActive: employeeData.isActive ?? existing.isActive,
      updatedAt: new Date(),
      // Update extended fields
      englishName: employeeData.englishName || existing.englishName,
      arabicName: employeeData.arabicName ?? existing.arabicName,
      idNumber: employeeData.idNumber || existing.idNumber,
      title: employeeData.title || employeeData.position || existing.title,
      directManager: employeeData.directManager ?? existing.directManager,
      employmentType: employeeData.employmentType || existing.employmentType,
      joiningDate: employeeData.joiningDate || existing.joiningDate,
      exitDate: employeeData.exitDate ?? existing.exitDate,
      status: employeeData.status || existing.status,
      personalMobile: employeeData.personalMobile ?? existing.personalMobile,
      workMobile: employeeData.workMobile ?? existing.workMobile,
      personalEmail: employeeData.personalEmail || existing.personalEmail,
      corporateEmail: employeeData.corporateEmail ?? existing.corporateEmail,
      userId: employeeData.userId ?? existing.userId,
    };
    
    this.employees[index] = updated;
    console.log('Updated employee in storage:', updated);
    return updated;
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

  async getAssetMaintenanceById(id: number): Promise<schema.AssetMaintenance | undefined> {
    return this.assetMaintenance.find(m => m.id === id);
  }

  async updateAssetMaintenance(id: number, maintenanceData: Partial<schema.InsertAssetMaintenance>): Promise<schema.AssetMaintenance | undefined> {
    const index = this.assetMaintenance.findIndex(m => m.id === id);
    if (index === -1) return undefined;

    const updatedMaintenance = {
      ...this.assetMaintenance[index],
      ...maintenanceData,
      updatedAt: new Date()
    };
    this.assetMaintenance[index] = updatedMaintenance;

    // Log activity
    await this.logActivity({
      userId: 1,
      action: 'UPDATE',
      entityType: 'ASSET_MAINTENANCE',
      entityId: id,
      details: {
        maintenanceId: id,
        changes: maintenanceData
      }
    });

    return updatedMaintenance;
  }

  async deleteAssetMaintenance(id: number): Promise<boolean> {
    const index = this.assetMaintenance.findIndex(m => m.id === id);
    if (index === -1) return false;

    const maintenance = this.assetMaintenance[index];
    this.assetMaintenance.splice(index, 1);

    // Log activity
    await this.logActivity({
      userId: 1,
      action: 'DELETE',
      entityType: 'ASSET_MAINTENANCE',
      entityId: id,
      details: {
        maintenanceId: id,
        assetId: maintenance.assetId,
        type: maintenance.type,
        description: maintenance.description
      }
    });

    return true;
  }

  async getAllMaintenanceRecords(): Promise<schema.AssetMaintenance[]> {
    return this.assetMaintenance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
      assignedEmployeeId: employeeId
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

    const employeeId = asset.assignedEmployeeId;

    // Update asset status and remove assignment
    await this.updateAsset(assetId, {
      status: 'Available',
      assignedEmployeeId: null
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
    
    const oldTicket = { ...this.tickets[index] };
    
    this.tickets[index] = {
      ...this.tickets[index],
      ...ticketData,
      updatedAt: new Date()
    };
    
    // Create history entries for changes
    const changes = Object.keys(ticketData).filter(key => 
      oldTicket[key as keyof schema.Ticket] !== ticketData[key as keyof Partial<schema.InsertTicket>]
    );
    
    for (const field of changes) {
      const oldValue = oldTicket[field as keyof schema.Ticket];
      const newValue = ticketData[field as keyof Partial<schema.InsertTicket>];
    }
    
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

  // Clear audit logs
  async clearAuditLogs(options: { olderThan?: Date; entityType?: string; action?: string }): Promise<{ deletedCount: number }> {
    const initialCount = this.activityLogs.length;
    
    this.activityLogs = this.activityLogs.filter(log => {
      // Check date filter
      if (options.olderThan && log.createdAt > options.olderThan) {
        return true; // Keep this log (it's newer than the cutoff)
      }
      
      // Check entity type filter
      if (options.entityType && log.entityType !== options.entityType) {
        return true; // Keep this log (different entity type)
      }
      
      // Check action filter
      if (options.action && log.action !== options.action) {
        return true; // Keep this log (different action)
      }
      
      // If we reach here, the log matches all filters and should be deleted
      return false;
    });
    
    const deletedCount = initialCount - this.activityLogs.length;
    return { deletedCount };
  }
  // Custom Asset Types, Brands, and Statuses operations
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

  // Categories operations (replaces Custom Request Types)
  async getCategories(): Promise<schema.Category[]> {
    return this.categories.filter(category => category.isActive);
  }

  async getAllCategories(): Promise<schema.Category[]> {
    return this.categories;
  }

  async createCategory(category: schema.InsertCategory): Promise<schema.Category> {
    const newCategory: schema.Category = {
      id: this.idCounters.categories++,
      ...category,
      isActive: category.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.categories.push(newCategory);
    
    // Log activity
    await this.logActivity({
      action: "Created",
      entityType: "Category",
      entityId: newCategory.id,
      userId: 1, // System user
      details: { name: newCategory.name, description: newCategory.description }
    });
    
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<schema.InsertCategory>): Promise<schema.Category | undefined> {
    const index = this.categories.findIndex(cat => cat.id === id);
    if (index === -1) return undefined;
    
    const oldCategory = { ...this.categories[index] };
    this.categories[index] = {
      ...this.categories[index],
      ...category,
      updatedAt: new Date()
    };
    
    // Log activity
    await this.logActivity({
      action: "Updated",
      entityType: "Category",
      entityId: id,
      userId: 1, // System user
      details: { 
        old: { name: oldCategory.name, description: oldCategory.description },
        new: { name: this.categories[index].name, description: this.categories[index].description }
      }
    });
    
    return this.categories[index];
  }

  async deleteCategory(id: number): Promise<boolean> {
    const index = this.categories.findIndex(cat => cat.id === id);
    if (index === -1) return false;
    
    const category = this.categories[index];
    this.categories.splice(index, 1);
    
    // Log activity
    await this.logActivity({
      action: "Deleted",
      entityType: "Category",
      entityId: id,
      userId: 1, // System user
      details: { name: category.name }
    });
    
    return true;
  }

  // Enhanced Ticket Update with history tracking (Feature 5: Update ticket details)
  async updateTicketWithHistory(id: number, ticketData: Partial<schema.InsertTicket>, userId: number): Promise<schema.Ticket | undefined> {
    const ticket = this.tickets.find(t => t.id === id);
    if (!ticket) return undefined;
    
    const oldTicket = { ...ticket };
    const changes: string[] = [];
    
    // Track changes
    if (ticketData.status && ticketData.status !== ticket.status) {
      changes.push(`Status changed from "${ticket.status}" to "${ticketData.status}"`);
    }
    if (ticketData.priority && ticketData.priority !== ticket.priority) {
      changes.push(`Priority changed from "${ticket.priority}" to "${ticketData.priority}"`);
    }
    if (ticketData.assignedToId && ticketData.assignedToId !== ticket.assignedToId) {
      const oldAssignee = ticket.assignedToId ? await this.getUser(ticket.assignedToId) : null;
      const newAssignee = await this.getUser(ticketData.assignedToId);
      changes.push(`Assigned from "${oldAssignee?.username || 'Unassigned'}" to "${newAssignee?.username || 'Unassigned'}"`);
    }
    if (ticketData.description && ticketData.description !== ticket.description) {
      changes.push("Description updated");
    }
    if (ticketData.categoryId && ticketData.categoryId !== ticket.categoryId) {
      const oldCategory = this.categories.find(c => c.id === ticket.categoryId);
      const newCategory = this.categories.find(c => c.id === ticketData.categoryId);
      changes.push(`Category changed from "${oldCategory?.name || 'None'}" to "${newCategory?.name || 'None'}"`);
    }
    
    // Update ticket
    Object.assign(ticket, ticketData);
    ticket.updatedAt = new Date();
    
    // Log activity
    await this.logActivity({
      action: "Updated",
      entityType: "Ticket",
      entityId: id,
      userId,
      details: { 
        ticketId: ticket.ticketId, 
        changes: changes.join("; ")
      }
    });
    
    return ticket;
  }

  // Delete Ticket with admin permission (Feature 4: Delete ticket function - admin only)
  async deleteTicket(id: number, userId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || user.role !== 'admin') { // Only admin can delete
      throw new Error("Unauthorized: Only administrators can delete tickets");
    }
    
    const ticketIndex = this.tickets.findIndex(t => t.id === id);
    if (ticketIndex === -1) return false;
    
    const ticket = this.tickets[ticketIndex];
    
    // Remove ticket
    this.tickets.splice(ticketIndex, 1);
    
    // Log activity
    await this.logActivity({
      action: "Deleted",
      entityType: "Ticket",
      entityId: id,
      userId,
      details: { 
        ticketId: ticket.ticketId,
        description: ticket.description,
        status: ticket.status
      }
    });
    
    return true;
  }

  // Advanced ticket management operations
  async getEnhancedTickets(): Promise<any[]> {
    const tickets = [...this.tickets];
    const enhanced = await Promise.all(tickets.map(async (ticket) => {
      const submittedBy = await this.getEmployee(ticket.submittedById);
      const assignedTo = ticket.assignedToId ? await this.getUser(ticket.assignedToId) : undefined;
      const comments = this.ticketComments.filter(c => c.ticketId === ticket.id);
      
      return {
        ...ticket,
        submittedBy: submittedBy ? {
          firstName: submittedBy.firstName || submittedBy.name?.split(' ')[0] || '',
          lastName: submittedBy.lastName || submittedBy.name?.split(' ')[1] || '',
          department: submittedBy.department || ''
        } : undefined,
        assignedTo: assignedTo ? {
          firstName: assignedTo.firstName || '',
          lastName: assignedTo.lastName || ''
        } : undefined,
        comments,
        attachments: [],
        tags: []
      };
    }));
    
    return enhanced;
  }

  async addTicketComment(commentData: any): Promise<any> {
    const comment = {
      id: this.idCounters.ticketComments++,
      ...commentData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.ticketComments.push(comment);
    
    return comment;
  }

}