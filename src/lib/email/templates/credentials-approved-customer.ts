import { emailLayout, buttonHtml, escapeHtml } from "../layout.js";
import { getBrandConfig } from "../config.js";

export type CredentialsApprovedTemplateData = {
  firstName: string;
  appUrl: string;
};

export function credentialsApprovedSubject(): string {
  return "Your professional credentials have been approved";
}

export function credentialsApprovedHtml(data: CredentialsApprovedTemplateData): string {
  const brand = getBrandConfig();
  const name = escapeHtml((data.firstName || "").trim()) || "there";
  const content = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="font-size: 20px; font-weight: 600; color: ${brand.textColor}; padding-bottom: 16px;">Credentials approved</td>
  </tr>
  <tr>
    <td style="font-size: 16px; line-height: 1.6; color: ${brand.textColor};">
      <p style="margin: 0 0 16px;">Hi ${name},</p>
      <p style="margin: 0 0 24px;">Your professional credentials have been approved. You can now access the full range of products and services that require verification.</p>
    </td>
  </tr>
  <tr>
    <td>${buttonHtml(data.appUrl, "Go to dashboard", brand.primaryColor)}</td>
  </tr>
</table>`;
  return emailLayout(brand, content);
}

export function credentialsApprovedText(data: CredentialsApprovedTemplateData): string {
  const name = (data.firstName || "").trim() || "there";
  return `Hi ${name},\n\nYour professional credentials have been approved. You can now access the full range of products and services. Visit: ${data.appUrl}`;
}
