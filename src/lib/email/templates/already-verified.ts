import { emailLayout, buttonHtml, escapeHtml } from "../layout.js";
import { getBrandConfig } from "../config.js";

export type AlreadyVerifiedTemplateData = {
  firstName: string;
  signInUrl: string;
};

export function alreadyVerifiedSubject(): string {
  return "You're already verified – sign in to Biomedical";
}

export function alreadyVerifiedHtml(data: AlreadyVerifiedTemplateData): string {
  const brand = getBrandConfig();
  const displayName = escapeHtml((data.firstName || "").trim()) || "there";
  const content = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="font-size: 20px; font-weight: 600; color: ${brand.textColor}; padding-bottom: 16px;">You're already verified, ${displayName}!</td>
  </tr>
  <tr>
    <td style="font-size: 16px; line-height: 1.6; color: ${brand.textColor};">
      <p style="margin: 0 0 16px;">Your email address is already verified. You can sign in to your account whenever you're ready.</p>
    </td>
  </tr>
  <tr>
    <td>${buttonHtml(data.signInUrl, "Sign in", brand.primaryColor)}</td>
  </tr>
  <tr>
    <td style="font-size: 14px; color: #6b7280; padding-top: 24px;">If you did not request this email, you can safely ignore it.</td>
  </tr>
</table>`;
  return emailLayout(brand, content);
}

export function alreadyVerifiedText(data: AlreadyVerifiedTemplateData): string {
  const displayName = data.firstName.trim() || "there";
  return `You're already verified, ${displayName}!\n\nYour email address is already verified. Sign in at ${data.signInUrl}.`;
}
