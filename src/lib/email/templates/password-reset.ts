import { emailLayout, buttonHtml, escapeHtml } from "../layout";
import { getBrandConfig } from "../config";

export type PasswordResetTemplateData = {
  resetUrl: string;
};

export function passwordResetSubject(): string {
  return "Reset your password";
}

export function passwordResetHtml(data: PasswordResetTemplateData): string {
  const brand = getBrandConfig();
  const content = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="font-size: 20px; font-weight: 600; color: ${brand.textColor}; padding-bottom: 16px;">Reset your password</td>
  </tr>
  <tr>
    <td style="font-size: 16px; line-height: 1.6; color: ${brand.textColor};">
      <p style="margin: 0 0 16px;">We received a request to reset your password. Click the button below to choose a new password.</p>
      <p style="margin: 0 0 24px;">This link expires in 1 hour.</p>
    </td>
  </tr>
  <tr>
    <td>${buttonHtml(data.resetUrl, "Reset password", brand.primaryColor)}</td>
  </tr>
  <tr>
    <td style="font-size: 14px; color: #6b7280; padding-top: 16px;">If you didn't request this, you can safely ignore this email.</td>
  </tr>
  <tr>
    <td style="font-size: 14px; color: #6b7280; padding-top: 8px;">If the button doesn't work, copy and paste this link into your browser:</td>
  </tr>
  <tr>
    <td style="font-size: 14px; word-break: break-all; padding-top: 8px;"><a href="${escapeHtml(data.resetUrl)}" style="color: ${brand.primaryColor};">${escapeHtml(data.resetUrl)}</a></td>
  </tr>
</table>`;
  return emailLayout(brand, content);
}

export function passwordResetText(data: PasswordResetTemplateData): string {
  return `Reset your password by visiting: ${data.resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, please ignore this email.`;
}
