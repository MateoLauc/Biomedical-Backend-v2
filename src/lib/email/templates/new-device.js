import { emailLayout, escapeHtml } from "../layout";
import { getBrandConfig } from "../config";
export function newDeviceSubject() {
    return "New sign-in to your Biomedical account";
}
export function newDeviceHtml(data) {
    const brand = getBrandConfig();
    const content = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="font-size: 20px; font-weight: 600; color: ${brand.textColor}; padding-bottom: 16px;">New sign-in detected</td>
  </tr>
  <tr>
    <td style="font-size: 16px; line-height: 1.6; color: ${brand.textColor};">
      <p style="margin: 0 0 16px;">We noticed a new sign-in to your Biomedical account.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 16px 0; background-color: #f9fafb; border-radius: 6px; padding: 16px;">
        <tr>
          <td style="font-size: 14px; color: #6b7280;">Device / browser</td>
        </tr>
        <tr>
          <td style="font-size: 16px; font-weight: 500; padding-top: 4px;">${escapeHtml(data.deviceDescription)}</td>
        </tr>
        <tr>
          <td style="font-size: 14px; color: #6b7280; padding-top: 12px;">Time</td>
        </tr>
        <tr>
          <td style="font-size: 16px; padding-top: 4px;">${escapeHtml(data.timestamp)}</td>
        </tr>
      </table>
      <p style="margin: 16px 0 0;">If this was you, you can ignore this email.</p>
      <p style="margin: 16px 0 0;">If you don't recognize this activity, we recommend changing your password right away.</p>
    </td>
  </tr>
  <tr>
    <td style="padding-top: 24px;">
      <a href="${data.resetPasswordUrl}" style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 600; color: #ffffff; background-color: ${brand.primaryColor}; text-decoration: none; border-radius: 6px;">Reset password</a>
      <span style="margin-left: 12px; font-size: 14px;"><a href="${data.appUrl}" style="color: ${brand.primaryColor};">Go to Biomedical</a></span>
    </td>
  </tr>
</table>`;
    return emailLayout(brand, content);
}
export function newDeviceText(data) {
    return `New sign-in to your Biomedical account\n\nDevice/browser: ${data.deviceDescription}\nTime: ${data.timestamp}\n\nIf this was you, you can ignore this email. If you don't recognize this activity, reset your password: ${data.resetPasswordUrl}`;
}
