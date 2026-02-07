import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../../db";
import { notifications } from "../../db/schema";
export const notificationsRepo = {
    async findById(id, userId) {
        const [row] = await db
            .select()
            .from(notifications)
            .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
            .limit(1);
        return row || null;
    },
    async listByUserId(userId, options) {
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
            query = query.limit(options.limit);
        }
        if (options?.offset !== undefined) {
            query = query.offset(options.offset);
        }
        return (await query);
    },
    async countByUserId(userId, unreadOnly) {
        const conditions = [eq(notifications.userId, userId)];
        if (unreadOnly === true) {
            conditions.push(isNull(notifications.readAt));
        }
        const [result] = await db
            .select({ count: sql `count(*)` })
            .from(notifications)
            .where(and(...conditions));
        return Number(result?.count ?? 0);
    },
    async markAsRead(id, userId) {
        const [row] = await db
            .update(notifications)
            .set({ readAt: new Date() })
            .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
            .returning();
        return row || null;
    },
    async markAllAsRead(userId) {
        const result = await db
            .update(notifications)
            .set({ readAt: new Date() })
            .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
            .returning({ id: notifications.id });
        return result.length;
    },
    async create(data) {
        const [row] = await db.insert(notifications).values(data).returning();
        return row;
    }
};
