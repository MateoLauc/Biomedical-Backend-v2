import { emailLayout, buttonHtml, escapeHtml } from "../layout.js";
import { getBrandConfig } from "../config.js";

export type PaymentProofSubmittedAdminTemplateData = {
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  total: string;
  reviewUrl: string;
};

export function paymentProofSubmittedAdminSubject(): string {
  return "Payment proof submitted for order";
}

export function paymentProofSubmittedAdminHtml(data: PaymentProofSubmittedAdminTemplateData): string {
  const brand = getBrandConfig();
  const name = escapeHtml((data.customerName || "").trim()) || "A customer";
  const email = escapeHtml(data.customerEmail);
  const total = escapeHtml(data.total);
  const content = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="font-size: 20px; font-weight: 600; color: ${brand.textColor}; padding-bottom: 16px;">Payment proof submitted</td>
  </tr>
  <tr>
    <td style="font-size: 16px; line-height: 1.6; color: ${brand.textColor};">
      <p style="margin: 0 0 16px;">${name} (${email}) has submitted a payment proof for order <strong>${escapeHtml(data.orderNumber)}</strong> (Amount: ${total}).</p>
      <p style="margin: 0 0 24px;">Please verify the proof and approve or reject the order from the admin dashboard.</p>
    </td>
  </tr>
  <tr>
    <td>${buttonHtml(data.reviewUrl, "View order", brand.primaryColor)}</td>
  </tr>
</table>`;
  return emailLayout(brand, content);
}

export function paymentProofSubmittedAdminText(data: PaymentProofSubmittedAdminTemplateData): string {
  const name = (data.customerName || "").trim() || "A customer";
  return `${name} (${data.customerEmail}) submitted payment proof for order ${data.orderNumber} (${data.total}). View: ${data.reviewUrl}`;
}
