import { authRepo } from "../auth/repo.js";
import { credentialsRepo } from "./repo.js";
import type { CredentialsSubmissionWithDocuments, SaveDraftInput, SubmitInput } from "./types.js";
import { badRequest } from "../../lib/http-errors.js";
import type { CredentialsSubmissionRecord } from "./types.js";

async function sendCredentialsSubmittedToSuperAdmins(customerName: string, customerEmail: string): Promise<void> {
  const { sendCredentialsSubmittedAdminEmail } = await import("../../lib/email/index.js");
  const superAdmins = await authRepo.listUsers({ role: "super_admin", limit: 100 });
  const emails = superAdmins.map((u) => u.email).filter(Boolean);
  for (const email of emails) {
    try {
      await sendCredentialsSubmittedAdminEmail(email, { customerName, customerEmail });
    } catch (err) {
      console.error("Failed to send credentials submitted email to", email, err);
    }
  }
}

export const credentialsService = {
  async getMySubmission(userId: string): Promise<CredentialsSubmissionWithDocuments | null> {
    const submission = await credentialsRepo.findByUserId(userId);
    if (!submission) return null;
    const documents = await credentialsRepo.findDocumentsBySubmissionId(submission.id);
    return { submission, documents };
  },

  async saveDraft(userId: string, input: SaveDraftInput): Promise<CredentialsSubmissionWithDocuments> {
    const submission = await credentialsRepo.upsertDraft(userId, {
      businessName: input.businessName ?? null,
      registrationNumber: input.registrationNumber ?? null,
      businessAddress: input.businessAddress ?? null,
      businessType: input.businessType ?? null,
      authorizedPersonName: input.authorizedPersonName ?? null,
      authorizedPersonTitle: input.authorizedPersonTitle ?? null,
      authorizedPersonEmail: input.authorizedPersonEmail ?? null,
      authorizedPersonPhone: input.authorizedPersonPhone ?? null,
      signatureImageUrl: input.signatureImageUrl ?? null,
      formData: input.formData ?? null
    });
    await credentialsRepo.setDocuments(submission.id, input.documentUrls ?? []);
    const documents = await credentialsRepo.findDocumentsBySubmissionId(submission.id);
    return { submission, documents };
  },

  async submit(
    userId: string,
    input: SubmitInput,
    userEmail: string,
    userFirstName: string
  ): Promise<CredentialsSubmissionWithDocuments> {
    const submission = await credentialsRepo.submit(userId, {
      businessName: input.businessName,
      registrationNumber: input.registrationNumber,
      businessAddress: input.businessAddress,
      businessType: input.businessType,
      authorizedPersonName: input.authorizedPersonName,
      authorizedPersonTitle: input.authorizedPersonTitle,
      authorizedPersonEmail: input.authorizedPersonEmail,
      authorizedPersonPhone: input.authorizedPersonPhone,
      signatureImageUrl: input.signatureImageUrl,
      formData: input.formData ?? null
    }, input.documentUrls);
    await authRepo.updateUserVerification(userId, {
      businessLicenseStatus: "pending",
      prescriptionAuthorityStatus: "pending"
    });
    const customerName = [userFirstName, ""].join(" ").trim() || userEmail;
    await sendCredentialsSubmittedToSuperAdmins(customerName, userEmail);
    const documents = await credentialsRepo.findDocumentsBySubmissionId(submission.id);
    return { submission, documents };
  },

  async getSubmissionById(
    submissionId: string
  ): Promise<{ submission: CredentialsSubmissionRecord; documents: Awaited<ReturnType<typeof credentialsRepo.findDocumentsBySubmissionId>> } | null> {
    const submission = await credentialsRepo.findById(submissionId);
    if (!submission) return null;
    const documents = await credentialsRepo.findDocumentsBySubmissionId(submission.id);
    return { submission, documents };
  },

  async getSubmissionByUserId(
    targetUserId: string
  ): Promise<{ submission: CredentialsSubmissionRecord; documents: Awaited<ReturnType<typeof credentialsRepo.findDocumentsBySubmissionId>> } | null> {
    const submission = await credentialsRepo.findByUserId(targetUserId);
    if (!submission) return null;
    const documents = await credentialsRepo.findDocumentsBySubmissionId(submission.id);
    return { submission, documents };
  }
};
