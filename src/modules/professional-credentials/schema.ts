import { z } from "zod";

const documentUrlSchema = z.object({
  fileUrl: z.string().min(1, "Document URL is required."),
  fileName: z.string().min(1, "Document name is required.")
});

export const saveDraftSchema = z.object({
  businessName: z.string().max(200).optional(),
  registrationNumber: z.string().max(100).optional(),
  businessAddress: z.string().max(500).optional(),
  businessType: z.string().max(100).optional(),
  authorizedPersonName: z.string().max(200).optional(),
  authorizedPersonTitle: z.string().max(100).optional(),
  authorizedPersonEmail: z.string().email().optional().or(z.literal("")),
  authorizedPersonPhone: z.string().max(50).optional(),
  signatureImageUrl: z.string().url().optional().or(z.literal("")),
  documentUrls: z.array(documentUrlSchema).optional(),
  formData: z.record(z.string(), z.unknown()).optional()
});

export const submitSchema = z
  .object({
    businessName: z.string().min(1, "Business name is required.").max(200),
    registrationNumber: z.string().min(1, "Registration number is required.").max(100),
    businessAddress: z.string().min(1, "Business address is required.").max(500),
    businessType: z.string().min(1, "Business type is required.").max(100),
    authorizedPersonName: z.string().min(1, "Authorized person name is required.").max(200),
    authorizedPersonTitle: z.string().min(1, "Authorized person title is required.").max(100),
    authorizedPersonEmail: z.string().min(1, "Email is required.").email(),
    authorizedPersonPhone: z.string().min(1, "Phone is required.").max(50),
    signatureImageUrl: z.string().min(1, "Signature is required.").url(),
    documentUrls: z.array(documentUrlSchema).min(1, "At least one document is required."),
    formData: z.record(z.string(), z.unknown()).optional()
  });
