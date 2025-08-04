import { 
  pgTable, 
  text, 
  serial, 
  integer, 
  boolean, 
  timestamp, 
  json,
  jsonb,
  date,
  pgEnum,
  varchar,
  decimal,
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums

export const accessLevelEnum = pgEnum('access_level', ['1', '2', '3', '4']);
export const roleEnum = pgEnum('role', ['employee', 'agent', 'manager', 'admin']);
export const employmentTypeEnum = pgEnum('employment_type', ['Full-time', 'Part-time', 'Contract', 'Intern']);
export const employeeStatusEnum = pgEnum('employee_status', ['Active', 'Resigned', 'Terminated', 'On Leave']);
export const assetStatusEnum = pgEnum('asset_status', ['Available', 'In Use', 'Damaged', 'Maintenance', 'Sold', 'Retired']);
export const assetTypeEnum = pgEnum('asset_type', ['Laptop', 'Desktop', 'Mobile', 'Tablet', 'Monitor', 'Printer', 'Server', 'Network', 'Other']);
export const maintenanceTypeEnum = pgEnum('maintenance_type', ['Preventive', 'Corrective', 'Upgrade', 'Repair', 'Inspection', 'Cleaning', 'Replacement']);
export const ticketRequestTypeEnum = pgEnum('ticket_request_type', ['Hardware', 'Software', 'Network', 'Other']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['Low', 'Medium', 'High']);
export const ticketStatusEnum = pgEnum('ticket_status', ['Open', 'In Progress', 'Resolved', 'Closed']);

// Session storage table for authentication
// Custom lookup tables for asset management
export const customAssetTypes = pgTable(
  "custom_asset_types",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    description: varchar("description", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }
);

export const customAssetBrands = pgTable(
  "custom_asset_brands",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    description: varchar("description", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }
);

export const customAssetStatuses = pgTable(
  "custom_asset_statuses",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    description: varchar("description", { length: 255 }),
    color: varchar("color", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }
);

export const serviceProviders = pgTable(
  "service_providers",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
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
  }
);

export const customRequestTypes = pgTable(
  "custom_request_types",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    description: varchar("description", { length: 255 }),
    priority: varchar("priority", { length: 50 }).default('Medium'),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }
);

export const assetServiceProviders = pgTable(
  "asset_service_providers",
  {
    id: serial("id").primaryKey(),
    assetId: integer("asset_id").notNull().references(() => assets.id, { onDelete: 'cascade' }),
    serviceProviderId: integer("service_provider_id").notNull().references(() => serviceProviders.id, { onDelete: 'cascade' }),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    contractNumber: varchar("contract_number", { length: 100 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }
);

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - aligned with actual PostgreSQL schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: text("password").notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  accessLevel: accessLevelEnum("access_level").notNull().default('1'), // 1=employee, 2=agent, 3=manager, 4=admin
  role: roleEnum("role").notNull().default('employee'), // employee, agent, manager, admin
  isActive: boolean("is_active").default(true), // User active status
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
});

// Employees table - Matches actual database structure
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  empId: varchar("emp_id", { length: 20 }).notNull().unique(), // Primary employee ID
  englishName: varchar("english_name", { length: 100 }).notNull(),
  arabicName: varchar("arabic_name", { length: 100 }),
  department: varchar("department", { length: 100 }).notNull(),
  idNumber: varchar("id_number", { length: 50 }).notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  directManager: integer("direct_manager").references((): any => employees.id),
  employmentType: employmentTypeEnum("employment_type").notNull().default('Full-time'),
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
  // Compatibility fields for backward compatibility
  name: varchar("name", { length: 100 }),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  position: varchar("position", { length: 100 }),
});

// Assets table
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  assetId: varchar("asset_id", { length: 20 }).notNull().unique(),
  type: varchar("type", { length: 100 }).notNull(),
  brand: varchar("brand", { length: 100 }).notNull(),
  modelNumber: varchar("model_number", { length: 100 }),
  modelName: varchar("model_name", { length: 100 }),
  serialNumber: varchar("serial_number", { length: 100 }).notNull(),
  specs: text("specs"),
  cpu: varchar("cpu", { length: 200 }), // Processor/CPU specification
  ram: varchar("ram", { length: 100 }), // RAM specification
  storage: varchar("storage", { length: 200 }), // Storage specification
  status: varchar("status", { length: 100 }).notNull().default('Available'),
  purchaseDate: date("purchase_date"),
  buyPrice: decimal("buy_price", { precision: 10, scale: 2 }),
  warrantyExpiryDate: date("warranty_expiry_date"),
  lifeSpan: integer("life_span"), // in months
  outOfBoxOs: varchar("out_of_box_os", { length: 100 }),
  assignedEmployeeId: integer("assigned_employee_id").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Asset Maintenance table
export const assetMaintenance = pgTable("asset_maintenance", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  date: date("date").notNull(),
  type: maintenanceTypeEnum("type").notNull(),
  description: text("description").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).default('0'),
  providerType: varchar("provider_type", { length: 50 }).notNull(), // Internal or External
  providerName: varchar("provider_name", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Asset Sales Items table
export const assetSaleItems = pgTable("asset_sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => assetSales.id),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ITIL-Compliant Asset Upgrade Management
export const upgradeStatusEnum = pgEnum('upgrade_status', ['Planned', 'Approved', 'In Progress', 'Testing', 'Completed', 'Failed', 'Cancelled', 'Rolled Back']);
export const upgradePriorityEnum = pgEnum('upgrade_priority', ['Critical', 'High', 'Medium', 'Low']);
export const upgradeRiskEnum = pgEnum('upgrade_risk', ['Critical', 'High', 'Medium', 'Low']);

export const assetUpgrades = pgTable("asset_upgrades", {
  id: serial("id").primaryKey(),
  upgradeId: varchar("upgrade_id", { length: 20 }).notNull().unique(),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  requestedById: integer("requested_by_id").notNull().references(() => users.id),
  approvedById: integer("approved_by_id").references(() => users.id),
  implementedById: integer("implemented_by_id").references(() => users.id),
  
  // ITIL Change Management Fields
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  businessJustification: text("business_justification").notNull(),
  upgradeType: varchar("upgrade_type", { length: 100 }).notNull(), // Hardware, Software, Firmware, Configuration
  priority: upgradePriorityEnum("priority").notNull().default('Medium'),
  risk: upgradeRiskEnum("risk").notNull().default('Medium'),
  status: upgradeStatusEnum("status").notNull().default('Planned'),
  
  // Current vs New Configuration
  currentConfiguration: json("current_configuration"), // Current asset specs/config
  newConfiguration: json("new_configuration"), // Planned new specs/config
  
  // Implementation Details
  plannedStartDate: timestamp("planned_start_date"),
  plannedEndDate: timestamp("planned_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  implementationNotes: text("implementation_notes"),
  
  // Testing & Verification
  testingRequired: boolean("testing_required").default(true),
  testingNotes: text("testing_notes"),
  backoutPlan: text("backout_plan").notNull(), // ITIL Requirement
  
  // Cost Management
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }).default('0'),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }).default('0'),
  costJustification: text("cost_justification"),
  
  // Impact Assessment
  impactAssessment: text("impact_assessment").notNull(),
  dependentAssets: text("dependent_assets").array(), // Asset IDs that depend on this
  affectedUsers: text("affected_users").array(), // User IDs affected by upgrade
  downtimeRequired: boolean("downtime_required").default(false),
  estimatedDowntime: integer("estimated_downtime"), // Minutes
  
  // Approval Workflow
  requiresApproval: boolean("requires_approval").default(true),
  approvalDate: timestamp("approval_date"),
  approvalNotes: text("approval_notes"),
  
  // Success Criteria
  successCriteria: text("success_criteria").notNull(),
  verificationSteps: text("verification_steps").array(),
  postUpgradeValidation: text("post_upgrade_validation"),
  
  // Rollback Information
  rollbackRequired: boolean("rollback_required").default(false),
  rollbackDate: timestamp("rollback_date"),
  rollbackReason: text("rollback_reason"),
  rollbackNotes: text("rollback_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Upgrade History/Audit Trail
export const upgradeHistory = pgTable("upgrade_history", {
  id: serial("id").primaryKey(),
  upgradeId: integer("upgrade_id").notNull().references(() => assetUpgrades.id),
  userId: integer("user_id").notNull().references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(), // Status Change, Comment Added, Configuration Updated, etc.
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  notes: text("notes"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Tickets table
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketId: varchar("ticket_id", { length: 20 }).notNull().unique(),
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
  timeSpent: integer("time_spent").default(0), // in minutes
  isTimeTracking: boolean("is_time_tracking").default(false),
  timeTrackingStartedAt: timestamp("time_tracking_started_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ticket History/Audit Trail
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

// Ticket Comments
export const ticketComments = pgTable("ticket_comments", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id),
  userId: integer("user_id").notNull().references(() => users.id),
  comment: text("comment").notNull(),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System configuration table
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

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: integer("entity_id"),
  details: json("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity Log table
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: integer("entity_id"),
  details: json("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Changes Log table for tracking system updates
export const changesLog = pgTable("changes_log", {
  id: serial("id").primaryKey(),
  version: varchar("version", { length: 20 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  changeType: varchar("change_type", { length: 50 }).notNull(), // Feature, Bug Fix, Enhancement, Security
  priority: varchar("priority", { length: 20 }).notNull().default('Medium'), // Low, Medium, High, Critical
  affectedModules: text("affected_modules").array(),
  userId: integer("user_id").references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default('Active'), // Active, Archived
  releaseDate: timestamp("release_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const employeesRelations = relations(employees, ({ one, many }) => ({
  manager: one(employees, {
    fields: [employees.directManager],
    references: [employees.id],
  }),
  subordinates: many(employees),
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  assignedAssets: many(assets),
  submittedTickets: many(tickets, { relationName: "submittedTickets" }),
  assetTransactions: many(assetTransactions),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  assignedTo: one(employees, {
    fields: [assets.assignedEmployeeId],
    references: [employees.id],
  }),
  maintenanceRecords: many(assetMaintenance),
  tickets: many(tickets),
  saleItems: many(assetSaleItems),
  transactions: many(assetTransactions),
}));

export const assetMaintenanceRelations = relations(assetMaintenance, ({ one }) => ({
  asset: one(assets, {
    fields: [assetMaintenance.assetId],
    references: [assets.id],
  }),
}));

export const assetSalesRelations = relations(assetSales, ({ many }) => ({
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

// Asset Transaction types enum
export const assetTransactionTypeEnum = pgEnum('asset_transaction_type', ['Check-Out', 'Check-In']);

// Asset Transactions table
export const assetTransactions = pgTable("asset_transactions", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => assets.id, { onDelete: 'cascade' }),
  type: assetTransactionTypeEnum("type").notNull(),
  employeeId: integer("employee_id").references(() => employees.id),
  transactionDate: timestamp("transaction_date").notNull().defaultNow(),
  expectedReturnDate: timestamp("expected_return_date"),
  actualReturnDate: timestamp("actual_return_date"),
  conditionNotes: text("condition_notes"),
  deviceSpecs: json("device_specs"), // Record device specifications at time of change
  handledById: integer("handled_by_id").references(() => users.id),
  attachments: text("attachments").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relationships for asset transactions
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

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  submittedBy: one(employees, {
    fields: [tickets.submittedById],
    references: [employees.id],
    relationName: "submittedTickets",
  }),
  relatedAsset: one(assets, {
    fields: [tickets.relatedAssetId],
    references: [assets.id],
  }),
  assignedTo: one(users, {
    fields: [tickets.assignedToId],
    references: [users.id],
  }),
  history: many(ticketHistory),
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

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id],
  }),
}));

export const changesLogRelations = relations(changesLog, ({ one }) => ({
  user: one(users, {
    fields: [changesLog.userId],
    references: [users.id],
  }),
}));

// Relations for service providers
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

// Schemas for inserts
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertEmployeeSchema = createInsertSchema(employees).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  name: true,
  email: true,
  phone: true,
  position: true
});
export const insertAssetSchema = createInsertSchema(assets)
  .omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true 
  })
  .extend({
    // Fix buyPrice to handle string inputs and convert them properly
    buyPrice: z.union([
      z.number(),
      z.string().transform(val => val === '' ? null : parseFloat(val)),
      z.null()
    ]).transform(val => val === null ? null : val).optional()
  });
export const insertAssetMaintenanceSchema = createInsertSchema(assetMaintenance)
  .omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true 
  })
  .extend({
    // Ensure cost can handle string inputs and converts them properly
    cost: z.union([
      z.number(),
      z.string().transform(val => val === '' ? 0 : parseFloat(val)),
      z.null()
    ]).transform(val => val === null ? 0 : val).optional().default(0)
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
  ticketId: true, // Remove ticketId from validation requirements
  createdAt: true, 
  updatedAt: true,
  lastActivityAt: true
});

// Enhanced ticket schemas  
export const insertTicketHistorySchema = createInsertSchema(ticketHistory).omit({
  id: true,
  createdAt: true,
});

export const insertTicketCommentSchema = createInsertSchema(ticketComments).omit({
  id: true,
  createdAt: true,
});

// export const insertTicketCategorySchema = createInsertSchema(ticketCategories).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true,
// });

// export const insertTicketNotificationSchema = createInsertSchema(ticketNotifications).omit({
//   id: true,
//   createdAt: true,
// });

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
  createdAt: true, 
  updatedAt: true 
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

// Export types
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

export type TicketComment = typeof ticketComments.$inferSelect;
export type InsertTicketComment = z.infer<typeof insertTicketCommentSchema>;

export type TicketHistory = typeof ticketHistory.$inferSelect;
export type InsertTicketHistory = z.infer<typeof insertTicketHistorySchema>;

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type ChangeLog = typeof changesLog.$inferSelect;
export type InsertChangeLog = z.infer<typeof insertChangesLogSchema>;

// Asset Transaction types
export const insertAssetTransactionSchema = createInsertSchema(assetTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AssetTransaction = typeof assetTransactions.$inferSelect;
export type InsertAssetTransaction = z.infer<typeof insertAssetTransactionSchema>;

// Security questions and password reset types
export const insertSecurityQuestionSchema = createInsertSchema(securityQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true
});

export type SecurityQuestion = typeof securityQuestions.$inferSelect;
export type InsertSecurityQuestion = z.infer<typeof insertSecurityQuestionSchema>;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

// Notification system
export const notificationEnum = pgEnum('notification_type', ['Asset', 'Ticket', 'System', 'Employee']);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: notificationEnum("type").notNull(),
  entityId: integer("entity_id"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Custom request types for ticket module
export type CustomRequestType = typeof customRequestTypes.$inferSelect;
export type InsertCustomRequestType = z.infer<typeof insertCustomRequestTypeSchema>;

// Custom asset management types
export type CustomAssetType = typeof customAssetTypes.$inferSelect;
export type InsertCustomAssetType = z.infer<typeof insertCustomAssetTypeSchema>;

export type CustomAssetBrand = typeof customAssetBrands.$inferSelect;
export type InsertCustomAssetBrand = z.infer<typeof insertCustomAssetBrandSchema>;

export type CustomAssetStatus = typeof customAssetStatuses.$inferSelect;
export type InsertCustomAssetStatus = z.infer<typeof insertCustomAssetStatusSchema>;

export type ServiceProvider = typeof serviceProviders.$inferSelect;
export type InsertServiceProvider = z.infer<typeof insertServiceProviderSchema>;

// Ticket history types (declared above - removing duplicate)
