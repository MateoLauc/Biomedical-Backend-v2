import { pgTable, text, timestamp, uuid, decimal, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { shippingAddresses } from "./shipping-addresses";
import { orderStatusEnum, paymentStatusEnum } from "./enums";
export const orders = pgTable("orders", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "restrict" }),
    shippingAddressId: uuid("shipping_address_id")
        .notNull()
        .references(() => shippingAddresses.id, { onDelete: "restrict" }),
    // Order details
    orderNumber: text("order_number").notNull().unique(), // e.g., "ORD-20260120-ABC123"
    status: orderStatusEnum("status").notNull().default("pending"),
    // Payment details
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
    paymentMethod: text("payment_method").notNull().default("paystack"), // "paystack" for now
    paymentReference: text("payment_reference"), // Paystack reference
    paymentId: text("payment_id"), // Paystack payment ID after verification
    // Pricing (snapshot at time of order)
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    shippingFee: decimal("shipping_fee", { precision: 10, scale: 2 }).notNull().default("0.00"),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),
    // Metadata
    notes: text("notes"), // Customer notes or admin notes
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelledReason: text("cancelled_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => ({
    userIdIdx: index("orders_user_id_idx").on(t.userId),
    orderNumberIdx: index("orders_order_number_idx").on(t.orderNumber),
    statusIdx: index("orders_status_idx").on(t.status),
    paymentStatusIdx: index("orders_payment_status_idx").on(t.paymentStatus),
    paymentReferenceIdx: index("orders_payment_reference_idx").on(t.paymentReference),
    createdAtIdx: index("orders_created_at_idx").on(t.createdAt)
}));
