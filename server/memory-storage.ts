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
  private customAssetTypes: schema.CustomAssetType[] = [];
  private customAssetBrands: schema.CustomAssetBrand[] = [];
  private customAssetStatuses: schema.CustomAssetStatus[] = [];
  private serviceProviders: schema.ServiceProvider[] = [];
  private customRequestTypes: schema.CustomRequestType[] = [];
  private ticketHistory: schema.TicketHistory[] = [];
  private ticketCategories: schema.TicketCategory[] = [];
  private ticketComments: schema.TicketComment[] = [];
  private timeEntries: any[] = [];
  private comments: schema.TicketComment[] = [];
  
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
    serviceProviders: 1,
    customRequestTypes: 1,
    ticketHistory: 1,
    ticketCategories: 1,
    timeEntries: 1,
    comments: 1,
    ticketComments: 1
  };

  constructor() {
    // Initialize with admin user only
    this.initializeAdminUser();
    this.initializeSystemConfig();
    this.initializeDefaultRequestTypes();
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
    // Initialize system config
    this.systemConfig = {
      id: 1,
      language: "en",
      assetIdPrefix: "AST",
      empIdPrefix: "EMP",
      ticketIdPrefix: "TKT",
      currency: "USD",
      departments: ["IT", "HR", "Finance", "Operations"],
      assetTypes: ["Hardware", "Software"],
      assetBrands: ["Dell", "HP", "Lenovo", "Apple"],
      assetStatuses: ["Available", "In Use", "Under Maintenance", "Retired"],
      emailHost: null,
      emailPort: null,
      emailUser: null,
      emailPassword: null,
      emailSecure: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Removed all sample data for clean production deployment

  // Custom asset data removed for clean production deployment

  private initializeDefaultRequestTypes() {
    // Check for existing request types to prevent duplicates
    if (this.customRequestTypes.length > 0) {
      return;
    }
    
    // Default request types for tickets
    this.customRequestTypes = [
      {
        id: this.idCounters.customRequestTypes++,
        name: "Hardware",
        description: "Hardware-related issues and requests",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.idCounters.customRequestTypes++,
        name: "Software", 
        description: "Software installation and application support",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.idCounters.customRequestTypes++,
        name: "Network",
        description: "Network connectivity and infrastructure issues", 
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.idCounters.customRequestTypes++,
        name: "Access Control",
        description: "User access and permission requests",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.idCounters.customRequestTypes++,
        name: "Security",
        description: "Security incidents and compliance issues",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  private addSampleTickets() {
    // Helper function to calculate priority based on urgency and impact (ITIL best practice)
    const calculatePriority = (urgency: string, impact: string): string => {
      const matrix = {
        'Critical': { 'Critical': 'High', 'High': 'High', 'Medium': 'High', 'Low': 'Medium' },
        'High': { 'Critical': 'High', 'High': 'High', 'Medium': 'Medium', 'Low': 'Medium' },
        'Medium': { 'Critical': 'High', 'High': 'Medium', 'Medium': 'Medium', 'Low': 'Low' },
        'Low': { 'Critical': 'Medium', 'High': 'Medium', 'Medium': 'Low', 'Low': 'Low' }
      };
      return matrix[urgency]?.[impact] || 'Medium';
    };

    // Add ITIL-compliant sample tickets
    const sampleTickets = [
      {
        id: this.idCounters.tickets++,
        ticketId: "TKT-0001",
        summary: "Email server connectivity issues",
        description: "Users are unable to access their email accounts through Outlook. Connection timeouts reported.",
        category: "Incident",
        requestType: "Network",
        urgency: "High",
        impact: "High",
        priority: "High",
        status: "Open",
        submittedById: 1,
        assignedToId: null,
        relatedAssetId: null,
        rootCause: "",
        workaround: "Use webmail interface temporarily",
        resolution: "",
        resolutionNotes: "",
        slaTarget: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        escalationLevel: 0,
        isTimeTracking: false,
        timeSpent: 0,
        timeTrackingStartedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.idCounters.tickets++,
        ticketId: "TKT-0002",
        summary: "New employee laptop setup request",
        description: "New hire John Smith requires laptop configuration with standard software package and domain access.",
        category: "Service Request",
        requestType: "Hardware",
        urgency: "Medium",
        impact: "Low",
        priority: "Low",
        status: "In Progress",
        submittedById: 1,
        assignedToId: 1,
        relatedAssetId: 1,
        rootCause: "",
        workaround: "",
        resolution: "",
        resolutionNotes: "",
        slaTarget: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        escalationLevel: 0,
        isTimeTracking: true,
        timeSpent: 45,
        timeTrackingStartedAt: new Date(),
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date()
      },
      {
        id: this.idCounters.tickets++,
        ticketId: "TKT-0003",
        summary: "Recurring printer driver crashes",
        description: "HP LaserJet printer driver crashes repeatedly on Windows 10 workstations causing print queue failures.",
        category: "Problem",
        requestType: "Software",
        urgency: "Medium",
        impact: "Medium",
        priority: "Medium",
        status: "Resolved",
        submittedById: 1,
        assignedToId: 1,
        relatedAssetId: null,
        rootCause: "Outdated printer driver incompatible with latest Windows updates",
        workaround: "Restart print spooler service when crashes occur",
        resolution: "Updated to latest printer driver version",
        resolutionNotes: "Downloaded driver v3.2.1 from HP website and deployed via Group Policy. Tested on 5 workstations successfully.",
        slaTarget: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        escalationLevel: 0,
        isTimeTracking: false,
        timeSpent: 120,
        timeTrackingStartedAt: null,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date()
      }
    ];

    // Calculate priority for each ticket and add to tickets array
    sampleTickets.forEach(ticket => {
      ticket.priority = calculatePriority(ticket.urgency, ticket.impact);
      this.tickets.push(ticket);
    });

    // Add sample ticket history entries
    this.ticketHistory.push(
      {
        id: this.idCounters.ticketHistory++,
        ticketId: 1,
        changedBy: 1,
        changeType: "Status Change",
        oldValue: "New",
        newValue: "Open",
        changeDescription: "Ticket opened and assigned to IT team",
        createdAt: new Date()
      },
      {
        id: this.idCounters.ticketHistory++,
        ticketId: 2,
        changedBy: 1,
        changeType: "Assignment",
        oldValue: "Unassigned",
        newValue: "John Doe",
        changeDescription: "Assigned to John Doe for laptop configuration",
        createdAt: new Date()
      },
      {
        id: this.idCounters.ticketHistory++,
        ticketId: 3,
        changedBy: 1,
        changeType: "Resolution",
        oldValue: "In Progress",
        newValue: "Resolved",
        changeDescription: "Driver issue resolved with latest update",
        createdAt: new Date()
      }
    );
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
      userId: employee.userId || null,
      createdAt: new Date(),
      updatedAt: new Date()
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
      
      await this.addTicketHistory({
        ticketId: id,
        changedBy: 1, // Default to admin user for now
        changeType: 'field_update',
        oldValue: oldValue?.toString() || '',
        newValue: newValue?.toString() || '',
        changeDescription: `Updated ${field} from "${oldValue}" to "${newValue}"`
      });
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

  // Custom request types management
  async getAllCustomRequestTypes(): Promise<any[]> {
    return this.customRequestTypes;
  }

  async createCustomRequestType(data: { name: string; description?: string }): Promise<any> {
    const requestType = {
      id: this.idCounters.customRequestTypes++,
      name: data.name,
      description: data.description || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.customRequestTypes.push(requestType);
    return requestType;
  }

  async updateCustomRequestType(id: number, data: { name: string; description?: string }): Promise<any> {
    const index = this.customRequestTypes.findIndex(rt => rt.id === id);
    if (index === -1) return null;

    this.customRequestTypes[index] = {
      ...this.customRequestTypes[index],
      name: data.name,
      description: data.description || '',
      updatedAt: new Date()
    };

    return this.customRequestTypes[index];
  }

  async deleteCustomRequestType(id: number): Promise<boolean> {
    const index = this.customRequestTypes.findIndex(rt => rt.id === id);
    if (index === -1) return false;

    this.customRequestTypes.splice(index, 1);
    return true;
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

  // Custom Request Types operations (Feature 1: Change Category to Request Type)
  async getCustomRequestTypes(): Promise<schema.CustomRequestType[]> {
    return this.customRequestTypes.filter(type => type.isActive);
  }

  async getAllCustomRequestTypes(): Promise<schema.CustomRequestType[]> {
    return this.customRequestTypes;
  }

  async createCustomRequestType(requestType: schema.InsertCustomRequestType): Promise<schema.CustomRequestType> {
    const newRequestType: schema.CustomRequestType = {
      id: this.idCounters.customRequestTypes++,
      ...requestType,
      isActive: requestType.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.customRequestTypes.push(newRequestType);
    
    // Log activity
    await this.logActivity({
      action: "Created",
      entityType: "Request Type",
      entityId: newRequestType.id,
      userId: 1, // System user
      details: { name: newRequestType.name, description: newRequestType.description }
    });
    
    return newRequestType;
  }

  async updateCustomRequestType(id: number, requestType: Partial<schema.InsertCustomRequestType>): Promise<schema.CustomRequestType | undefined> {
    const index = this.customRequestTypes.findIndex(rt => rt.id === id);
    if (index === -1) return undefined;
    
    const oldRequestType = { ...this.customRequestTypes[index] };
    this.customRequestTypes[index] = {
      ...this.customRequestTypes[index],
      ...requestType,
      updatedAt: new Date()
    };
    
    // Log activity
    await this.logActivity({
      action: "Updated",
      entityType: "Request Type",
      entityId: id,
      userId: 1, // System user
      details: { 
        old: { name: oldRequestType.name, description: oldRequestType.description },
        new: { name: this.customRequestTypes[index].name, description: this.customRequestTypes[index].description }
      }
    });
    
    return this.customRequestTypes[index];
  }

  async deleteCustomRequestType(id: number): Promise<boolean> {
    const index = this.customRequestTypes.findIndex(rt => rt.id === id);
    if (index === -1) return false;
    
    const requestType = this.customRequestTypes[index];
    this.customRequestTypes.splice(index, 1);
    
    // Log activity
    await this.logActivity({
      action: "Deleted",
      entityType: "Request Type",
      entityId: id,
      userId: 1, // System user
      details: { name: requestType.name }
    });
    
    return true;
  }

  // Enhanced Ticket operations with time tracking (Feature 2: Manual time tracking)
  async startTicketTimeTracking(ticketId: number, userId: number): Promise<schema.Ticket | undefined> {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) return undefined;
    
    ticket.isTimeTracking = true;
    ticket.timeTrackingStartedAt = new Date().toISOString();
    ticket.updatedAt = new Date();
    
    // Log activity
    await this.logActivity({
      action: "Started Time Tracking",
      entityType: "Ticket",
      entityId: ticketId,
      userId,
      details: { ticketId: ticket.ticketId, startTime: ticket.timeTrackingStartedAt }
    });
    
    return ticket;
  }

  async stopTicketTimeTracking(ticketId: number, userId: number): Promise<schema.Ticket | undefined> {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket || !ticket.isTimeTracking) return undefined;
    
    const endTime = new Date();
    const startTime = ticket.timeTrackingStartedAt ? new Date(ticket.timeTrackingStartedAt) : new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60); // minutes
    
    ticket.isTimeTracking = false;
    ticket.timeTrackingStartedAt = null;
    ticket.timeSpent = (ticket.timeSpent || 0) + duration;
    ticket.updatedAt = new Date();
    
    // Log activity
    await this.logActivity({
      action: "Stopped Time Tracking",
      entityType: "Ticket",
      entityId: ticketId,
      userId,
      details: { 
        ticketId: ticket.ticketId, 
        endTime: endTime.toISOString(), 
        duration: `${duration} minutes`,
        totalTime: `${ticket.timeSpent} minutes`
      }
    });
    
    return ticket;
  }

  // Ticket History operations (Feature 3: Ticket history and updates display)
  async getTicketHistory(ticketId: number): Promise<schema.TicketHistory[]> {
    return this.ticketHistory
      .filter(h => h.ticketId === ticketId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createTicketHistory(history: schema.InsertTicketHistory): Promise<schema.TicketHistory> {
    const newHistory: schema.TicketHistory = {
      id: this.idCounters.ticketHistory++,
      ...history,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.ticketHistory.push(newHistory);
    return newHistory;
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
    if (ticketData.requestType && ticketData.requestType !== ticket.requestType) {
      changes.push(`Request type changed from "${ticket.requestType}" to "${ticketData.requestType}"`);
    }
    
    // Update ticket
    Object.assign(ticket, ticketData);
    ticket.updatedAt = new Date();
    
    // Create history entry for each change
    if (changes.length > 0) {
      await this.createTicketHistory({
        ticketId: ticket.id,
        userId,
        action: "Updated",
        changes: changes.join("; "),
        oldValues: JSON.stringify({
          status: oldTicket.status,
          priority: oldTicket.priority,
          assignedToId: oldTicket.assignedToId,
          requestType: oldTicket.requestType
        }),
        newValues: JSON.stringify({
          status: ticket.status,
          priority: ticket.priority,
          assignedToId: ticket.assignedToId,
          requestType: ticket.requestType
        })
      });
      
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
    }
    
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
    
    // Remove related history
    this.ticketHistory = this.ticketHistory.filter(h => h.ticketId !== id);
    
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

  // Enhanced ticket creation with history
  async createTicketWithHistory(ticket: schema.InsertTicket): Promise<schema.Ticket> {
    const newTicket = await this.createTicket(ticket);
    
    // Create initial history entry
    await this.createTicketHistory({
      ticketId: newTicket.id,
      userId: ticket.submittedById,
      action: "Created",
      changes: `Ticket created with status "${newTicket.status}" and priority "${newTicket.priority}"`,
      oldValues: null,
      newValues: JSON.stringify({
        status: newTicket.status,
        priority: newTicket.priority,
        requestType: newTicket.requestType
      })
    });
    
    return newTicket;
  }

  // Advanced ticket management operations
  async getEnhancedTickets(): Promise<any[]> {
    const tickets = [...this.tickets];
    const enhanced = await Promise.all(tickets.map(async (ticket) => {
      const submittedBy = await this.getEmployee(ticket.submittedById);
      const assignedTo = ticket.assignedToId ? await this.getUser(ticket.assignedToId) : undefined;
      const comments = this.ticketComments.filter(c => c.ticketId === ticket.id);
      const history = this.ticketHistory.filter(h => h.ticketId === ticket.id);
      
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
        history,
        attachments: [],
        tags: []
      };
    }));
    
    return enhanced;
  }

  async getTicketCategories(): Promise<any[]> {
    // Initialize default categories if empty
    if (this.ticketCategories.length === 0) {
      this.ticketCategories = [
        {
          id: this.idCounters.ticketCategories++,
          name: "Hardware Issues",
          description: "Hardware-related problems and requests",
          color: "#ef4444",
          slaHours: 24,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: this.idCounters.ticketCategories++,
          name: "Software Issues", 
          description: "Software installation and troubleshooting",
          color: "#3b82f6",
          slaHours: 48,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: this.idCounters.ticketCategories++,
          name: "Network Issues",
          description: "Network connectivity and configuration",
          color: "#f59e0b",
          slaHours: 8,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    }
    return [...this.ticketCategories];
  }

  async createTicketCategory(categoryData: any): Promise<any> {
    const category = {
      id: this.idCounters.ticketCategories++,
      ...categoryData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.ticketCategories.push(category);
    return category;
  }

  async addTicketComment(commentData: any): Promise<any> {
    const comment = {
      id: this.idCounters.ticketComments++,
      ...commentData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.ticketComments.push(comment);
    
    // Add to ticket history
    await this.addTicketHistory({
      ticketId: commentData.ticketId,
      userId: commentData.userId,
      action: "Comment Added",
      fieldChanged: "comments",
      newValue: commentData.content,
      notes: commentData.isPrivate ? "Private comment" : "Public comment"
    });
    
    return comment;
  }

  async addTimeEntry(ticketId: number, hours: number, description: string, userId: number): Promise<any> {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) throw new Error("Ticket not found");
    
    // Update ticket with time tracking
    const currentActualHours = ticket.actualHours || 0;
    ticket.actualHours = currentActualHours + hours;
    ticket.updatedAt = new Date();
    
    // Add to history
    await this.addTicketHistory({
      ticketId,
      userId,
      action: "Time Entry Added",
      fieldChanged: "actualHours",
      oldValue: currentActualHours.toString(),
      newValue: ticket.actualHours.toString(),
      notes: `${hours} hours - ${description}`
    });
    
    return { success: true, totalHours: ticket.actualHours };
  }

  async mergeTickets(primaryTicketId: number, secondaryTicketIds: number[], userId: number): Promise<any> {
    const primaryTicket = this.tickets.find(t => t.id === primaryTicketId);
    if (!primaryTicket) throw new Error("Primary ticket not found");
    
    const secondaryTickets = this.tickets.filter(t => secondaryTicketIds.includes(t.id));
    if (secondaryTickets.length !== secondaryTicketIds.length) {
      throw new Error("Some secondary tickets not found");
    }
    
    // Merge comments and history
    secondaryTickets.forEach(ticket => {
      // Update comments to point to primary ticket
      this.ticketComments.forEach(comment => {
        if (comment.ticketId === ticket.id) {
          comment.ticketId = primaryTicketId;
        }
      });
      
      // Update history to point to primary ticket  
      this.ticketHistory.forEach(history => {
        if (history.ticketId === ticket.id) {
          history.ticketId = primaryTicketId;
        }
      });
      
      // Remove merged ticket
      const index = this.tickets.findIndex(t => t.id === ticket.id);
      if (index > -1) this.tickets.splice(index, 1);
    });
    
    // Add merge history
    await this.addTicketHistory({
      ticketId: primaryTicketId,
      userId,
      action: "Tickets Merged",
      notes: `Merged tickets: ${secondaryTicketIds.join(', ')}`
    });
    
    return { success: true, mergedTicketIds: secondaryTicketIds };
  }

  async addTicketHistory(historyData: any): Promise<any> {
    const history = {
      id: this.idCounters.ticketHistory++,
      ...historyData,
      createdAt: new Date()
    };
    this.ticketHistory.push(history);
    return history;
  }

  async addTicketComment(commentData: any): Promise<any> {
    const comment = {
      id: this.idCounters.ticketComments++,
      ticketId: commentData.ticketId,
      userId: commentData.userId,
      content: commentData.content,
      isPrivate: commentData.isPrivate || false,
      attachments: commentData.attachments || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.ticketComments.push(comment);
    
    // Update ticket's last activity
    const ticket = this.tickets.find(t => t.id === commentData.ticketId);
    if (ticket) {
      ticket.lastActivityAt = new Date();
    }
    
    return comment;
  }

  async getTicketComments(ticketId: number): Promise<any[]> {
    return this.ticketComments
      .filter(comment => comment.ticketId === ticketId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async addTimeEntry(ticketId: number, hours: number, description: string, userId: number): Promise<any> {
    const timeEntry = {
      id: this.idCounters.timeEntries++,
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
  }
}