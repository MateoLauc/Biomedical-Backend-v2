import { pgTable, text, timestamp, uuid, decimal, integer, index } from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { productVariants } from "./product-variants";

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productVariantId: uuid("product_variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "restrict" }),
    
    // Product snapshot at time of order (in case product details change later)
    productName: text("product_name").notNull(),
    productSlug: text("product_slug").notNull(),
    packSize: text("pack_size").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Price at time of order
    quantity: integer("quantity").notNull(),
    
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    orderIdIdx: index("order_items_order_id_idx").on(t.orderId),
    productVariantIdIdx: index("order_items_product_variant_id_idx").on(t.productVariantId)
  })
);
