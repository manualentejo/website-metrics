import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  real,
  jsonb,
} from "drizzle-orm/pg-core";

export const sites = pgTable("sites", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  status: text("status").notNull().default("em_andamento"), // "no_ar" | "em_andamento"
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id")
    .notNull()
    .references(() => sites.id, { onDelete: "cascade" }),
  strategy: text("strategy").notNull(), // "mobile" | "desktop"
  ranAt: timestamp("ran_at", { withTimezone: true }).defaultNow().notNull(),

  performanceScore: real("performance_score"),
  accessibilityScore: real("accessibility_score"),
  bestPracticesScore: real("best_practices_score"),
  seoScore: real("seo_score"),

  fcpMs: real("fcp_ms"),
  lcpMs: real("lcp_ms"),
  tbtMs: real("tbt_ms"),
  cls: real("cls"),
  speedIndexMs: real("speed_index_ms"),

  failedSeoAudits: jsonb("failed_seo_audits").$type<
    { id: string; title: string; weight: number; score: number | null }[]
  >(),

  error: text("error"),
});

// Keeps only the latest screenshot/filmstrip per site+strategy so storage
// doesn't grow with 52 weeks of history — overwritten on every cron run.
export const snapshots = pgTable("snapshots", {
  siteId: uuid("site_id")
    .notNull()
    .references(() => sites.id, { onDelete: "cascade" }),
  strategy: text("strategy").notNull(), // "mobile" | "desktop"
  finalScreenshot: text("final_screenshot"),
  thumbnails: jsonb("thumbnails").$type<{ timing: number; data: string }[]>(),
  capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow().notNull(),
});
