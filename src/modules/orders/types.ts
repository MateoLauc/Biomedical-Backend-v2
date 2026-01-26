import type { orders, orderItems } from "../../db/schema";

export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;

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

export type OrderWithItems = Order & {
  items: OrderItem[];
};
