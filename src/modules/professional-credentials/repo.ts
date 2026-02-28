import { asc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  professionalCredentialsSubmissions,
  professionalCredentialsDocuments
} from "../../db/schema/index.js";
import type { CredentialsSubmissionRecord, CredentialsDocumentRecord } from "./types.js";

export const credentialsRepo = {
  async findByUserId(userId: string): Promise<CredentialsSubmissionRecord | null> {
    const [row] = await db
      .select()
      .from(professionalCredentialsSubmissions)
      .where(eq(professionalCredentialsSubmissions.userId, userId))
      .limit(1);
    return (row as CredentialsSubmissionRecord) || null;
  },

  async findDocumentsBySubmissionId(submissionId: string): Promise<CredentialsDocumentRecord[]> {
    const rows = await db
      .select()
      .from(professionalCredentialsDocuments)
      .where(eq(professionalCredentialsDocuments.submissionId, submissionId))
      .orderBy(asc(professionalCredentialsDocuments.sortOrder), asc(professionalCredentialsDocuments.createdAt));
    return rows as CredentialsDocumentRecord[];
  },

  async upsertDraft(
    userId: string,
    data: {
      businessName?: string | null;
      registrationNumber?: string | null;
      businessAddress?: string | null;
      businessType?: string | null;
      authorizedPersonName?: string | null;
      authorizedPersonTitle?: string | null;
      authorizedPersonEmail?: string | null;
      authorizedPersonPhone?: string | null;
      signatureImageUrl?: string | null;
      formData?: Record<string, unknown> | null;
    }
  ): Promise<CredentialsSubmissionRecord> {
    const existing = await this.findByUserId(userId);
    const now = new Date();
    const payload = {
      ...data,
      updatedAt: now,
      status: "draft" as const
    };
    if (existing) {
      const [updated] = await db
        .update(professionalCredentialsSubmissions)
        .set(payload)
        .where(eq(professionalCredentialsSubmissions.id, existing.id))
        .returning();
      return updated as CredentialsSubmissionRecord;
    }
    const [inserted] = await db
      .insert(professionalCredentialsSubmissions)
      .values({
        userId,
        businessName: data.businessName ?? null,
        registrationNumber: data.registrationNumber ?? null,
        businessAddress: data.businessAddress ?? null,
        businessType: data.businessType ?? null,
        authorizedPersonName: data.authorizedPersonName ?? null,
        authorizedPersonTitle: data.authorizedPersonTitle ?? null,
        authorizedPersonEmail: data.authorizedPersonEmail ?? null,
        authorizedPersonPhone: data.authorizedPersonPhone ?? null,
        signatureImageUrl: data.signatureImageUrl ?? null,
        formData: data.formData ?? null,
        status: "draft"
      })
      .returning();
    return inserted as CredentialsSubmissionRecord;
  },

  async setDocuments(submissionId: string, documents: Array<{ fileUrl: string; fileName: string }>): Promise<void> {
    await db.delete(professionalCredentialsDocuments).where(eq(professionalCredentialsDocuments.submissionId, submissionId));
    if (documents.length === 0) return;
    await db.insert(professionalCredentialsDocuments).values(
      documents.map((d, i) => ({
        submissionId,
        fileUrl: d.fileUrl,
        fileName: d.fileName,
        sortOrder: i
      }))
    );
  },

  async submit(
    userId: string,
    data: {
      businessName: string;
      registrationNumber: string;
      businessAddress: string;
      businessType: string;
      authorizedPersonName: string;
      authorizedPersonTitle: string;
      authorizedPersonEmail: string;
      authorizedPersonPhone: string;
      signatureImageUrl: string;
      formData?: Record<string, unknown> | null;
    },
    documentUrls: Array<{ fileUrl: string; fileName: string }>
  ): Promise<CredentialsSubmissionRecord> {
    const now = new Date();
    const existing = await this.findByUserId(userId);
    const payload = {
      ...data,
      formData: data.formData ?? null,
      status: "submitted" as const,
      submittedAt: now,
      updatedAt: now
    };
    if (existing) {
      const [updated] = await db
        .update(professionalCredentialsSubmissions)
        .set(payload)
        .where(eq(professionalCredentialsSubmissions.id, existing.id))
        .returning();
      if (!updated) throw new Error("Failed to update credentials submission");
      await this.setDocuments(updated.id, documentUrls);
      return updated as CredentialsSubmissionRecord;
    }
    const [inserted] = await db
      .insert(professionalCredentialsSubmissions)
      .values({
        userId,
        ...data,
        formData: data.formData ?? null,
        status: "submitted",
        submittedAt: now
      })
      .returning();
    if (!inserted) throw new Error("Failed to insert credentials submission");
    await this.setDocuments(inserted.id, documentUrls);
    return inserted as CredentialsSubmissionRecord;
  },

  async findById(id: string): Promise<CredentialsSubmissionRecord | null> {
    const [row] = await db
      .select()
      .from(professionalCredentialsSubmissions)
      .where(eq(professionalCredentialsSubmissions.id, id))
      .limit(1);
    return (row as CredentialsSubmissionRecord) || null;
  }
};
