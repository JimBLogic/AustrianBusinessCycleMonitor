import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
