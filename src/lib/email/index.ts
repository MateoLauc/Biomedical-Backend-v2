import { env } from "../../config/env.js";
import { getMailtrapClient, getFromAddress, isEmailConfigured } from "./client.js";
import { logger } from "../logger.js";
import {
  verificationSubject,
  verificationHtml,
  verificationText
} from "./templates/verification.js";
import {
  passwordResetSubject,
  passwordResetHtml,
  passwordResetText
} from "./templates/password-reset.js";
import {
  welcomeSubject,
  welcomeHtml,
  welcomeText
} from "./templates/welcome.js";
import {
  newDeviceSubject,
  newDeviceHtml,
  newDeviceText
} from "./templates/new-device.js";
import {
  alreadyVerifiedSubject,
  alreadyVerifiedHtml,
  alreadyVerifiedText
} from "./templates/already-verified.js";
import {
  credentialsSubmittedAdminSubject,
  credentialsSubmittedAdminHtml,
  credentialsSubmittedAdminText
} from "./templates/credentials-submitted-admin.js";
import {
  credentialsApprovedSubject,
  credentialsApprovedHtml,
  credentialsApprovedText
} from "./templates/credentials-approved-customer.js";
import {
  credentialsDeclinedSubject,
  credentialsDeclinedHtml,
  credentialsDeclinedText
} from "./templates/credentials-declined-customer.js";
import { getLogoAttachment } from "./logo.js";
import { getBrandConfig } from "./config.js";

function baseUrl(): string {
  const first = env.CORS_ORIGINS.split(",")[0]?.trim();
  return first || "http://localhost:3000";
}

function emailAttachments(): Array<{ filename: string; content_id: string; disposition: "inline"; content: Buffer }> {
  const logo = getLogoAttachment();
  return logo ? [logo] : [];
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verificationUrl = `${baseUrl()}/auth/verify-email?token=${token}`;

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
  const resetUrl = `${baseUrl()}/auth/reset-password?token=${token}`;

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

export async function sendAdminWelcomeEmail(email: string, firstName: string, tempPassword: string): Promise<void> {
  const appUrl = baseUrl();

  if (!isEmailConfigured()) {
    logger.info({ email, appUrl }, "Admin welcome email (not sent - email not configured)");
    return;
  }

  const client = getMailtrapClient()!;
  const from = getFromAddress();

  // Build a simple admin welcome message that includes the temporary password and instructions
  const html = `
    ${welcomeHtml({ firstName, appUrl })}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;">
      <tr>
        <td style="font-size:16px; color:${getBrandConfig().textColor};">
          <p style="margin:0 0 12px;">An administrator account has been created for you.</p>
          <p style="margin:0 0 12px;">Temporary password: <strong>${tempPassword}</strong></p>
          <p style="margin:0 0 12px;">Please sign in and change your password in Settings as soon as you log in.</p>
        </td>
      </tr>
    </table>
  `;

  const text = `${welcomeText({ firstName, appUrl })}\n\nAn administrator account has been created for you.\nTemporary password: ${tempPassword}\n\nPlease sign in and change your password in Settings as soon as you log in.`;

  try {
    await client.send({
      from: { name: from.name, email: from.email },
      to: [{ email }],
      subject: welcomeSubject(),
      html,
      text,
      attachments: emailAttachments()
    });
    logger.info({ email }, "Admin welcome email sent");
  } catch (err) {
    logger.error({ err, email }, "Failed to send admin welcome email");
    throw err;
  }
}

export type NewDeviceEmailParams = {
  email: string;
  deviceDescription: string;
  timestamp: string;
};

export async function sendAlreadyVerifiedEmail(email: string, firstName: string): Promise<void> {
  const signInUrl = `${baseUrl()}/auth/sign-in`;

  if (!isEmailConfigured()) {
    logger.info({ email, signInUrl }, "Already verified email (not sent - email not configured)");
    return;
  }

  const client = getMailtrapClient()!;
  const from = getFromAddress();

  try {
    await client.send({
      from: { name: from.name, email: from.email },
      to: [{ email }],
      subject: alreadyVerifiedSubject(),
      html: alreadyVerifiedHtml({ firstName, signInUrl }),
      text: alreadyVerifiedText({ firstName, signInUrl }),
      attachments: emailAttachments()
    });
    logger.info({ email }, "Already verified email sent");
  } catch (err) {
    logger.error({ err, email }, "Failed to send already verified email");
    throw err;
  }
}

export async function sendNewDeviceEmail(params: NewDeviceEmailParams): Promise<void> {
  const { email, deviceDescription, timestamp } = params;
  const appUrl = baseUrl();
  const resetPasswordUrl = `${appUrl}/auth/forgot-password`;

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

export async function sendCredentialsSubmittedAdminEmail(
  toEmail: string,
  data: { customerName: string; customerEmail: string }
): Promise<void> {
  const reviewUrl = `${baseUrl()}/admin/users`;
  if (!isEmailConfigured()) {
    logger.info({ toEmail, customerEmail: data.customerEmail }, "Credentials submitted admin email (not sent - email not configured)");
    return;
  }
  const client = getMailtrapClient()!;
  const from = getFromAddress();
  try {
    await client.send({
      from: { name: from.name, email: from.email },
      to: [{ email: toEmail }],
      subject: credentialsSubmittedAdminSubject(),
      html: credentialsSubmittedAdminHtml({ ...data, reviewUrl }),
      text: credentialsSubmittedAdminText({ ...data, reviewUrl }),
      attachments: emailAttachments()
    });
    logger.info({ toEmail }, "Credentials submitted admin email sent");
  } catch (err) {
    logger.error({ err, toEmail }, "Failed to send credentials submitted admin email");
    throw err;
  }
}

export async function sendCredentialsApprovedEmail(email: string, firstName: string): Promise<void> {
  const appUrl = baseUrl();
  if (!isEmailConfigured()) {
    logger.info({ email }, "Credentials approved email (not sent - email not configured)");
    return;
  }
  const client = getMailtrapClient()!;
  const from = getFromAddress();
  try {
    await client.send({
      from: { name: from.name, email: from.email },
      to: [{ email }],
      subject: credentialsApprovedSubject(),
      html: credentialsApprovedHtml({ firstName, appUrl }),
      text: credentialsApprovedText({ firstName, appUrl }),
      attachments: emailAttachments()
    });
    logger.info({ email }, "Credentials approved email sent");
  } catch (err) {
    logger.error({ err, email }, "Failed to send credentials approved email");
    throw err;
  }
}

export async function sendCredentialsDeclinedEmail(email: string, firstName: string): Promise<void> {
  const appUrl = `${baseUrl()}/profile/credentials`;
  if (!isEmailConfigured()) {
    logger.info({ email }, "Credentials declined email (not sent - email not configured)");
    return;
  }
  const client = getMailtrapClient()!;
  const from = getFromAddress();
  try {
    await client.send({
      from: { name: from.name, email: from.email },
      to: [{ email }],
      subject: credentialsDeclinedSubject(),
      html: credentialsDeclinedHtml({ firstName, appUrl }),
      text: credentialsDeclinedText({ firstName, appUrl }),
      attachments: emailAttachments()
    });
    logger.info({ email }, "Credentials declined email sent");
  } catch (err) {
    logger.error({ err, email }, "Failed to send credentials declined email");
    throw err;
  }
}
