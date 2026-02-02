import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { jobStatusEnum } from "./enums";

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    type: text("type").notNull(), // e.g. "Full-Time", "Part-Time"
    department: text("department").notNull(),
    icon: text("icon"), // e.g. "microscope", "checkmark", "gear"
    responsibilities: text("responsibilities").notNull(), // JSON array of strings, stored as text
    status: jobStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    statusIdx: index("jobs_status_idx").on(t.status),
    createdAtIdx: index("jobs_created_at_idx").on(t.createdAt)
  })
);
