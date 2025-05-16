import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as schema from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { compare, hash } from "bcryptjs";
import ConnectPgSimple from "connect-pg-simple";
import multer from "multer";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { createHash } from "crypto";
import { auditLogMiddleware, logActivity, AuditAction, EntityType } from "./auditLogger";

// Helper function to generate IDs
const generateId = (prefix: string, num: number) => {
  return `${prefix}${num.toString().padStart(5, "0")}`;
};

// Helper function to validate request body against schema
function validateBody<T>(schema: any, data: any): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(fromZodError(error).message);
    }
    throw error;
  }
}

// Authentication middleware
const authenticateUser = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Check if user has appropriate access level
const hasAccess = (minAccessLevel: number) => {
  return (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = req.user as schema.User;
    const userAccessLevel = parseInt(user.accessLevel);
    
    if (userAccessLevel < minAccessLevel) {
      return res.status(403).json({ message: "Forbidden: Insufficient access level" });
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
  // Setup session with PostgreSQL for persistence
  const pgStore = ConnectPgSimple(session);
  app.use(
    session({
      store: new pgStore({
        conString: process.env.DATABASE_URL,
        tableName: 'sessions',
        createTableIfMissing: true,
        pruneSessionInterval: 24 * 60 * 60, // 24 hours
      }),
      secret: process.env.SESSION_SECRET || "SimpleIT-bolt-secret",
      resave: false, 
      saveUninitialized: false,
      cookie: { 
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for longer persistence
        sameSite: 'lax'
      },
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Add audit logging middleware
  app.use(auditLogMiddleware);

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
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.json({ message: "Login successful", user: req.user });
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
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  // User CRUD routes
  app.get("/api/users", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/users/:id", authenticateUser, hasAccess(3), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      
      // If password is being updated, hash it
      if (userData.password) {
        userData.password = await hash(userData.password, 10);
      }
      
      const updatedUser = await storage.updateUser(id, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Update",
          entityType: "User",
          entityId: updatedUser.id,
          details: { username: updatedUser.username }
        });
      }
      
      res.json(updatedUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Employee CRUD routes
  app.get("/api/employees", authenticateUser, async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/employees", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const employeeData = validateBody<schema.InsertEmployee>(schema.insertEmployeeSchema, req.body);
      
      // Generate employee ID if not provided
      if (!employeeData.empId) {
        const allEmployees = await storage.getAllEmployees();
        const newEmpNum = allEmployees.length + 1;
        employeeData.empId = `EMP${newEmpNum.toString().padStart(5, "0")}`;
      }
      
      const employee = await storage.createEmployee(employeeData);
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Create",
          entityType: "Employee",
          entityId: employee.id,
          details: { name: employee.englishName, empId: employee.empId }
        });
      }
      
      res.status(201).json(employee);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/employees/:id", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employeeData = req.body;
      
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
          details: { name: updatedEmployee.englishName, empId: updatedEmployee.empId }
        });
      }
      
      res.json(updatedEmployee);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Employee Import/Export
  app.post("/api/employees/import", authenticateUser, hasAccess(3), upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const results: schema.InsertEmployee[] = [];
      const errors: any[] = [];
      let counter = 0;
      
      // Convert buffer to readable stream
      const stream = Readable.from(req.file.buffer.toString());
      
      // Parse CSV
      stream
        .pipe(csvParser())
        .on('data', async (data) => {
          try {
            counter++;
            const employeeData: schema.InsertEmployee = {
              empId: data.empId || `EMP${counter.toString().padStart(5, "0")}`,
              englishName: data.englishName,
              arabicName: data.arabicName || null,
              department: data.department,
              idNumber: data.idNumber,
              title: data.title,
              directManager: data.directManager ? parseInt(data.directManager) : null,
              employmentType: data.employmentType as any,
              joiningDate: new Date(data.joiningDate),
              exitDate: data.exitDate ? new Date(data.exitDate) : null,
              status: (data.status || 'Active') as any,
              personalMobile: data.personalMobile || null,
              workMobile: data.workMobile || null,
              personalEmail: data.personalEmail || null,
              corporateEmail: data.corporateEmail || null,
              userId: data.userId ? parseInt(data.userId) : null
            };
            
            results.push(employeeData);
          } catch (error: any) {
            errors.push({ row: counter, error: error.message });
          }
        })
        .on('end', async () => {
          // Insert all valid employees
          const importedEmployees = [];
          
          for (const employee of results) {
            try {
              const newEmployee = await storage.createEmployee(employee);
              importedEmployees.push(newEmployee);
              
              // Log activity
              if (req.user) {
                await storage.logActivity({
                  userId: (req.user as schema.User).id,
                  action: "Import",
                  entityType: "Employee",
                  entityId: newEmployee.id,
                  details: { name: newEmployee.englishName, empId: newEmployee.empId }
                });
              }
            } catch (error: any) {
              errors.push({ employee: employee.englishName, error: error.message });
            }
          }
          
          res.json({ 
            message: "Import completed", 
            imported: importedEmployees.length,
            errors: errors.length > 0 ? errors : null
          });
        });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/employees/export", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      
      // Convert to CSV
      const fields = [
        'empId', 'englishName', 'arabicName', 'department', 'idNumber', 
        'title', 'directManager', 'employmentType', 'joiningDate', 'exitDate', 
        'status', 'personalMobile', 'workMobile', 'personalEmail', 'corporateEmail'
      ];
      
      let csv = fields.join(',') + '\n';
      
      employees.forEach(employee => {
        const row = fields.map(field => {
          const value = employee[field as keyof schema.Employee];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
          return value;
        }).join(',');
        csv += row + '\n';
      });
      
      // Set headers for file download
      res.setHeader('Content-Disposition', 'attachment; filename=employees.csv');
      res.setHeader('Content-Type', 'text/csv');
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Export",
          entityType: "Employee",
          details: { count: employees.length }
        });
      }
      
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Asset CRUD routes
  app.get("/api/assets", authenticateUser, async (req, res) => {
    try {
      const assets = await storage.getAllAssets();
      res.json(assets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/assets/:id", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const asset = await storage.getAsset(id);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      res.json(asset);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/assets", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const assetData = validateBody<schema.InsertAsset>(schema.insertAssetSchema, req.body);
      
      // Get system config for asset ID prefix
      let assetPrefix = "BOLT-";
      const sysConfig = await storage.getSystemConfig();
      if (sysConfig && sysConfig.assetIdPrefix) {
        assetPrefix = sysConfig.assetIdPrefix;
      }
      
      // Generate asset ID if not provided
      if (!assetData.assetId) {
        const allAssets = await storage.getAllAssets();
        const newAssetNum = allAssets.length + 1;
        
        // Add type prefix
        let typePrefix = "";
        switch (assetData.type) {
          case "Laptop": typePrefix = "LT-"; break;
          case "Desktop": typePrefix = "DT-"; break;
          case "Mobile": typePrefix = "MB-"; break;
          case "Tablet": typePrefix = "TB-"; break;
          case "Monitor": typePrefix = "MN-"; break;
          case "Printer": typePrefix = "PR-"; break;
          case "Server": typePrefix = "SV-"; break;
          case "Network": typePrefix = "NW-"; break;
          default: typePrefix = "OT-";
        }
        
        assetData.assetId = `${assetPrefix}${typePrefix}${newAssetNum.toString().padStart(4, "0")}`;
      }
      
      const asset = await storage.createAsset(assetData);
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Create",
          entityType: "Asset",
          entityId: asset.id,
          details: { assetId: asset.assetId, type: asset.type, brand: asset.brand }
        });
      }
      
      res.status(201).json(asset);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
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
    } catch (error: any) {
      res.status(400).json({ message: error.message });
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Asset Maintenance
  app.post("/api/assets/:id/maintenance", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const assetId = parseInt(req.params.id);
      
      // Check if asset exists
      const asset = await storage.getAsset(assetId);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      const maintenanceData = validateBody<schema.InsertAssetMaintenance>(
        schema.insertAssetMaintenanceSchema, 
        { ...req.body, assetId }
      );
      
      const maintenance = await storage.createAssetMaintenance(maintenanceData);
      
      // Update asset status if needed
      if (asset.status !== "Maintenance") {
        await storage.updateAsset(assetId, { status: "Maintenance" });
      }
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Maintenance",
          entityType: "Asset",
          entityId: assetId,
          details: { 
            assetId: asset.assetId, 
            type: asset.type,
            maintenanceType: maintenance.type,
            cost: maintenance.cost
          }
        });
      }
      
      res.status(201).json(maintenance);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/assets/:id/maintenance", authenticateUser, async (req, res) => {
    try {
      const assetId = parseInt(req.params.id);
      
      // Check if asset exists
      const asset = await storage.getAsset(assetId);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      const maintenanceRecords = await storage.getMaintenanceForAsset(assetId);
      
      res.json(maintenanceRecords);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/asset-sales", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const sales = await storage.getAssetSales();
      res.json(sales);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Asset Import/Export
  app.post("/api/assets/import", authenticateUser, hasAccess(3), upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const results: schema.InsertAsset[] = [];
      const errors: any[] = [];
      let counter = 0;
      
      // Get system config for asset ID prefix
      let assetPrefix = "BOLT-";
      const sysConfig = await storage.getSystemConfig();
      if (sysConfig && sysConfig.assetIdPrefix) {
        assetPrefix = sysConfig.assetIdPrefix;
      }
      
      // Convert buffer to readable stream
      const stream = Readable.from(req.file.buffer.toString());
      
      // Parse CSV
      stream
        .pipe(csvParser())
        .on('data', async (data) => {
          try {
            counter++;
            
            // Generate asset ID if not provided
            let assetId = data.assetId;
            if (!assetId) {
              // Add type prefix
              let typePrefix = "";
              switch (data.type) {
                case "Laptop": typePrefix = "LT-"; break;
                case "Desktop": typePrefix = "DT-"; break;
                case "Mobile": typePrefix = "MB-"; break;
                case "Tablet": typePrefix = "TB-"; break;
                case "Monitor": typePrefix = "MN-"; break;
                case "Printer": typePrefix = "PR-"; break;
                case "Server": typePrefix = "SV-"; break;
                case "Network": typePrefix = "NW-"; break;
                default: typePrefix = "OT-";
              }
              
              assetId = `${assetPrefix}${typePrefix}${counter.toString().padStart(4, "0")}`;
            }
            
            const assetData: schema.InsertAsset = {
              assetId,
              type: data.type as any,
              brand: data.brand,
              modelNumber: data.modelNumber || null,
              modelName: data.modelName || null,
              serialNumber: data.serialNumber,
              specs: data.specs || null,
              status: (data.status || 'Available') as any,
              purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
              buyPrice: data.buyPrice ? parseFloat(data.buyPrice) : null,
              warrantyExpiryDate: data.warrantyExpiryDate ? new Date(data.warrantyExpiryDate) : null,
              lifeSpan: data.lifeSpan ? parseInt(data.lifeSpan) : null,
              outOfBoxOs: data.outOfBoxOs || null,
              assignedEmployeeId: data.assignedEmployeeId ? parseInt(data.assignedEmployeeId) : null
            };
            
            results.push(assetData);
          } catch (error: any) {
            errors.push({ row: counter, error: error.message });
          }
        })
        .on('end', async () => {
          // Insert all valid assets
          const importedAssets = [];
          
          for (const asset of results) {
            try {
              const newAsset = await storage.createAsset(asset);
              importedAssets.push(newAsset);
              
              // Log activity
              if (req.user) {
                await storage.logActivity({
                  userId: (req.user as schema.User).id,
                  action: "Import",
                  entityType: "Asset",
                  entityId: newAsset.id,
                  details: { assetId: newAsset.assetId, type: newAsset.type, brand: newAsset.brand }
                });
              }
            } catch (error: any) {
              errors.push({ asset: asset.assetId, error: error.message });
            }
          }
          
          res.json({ 
            message: "Import completed", 
            imported: importedAssets.length,
            errors: errors.length > 0 ? errors : null
          });
        });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/assets/export", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const assets = await storage.getAllAssets();
      
      // Convert to CSV
      const fields = [
        'assetId', 'type', 'brand', 'modelNumber', 'modelName', 
        'serialNumber', 'specs', 'status', 'purchaseDate', 'buyPrice', 
        'warrantyExpiryDate', 'lifeSpan', 'outOfBoxOs', 'assignedEmployeeId'
      ];
      
      let csv = fields.join(',') + '\n';
      
      assets.forEach(asset => {
        const row = fields.map(field => {
          const value = asset[field as keyof schema.Asset];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
          return value;
        }).join(',');
        csv += row + '\n';
      });
      
      // Set headers for file download
      res.setHeader('Content-Disposition', 'attachment; filename=assets.csv');
      res.setHeader('Content-Type', 'text/csv');
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Export",
          entityType: "Asset",
          details: { count: assets.length }
        });
      }
      
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Ticket CRUD routes
  app.get("/api/tickets", authenticateUser, async (req, res) => {
    try {
      const tickets = await storage.getAllTickets();
      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/tickets/:id", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await storage.getTicket(id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tickets", authenticateUser, async (req, res) => {
    try {
      const ticketData = validateBody<schema.InsertTicket>(schema.insertTicketSchema, req.body);
      
      // Generate ticket ID
      const allTickets = await storage.getAllTickets();
      const newTicketNum = allTickets.length + 1;
      ticketData.ticketId = `T-${newTicketNum.toString().padStart(4, "0")}`;
      
      const ticket = await storage.createTicket(ticketData);
      
      // Log activity
      if (req.user) {
        await storage.logActivity({
          userId: (req.user as schema.User).id,
          action: "Create",
          entityType: "Ticket",
          entityId: ticket.id,
          details: { ticketId: ticket.ticketId, category: ticket.category, priority: ticket.priority }
        });
      }
      
      res.status(201).json(ticket);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/tickets/:id", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticketData = req.body;
      
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
    } catch (error: any) {
      res.status(400).json({ message: error.message });
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // System Configuration
  app.get("/api/system-config", authenticateUser, async (req, res) => {
    try {
      const config = await storage.getSystemConfig();
      res.json(config || { language: "English", assetIdPrefix: "BOLT-" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Activity Log
  app.get("/api/activity-log", authenticateUser, hasAccess(2), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const activities = await storage.getRecentActivity(limit);
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Dashboard Summary
  app.get("/api/dashboard/summary", authenticateUser, async (req, res) => {
    try {
      const [
        employees,
        assets,
        openTickets,
        userCount
      ] = await Promise.all([
        storage.getAllEmployees(),
        storage.getAllAssets(),
        storage.getTicketsByStatus("Open"),
        storage.getAllUsers()
      ]);
      
      // Calculate total asset value
      const totalAssetValue = assets.reduce((sum, asset) => {
        return sum + (asset.buyPrice ? parseFloat(asset.buyPrice.toString()) : 0);
      }, 0);
      
      // Count assets by type
      const assetsByType = assets.reduce((acc: Record<string, number>, asset) => {
        acc[asset.type] = (acc[asset.type] || 0) + 1;
        return acc;
      }, {});
      
      // Count assets by status
      const assetsByStatus = assets.reduce((acc: Record<string, number>, asset) => {
        acc[asset.status] = (acc[asset.status] || 0) + 1;
        return acc;
      }, {});
      
      // Count employees by department
      const employeesByDepartment = employees.reduce((acc: Record<string, number>, employee) => {
        acc[employee.department] = (acc[employee.department] || 0) + 1;
        return acc;
      }, {});
      
      // Get recent assets
      const recentAssets = assets.slice(0, 5);
      
      // Get recent tickets
      const allTickets = await storage.getAllTickets();
      const recentTickets = allTickets.slice(0, 5);
      
      // Get recent activity
      const recentActivity = await storage.getRecentActivity(5);
      
      res.json({
        counts: {
          employees: employees.length,
          assets: assets.length,
          activeTickets: openTickets.length,
          users: userCount.length,
          totalAssetValue
        },
        assetsByType,
        assetsByStatus,
        employeesByDepartment,
        recentAssets,
        recentTickets,
        recentActivity
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
      
      // Tickets by Category
      const ticketsByCategory: Record<string, number> = {};
      tickets.forEach(ticket => {
        ticketsByCategory[ticket.category] = (ticketsByCategory[ticket.category] || 0) + 1;
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
        ticketsByCategory,
        recentTicketsCount: recentTickets.length,
        averageResolutionTime: averageResolutionTime.toFixed(2) + " hours"
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
        accessLevel: "3"
      });
      console.log("Admin user created");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }

  const httpServer = createServer(app);
  return httpServer;
}
