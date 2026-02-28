import { emailLayout, buttonHtml, escapeHtml } from "../layout.js";
import { getBrandConfig } from "../config.js";

export type CredentialsDeclinedTemplateData = {
  firstName: string;
  appUrl: string;
};

export function credentialsDeclinedSubject(): string {
  return "Update on your professional credentials submission";
}

export function credentialsDeclinedHtml(data: CredentialsDeclinedTemplateData): string {
  const brand = getBrandConfig();
  const name = escapeHtml((data.firstName || "").trim()) || "there";
  const content = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="font-size: 20px; font-weight: 600; color: ${brand.textColor}; padding-bottom: 16px;">Submission update</td>
  </tr>
  <tr>
    <td style="font-size: 16px; line-height: 1.6; color: ${brand.textColor};">
      <p style="margin: 0 0 16px;">Hi ${name},</p>
      <p style="margin: 0 0 16px;">After review, your professional credentials submission could not be approved at this time.</p>
      <p style="margin: 0 0 24px;">You may submit again with updated information or documents. If you have questions, please contact us.</p>
    </td>
  </tr>
  <tr>
    <td>${buttonHtml(data.appUrl, "Submit again", brand.primaryColor)}</td>
  </tr>
</table>`;
  return emailLayout(brand, content);
}

export function credentialsDeclinedText(data: CredentialsDeclinedTemplateData): string {
  const name = (data.firstName || "").trim() || "there";
  return `Hi ${name},\n\nAfter review, your professional credentials submission could not be approved. You may submit again: ${data.appUrl}`;
}
