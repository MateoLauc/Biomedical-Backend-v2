import { pgTable, text, timestamp, uuid, boolean, integer } from "drizzle-orm/pg-core";
import { index } from "drizzle-orm/pg-core";
import { categories } from "./categories";

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    composition: text("composition"),
    indication: text("indication"),
    requiresApproval: boolean("requires_approval").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(10),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    categoryIdIdx: index("products_category_id_idx").on(t.categoryId),
    slugIdx: index("products_slug_idx").on(t.slug),
    isActiveIdx: index("products_is_active_idx").on(t.isActive)
  })
);
