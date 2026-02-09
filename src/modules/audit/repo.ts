import { db } from "../../db/index.js";
import { auditLogs } from "../../db/schema/index.js";

export const auditRepo = {
  async createLog(data: {
    actorUserId?: string | null;
    action: string;
    entityType?: string | null;
    entityId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown> | null;
  }) {
    const [row] = await db.insert(auditLogs).values({
      actorUserId: data.actorUserId ?? null,
      action: data.action,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
      ip: data.ip ?? null,
      userAgent: data.userAgent ?? null,
      metadata: data.metadata ?? null
    }).returning();
    return row;
  }
};

