import { env } from "../../config/env.js";

export type FromAddress = { name: string; email: string };

/**
 * Parse MAIL_FROM (e.g. "Biomedical <no-reply@biomedicalng.com>") into name and email.
 */
export function parseMailFrom(): FromAddress {
  const raw = env.MAIL_FROM || "Biomedical <no-reply@biomedicalng.com>";
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (match && match[1] != null && match[2] != null) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  if (raw.includes("@")) {
    return { name: "Biomedical", email: raw.trim() };
  }
  return { name: "Biomedical", email: "no-reply@biomedicalng.com" };
}

export type BrandConfig = {
  logoUrl: string | null;
  primaryColor: string;
  primary50: string;
  bgColor: string;
  textColor: string;
};

const DEFAULTS = {
  primaryColor: "#0192DD",
  primary50: "#E6F4FC",
  bgColor: "#F4F5F5",
  textColor: "#333536"
};

/**
 * Brand settings for email templates (align with frontend globals.css).
 */
export function getBrandConfig(): BrandConfig {
  return {
    logoUrl: env.BRAND_LOGO_URL && env.BRAND_LOGO_URL.trim() ? env.BRAND_LOGO_URL.trim() : null,
    primaryColor: env.BRAND_PRIMARY_COLOR?.trim() || DEFAULTS.primaryColor,
    primary50: env.BRAND_PRIMARY_50?.trim() || DEFAULTS.primary50,
    bgColor: env.BRAND_BG_COLOR?.trim() || DEFAULTS.bgColor,
    textColor: env.BRAND_TEXT_COLOR?.trim() || DEFAULTS.textColor
  };
}
