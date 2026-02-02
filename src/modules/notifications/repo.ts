import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../../db";
import { notifications } from "../../db/schema";
import type { Notification } from "./types";

export const notificationsRepo = {
  async findById(id: string, userId: string): Promise<Notification | null> {
    const [row] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .limit(1);
    return (row as Notification) || null;
  },

  async listByUserId(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number; offset?: number }
  ): Promise<Notification[]> {
    const conditions = [eq(notifications.userId, userId)];
    if (options?.unreadOnly === true) {
      conditions.push(isNull(notifications.readAt));
    }

    let query = db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt));

    if (options?.limit !== undefined) {
      query = query.limit(options.limit) as typeof query;
    }
    if (options?.offset !== undefined) {
      query = query.offset(options.offset) as typeof query;
    }

    return (await query) as Notification[];
  },

  async countByUserId(userId: string, unreadOnly?: boolean): Promise<number> {
    const conditions = [eq(notifications.userId, userId)];
    if (unreadOnly === true) {
      conditions.push(isNull(notifications.readAt));
    }
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(...conditions));
    return Number(result?.count ?? 0);
  },

  async markAsRead(id: string, userId: string): Promise<Notification | null> {
    const [row] = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return (row as Notification) || null;
  },

  async markAllAsRead(userId: string): Promise<number> {
    const result = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
      .returning({ id: notifications.id });
    return result.length;
  },

  async create(data: { userId: string; title: string; body: string }): Promise<Notification> {
    const [row] = await db.insert(notifications).values(data).returning();
    return row as Notification;
  }
};
