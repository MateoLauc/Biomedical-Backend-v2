import { z } from "zod";
export const updateProfileSchema = z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    whoYouAre: z.string().min(1).max(200).optional(),
    phoneNumber: z.string().min(1).max(20).optional(),
    countryOfPractice: z.string().min(1).max(100).optional(),
    email: z.string().email().max(255).optional()
});
