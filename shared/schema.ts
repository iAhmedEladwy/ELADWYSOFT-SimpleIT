import { pgTable, serial, varchar, text, integer, boolean, timestamp, decimal, date, jsonb, index, pgEnum } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums matching the current database
export const accessLevelEnum = pgEnum('access_level', ['1', '2', '3', '4']);
export const roleEnum = pgEnum('role', ['employee', 'agent', 'manager', 'admin']);
export const employmentTypeEnum = pgEnum('employment_type', ['Full-time', 'Part-time', 'Contract', 'Intern']);
export const employeeStatusEnum = pgEnum('employee_status', ['Active', 'Resigned', 'Terminated', 'On Leave']);
// Asset statuses are now flexible - ENUM removed to allow custom statuses
export const assetTypeEnum = pgEnum('asset_type', ['Laptop', 'Desktop', 'Mobile', 'Tablet', 'Monitor', 'Printer', 'Server', 'Network', 'Other']);
export const assetConditionEnum = pgEnum('asset_condition', ['New', 'Good', 'Fair', 'Poor', 'Damaged']);
export const ticketStatusEnum = pgEnum('ticket_status', ['Open', 'In Progress', 'Resolved', 'Closed']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['Low', 'Medium', 'High']);
export const notificationTypeEnum = pgEnum('notification_type', ['Asset', 'Ticket', 'System', 'Employee']);
export const upgradePriorityEnum = pgEnum('upgrade_priority', ['Critical', 'High', 'Medium', 'Low']);
export const upgradeRiskEnum = pgEnum('upgrade_risk', ['Critical', 'High', 'Medium', 'Low']);
export const upgradeStatusEnum = pgEnum('upgrade_status', ['Planned', 'Approved', 'In Progress', 'Testing', 'Completed', 'Failed', 'Cancelled', 'Rolled Back']);
export const maintenanceTypeEnum = pgEnum('maintenance_type', ['Preventive', 'Corrective', 'Upgrade', 'Repair', 'Inspection', 'Cleaning', 'Replacement']);
export const assetTransactionTypeEnum = pgEnum('asset_transaction_type', ['Check-Out', 'Check-In']);

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
  updatedAt: timestamp("updated_at").defaultNow(),
  // Compatibility columns (not generated to avoid PostgreSQL version issues)
  name: varchar("name", { length: 100 }),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  position: varchar("position", { length: 100 }),
});

// Assets table
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  assetId: varchar("asset_id", { length: 20 }).notNull().unique().default(sql`concat('AST-', lpad((nextval('assets_id_seq'::regclass))::text, 5, '0'::text))`),
  type: assetTypeEnum("type").notNull(),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service Providers table
export const serviceProviders = pgTable("service_providers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  contactPerson: varchar("contact_person", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 100 }),
  address: varchar("address", { length: 255 }),
  serviceType: varchar("service_type", { length: 100 }),
  contractStartDate: timestamp("contract_start_date"),
  contractEndDate: timestamp("contract_end_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Asset Service Providers relationship table
export const assetServiceProviders = pgTable("asset_service_providers", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  serviceProviderId: integer("service_provider_id").notNull().references(() => serviceProviders.id),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  contractNumber: varchar("contract_number", { length: 100 }),
  notes: text("notes"),
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
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
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

// Asset Upgrades table
export const assetUpgrades = pgTable("asset_upgrades", {
  id: serial("id").primaryKey(),
  upgradeId: varchar("upgrade_id", { length: 20 }).notNull(),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  requestedById: integer("requested_by_id").notNull().references(() => users.id),
  approvedById: integer("approved_by_id").references(() => users.id),
  implementedById: integer("implemented_by_id").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  businessJustification: text("business_justification").notNull(),
  upgradeType: varchar("upgrade_type", { length: 100 }).notNull(),
  priority: upgradePriorityEnum("priority").notNull().default('Medium'),
  risk: upgradeRiskEnum("risk").notNull().default('Medium'),
  status: upgradeStatusEnum("status").notNull().default('Planned'),
  currentConfiguration: jsonb("current_configuration"),
  newConfiguration: jsonb("new_configuration"),
  plannedStartDate: timestamp("planned_start_date"),
  plannedEndDate: timestamp("planned_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  implementationNotes: text("implementation_notes"),
  testingRequired: boolean("testing_required").default(true),
  testingNotes: text("testing_notes"),
  backoutPlan: text("backout_plan").notNull(),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }).default('0'),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }).default('0'),
  costJustification: text("cost_justification"),
  impactAssessment: text("impact_assessment").notNull(),
  dependentAssets: text("dependent_assets").array(),
  affectedUsers: text("affected_users").array(),
  downtimeRequired: boolean("downtime_required").default(false),
  estimatedDowntime: integer("estimated_downtime"),
  requiresApproval: boolean("requires_approval").default(true),
  approvalDate: timestamp("approval_date"),
  approvalNotes: text("approval_notes"),
  successCriteria: text("success_criteria").notNull(),
  verificationSteps: text("verification_steps").array(),
  postUpgradeValidation: text("post_upgrade_validation"),
  rollbackRequired: boolean("rollback_required").default(false),
  rollbackDate: timestamp("rollback_date"),
  rollbackReason: text("rollback_reason"),
  rollbackNotes: text("rollback_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Upgrade History table
export const upgradeHistory = pgTable("upgrade_history", {
  id: serial("id").primaryKey(),
  upgradeId: integer("upgrade_id").notNull().references(() => assetUpgrades.id),
  userId: integer("user_id").notNull().references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  notes: text("notes"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Tickets table
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketId: varchar("ticket_id", { length: 20 }).notNull().unique().default(sql`('TKT-' || lpad((nextval('tickets_id_seq'::regclass))::text, 6, '0'::text))`),
  submittedById: integer("submitted_by_id").notNull().references(() => employees.id),
  requestType: varchar("request_type", { length: 100 }).notNull(),
  priority: ticketPriorityEnum("priority").notNull(),
  description: text("description").notNull(),
  relatedAssetId: integer("related_asset_id").references(() => assets.id),
  status: ticketStatusEnum("status").notNull().default('Open'),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  startTime: timestamp("start_time"),
  completionTime: timestamp("completion_time"),
  timeSpent: integer("time_spent"),
  category: varchar("category", { length: 100 }).default('Incident'),
  summary: varchar("summary", { length: 255 }),
  urgency: varchar("urgency", { length: 50 }).default('Medium'),
  impact: varchar("impact", { length: 50 }).default('Medium'),
  rootCause: text("root_cause"),
  workaround: text("workaround"),
  resolution: text("resolution"),
  tags: text("tags").array(),
  dueDate: timestamp("due_date"),
  isTimeTracking: boolean("is_time_tracking").default(false),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  slaTarget: timestamp("sla_target"),
  slaBreached: boolean("sla_breached").default(false),
  escalationLevel: integer("escalation_level").default(0),
  mergedIntoId: integer("merged_into_id").references((): any => tickets.id),
  reopenCount: integer("reopen_count").default(0),
  customerRating: integer("customer_rating"),
  customerFeedback: text("customer_feedback"),
  privateNotes: text("private_notes"),
  attachments: text("attachments").array(),
  timeTrackingStartedAt: timestamp("time_tracking_started_at"),
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
  language: varchar("language", { length: 10 }).notNull().default('English'),
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

// Custom Request Types table
export const customRequestTypes = pgTable("custom_request_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default('#3B82F6'),
  isActive: boolean("is_active").default(true),
  priority: varchar("priority", { length: 20 }).default('Medium'),
  slaHours: integer("sla_hours").default(24),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Changes Log table
export const changesLog = pgTable("changes_log", {
  id: serial("id").primaryKey(),
  version: varchar("version", { length: 20 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description").notNull(),
  technicalDetails: text("technical_details"),
  date: date("date").notNull().default(sql`CURRENT_DATE`),
  author: varchar("author", { length: 100 }).notNull().default('System Administrator'),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
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
  assetServiceProviders: many(assetServiceProviders),
  assetSaleItems: many(assetSaleItems),
}));

export const assetStatusesRelations = relations(assetStatuses, ({ many }) => ({
  // No direct relations needed as assets reference statuses by name, not ID
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  submittedByEmployee: one(employees, { fields: [tickets.submittedById], references: [employees.id] }),
  assignedToUser: one(users, { fields: [tickets.assignedToId], references: [users.id] }),
  relatedAsset: one(assets, { fields: [tickets.relatedAssetId], references: [assets.id] }),
  mergedIntoTicket: one(tickets, { fields: [tickets.mergedIntoId], references: [tickets.id] }),
  comments: many(ticketComments),
  history: many(ticketHistory),
}));

// Insert schemas for form validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true, updatedAt: true, empId: true });
export const insertAssetSchema = createInsertSchema(assets).omit({ id: true, createdAt: true, updatedAt: true, assetId: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, createdAt: true, updatedAt: true, ticketId: true });
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
export const insertChangesLogSchema = createInsertSchema(changesLog).omit({ id: true, createdAt: true });

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
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
export type ChangeLog = typeof changesLog.$inferSelect;
export type InsertChangeLog = z.infer<typeof insertChangesLogSchema>;

// Asset Status types
export const insertAssetStatusSchema = createInsertSchema(assetStatuses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type AssetStatus = typeof assetStatuses.$inferSelect;
export type InsertAssetStatus = z.infer<typeof insertAssetStatusSchema>;