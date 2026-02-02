import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const userDevices = pgTable(
  "user_devices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    deviceHash: text("device_hash").notNull(),
    userAgent: text("user_agent"),

    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    userIdDeviceHashIdx: index("user_devices_user_id_device_hash_idx").on(t.userId, t.deviceHash),
    userIdIdx: index("user_devices_user_id_idx").on(t.userId)
  })
);
