import { pgTable, text, timestamp, uuid, decimal, integer, boolean } from "drizzle-orm/pg-core";
import { index } from "drizzle-orm/pg-core";
import { products } from "./products";
export const productVariants = pgTable("product_variants", {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
    packSize: text("pack_size").notNull(), // e.g., "500mls", "100mls", "100mls, 200mls"
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => ({
    productIdIdx: index("product_variants_product_id_idx").on(t.productId),
    isActiveIdx: index("product_variants_is_active_idx").on(t.isActive)
}));
