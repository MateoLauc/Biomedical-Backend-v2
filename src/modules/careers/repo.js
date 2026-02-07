import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { jobs } from "../../db/schema";
function rowToJob(row) {
    let responsibilities = [];
    try {
        responsibilities = JSON.parse(row.responsibilities || "[]");
    }
    catch {
        responsibilities = [];
    }
    return {
        id: row.id,
        title: row.title,
        type: row.type,
        department: row.department,
        icon: row.icon,
        responsibilities,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
    };
}
export const careersRepo = {
    async findById(id) {
        const [row] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
        if (!row)
            return null;
        return rowToJob(row);
    },
    async list(options) {
        const conditions = [];
        if (options?.status)
            conditions.push(eq(jobs.status, options.status));
        let query = db.select().from(jobs).orderBy(desc(jobs.createdAt));
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        if (options?.limit !== undefined) {
            query = query.limit(options.limit);
        }
        if (options?.offset !== undefined) {
            query = query.offset(options.offset);
        }
        const rows = await query;
        return rows.map((r) => rowToJob(r));
    },
    async count(options) {
        const conditions = [];
        if (options?.status)
            conditions.push(eq(jobs.status, options.status));
        let query = db.select({ count: sql `count(*)` }).from(jobs);
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        const [result] = await query;
        return Number(result?.count ?? 0);
    },
    async create(data) {
        const [row] = await db
            .insert(jobs)
            .values({
            title: data.title,
            type: data.type,
            department: data.department,
            icon: data.icon ?? null,
            responsibilities: JSON.stringify(data.responsibilities),
            status: data.status ?? "open"
        })
            .returning();
        if (!row)
            throw new Error("Failed to create job");
        return rowToJob(row);
    },
    async update(id, data) {
        const set = { updatedAt: new Date() };
        if (data.title !== undefined)
            set.title = data.title;
        if (data.type !== undefined)
            set.type = data.type;
        if (data.department !== undefined)
            set.department = data.department;
        if (data.icon !== undefined)
            set.icon = data.icon;
        if (data.responsibilities !== undefined)
            set.responsibilities = JSON.stringify(data.responsibilities);
        if (data.status !== undefined)
            set.status = data.status;
        const [row] = await db.update(jobs).set(set).where(eq(jobs.id, id)).returning();
        if (!row)
            return null;
        return rowToJob(row);
    },
    async delete(id) {
        const result = await db.delete(jobs).where(eq(jobs.id, id)).returning({ id: jobs.id });
        return result.length > 0;
    }
};
