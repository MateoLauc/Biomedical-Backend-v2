import { z } from "zod";

export const listNotificationsQuerySchema = z.object({
  unreadOnly: z
    .string()
    .refine((val) => val === "" || val === "true" || val === "false", { message: "Must be true or false." })
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
