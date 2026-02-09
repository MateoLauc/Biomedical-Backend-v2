import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),

    action: text("action").notNull(),

    entityType: text("entity_type"),
    entityId: text("entity_id"),

    ip: text("ip"),
    userAgent: text("user_agent"),

    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    actorUserIdIdx: index("audit_logs_actor_user_id_idx").on(t.actorUserId),
    createdAtIdx: index("audit_logs_created_at_idx").on(t.createdAt)
  })
);

