import { emailLayout, buttonHtml, escapeHtml } from "../layout.js";
import { getBrandConfig } from "../config.js";

export type CredentialsSubmittedAdminTemplateData = {
  customerName: string;
  customerEmail: string;
  reviewUrl: string;
};

export function credentialsSubmittedAdminSubject(): string {
  return "New professional credentials submitted for review";
}

export function credentialsSubmittedAdminHtml(data: CredentialsSubmittedAdminTemplateData): string {
  const brand = getBrandConfig();
  const name = escapeHtml((data.customerName || "").trim()) || "A customer";
  const email = escapeHtml(data.customerEmail);
  const content = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="font-size: 20px; font-weight: 600; color: ${brand.textColor}; padding-bottom: 16px;">New credentials submission</td>
  </tr>
  <tr>
    <td style="font-size: 16px; line-height: 1.6; color: ${brand.textColor};">
      <p style="margin: 0 0 16px;">${name} (${email}) has submitted professional credentials for review and approval.</p>
      <p style="margin: 0 0 24px;">Please review the submission and approve or decline from the admin dashboard.</p>
    </td>
  </tr>
  <tr>
    <td>${buttonHtml(data.reviewUrl, "Review submission", brand.primaryColor)}</td>
  </tr>
</table>`;
  return emailLayout(brand, content);
}

export function credentialsSubmittedAdminText(data: CredentialsSubmittedAdminTemplateData): string {
  const name = (data.customerName || "").trim() || "A customer";
  return `${name} (${data.customerEmail}) has submitted professional credentials for review. Review at: ${data.reviewUrl}`;
}
