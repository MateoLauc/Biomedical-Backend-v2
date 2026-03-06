import { emailLayout, buttonHtml, escapeHtml } from "../layout.js";
import { getBrandConfig } from "../config.js";

export type OrderStatusUpdatedTemplateData = {
  firstName: string;
  orderNumber: string;
  status: string;
  orderDetailUrl: string;
};

function formatStatus(status: string): string {
  const s = (status || "").replace(/_/g, " ").trim();
  if (!s) return "updated";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function orderStatusUpdatedSubject(data: Pick<OrderStatusUpdatedTemplateData, "orderNumber" | "status">): string {
  return `Order ${data.orderNumber}: ${formatStatus(data.status)}`;
}

export function orderStatusUpdatedHtml(data: OrderStatusUpdatedTemplateData): string {
  const brand = getBrandConfig();
  const name = escapeHtml((data.firstName || "").trim()) || "there";
  const status = escapeHtml(formatStatus(data.status));

  const content = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="font-size: 20px; font-weight: 600; color: ${brand.textColor}; padding-bottom: 16px;">Order update</td>
  </tr>
  <tr>
    <td style="font-size: 16px; line-height: 1.6; color: ${brand.textColor};">
      <p style="margin: 0 0 16px;">Hi ${name},</p>
      <p style="margin: 0 0 16px;">Your order <strong>${escapeHtml(data.orderNumber)}</strong> status is now <strong>${status}</strong>.</p>
      <p style="margin: 0 0 24px;">You can view the latest details in your account.</p>
    </td>
  </tr>
  <tr>
    <td>${buttonHtml(data.orderDetailUrl, "View order", brand.primaryColor)}</td>
  </tr>
</table>`;

  return emailLayout(brand, content);
}

export function orderStatusUpdatedText(data: OrderStatusUpdatedTemplateData): string {
  const name = (data.firstName || "").trim() || "there";
  return `Hi ${name},\n\nYour order ${data.orderNumber} status is now ${formatStatus(data.status)}.\n\nView order: ${data.orderDetailUrl}`;
}

