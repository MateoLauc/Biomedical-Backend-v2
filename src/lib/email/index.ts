import { env } from "../../config/env";
import { getMailtrapClient, getFromAddress, isEmailConfigured } from "./client";
import { logger } from "../logger";
import {
  verificationSubject,
  verificationHtml,
  verificationText
} from "./templates/verification";
import {
  passwordResetSubject,
  passwordResetHtml,
  passwordResetText
} from "./templates/password-reset";
import {
  welcomeSubject,
  welcomeHtml,
  welcomeText
} from "./templates/welcome";
import {
  newDeviceSubject,
  newDeviceHtml,
  newDeviceText
} from "./templates/new-device";
import { getLogoAttachment } from "./logo";

function baseUrl(): string {
  const first = env.CORS_ORIGINS.split(",")[0]?.trim();
  return first || "http://localhost:3000";
}

function emailAttachments(): Array<{ filename: string; content_id: string; disposition: "inline"; content: Buffer }> {
  const logo = getLogoAttachment();
  return logo ? [logo] : [];
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verificationUrl = `${baseUrl()}/verify-email?token=${token}`;

  if (!isEmailConfigured()) {
    logger.info({ email, verificationUrl }, "Email verification (not sent - email not configured)");
    return;
  }

  const client = getMailtrapClient()!;
  const from = getFromAddress();

  try {
    await client.send({
      from: { name: from.name, email: from.email },
      to: [{ email }],
      subject: verificationSubject(),
      html: verificationHtml({ verificationUrl }),
      text: verificationText({ verificationUrl }),
      attachments: emailAttachments()
    });
    logger.info({ email }, "Verification email sent");
  } catch (err) {
    logger.error({ err, email }, "Failed to send verification email");
    throw err;
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${baseUrl()}/reset-password?token=${token}`;

  if (!isEmailConfigured()) {
    logger.info({ email, resetUrl }, "Password reset email (not sent - email not configured)");
    return;
  }

  const client = getMailtrapClient()!;
  const from = getFromAddress();

  try {
    await client.send({
      from: { name: from.name, email: from.email },
      to: [{ email }],
      subject: passwordResetSubject(),
      html: passwordResetHtml({ resetUrl }),
      text: passwordResetText({ resetUrl }),
      attachments: emailAttachments()
    });
    logger.info({ email }, "Password reset email sent");
  } catch (err) {
    logger.error({ err, email }, "Failed to send password reset email");
    throw err;
  }
}

export async function sendWelcomeEmail(email: string, firstName: string): Promise<void> {
  const appUrl = baseUrl();

  if (!isEmailConfigured()) {
    logger.info({ email, appUrl }, "Welcome email (not sent - email not configured)");
    return;
  }

  const client = getMailtrapClient()!;
  const from = getFromAddress();

  try {
    await client.send({
      from: { name: from.name, email: from.email },
      to: [{ email }],
      subject: welcomeSubject(),
      html: welcomeHtml({ firstName, appUrl }),
      text: welcomeText({ firstName, appUrl }),
      attachments: emailAttachments()
    });
    logger.info({ email }, "Welcome email sent");
  } catch (err) {
    logger.error({ err, email }, "Failed to send welcome email");
    throw err;
  }
}

export type NewDeviceEmailParams = {
  email: string;
  deviceDescription: string;
  timestamp: string;
};

export async function sendNewDeviceEmail(params: NewDeviceEmailParams): Promise<void> {
  const { email, deviceDescription, timestamp } = params;
  const appUrl = baseUrl();
  const resetPasswordUrl = `${appUrl}/forgot-password`;

  if (!isEmailConfigured()) {
    logger.info({ email, deviceDescription }, "New device email (not sent - email not configured)");
    return;
  }

  const client = getMailtrapClient()!;
  const from = getFromAddress();

  try {
    await client.send({
      from: { name: from.name, email: from.email },
      to: [{ email }],
      subject: newDeviceSubject(),
      html: newDeviceHtml({ deviceDescription, timestamp, appUrl, resetPasswordUrl }),
      text: newDeviceText({ deviceDescription, timestamp, appUrl, resetPasswordUrl }),
      attachments: emailAttachments()
    });
    logger.info({ email }, "New device email sent");
  } catch (err) {
    logger.error({ err, email }, "Failed to send new device email");
    throw err;
  }
}
