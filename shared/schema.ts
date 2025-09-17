import { pgTable, serial, varchar, text, integer, boolean, timestamp,bigint, decimal, date, jsonb, index, pgEnum,pgSequence } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums matching the current database
export const accessLevelEnum = pgEnum('access_level', ['1', '2', '3', '4']);
export const roleEnum = pgEnum('role', ['employee', 'agent', 'manager', 'admin']);
export const employmentTypeEnum = pgEnum('employment_type', ['Full-time', 'Part-time', 'Contract', 'Intern', 'Freelance']);
export const employeeStatusEnum = pgEnum('employee_status', ['Active', 'Resigned', 'Terminated', 'On Leave']);
export const pricingModeEnum = pgEnum('pricing_mode', ['total', 'individual']);
// Asset statuses are now flexible - ENUM removed to allow custom statuses
export const assetConditionEnum = pgEnum('asset_condition', ['New', 'Good', 'Fair', 'Poor', 'Damaged']);
export const ticketStatusEnum = pgEnum('ticket_status', ['Open', 'In Progress', 'Resolved', 'Closed']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['Low', 'Medium', 'High', 'Critical']);
export const ticketTypeEnum = pgEnum('ticket_type', ['Incident', 'Service Request', 'Problem', 'Change']);
export const ticketCategoryEnum = pgEnum('ticket_category', ['Hardware', 'Software', 'Network', 'Access', 'Other']);
export const ticketUrgencyEnum = pgEnum('ticket_urgency', ['Low', 'Medium', 'High', 'Critical']);
export const ticketImpactEnum = pgEnum('ticket_impact', ['Low', 'Medium', 'High', 'Critical']);
export const notificationTypeEnum = pgEnum('notification_type', ['Asset', 'Ticket', 'System', 'Employee']);
export const upgradeStatusEnum = pgEnum('upgrade_status', ['Planned', 'Approved', 'In Progress', 'Testing', 'Completed', 'Failed', 'Cancelled', 'Rolled Back']);
export const maintenanceTypeEnum = pgEnum('maintenance_type', ['Preventive', 'Corrective', 'Upgrade', 'Repair', 'Inspection', 'Cleaning', 'Replacement']);
export const assetTransactionTypeEnum = pgEnum('asset_transaction_type', ['Check-Out', 'Check-In', 'Maintenance','Sale','Retirement','Upgrade']);

// Add sequence definitions with increment: 1
export const employeesIdSequence = pgSequence('employees_id_seq', {
  startWith: 1,
  increment: 1,
  minValue: 1,
  cache: 1
});

export const assetsIdSequence = pgSequence('assets_id_seq', {
  startWith: 1,
  increment: 1,
  minValue: 1,
  cache: 1
});

export const ticketsIdSequence = pgSequence('tickets_id_seq', {
  startWith: 1,
  increment: 1,
  minValue: 1,
  cache: 1
});

export const assetSalesIdSequence = pgSequence('asset_sales_id_seq', {
  startWith: 1,
  increment: 1,
  minValue: 1,
  cache: 1
});


// Sessions table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: text("password").notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  accessLevel: accessLevelEnum("access_level").notNull().default('1'),
  role: roleEnum("role").notNull().default('employee'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Security Questions table
export const securityQuestions = pgTable("security_questions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Password Reset Tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  used: boolean("used").default(false),
});

// Employees table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  empId: varchar("emp_id", { length: 20 }).notNull().unique().default(sql`concat('EMP-', lpad((nextval('employees_id_seq'::regclass))::text, 5, '0'::text))`),
  englishName: varchar("english_name", { length: 100 }).notNull(),
  arabicName: varchar("arabic_name", { length: 100 }),
  department: varchar("department", { length: 100 }).notNull(),
  idNumber: varchar("id_number", { length: 50 }).notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  directManager: integer("direct_manager").references((): any => employees.id),
  employmentType: employmentTypeEnum("employment_type").notNull(),
  joiningDate: date("joining_date").notNull(),
  exitDate: date("exit_date"),
  status: employeeStatusEnum("status").notNull().default('Active'),
  personalMobile: varchar("personal_mobile", { length: 20 }),
  workMobile: varchar("work_mobile", { length: 20 }),
  personalEmail: varchar("personal_email", { length: 100 }),
  corporateEmail: varchar("corporate_email", { length: 100 }),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Assets table
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  assetId: varchar("asset_id", { length: 20 }).notNull().unique().default(sql`concat('AST-', lpad((nextval('assets_id_seq'::regclass))::text, 5, '0'::text))`),
  type: varchar("type", { length: 100 }).notNull(),
  brand: varchar("brand", { length: 100 }).notNull(),
  modelNumber: varchar("model_number", { length: 100 }),
  modelName: varchar("model_name", { length: 100 }),
  serialNumber: varchar("serial_number", { length: 100 }).notNull(),
  specs: text("specs"),
  status: varchar("status", { length: 100 }).notNull().default('Available'),
  purchaseDate: date("purchase_date"),
  buyPrice: decimal("buy_price", { precision: 10, scale: 2 }),
  warrantyExpiryDate: date("warranty_expiry_date"),
  lifeSpan: integer("life_span"),
  outOfBoxOs: varchar("out_of_box_os", { length: 100 }),
  assignedEmployeeId: integer("assigned_employee_id").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Additional hardware specification columns
  cpu: varchar("cpu", { length: 100 }),
  ram: varchar("ram", { length: 100 }),
  storage: varchar("storage", { length: 100 }),
});

// Asset Maintenance table
export const assetMaintenance = pgTable("asset_maintenance", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  date: date("date").notNull(),
  description: text("description").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).default('0'),
  providerType: varchar("provider_type", { length: 100 }).notNull(),
  providerName: varchar("provider_name", { length: 100 }),
  type: maintenanceTypeEnum("type").notNull().default('Preventive'),
  status: varchar("status", { length: 50 }).default('Completed'), // Maintenance STATUS - ADD THIS
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Asset Transactions table
export const assetTransactions = pgTable("asset_transactions", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  type: assetTransactionTypeEnum("type").notNull(),
  employeeId: integer("employee_id").references(() => employees.id),
  transactionDate: timestamp("transaction_date").notNull().defaultNow(),
  expectedReturnDate: timestamp("expected_return_date"),
  actualReturnDate: timestamp("actual_return_date"),
  conditionNotes: text("condition_notes"),
  handledById: integer("handled_by_id").references(() => users.id),
  attachments: text("attachments").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deviceSpecs: jsonb("device_specs"),
});

// Asset Sales table
export const assetSales = pgTable("asset_sales", {
  id: serial("id").primaryKey(),
  // ADD THESE 3 NEW FIELDS:
  saleId: varchar("sale_id", { length: 20 }).notNull().unique().default(sql`concat('SALE-', to_char(CURRENT_DATE, 'YYYY'), '-', lpad((nextval('asset_sales_id_seq'::regclass))::text, 3, '0'::text))`),
  pricingMode: pricingModeEnum("pricing_mode").notNull().default('total'),
  createdById: integer("created_by_id").references(() => users.id),
  // KEEP YOUR EXISTING FIELDS:
  buyer: varchar("buyer", { length: 100 }).notNull(),
  date: date("date").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Asset Sale Items table
export const assetSaleItems = pgTable("asset_sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => assetSales.id),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(),
  assetCondition: varchar("asset_condition", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Asset Statuses lookup table for defaults and custom statuses
export const assetStatuses = pgTable("asset_statuses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  color: varchar("color", { length: 7 }), // Hex color code
  isDefault: boolean("is_default").default(false),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Simplified Asset Upgrades table
export const assetUpgrades = pgTable("asset_upgrades", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  
  // Basic Information
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 20 }).notNull(), // 'Hardware' or 'Software'
  upgradeType: varchar("upgrade_type", { length: 100 }).notNull(),
  priority: varchar("priority", { length: 20 }).notNull().default('Medium'), // Low, Medium, High
  
  // Scheduling
  scheduledDate: date("scheduled_date").notNull(),
  
  // Cost Information
  purchaseRequired: boolean("purchase_required").default(false),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  
  // Justification
  justification: text("justification").notNull(),
  
  // Approval
  approvedById: integer("approved_by_id").references(() => employees.id),
  approvalDate: date("approval_date"),
  
  // Status tracking
  status: varchar("status", { length: 50 }).notNull().default('Draft'),
  // Status values: Draft, Pending Approval, Approved, In Progress, Completed, Cancelled
  
  // User tracking
  createdById: integer("created_by_id").notNull().references(() => users.id),
  updatedById: integer("updated_by_id").references(() => users.id),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tickets table - Simplified v0.4.0 Schema (21 core fields)
export const tickets = pgTable("tickets", {
  // Core Identity & Tracking
  id: serial("id").primaryKey(),
  ticketId: varchar("ticket_id", { length: 20 }).notNull().unique().default(sql`('TKT-' || lpad((nextval('tickets_id_seq'::regclass))::text, 6, '0'::text))`),
  
  // Relationships
  submittedById: integer("submitted_by_id").notNull().references(() => employees.id),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  relatedAssetId: integer("related_asset_id").references(() => assets.id),
  
  // Request Classification
  type: ticketTypeEnum("type").notNull().default('Incident'), // Nature of request
  categoryId: integer("category_id").references(() => categories.id), // Reference to dynamic categories table
  
  // Priority Management (calculated based on urgency × impact)
  priority: ticketPriorityEnum("priority").notNull().default('Medium'),
  urgency: ticketUrgencyEnum("urgency").notNull().default('Medium'),
  impact: ticketImpactEnum("impact").notNull().default('Medium'),
  
  // Content
  title: varchar("title", { length: 255 }).notNull(), // Renamed from summary
  description: text("description").notNull(),
  resolution: text("resolution"),
  
  // Status & Workflow
  status: ticketStatusEnum("status").notNull().default('Open'),
  
  // Time Management
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completionTime: timestamp("completion_time"),
  timeSpent: integer("time_spent"), // in minutes
  dueDate: timestamp("due_date"),
  slaTarget: timestamp("sla_target"),
});

// Ticket Comments table
export const ticketComments = pgTable("ticket_comments", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isPrivate: boolean("is_private").default(false),
  attachments: text("attachments").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ticket History table
export const ticketHistory = pgTable("ticket_history", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id),
  userId: integer("user_id").notNull().references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  fieldChanged: varchar("field_changed", { length: 100 }),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity Log table
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: integer("entity_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// System Configuration table
export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  language: varchar("language", { length: 10 }).notNull().default('en'),
  assetIdPrefix: varchar("asset_id_prefix", { length: 10 }).notNull().default('SIT-'),
  empIdPrefix: varchar("emp_id_prefix", { length: 10 }).notNull().default('EMP-'),
  ticketIdPrefix: varchar("ticket_id_prefix", { length: 10 }).notNull().default('TKT-'),
  currency: varchar("currency", { length: 10 }).notNull().default('USD'),
  departments: text("departments").array(),
  emailHost: varchar("email_host", { length: 100 }),
  emailPort: integer("email_port"),
  emailUser: varchar("email_user", { length: 100 }),
  emailPassword: varchar("email_password", { length: 100 }),
  emailFromAddress: varchar("email_from_address", { length: 100 }),
  emailFromName: varchar("email_from_name", { length: 100 }),
  emailSecure: boolean("email_secure").default(true),
  employeeIdPrefix: varchar("employee_id_prefix", { length: 10 }).default('EMP'),
  companyName: varchar("company_name", { length: 255 }).default('ELADWYSOFT'),
  companyAddress: text("company_address"),
  companyPhone: varchar("company_phone", { length: 50 }),
  companyEmail: varchar("company_email", { length: 100 }),
  companyWebsite: varchar("company_website", { length: 255 }),
  defaultCurrency: varchar("default_currency", { length: 10 }).default('USD'),
  enableAuditLogs: boolean("enable_audit_logs").default(true),
  auditLogRetentionDays: integer("audit_log_retention_days").default(365),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom Asset Brands table
export const customAssetBrands = pgTable("custom_asset_brands", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom Asset Statuses table
export const customAssetStatuses = pgTable("custom_asset_statuses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  color: varchar("color", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom Asset Types table
export const customAssetTypes = pgTable("custom_asset_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table (formerly Custom Request Types)
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: notificationTypeEnum("type").notNull(),
  entityId: integer("entity_id"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  employees: many(employees),
  tickets: many(tickets),
  ticketComments: many(ticketComments),
  activityLogs: many(activityLog),
  notifications: many(notifications),
  securityQuestions: many(securityQuestions),
  passwordResetTokens: many(passwordResetTokens),
}));

// Backup Management Tables
export const backupJobs = pgTable("backup_jobs", {
  id: serial("id").primaryKey(),
  jobId: varchar("job_id", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  schedule: varchar("schedule", { length: 50 }).notNull(), // 'manual', 'daily', 'weekly'
  isEnabled: boolean("is_enabled").default(true),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const backupFiles = pgTable("backup_files", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  filepath: varchar("filepath", { length: 500 }).notNull(),
  fileSize: bigint("file_size", { mode: 'number' }).notNull(),
  backupType: varchar("backup_type", { length: 50 }).notNull(), // 'manual', 'scheduled'
  status: varchar("status", { length: 50 }).default('completed'), // 'in_progress', 'completed', 'failed'
  jobId: integer("job_id").references(() => backupJobs.id),
  createdById: integer("created_by_id").references(() => users.id),
  metadata: text("metadata"), // JSON string for additional info
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemHealth = pgTable("system_health", {
  id: serial("id").primaryKey(),
  metricName: varchar("metric_name", { length: 100 }).notNull(),
  metricValue: varchar("metric_value", { length: 255 }).notNull(),
  metricType: varchar("metric_type", { length: 50 }).notNull(), // 'disk', 'database', 'memory'
  status: varchar("status", { length: 20 }).notNull(), // 'healthy', 'warning', 'critical'
  threshold: varchar("threshold", { length: 100 }),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

export const restoreHistory = pgTable("restore_history", {
  id: serial("id").primaryKey(),
  backupFileId: integer("backup_file_id").references(() => backupFiles.id),
  status: varchar("status", { length: 50 }).notNull(), // 'in_progress', 'completed', 'failed'
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  restoredById: integer("restored_by_id").references(() => users.id),
  recordsRestored: integer("records_restored").default(0),
  tablesRestored: varchar("tables_restored", { length: 500 }), // comma-separated table names
});

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, { fields: [employees.userId], references: [users.id] }),
  directManagerEmployee: one(employees, { fields: [employees.directManager], references: [employees.id] }),
  subordinates: many(employees),
  assets: many(assets),
  tickets: many(tickets),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  assignedEmployee: one(employees, { fields: [assets.assignedEmployeeId], references: [employees.id] }),
  tickets: many(tickets),
  assetMaintenance: many(assetMaintenance),
  assetTransactions: many(assetTransactions),
  assetUpgrades: many(assetUpgrades),
  assetSaleItems: many(assetSaleItems),
}));

export const assetSalesRelations = relations(assetSales, ({ one, many }) => ({
  createdByUser: one(users, { fields: [assetSales.createdById], references: [users.id] }),
  saleItems: many(assetSaleItems),
}));

export const assetSaleItemsRelations = relations(assetSaleItems, ({ one }) => ({
  sale: one(assetSales, { fields: [assetSaleItems.saleId], references: [assetSales.id] }),
  asset: one(assets, { fields: [assetSaleItems.assetId], references: [assets.id] }),
}));

export const assetStatusesRelations = relations(assetStatuses, ({ many }) => ({
  // No direct relations needed as assets reference statuses by name, not ID
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  submittedByEmployee: one(employees, { fields: [tickets.submittedById], references: [employees.id] }),
  assignedToUser: one(users, { fields: [tickets.assignedToId], references: [users.id] }),
  relatedAsset: one(assets, { fields: [tickets.relatedAssetId], references: [assets.id] }),
  category: one(categories, { fields: [tickets.categoryId], references: [categories.id] }),
  comments: many(ticketComments),
  history: many(ticketHistory),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  tickets: many(tickets),
}));

// Insert schemas for form validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true, updatedAt: true, empId: true });
export const insertAssetSchema = createInsertSchema(assets).omit({ id: true, createdAt: true, updatedAt: true, assetId: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, createdAt: true, updatedAt: true, ticketId: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssetMaintenanceSchema = createInsertSchema(assetMaintenance).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

// Additional insert schemas for missing tables
export const insertAssetSalesSchema = createInsertSchema(assetSales).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssetSaleItemsSchema = createInsertSchema(assetSaleItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({ id: true, createdAt: true, updatedAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLog).omit({ id: true, createdAt: true });
export const insertAssetTransactionSchema = createInsertSchema(assetTransactions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSecurityQuestionSchema = createInsertSchema(securityQuestions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true });

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type AssetMaintenance = typeof assetMaintenance.$inferSelect;
export type InsertAssetMaintenance = z.infer<typeof insertAssetMaintenanceSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Additional type exports for missing tables
export type AssetSale = typeof assetSales.$inferSelect;
export type InsertAssetSale = z.infer<typeof insertAssetSalesSchema>;
export type AssetSaleItem = typeof assetSaleItems.$inferSelect;
export type InsertAssetSaleItem = z.infer<typeof insertAssetSaleItemsSchema>;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type AssetTransaction = typeof assetTransactions.$inferSelect;
export type InsertAssetTransaction = z.infer<typeof insertAssetTransactionSchema>;
export type SecurityQuestion = typeof securityQuestions.$inferSelect;
export type InsertSecurityQuestion = z.infer<typeof insertSecurityQuestionSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

// Asset Status types
export const insertAssetStatusSchema = createInsertSchema(assetStatuses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type AssetStatus = typeof assetStatuses.$inferSelect;
export type InsertAssetStatus = z.infer<typeof insertAssetStatusSchema>;
