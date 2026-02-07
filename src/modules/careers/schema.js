import { z } from "zod";
const jobStatusSchema = z.enum(["open", "closed"]);
export const createJobSchema = z.object({
    title: z.string().min(1, "Title is required.").max(200),
    type: z.string().min(1, "Type is required.").max(100),
    department: z.string().min(1, "Department is required.").max(200),
    icon: z.string().max(50).optional(),
    responsibilities: z.array(z.string().min(1)).min(1, "At least one responsibility is required."),
    status: jobStatusSchema.optional()
});
export const updateJobSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    type: z.string().min(1).max(100).optional(),
    department: z.string().min(1).max(200).optional(),
    icon: z.string().max(50).optional(),
    responsibilities: z.array(z.string().min(1)).optional(),
    status: jobStatusSchema.optional()
});
export const listJobsQuerySchema = z.object({
    status: z
        .string()
        .refine((val) => !val || jobStatusSchema.safeParse(val).success, { message: "Invalid status. Must be open or closed." })
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
