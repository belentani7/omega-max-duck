import {
  boolean,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const userRole = mysqlEnum("user_role", ["owner", "collaborator", "client"]);
export const projectStatus = mysqlEnum("project_status", ["lead", "quoted", "accepted", "waiting_files", "in_production", "mix_review", "client_review", "changes_requested", "approved", "delivered", "archived"]);
export const paymentStatus = mysqlEnum("payment_status", ["draft", "pending_approval", "approved", "rejected", "sent", "paid", "overdue", "cancelled"]);
export const automationRunStatus = mysqlEnum("automation_run_status", ["success", "failed", "skipped", "awaiting_approval"]);

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRole.notNull().default("client"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  portalUserId: int("portalUserId").references(() => users.id),
  name: varchar("name", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 180 }),
  artistName: varchar("artistName", { length: 180 }),
  language: varchar("language", { length: 12 }).notNull().default("pt-BR"),
  timezone: varchar("timezone", { length: 80 }).notNull().default("America/Recife"),
  tags: json("tags").$type<string[]>().notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("clients_email_idx").on(table.email), uniqueIndex("clients_portal_user_unique").on(table.portalUserId)]);

export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 180 }).notNull(),
  role: varchar("role", { length: 120 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const contactRequests = mysqlTable("contact_requests", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  service: varchar("service", { length: 120 }),
  message: text("message").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("new"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("contact_requests_status_idx").on(table.status), index("contact_requests_created_idx").on(table.createdAt)]);

export const clientHistory = mysqlTable("client_history", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  actorId: int("actorId").references(() => users.id),
  event: varchar("event", { length: 120 }).notNull(),
  detail: text("detail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const opportunities = mysqlTable("opportunities", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").references(() => clients.id, { onDelete: "set null" }),
  name: varchar("name", { length: 180 }).notNull(),
  stage: varchar("stage", { length: 40 }).notNull().default("lead"),
  service: varchar("service", { length: 120 }),
  estimatedValue: decimal("estimatedValue", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  expectedCloseAt: timestamp("expectedCloseAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("opportunities_stage_idx").on(table.stage)]);

export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  opportunityId: int("opportunityId").references(() => opportunities.id, { onDelete: "set null" }),
  number: varchar("number", { length: 48 }).notNull().unique(),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  expiresAt: timestamp("expiresAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 220 }).notNull(),
  service: varchar("service", { length: 120 }).notNull().default("music_production"),
  status: projectStatus.notNull().default("lead"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  deadlineAt: timestamp("deadlineAt"),
  description: text("description"),
  createdById: int("createdById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("projects_client_idx").on(table.clientId), index("projects_status_idx").on(table.status)]);

export const tracks = mysqlTable("tracks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 220 }).notNull(),
  type: varchar("type", { length: 40 }).notNull().default("stem"),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const projectFiles = mysqlTable("project_files", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  trackId: int("trackId").references(() => tracks.id, { onDelete: "set null" }),
  uploadedById: int("uploadedById").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  category: varchar("category", { length: 48 }).notNull().default("source"),
  mime: varchar("mime", { length: 120 }).notNull(),
  sizeBytes: int("sizeBytes").notNull().default(0),
  status: varchar("status", { length: 32 }).notNull().default("uploaded"),
  authorizedForClient: boolean("authorizedForClient").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const projectVersions = mysqlTable("project_versions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 220 }).notNull(),
  status: varchar("status", { length: 40 }).notNull().default("draft"),
  notes: text("notes"),
  createdById: int("createdById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const versionComments = mysqlTable("version_comments", {
  id: int("id").autoincrement().primaryKey(),
  versionId: int("versionId").notNull().references(() => projectVersions.id, { onDelete: "cascade" }),
  authorId: int("authorId").references(() => users.id),
  body: text("body").notNull(),
  timestampSeconds: decimal("timestampSeconds", { precision: 10, scale: 3 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").references(() => projects.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("todo"),
  priority: varchar("priority", { length: 20 }).notNull().default("medium"),
  assigneeId: int("assigneeId").references(() => users.id, { onDelete: "set null" }),
  dueAt: timestamp("dueAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("tasks_status_idx").on(table.status), index("tasks_due_idx").on(table.dueAt)]);

export const qcItems = mysqlTable("qc_items", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 255 }).notNull(),
  category: varchar("category", { length: 40 }).notNull().default("general"),
  checked: boolean("checked").notNull().default(false),
  notes: text("notes"),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const processingChains = mysqlTable("processing_chains", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  category: varchar("category", { length: 64 }).notNull().default("vocal"),
  genre: varchar("genre", { length: 80 }),
  description: text("description"),
  steps: json("steps").$type<Array<{ plugin: string; order: number; settings?: string; notes?: string }>>().notNull(),
  favorite: boolean("favorite").notNull().default(false),
  uses: int("uses").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const plugins = mysqlTable("plugins", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  developer: varchar("developer", { length: 180 }).notNull(),
  version: varchar("version", { length: 80 }).notNull(),
  format: varchar("format", { length: 32 }).notNull().default("VST3"),
  category: varchar("category", { length: 64 }).notNull().default("vocal"),
  tags: json("tags").$type<string[]>().notNull(),
  status: varchar("status", { length: 32 }).notNull().default("known"),
  officialUrl: varchar("officialUrl", { length: 1024 }),
  notes: text("notes"),
  favorite: boolean("favorite").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  projectId: int("projectId").references(() => projects.id, { onDelete: "set null" }),
  number: varchar("number", { length: 48 }).notNull().unique(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  status: paymentStatus.notNull().default("draft"),
  dueAt: timestamp("dueAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("invoices_client_idx").on(table.clientId), index("invoices_status_idx").on(table.status)]);

export const paymentRequests = mysqlTable("payment_requests", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").references(() => invoices.id, { onDelete: "set null" }),
  sourceAutomationId: int("sourceAutomationId"),
  title: varchar("title", { length: 220 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  status: paymentStatus.notNull().default("pending_approval"),
  rationale: text("rationale"),
  requestedById: int("requestedById").references(() => users.id),
  approvedById: int("approvedById").references(() => users.id),
  approvedAt: timestamp("approvedAt"),
  decisionReason: text("decisionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("payment_requests_status_idx").on(table.status)]);

export const automations = mysqlTable("automations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  trigger: varchar("trigger", { length: 80 }).notNull(),
  condition: json("condition").$type<Record<string, unknown> | null>(),
  action: json("action").$type<{ type: string; payload?: Record<string, unknown>; requiresApproval?: boolean }>().notNull(),
  enabled: boolean("enabled").notNull().default(true),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  runs: int("runs").notNull().default(0),
  lastRunAt: timestamp("lastRunAt"),
  createdById: int("createdById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("automations_trigger_idx").on(table.trigger), index("automations_cron_uid_idx").on(table.scheduleCronTaskUid)]);

export const automationRuns = mysqlTable("automation_runs", {
  id: int("id").autoincrement().primaryKey(),
  automationId: int("automationId").notNull().references(() => automations.id, { onDelete: "cascade" }),
  status: automationRunStatus.notNull().default("success"),
  detail: text("detail"),
  payload: json("payload").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const communications = mysqlTable("communications", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").references(() => projects.id, { onDelete: "set null" }),
  recipientUserId: int("recipientUserId").references(() => users.id, { onDelete: "set null" }),
  audience: varchar("audience", { length: 24 }).notNull(),
  channel: varchar("channel", { length: 24 }).notNull().default("in_app"),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("communications_recipient_idx").on(table.recipientUserId), index("communications_project_idx").on(table.projectId)]);

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  sku: varchar("sku", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 80 }).notNull().default("studio"),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull().default("0"),
  stock: int("stock").notNull().default(0),
  minStock: int("minStock").notNull().default(0),
  pvcSphere: int("pvcSphere").notNull().default(1),
  pvcValidated: boolean("pvcValidated").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("products_stock_idx").on(table.stock)]);

export const replenishmentProposals = mysqlTable("replenishment_proposals", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  proposedQuantity: int("proposedQuantity").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("proposed"),
  reason: text("reason").notNull(),
  createdByAutomationId: int("createdByAutomationId").references(() => automations.id, { onDelete: "set null" }),
  reviewedById: int("reviewedById").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  actorId: int("actorId").references(() => users.id, { onDelete: "set null" }),
  actorRole: varchar("actorRole", { length: 24 }).notNull().default("system"),
  action: varchar("action", { length: 120 }).notNull(),
  resource: varchar("resource", { length: 80 }).notNull(),
  resourceId: varchar("resourceId", { length: 80 }),
  detail: text("detail"),
  source: varchar("source", { length: 40 }).notNull().default("web"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("audit_resource_idx").on(table.resource, table.resourceId), index("audit_created_idx").on(table.createdAt)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
