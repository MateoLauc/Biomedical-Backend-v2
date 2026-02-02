import { z } from "zod";

const roleSchema = z.enum(["super_admin", "admin", "customer"]);
const verificationStatusSchema = z.enum(["not_submitted", "pending", "approved", "rejected"]);

export const updateUserVerificationSchema = z.object({
  businessLicenseStatus: verificationStatusSchema.optional(),
  prescriptionAuthorityStatus: verificationStatusSchema.optional()
}).refine((data) => data.businessLicenseStatus !== undefined || data.prescriptionAuthorityStatus !== undefined, {
  message: "At least one of businessLicenseStatus or prescriptionAuthorityStatus is required."
});

export const listUsersQuerySchema = z.object({
  role: z.string().refine((val) => !val || roleSchema.safeParse(val).success, { message: "Invalid role." }).optional(),
  identityVerified: z
    .string()
    .refine((val) => val === "" || val === "true" || val === "false", { message: "Must be true or false." })
    .optional(),
  businessLicenseStatus: z
    .string()
    .refine((val) => !val || verificationStatusSchema.safeParse(val).success, { message: "Invalid business license status." })
    .optional(),
  prescriptionAuthorityStatus: z
    .string()
    .refine((val) => !val || verificationStatusSchema.safeParse(val).success, { message: "Invalid prescription authority status." })
    .optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1, "Page must be 1 or greater."))
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100, "Limit must be between 1 and 100."))
    .optional()
});
