import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1),
    CORS_ORIGINS: z.string().default(""),
    JWT_ACCESS_SECRET: z.string().min(16),
    JWT_REFRESH_SECRET: z.string().min(16),
    JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(15 * 60),
    JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(30 * 24 * 60 * 60),
    MAILTRAP_API_KEY: z.string().optional(),
    MAILTRAP_USE_SANDBOX: z.string().optional(),
    MAILTRAP_INBOX_ID: z.coerce.number().int().positive().optional(),
    MAIL_FROM: z.string().optional(),
    BRAND_LOGO_URL: z.string().optional(),
    BRAND_PRIMARY_COLOR: z.string().optional(),
    BRAND_PRIMARY_50: z.string().optional(),
    BRAND_BG_COLOR: z.string().optional(),
    BRAND_TEXT_COLOR: z.string().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    SENTRY_DSN: z.string().optional(),
    PAYSTACK_SECRET_KEY: z.string().optional(),
    PAYSTACK_WEBHOOK_SECRET: z.string().optional(),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().optional(),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().optional()
});
export const env = envSchema.parse(process.env);
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
export const corsOrigins = env.CORS_ORIGINS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
