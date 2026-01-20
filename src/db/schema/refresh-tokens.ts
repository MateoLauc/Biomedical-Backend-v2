import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    tokenHash: text("token_hash").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),

    replacedByTokenId: uuid("replaced_by_token_id"),

    ip: text("ip"),
    userAgent: text("user_agent")
  },
  (t) => ({
    tokenHashUq: uniqueIndex("refresh_tokens_token_hash_uq").on(t.tokenHash),
    userIdIdx: index("refresh_tokens_user_id_idx").on(t.userId)
  })
);

