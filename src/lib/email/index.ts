import nodemailer from "nodemailer";
import { env } from "../../config/env";
import { logger } from "../logger";

let transporter: nodemailer.Transporter | null = null;

if (env.MAILTRAP_HOST && env.MAILTRAP_USER && env.MAILTRAP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.MAILTRAP_HOST,
    port: env.MAILTRAP_PORT || 587,
    auth: {
      user: env.MAILTRAP_USER,
      pass: env.MAILTRAP_PASS
    }
  });
} else {
  logger.warn("Email service not configured (MAILTRAP_* env vars missing)");
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verificationUrl = `${env.CORS_ORIGINS.split(",")[0] || "http://localhost:3000"}/verify-email?token=${token}`;

  if (!transporter) {
    logger.info({ email, token, verificationUrl }, "Email verification (not sent - email not configured)");
    return;
  }

  try {
    await transporter.sendMail({
      from: env.MAIL_FROM || "Biomedical <no-reply@biomedical.example>",
      to: email,
      subject: "Verify your email address",
      html: `
        <h1>Verify your email address</h1>
        <p>Click the link below to verify your email:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link expires in 24 hours.</p>
      `,
      text: `Verify your email by visiting: ${verificationUrl}`
    });
    logger.info({ email }, "Verification email sent");
  } catch (err) {
    logger.error({ err, email }, "Failed to send verification email");
    throw err;
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${env.CORS_ORIGINS.split(",")[0] || "http://localhost:3000"}/reset-password?token=${token}`;

  if (!transporter) {
    logger.info({ email, token, resetUrl }, "Password reset email (not sent - email not configured)");
    return;
  }

  try {
    await transporter.sendMail({
      from: env.MAIL_FROM || "Biomedical <no-reply@biomedical.example>",
      to: email,
      subject: "Reset your password",
      html: `
        <h1>Reset your password</h1>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
      text: `Reset your password by visiting: ${resetUrl}`
    });
    logger.info({ email }, "Password reset email sent");
  } catch (err) {
    logger.error({ err, email }, "Failed to send password reset email");
    throw err;
  }
}
