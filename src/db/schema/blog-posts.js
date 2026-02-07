import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { blogPostStatusEnum, blogPostTypeEnum } from "./enums";
export const blogPosts = pgTable("blog_posts", {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    body: text("body").notNull(),
    imageUrl: text("image_url"), // Cloudinary URL after upload
    type: blogPostTypeEnum("type").notNull().default("news_article"),
    status: blogPostStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => ({
    slugIdx: index("blog_posts_slug_idx").on(t.slug),
    typeIdx: index("blog_posts_type_idx").on(t.type),
    statusIdx: index("blog_posts_status_idx").on(t.status),
    publishedAtIdx: index("blog_posts_published_at_idx").on(t.publishedAt),
    createdAtIdx: index("blog_posts_created_at_idx").on(t.createdAt)
}));
