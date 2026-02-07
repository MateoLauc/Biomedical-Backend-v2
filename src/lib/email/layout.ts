import type { BrandConfig } from "./config";

/**
 * Table-based email layout for deliverability (avoids spam filters).
 * Uses tr/td structure; inline styles for email clients.
 * Banner uses primary-50 and embedded logo (cid:logo).
 */
export function emailLayout(brand: BrandConfig, contentHtml: string): string {
  const { primary50, bgColor, textColor } = brand;

  const bannerRow = `
    <tr>
      <td align="center" style="background-color: ${escapeHtml(String(primary50))}; padding: 24px 24px; border-radius: 8px 8px 0 0;">
        <img src="cid:logo" alt="Biomedical" width="140" height="40" style="display: block; max-width: 140px; height: auto;" />
      </td>
    </tr>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Biomedical</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${escapeHtml(bgColor)}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.5; color: ${escapeHtml(textColor)};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${escapeHtml(bgColor)};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          ${bannerRow}
          <tr>
            <td style="padding: 24px 32px 32px;">
              ${contentHtml}
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px 24px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
              This email was sent by Biomedical. If you did not request this, you can safely ignore it.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Standard button style for CTA links (table-based for email clients).
 */
export function buttonHtml(href: string, label: string, primaryColor: string): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
  <tr>
    <td style="border-radius: 6px; background-color: ${escapeHtml(primaryColor)};">
      <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`.trim();
}
