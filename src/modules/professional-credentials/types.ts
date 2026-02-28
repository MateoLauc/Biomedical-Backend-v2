export type CredentialsSubmissionStatus = "draft" | "submitted";

/** Extended form payload (Part A/B/C/D from Figma). Stored as JSON. */
export type CredentialsFormData = Record<string, unknown>;

export interface CredentialsSubmissionRecord {
  id: string;
  userId: string;
  businessName: string | null;
  registrationNumber: string | null;
  businessAddress: string | null;
  businessType: string | null;
  authorizedPersonName: string | null;
  authorizedPersonTitle: string | null;
  authorizedPersonEmail: string | null;
  authorizedPersonPhone: string | null;
  signatureImageUrl: string | null;
  formData: CredentialsFormData | null;
  status: CredentialsSubmissionStatus;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CredentialsDocumentRecord {
  id: string;
  submissionId: string;
  fileUrl: string;
  fileName: string;
  sortOrder: number;
  createdAt: Date;
}

export interface CredentialsSubmissionWithDocuments {
  submission: CredentialsSubmissionRecord;
  documents: CredentialsDocumentRecord[];
}

export interface SaveDraftInput {
  businessName?: string;
  registrationNumber?: string;
  businessAddress?: string;
  businessType?: string;
  authorizedPersonName?: string;
  authorizedPersonTitle?: string;
  authorizedPersonEmail?: string;
  authorizedPersonPhone?: string;
  signatureImageUrl?: string;
  documentUrls?: Array<{ fileUrl: string; fileName: string }>;
  formData?: CredentialsFormData;
}

export interface SubmitInput {
  businessName: string;
  registrationNumber: string;
  businessAddress: string;
  businessType: string;
  authorizedPersonName: string;
  authorizedPersonTitle: string;
  authorizedPersonEmail: string;
  authorizedPersonPhone: string;
  signatureImageUrl: string;
  documentUrls: Array<{ fileUrl: string; fileName: string }>;
  formData?: CredentialsFormData;
}
