import type { orders } from "../../db/schema/index.js";

export type Order = typeof orders.$inferSelect;
export type OrderItem = {
  id: string;
  orderId: string;
  productVariantId: string;
  productName: string;
  productSlug: string;
  packSize: string;
  price: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type CreateOrderInput = {
  shippingAddressId: string;
  notes?: string;
  callbackUrl?: string; // Optional callback URL for Paystack redirect
};

export type UpdateOrderStatusInput = {
  status: OrderStatus;
  notes?: string;
};

export type CancelOrderInput = {
  reason: string;
};

export type OrderWithItems = {
  id: string;
  userId: string;
  shippingAddressId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentReference: string | null;
  paymentId: string | null;
  subtotal: string;
  shippingFee: string;
  total: string;
  notes: string | null;
  cancelledAt: Date | null;
  cancelledReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
};
