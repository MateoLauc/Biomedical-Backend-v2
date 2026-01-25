import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const shippingAddresses = pgTable(
  "shipping_addresses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phoneNumber: text("phone_number").notNull(),
    additionalPhoneNumber: text("additional_phone_number"),
    deliveryAddress: text("delivery_address").notNull(),
    additionalInformation: text("additional_information"),
    region: text("region").notNull(),
    message: text("message"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    userIdIdx: index("shipping_addresses_user_id_idx").on(t.userId)
  })
);
