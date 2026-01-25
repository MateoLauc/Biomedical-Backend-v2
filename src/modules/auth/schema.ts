import { z } from "zod";

export const signupSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  whoYouAre: z.string().min(1).max(200),
  email: z.string().email().max(255),
  phoneNumber: z.string().min(1).max(20),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(100, "Password must be no more than 100 characters long."),
  countryOfPractice: z.string().min(1).max(100)
});

export const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required.")
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1)
});

export const resendVerificationSchema = z.object({
  email: z.string().email()
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(100, "Password must be no more than 100 characters long.")
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters long.")
    .max(100, "New password must be no more than 100 characters long.")
});
