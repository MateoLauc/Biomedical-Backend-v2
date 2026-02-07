import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { index } from "drizzle-orm/pg-core";
export const categories = pgTable("categories", {
    id: uuid("id").defaultRandom().primaryKey(),
    parentCategoryId: uuid("parent_category_id").references(() => categories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => ({
    slugIdx: index("categories_slug_idx").on(t.slug),
    parentCategoryIdIdx: index("categories_parent_category_id_idx").on(t.parentCategoryId)
}));
