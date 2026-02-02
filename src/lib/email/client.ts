import { MailtrapClient } from "mailtrap";
import { env } from "../../config/env";
import { parseMailFrom } from "./config";
import { logger } from "../logger";

let client: MailtrapClient | null = null;

if (env.MAILTRAP_API_KEY) {
  const isSandbox = env.MAILTRAP_USE_SANDBOX === "true";
  client = new MailtrapClient({
    token: env.MAILTRAP_API_KEY,
    sandbox: isSandbox,
    ...(isSandbox && env.MAILTRAP_INBOX_ID != null && { testInboxId: env.MAILTRAP_INBOX_ID })
  });
  logger.info(
    {
      sandbox: isSandbox,
      inboxId: isSandbox ? env.MAILTRAP_INBOX_ID : undefined
    },
    "Email service configured (Mailtrap)"
  );
} else {
  logger.warn("Email service not configured (MAILTRAP_API_KEY missing)");
}

export function getMailtrapClient(): MailtrapClient | null {
  return client;
}

export function getFromAddress(): ReturnType<typeof parseMailFrom> {
  return parseMailFrom();
}

export function isEmailConfigured(): boolean {
  return client != null;
}
