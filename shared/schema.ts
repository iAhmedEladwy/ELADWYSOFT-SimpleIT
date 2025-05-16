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
export const ticketCategoryEnum = pgEnum('ticket_category', ['Hardware', 'Software', 'Network', 'Other']);
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

// Employees table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  empId: varchar("emp_id", { length: 20 }).notNull().unique(),
  englishName: varchar("english_name", { length: 100 }).notNull(),
  arabicName: varchar("arabic_name", { length: 100 }),
  department: varchar("department", { length: 100 }).notNull(),
  idNumber: varchar("id_number", { length: 50 }).notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  directManager: integer("direct_manager").references(() => employees.id),
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
  cost: decimal("cost", { precision: 10, scale: 2 }),
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
  category: ticketCategoryEnum("category").notNull(),
  priority: ticketPriorityEnum("priority").notNull(),
  description: text("description").notNull(),
  relatedAssetId: integer("related_asset_id").references(() => assets.id),
  status: ticketStatusEnum("status").notNull().default('Open'),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System Configuration table
export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  language: varchar("language", { length: 10 }).notNull().default('English'),
  assetIdPrefix: varchar("asset_id_prefix", { length: 10 }).notNull().default('BOLT-'),
  currency: varchar("currency", { length: 10 }).notNull().default('USD'),
  currencySymbol: varchar("currency_symbol", { length: 5 }).notNull().default('$'),
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
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  assignedTo: one(employees, {
    fields: [assets.assignedEmployeeId],
    references: [employees.id],
  }),
  maintenanceRecords: many(assetMaintenance),
  tickets: many(tickets),
  saleItems: many(assetSaleItems),
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
export const insertAssetSchema = createInsertSchema(assets).omit({ 
  id: true, 
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
