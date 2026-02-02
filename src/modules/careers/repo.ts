import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { jobs } from "../../db/schema";
import type { Job, CreateJobInput, UpdateJobInput, JobStatus } from "./types";

function rowToJob(row: { id: string; title: string; type: string; department: string; icon: string | null; responsibilities: string; status: JobStatus; createdAt: Date; updatedAt: Date }): Job {
  let responsibilities: string[] = [];
  try {
    responsibilities = JSON.parse(row.responsibilities || "[]") as string[];
  } catch {
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
  async findById(id: string): Promise<Job | null> {
    const [row] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (!row) return null;
    return rowToJob(row as Parameters<typeof rowToJob>[0]);
  },

  async list(options?: { status?: JobStatus; limit?: number; offset?: number }): Promise<Job[]> {
    const conditions = [];
    if (options?.status) conditions.push(eq(jobs.status, options.status));

    let query = db.select().from(jobs).orderBy(desc(jobs.createdAt));
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
    return rows.map((r) => rowToJob(r as Parameters<typeof rowToJob>[0]));
  },

  async count(options?: { status?: JobStatus }): Promise<number> {
    const conditions = [];
    if (options?.status) conditions.push(eq(jobs.status, options.status));
    let query = db.select({ count: sql<number>`count(*)` }).from(jobs);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    const [result] = await query;
    return Number(result?.count ?? 0);
  },

  async create(data: CreateJobInput): Promise<Job> {
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
    if (!row) throw new Error("Failed to create job");
    return rowToJob(row as Parameters<typeof rowToJob>[0]);
  },

  async update(id: string, data: UpdateJobInput): Promise<Job | null> {
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (data.title !== undefined) set.title = data.title;
    if (data.type !== undefined) set.type = data.type;
    if (data.department !== undefined) set.department = data.department;
    if (data.icon !== undefined) set.icon = data.icon;
    if (data.responsibilities !== undefined) set.responsibilities = JSON.stringify(data.responsibilities);
    if (data.status !== undefined) set.status = data.status;

    const [row] = await db.update(jobs).set(set as Record<string, unknown>).where(eq(jobs.id, id)).returning();
    if (!row) return null;
    return rowToJob(row as Parameters<typeof rowToJob>[0]);
  },

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(jobs).where(eq(jobs.id, id)).returning({ id: jobs.id });
    return result.length > 0;
  }
};
