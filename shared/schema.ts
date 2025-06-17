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
export const accessLevelEnum = pgEnum('access_level', ['1', '2', '3']);
export const employmentTypeEnum = pgEnum('employment_type', ['Full-time', 'Part-time', 'Contract', 'Intern']);
export const employeeStatusEnum = pgEnum('employee_status', ['Active', 'Resigned', 'Terminated', 'On Leave']);
export const assetStatusEnum = pgEnum('asset_status', ['Available', 'In Use', 'Damaged', 'Maintenance', 'Sold', 'Retired']);
export const assetTypeEnum = pgEnum('asset_type', ['Laptop', 'Desktop', 'Mobile', 'Tablet', 'Monitor', 'Printer', 'Server', 'Network', 'Other']);
export const maintenanceTypeEnum = pgEnum('maintenance_type', ['Hardware', 'Software', 'Both']);
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

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: text("password").notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  accessLevel: accessLevelEnum("access_level").notNull().default('1'),
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

// Employees table
export const employees: any = pgTable("employees", {
  id: serial("id").primaryKey(),
  empId: varchar("emp_id", { length: 20 }).notNull().unique(),
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

// Tickets table
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketId: varchar("ticket_id", { length: 20 }).notNull().unique(),
  submittedById: integer("submitted_by_id").notNull().references(() => employees.id),
  requestType: ticketRequestTypeEnum("request_type").notNull(),
  priority: ticketPriorityEnum("priority").notNull(),
  description: text("description").notNull(),
  relatedAssetId: integer("related_asset_id").references(() => assets.id),
  status: ticketStatusEnum("status").notNull().default('Open'),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  resolutionNotes: text("resolution_notes"),
  startTime: timestamp("start_time"),
  completionTime: timestamp("completion_time"),
  timeSpent: integer("time_spent"), // Time spent in minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  // Email configuration settings
  emailHost: varchar("email_host", { length: 100 }),
  emailPort: integer("email_port"),
  emailUser: varchar("email_user", { length: 100 }),
  emailPassword: varchar("email_password", { length: 100 }),
  emailFromAddress: varchar("email_from_address", { length: 100 }),
  emailFromName: varchar("email_from_name", { length: 100 }),
  emailSecure: boolean("email_secure").default(true),
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

export const ticketsRelations = relations(tickets, ({ one }) => ({
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
  updatedAt: true 
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
