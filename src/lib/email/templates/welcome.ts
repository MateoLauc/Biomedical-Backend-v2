import { emailLayout, buttonHtml, escapeHtml } from "../layout.js";
import { getBrandConfig } from "../config.js";

export type WelcomeTemplateData = {
  firstName: string;
  appUrl: string;
};

export function welcomeSubject(): string {
  return "Welcome to Biomedical";
}

export function welcomeHtml(data: WelcomeTemplateData): string {
  const brand = getBrandConfig();
  const displayName = escapeHtml((data.firstName || "").trim()) || "there";
  const content = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="font-size: 20px; font-weight: 600; color: ${brand.textColor}; padding-bottom: 16px;">Welcome, ${displayName}!</td>
  </tr>
  <tr>
    <td style="font-size: 16px; line-height: 1.6; color: ${brand.textColor};">
      <p style="margin: 0 0 16px;">Thank you for signing up. We're glad to have you.</p>
      <p style="margin: 0 0 24px;">Please verify your email using the link we sent you, then you can sign in and get started.</p>
    </td>
  </tr>
  <tr>
    <td>${buttonHtml(data.appUrl, "Go to Biomedical", brand.primaryColor)}</td>
  </tr>
  <tr>
    <td style="font-size: 14px; color: #6b7280; padding-top: 24px;">If you have any questions, just reply to this email.</td>
  </tr>
</table>`;
  return emailLayout(brand, content);
}

export function welcomeText(data: WelcomeTemplateData): string {
  const displayName = data.firstName.trim() || "there";
  return `Welcome, ${displayName}!\n\nThank you for signing up. Please verify your email using the link we sent you, then sign in at ${data.appUrl}.`;
}
