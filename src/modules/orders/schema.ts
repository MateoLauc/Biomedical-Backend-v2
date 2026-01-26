import { z } from "zod";

export const createOrderSchema = z.object({
  shippingAddressId: z.string().uuid("Invalid shipping address ID."),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters.").optional()
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]).refine(
    (val) => ["pending", "processing", "shipped", "delivered", "cancelled"].includes(val),
    { message: "Invalid order status. Must be one of: pending, processing, shipped, delivered, cancelled." }
  ),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters.").optional()
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(5, "Cancellation reason must be at least 5 characters.").max(500, "Cancellation reason cannot exceed 500 characters.")
});

export const listOrdersQuerySchema = z.object({
  status: z.string().refine(
    (val) => !val || ["pending", "processing", "shipped", "delivered", "cancelled"].includes(val),
    { message: "Invalid order status." }
  ).optional(),
  paymentStatus: z.string().refine(
    (val) => !val || ["pending", "paid", "failed", "refunded"].includes(val),
    { message: "Invalid payment status." }
  ).optional(),
  page: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1, "Page must be 1 or greater.")).optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1).max(100, "Limit must be between 1 and 100.")).optional()
});
