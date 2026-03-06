import { emailLayout, buttonHtml, escapeHtml } from "../layout.js";
import { getBrandConfig } from "../config.js";

export type OrderPaymentApprovedTemplateData = {
  firstName: string;
  orderNumber: string;
  orderDetailUrl: string;
};

export function orderPaymentApprovedSubject(): string {
  return "Your order payment has been approved";
}

export function orderPaymentApprovedHtml(data: OrderPaymentApprovedTemplateData): string {
  const brand = getBrandConfig();
  const name = escapeHtml((data.firstName || "").trim()) || "there";
  const content = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="font-size: 20px; font-weight: 600; color: ${brand.textColor}; padding-bottom: 16px;">Payment approved</td>
  </tr>
  <tr>
    <td style="font-size: 16px; line-height: 1.6; color: ${brand.textColor};">
      <p style="margin: 0 0 16px;">Hi ${name},</p>
      <p style="margin: 0 0 16px;">Your payment for order <strong>${escapeHtml(data.orderNumber)}</strong> has been verified and approved. We will process your order shortly.</p>
      <p style="margin: 0 0 24px;">You can track your order status in your account.</p>
    </td>
  </tr>
  <tr>
    <td>${buttonHtml(data.orderDetailUrl, "View order", brand.primaryColor)}</td>
  </tr>
</table>`;
  return emailLayout(brand, content);
}

export function orderPaymentApprovedText(data: OrderPaymentApprovedTemplateData): string {
  const name = (data.firstName || "").trim() || "there";
  return `Hi ${name},\n\nYour payment for order ${data.orderNumber} has been approved. View order: ${data.orderDetailUrl}`;
}
