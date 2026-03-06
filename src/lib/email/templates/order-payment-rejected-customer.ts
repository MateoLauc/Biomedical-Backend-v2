import { emailLayout, buttonHtml, escapeHtml } from "../layout.js";
import { getBrandConfig } from "../config.js";

export type OrderPaymentRejectedTemplateData = {
  firstName: string;
  orderNumber: string;
  ordersUrl: string;
};

export function orderPaymentRejectedSubject(): string {
  return "Update on your order payment";
}

export function orderPaymentRejectedHtml(data: OrderPaymentRejectedTemplateData): string {
  const brand = getBrandConfig();
  const name = escapeHtml((data.firstName || "").trim()) || "there";
  const content = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="font-size: 20px; font-weight: 600; color: ${brand.textColor}; padding-bottom: 16px;">Payment not verified</td>
  </tr>
  <tr>
    <td style="font-size: 16px; line-height: 1.6; color: ${brand.textColor};">
      <p style="margin: 0 0 16px;">Hi ${name},</p>
      <p style="margin: 0 0 16px;">After review, we could not verify the payment for order <strong>${escapeHtml(data.orderNumber)}</strong>.</p>
      <p style="margin: 0 0 24px;">If you have already paid, please contact us with your transaction details. You can also submit a new payment proof from your orders page.</p>
    </td>
  </tr>
  <tr>
    <td>${buttonHtml(data.ordersUrl, "View my orders", brand.primaryColor)}</td>
  </tr>
</table>`;
  return emailLayout(brand, content);
}

export function orderPaymentRejectedText(data: OrderPaymentRejectedTemplateData): string {
  const name = (data.firstName || "").trim() || "there";
  return `Hi ${name},\n\nWe could not verify the payment for order ${data.orderNumber}. View your orders: ${data.ordersUrl}`;
}
