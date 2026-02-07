import { pgTable, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";
import { productVariants } from "./product-variants";
export const cartItems = pgTable("cart_items", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    productVariantId: uuid("product_variant_id")
        .notNull()
        .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => ({
    userIdIdx: index("cart_items_user_id_idx").on(t.userId),
    productVariantIdIdx: index("cart_items_product_variant_id_idx").on(t.productVariantId),
    userVariantUq: uniqueIndex("cart_items_user_variant_uq").on(t.userId, t.productVariantId)
}));
