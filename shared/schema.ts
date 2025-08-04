import { pgTable, serial, varchar, text, integer, boolean, timestamp, decimal, date, jsonb, index, pgEnum } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums matching the current database
export const accessLevelEnum = pgEnum('access_level', ['1', '2', '3', '4']);
export const roleEnum = pgEnum('role', ['employee', 'agent', 'manager', 'admin']);
export const employmentTypeEnum = pgEnum('employment_type', ['Full-time', 'Part-time', 'Contract', 'Temporary']);
export const employeeStatusEnum = pgEnum('employee_status', ['Active', 'Inactive', 'Terminated', 'On Leave']);
export const assetStatusEnum = pgEnum('asset_status', ['Available', 'In Use', 'Damaged', 'Maintenance', 'Sold', 'Retired']);
export const assetTypeEnum = pgEnum('asset_type', ['Laptop', 'Desktop', 'Mobile', 'Tablet', 'Monitor', 'Printer', 'Server', 'Network', 'Other']);
export const assetConditionEnum = pgEnum('asset_condition', ['New', 'Good', 'Fair', 'Poor', 'Damaged']);
export const ticketStatusEnum = pgEnum('ticket_status', ['Open', 'In Progress', 'Resolved', 'Closed', 'Cancelled']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['Low', 'Medium', 'High', 'Critical']);
export const notificationTypeEnum = pgEnum('notification_type', ['Asset', 'Ticket', 'System', 'Employee']);
export const upgradePriorityEnum = pgEnum('upgrade_priority', ['Critical', 'High', 'Medium', 'Low']);
export const upgradeRiskEnum = pgEnum('upgrade_risk', ['Critical', 'High', 'Medium', 'Low']);
export const upgradeStatusEnum = pgEnum('upgrade_status', ['Planned', 'Approved', 'In Progress', 'Testing', 'Completed', 'Failed', 'Cancelled', 'Rolled Back']);

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
  status: assetStatusEnum("status").notNull().default('Available'),
  purchaseDate: date("purchase_date"),
  buyPrice: decimal("buy_price", { precision: 10, scale: 2 }),
  warrantyExpiryDate: date("warranty_expiry_date"),
  lifeSpan: integer("life_span"),
  outOfBoxOs: varchar("out_of_box_os", { length: 100 }),
  assignedEmployeeId: integer("assigned_employee_id").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Asset Maintenance table
export const assetMaintenance = pgTable("asset_maintenance", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  maintenanceType: varchar("maintenance_type", { length: 100 }).notNull(),
  description: text("description").notNull(),
  scheduledDate: date("scheduled_date"),
  completedDate: date("completed_date"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  performedById: integer("performed_by_id").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Asset Sales table
export const assetSales = pgTable("asset_sales", {
  id: serial("id").primaryKey(),
  saleId: varchar("sale_id", { length: 20 }).notNull().unique(),
  buyerName: varchar("buyer_name", { length: 255 }).notNull(),
  buyerContact: varchar("buyer_contact", { length: 100 }),
  saleDate: date("sale_date").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  notes: text("notes"),
  handledById: integer("handled_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Asset Sale Items table
export const assetSaleItems = pgTable("asset_sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => assetSales.id),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(),
  condition: varchar("condition", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tickets table
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketId: varchar("ticket_id", { length: 20 }).notNull().unique().default(sql`('TKT-'::text || lpad(nextval('tickets_id_seq'::regclass)::text, 6, '0'::text))`),
  summary: varchar("summary", { length: 255 }),
  description: text("description").notNull(),
  requestType: varchar("request_type", { length: 100 }).notNull().default('Hardware'),
  category: varchar("category", { length: 100 }).notNull().default('Incident'),
  priority: ticketPriorityEnum("priority").notNull().default('Medium'),
  urgency: varchar("urgency", { length: 50 }).notNull().default('Medium'),
  impact: varchar("impact", { length: 50 }).notNull().default('Medium'),
  status: ticketStatusEnum("status").notNull().default('Open'),
  submittedById: integer("submitted_by_id").notNull().references(() => employees.id),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  relatedAssetId: integer("related_asset_id").references(() => assets.id),
  resolution: text("resolution"),
  resolutionNotes: text("resolution_notes"),
  dueDate: timestamp("due_date"),
  slaTarget: timestamp("sla_target"),
  escalationLevel: varchar("escalation_level", { length: 10 }).default('0'),
  tags: text("tags"),
  privateNotes: text("private_notes"),
  timeSpent: integer("time_spent").default(0),
  isTimeTracking: boolean("is_time_tracking").default(false),
  timeTrackingStartedAt: timestamp("time_tracking_started_at"),
  mergedIntoId: integer("merged_into_id").references(() => tickets.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ticket History table
export const ticketHistory = pgTable("ticket_history", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id),
  userId: integer("user_id").notNull().references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  changeDescription: text("change_description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ticket Comments table
export const ticketComments = pgTable("ticket_comments", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id),
  userId: integer("user_id").notNull().references(() => users.id),
  comment: text("comment").notNull(),
  isPrivate: boolean("is_private").default(false),
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

// System Configuration table
export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  language: varchar("language", { length: 10 }).notNull().default('en'),
  assetIdPrefix: varchar("asset_id_prefix", { length: 10 }).notNull().default('AST'),
  employeeIdPrefix: varchar("employee_id_prefix", { length: 10 }).notNull().default('EMP'),
  ticketIdPrefix: varchar("ticket_id_prefix", { length: 10 }).notNull().default('TKT'),
  departments: text("departments").array().default([]),
  companyName: varchar("company_name", { length: 255 }).notNull().default('SimpleIT'),
  companyAddress: text("company_address"),
  companyPhone: varchar("company_phone", { length: 50 }),
  companyEmail: varchar("company_email", { length: 100 }),
  companyWebsite: varchar("company_website", { length: 255 }),
  defaultCurrency: varchar("default_currency", { length: 10 }).notNull().default('USD'),
  enableAuditLogs: boolean("enable_audit_logs").default(true),
  auditLogRetentionDays: integer("audit_log_retention_days").default(365),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Asset Transactions table
export const assetTransactions = pgTable("asset_transactions", {
  id: serial("id").primaryKey(),
  transactionId: varchar("transaction_id", { length: 20 }).notNull().unique(),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  employeeId: integer("employee_id").references(() => employees.id),
  transactionType: varchar("transaction_type", { length: 50 }).notNull(),
  fromLocation: varchar("from_location", { length: 255 }),
  toLocation: varchar("to_location", { length: 255 }),
  handledById: integer("handled_by_id").references(() => users.id),
  notes: text("notes"),
  transactionDate: timestamp("transaction_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom Asset Types table
export const customAssetTypes = pgTable("custom_asset_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom Asset Brands table
export const customAssetBrands = pgTable("custom_asset_brands", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom Asset Statuses table
export const customAssetStatuses = pgTable("custom_asset_statuses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default('#6B7280'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service Providers table
export const serviceProviders = pgTable("service_providers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 100 }),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  serviceType: varchar("service_type", { length: 100 }),
  isActive: boolean("is_active").default(true),
  contractStartDate: date("contract_start_date"),
  contractEndDate: date("contract_end_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Asset Service Providers table
export const assetServiceProviders = pgTable("asset_service_providers", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  serviceProviderId: integer("service_provider_id").notNull().references(() => serviceProviders.id),
  serviceType: varchar("service_type", { length: 100 }).notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  contractNumber: varchar("contract_number", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom Request Types table
export const customRequestTypes = pgTable("custom_request_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  priority: varchar("priority", { length: 50 }),
  slaHours: integer("sla_hours"),
});

// Asset Upgrades table
export const assetUpgrades = pgTable("asset_upgrades", {
  id: serial("id").primaryKey(),
  upgradeId: varchar("upgrade_id", { length: 20 }).notNull().unique(),
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
}, (table) => [
  index("idx_asset_upgrades_asset_id").on(table.assetId),
  index("idx_asset_upgrades_requested_by").on(table.requestedById),
  index("idx_asset_upgrades_status").on(table.status),
]);

// Upgrade History table
export const upgradeHistory = pgTable("upgrade_history", {
  id: serial("id").primaryKey(),
  upgradeId: integer("upgrade_id").notNull().references(() => assetUpgrades.id),
  userId: integer("user_id").notNull().references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => [
  index("idx_upgrade_history_upgrade_id").on(table.upgradeId),
  index("idx_upgrade_history_timestamp").on(table.timestamp),
]);

// RELATIONS
export const usersRelations = relations(users, ({ many }) => ({
  employees: many(employees),
  securityQuestions: many(securityQuestions),
  passwordResetTokens: many(passwordResetTokens),
  notifications: many(notifications),
  ticketHistory: many(ticketHistory),
  ticketComments: many(ticketComments),
  assetUpgrades: many(assetUpgrades),
  upgradeHistory: many(upgradeHistory),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  manager: one(employees, {
    fields: [employees.directManager],
    references: [employees.id],
    relationName: "manager",
  }),
  subordinates: many(employees, { relationName: "manager" }),
  assets: many(assets),
  submittedTickets: many(tickets),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  assignedTo: one(employees, {
    fields: [assets.assignedEmployeeId],
    references: [employees.id],
  }),
  maintenance: many(assetMaintenance),
  saleItems: many(assetSaleItems),
  tickets: many(tickets),
  transactions: many(assetTransactions),
  serviceProviders: many(assetServiceProviders),
  upgrades: many(assetUpgrades),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  submittedBy: one(employees, {
    fields: [tickets.submittedById],
    references: [employees.id],
  }),
  assignedTo: one(users, {
    fields: [tickets.assignedToId],
    references: [users.id],
  }),
  relatedAsset: one(assets, {
    fields: [tickets.relatedAssetId],
    references: [assets.id],
  }),
  mergedInto: one(tickets, {
    fields: [tickets.mergedIntoId],
    references: [tickets.id],
  }),
  history: many(ticketHistory),
  comments: many(ticketComments),
}));

export const ticketHistoryRelations = relations(ticketHistory, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketHistory.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [ticketHistory.userId],
    references: [users.id],
  }),
}));

export const ticketCommentsRelations = relations(ticketComments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketComments.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [ticketComments.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const securityQuestionsRelations = relations(securityQuestions, ({ one }) => ({
  user: one(users, {
    fields: [securityQuestions.userId],
    references: [users.id],
  }),
}));

export const assetMaintenanceRelations = relations(assetMaintenance, ({ one }) => ({
  asset: one(assets, {
    fields: [assetMaintenance.assetId],
    references: [assets.id],
  }),
  performedBy: one(users, {
    fields: [assetMaintenance.performedById],
    references: [users.id],
  }),
}));

export const assetSalesRelations = relations(assetSales, ({ one, many }) => ({
  handledBy: one(users, {
    fields: [assetSales.handledById],
    references: [users.id],
  }),
  items: many(assetSaleItems),
}));

export const assetSaleItemsRelations = relations(assetSaleItems, ({ one }) => ({
  sale: one(assetSales, {
    fields: [assetSaleItems.saleId],
    references: [assetSales.id],
  }),
  asset: one(assets, {
    fields: [assetSaleItems.assetId],
    references: [assets.id],
  }),
}));

export const assetTransactionsRelations = relations(assetTransactions, ({ one }) => ({
  asset: one(assets, {
    fields: [assetTransactions.assetId],
    references: [assets.id],
  }),
  employee: one(employees, {
    fields: [assetTransactions.employeeId],
    references: [employees.id],
  }),
  handledBy: one(users, {
    fields: [assetTransactions.handledById],
    references: [users.id],
  }),
}));

export const serviceProvidersRelations = relations(serviceProviders, ({ many }) => ({
  assetServiceProviders: many(assetServiceProviders),
}));

export const assetServiceProvidersRelations = relations(assetServiceProviders, ({ one }) => ({
  asset: one(assets, {
    fields: [assetServiceProviders.assetId],
    references: [assets.id],
  }),
  serviceProvider: one(serviceProviders, {
    fields: [assetServiceProviders.serviceProviderId],
    references: [serviceProviders.id],
  }),
}));

export const assetUpgradesRelations = relations(assetUpgrades, ({ one, many }) => ({
  asset: one(assets, {
    fields: [assetUpgrades.assetId],
    references: [assets.id],
  }),
  requestedBy: one(users, {
    fields: [assetUpgrades.requestedById],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [assetUpgrades.approvedById],
    references: [users.id],
  }),
  implementedBy: one(users, {
    fields: [assetUpgrades.implementedById],
    references: [users.id],
  }),
  history: many(upgradeHistory),
}));

export const upgradeHistoryRelations = relations(upgradeHistory, ({ one }) => ({
  upgrade: one(assetUpgrades, {
    fields: [upgradeHistory.upgradeId],
    references: [assetUpgrades.id],
  }),
  user: one(users, {
    fields: [upgradeHistory.userId],
    references: [users.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id],
  }),
}));

// INSERT SCHEMAS
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({ 
  id: true, 
  empId: true,
  createdAt: true, 
  updatedAt: true,
  name: true,
  email: true,
  phone: true,
  position: true
});

export const insertAssetSchema = createInsertSchema(assets).omit({ 
  id: true, 
  assetId: true,
  createdAt: true, 
  updatedAt: true 
});

export const insertAssetMaintenanceSchema = createInsertSchema(assetMaintenance).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertAssetSaleSchema = createInsertSchema(assetSales).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertAssetSaleItemSchema = createInsertSchema(assetSaleItems).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertTicketSchema = createInsertSchema(tickets).omit({ 
  id: true, 
  ticketId: true,
  createdAt: true, 
  updatedAt: true
});

export const insertTicketHistorySchema = createInsertSchema(ticketHistory).omit({
  id: true,
  createdAt: true,
});

export const insertTicketCommentSchema = createInsertSchema(ticketComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({ 
  id: true, 
  createdAt: true
});

export const insertChangesLogSchema = createInsertSchema(changesLog).omit({ 
  id: true, 
  createdAt: true
});

export const insertAssetTransactionSchema = createInsertSchema(assetTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomAssetTypeSchema = createInsertSchema(customAssetTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCustomAssetBrandSchema = createInsertSchema(customAssetBrands).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCustomAssetStatusSchema = createInsertSchema(customAssetStatuses).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertServiceProviderSchema = createInsertSchema(serviceProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAssetServiceProviderSchema = createInsertSchema(assetServiceProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCustomRequestTypeSchema = createInsertSchema(customRequestTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true
});

export const insertSecurityQuestionSchema = createInsertSchema(securityQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAssetUpgradeSchema = createInsertSchema(assetUpgrades).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUpgradeHistorySchema = createInsertSchema(upgradeHistory).omit({
  id: true
});

// TYPE EXPORTS
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type AssetMaintenance = typeof assetMaintenance.$inferSelect;
export type InsertAssetMaintenance = z.infer<typeof insertAssetMaintenanceSchema>;

export type AssetSale = typeof assetSales.$inferSelect;
export type InsertAssetSale = z.infer<typeof insertAssetSaleSchema>;

export type AssetSaleItem = typeof assetSaleItems.$inferSelect;
export type InsertAssetSaleItem = z.infer<typeof insertAssetSaleItemSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type TicketHistory = typeof ticketHistory.$inferSelect;
export type InsertTicketHistory = z.infer<typeof insertTicketHistorySchema>;

export type TicketComment = typeof ticketComments.$inferSelect;
export type InsertTicketComment = z.infer<typeof insertTicketCommentSchema>;

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type ChangeLog = typeof changesLog.$inferSelect;
export type InsertChangeLog = z.infer<typeof insertChangesLogSchema>;

export type AssetTransaction = typeof assetTransactions.$inferSelect;
export type InsertAssetTransaction = z.infer<typeof insertAssetTransactionSchema>;

export type CustomAssetType = typeof customAssetTypes.$inferSelect;
export type InsertCustomAssetType = z.infer<typeof insertCustomAssetTypeSchema>;

export type CustomAssetBrand = typeof customAssetBrands.$inferSelect;
export type InsertCustomAssetBrand = z.infer<typeof insertCustomAssetBrandSchema>;

export type CustomAssetStatus = typeof customAssetStatuses.$inferSelect;
export type InsertCustomAssetStatus = z.infer<typeof insertCustomAssetStatusSchema>;

export type ServiceProvider = typeof serviceProviders.$inferSelect;
export type InsertServiceProvider = z.infer<typeof insertServiceProviderSchema>;

export type AssetServiceProvider = typeof assetServiceProviders.$inferSelect;
export type InsertAssetServiceProvider = z.infer<typeof insertAssetServiceProviderSchema>;

export type CustomRequestType = typeof customRequestTypes.$inferSelect;
export type InsertCustomRequestType = z.infer<typeof insertCustomRequestTypeSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type SecurityQuestion = typeof securityQuestions.$inferSelect;
export type InsertSecurityQuestion = z.infer<typeof insertSecurityQuestionSchema>;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

export type AssetUpgrade = typeof assetUpgrades.$inferSelect;
export type InsertAssetUpgrade = z.infer<typeof insertAssetUpgradeSchema>;

export type UpgradeHistory = typeof upgradeHistory.$inferSelect;
export type InsertUpgradeHistory = z.infer<typeof insertUpgradeHistorySchema>;