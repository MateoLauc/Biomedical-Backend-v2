import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { blogPosts } from "../../db/schema/index.js";
import type { BlogPost, CreateBlogPostInput, UpdateBlogPostInput, BlogPostStatus, BlogPostType } from "./types.js";

function rowToBlogPost(row: {
  id: string;
  title: string;
  slug: string;
  body: string;
  imageUrl: string | null;
  type: BlogPostType;
  status: BlogPostStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): BlogPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    body: row.body,
    imageUrl: row.imageUrl,
    type: row.type,
    status: row.status,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export const blogRepo = {
  async findById(id: string): Promise<BlogPost | null> {
    const [row] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    if (!row) return null;
    return rowToBlogPost(row as Parameters<typeof rowToBlogPost>[0]);
  },

  async findBySlug(slug: string): Promise<BlogPost | null> {
    const [row] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
    if (!row) return null;
    return rowToBlogPost(row as Parameters<typeof rowToBlogPost>[0]);
  },

  async list(options?: { type?: BlogPostType; status?: BlogPostStatus; limit?: number; offset?: number }): Promise<BlogPost[]> {
    const conditions = [];
    if (options?.type) conditions.push(eq(blogPosts.type, options.type));
    if (options?.status) conditions.push(eq(blogPosts.status, options.status));

    let query = db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    if (options?.limit !== undefined) {
      query = query.limit(options.limit) as typeof query;
    }
    if (options?.offset !== undefined) {
      query = query.offset(options.offset) as typeof query;
    }

    const rows = await query;
    return rows.map((r) => rowToBlogPost(r as Parameters<typeof rowToBlogPost>[0]));
  },

  async count(options?: { type?: BlogPostType; status?: BlogPostStatus }): Promise<number> {
    const conditions = [];
    if (options?.type) conditions.push(eq(blogPosts.type, options.type));
    if (options?.status) conditions.push(eq(blogPosts.status, options.status));
    let query = db.select({ count: sql<number>`count(*)` }).from(blogPosts);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    const [result] = await query;
    return Number(result?.count ?? 0);
  },

  async create(data: CreateBlogPostInput & { slug: string; publishedAt?: Date }): Promise<BlogPost> {
    const [row] = await db
      .insert(blogPosts)
      .values({
        title: data.title,
        slug: data.slug,
        body: data.body,
        imageUrl: data.imageUrl ?? null,
        type: data.type ?? "news_article",
        status: data.status ?? "draft",
        ...(data.publishedAt && { publishedAt: data.publishedAt })
      })
      .returning();
    if (!row) throw new Error("Failed to create blog post");
    return rowToBlogPost(row as Parameters<typeof rowToBlogPost>[0]);
  },

  async update(id: string, data: UpdateBlogPostInput & { publishedAt?: Date }): Promise<BlogPost | null> {
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (data.title !== undefined) set.title = data.title;
    if (data.slug !== undefined) set.slug = data.slug;
    if (data.body !== undefined) set.body = data.body;
    if (data.imageUrl !== undefined) set.imageUrl = data.imageUrl || null;
    if (data.type !== undefined) set.type = data.type;
    if (data.status !== undefined) set.status = data.status;
    if (data.publishedAt !== undefined) set.publishedAt = data.publishedAt;

    const [row] = await db.update(blogPosts).set(set as Record<string, unknown>).where(eq(blogPosts.id, id)).returning();
    if (!row) return null;
    return rowToBlogPost(row as Parameters<typeof rowToBlogPost>[0]);
  },

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning({ id: blogPosts.id });
    return result.length > 0;
  }
};
