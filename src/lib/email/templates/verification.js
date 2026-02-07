import { emailLayout, buttonHtml, escapeHtml } from "../layout";
import { getBrandConfig } from "../config";
export function verificationSubject() {
    return "Verify your email address";
}
export function verificationHtml(data) {
    const brand = getBrandConfig();
    const content = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="font-size: 20px; font-weight: 600; color: ${brand.textColor}; padding-bottom: 16px;">Verify your email address</td>
  </tr>
  <tr>
    <td style="font-size: 16px; line-height: 1.6; color: ${brand.textColor};">
      <p style="margin: 0 0 16px;">Thanks for signing up. Click the button below to verify your email address.</p>
      <p style="margin: 0 0 24px;">This link expires in 24 hours.</p>
    </td>
  </tr>
  <tr>
    <td>${buttonHtml(data.verificationUrl, "Verify email address", brand.primaryColor)}</td>
  </tr>
  <tr>
    <td style="font-size: 14px; color: #6b7280; padding-top: 16px;">If the button doesn't work, copy and paste this link into your browser:</td>
  </tr>
  <tr>
    <td style="font-size: 14px; word-break: break-all; padding-top: 8px;"><a href="${escapeHtml(data.verificationUrl)}" style="color: ${brand.primaryColor};">${escapeHtml(data.verificationUrl)}</a></td>
  </tr>
</table>`;
    return emailLayout(brand, content);
}
export function verificationText(data) {
    return `Verify your email address by visiting: ${data.verificationUrl}\n\nThis link expires in 24 hours.`;
}
