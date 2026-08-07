import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  email: text("email").primaryKey(),
  displayName: text("display_name"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const macroSnapshots = sqliteTable("macro_snapshots", {
  id: text("id").primaryKey(),
  requestedAt: text("requested_at").notNull(),
  refreshMode: text("refresh_mode").notNull(),
  regime: text("regime").notNull(),
  scoresJson: text("scores_json").notNull(),
  metricsJson: text("metrics_json").notNull(),
  provenanceJson: text("provenance_json").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("macro_snapshots_requested_at_idx").on(table.requestedAt),
]);

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("open"),
  dueDate: text("due_date"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("tasks_owner_status_idx").on(table.ownerEmail, table.status),
]);

export const financeItems = sqliteTable("finance_items", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  symbol: text("symbol").notNull(),
  label: text("label").notNull(),
  category: text("category").notNull(),
  units: real("units"),
  costBasis: real("cost_basis"),
  currency: text("currency").notNull().default("USD"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("finance_items_owner_idx").on(table.ownerEmail),
]);

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  title: text("title").notNull(),
  thesis: text("thesis").notNull(),
  counterThesis: text("counter_thesis"),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("reviews_owner_idx").on(table.ownerEmail),
]);

export const files = sqliteTable("files", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  objectKey: text("object_key").notNull(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("files_owner_idx").on(table.ownerEmail),
]);
