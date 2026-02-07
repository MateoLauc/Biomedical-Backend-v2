import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../../db";
import { orders, orderItems } from "../../db/schema";
export const ordersRepo = {
    async findOrderById(id, userId) {
        const conditions = [eq(orders.id, id)];
        if (userId) {
            conditions.push(eq(orders.userId, userId));
        }
        const [order] = await db
            .select()
            .from(orders)
            .where(and(...conditions))
            .limit(1);
        return order || null;
    },
    async findOrderByOrderNumber(orderNumber, userId) {
        const conditions = [eq(orders.orderNumber, orderNumber)];
        if (userId) {
            conditions.push(eq(orders.userId, userId));
        }
        const [order] = await db
            .select()
            .from(orders)
            .where(and(...conditions))
            .limit(1);
        return order || null;
    },
    async findOrderByPaymentReference(paymentReference) {
        const [order] = await db
            .select()
            .from(orders)
            .where(eq(orders.paymentReference, paymentReference))
            .limit(1);
        return order || null;
    },
    async listOrders(options) {
        const conditions = [];
        if (options?.userId) {
            conditions.push(eq(orders.userId, options.userId));
        }
        if (options?.status) {
            conditions.push(eq(orders.status, options.status));
        }
        if (options?.paymentStatus) {
            conditions.push(eq(orders.paymentStatus, options.paymentStatus));
        }
        let query = db.select().from(orders);
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        query = query.orderBy(desc(orders.createdAt));
        if (options?.limit) {
            query = query.limit(options.limit);
        }
        if (options?.offset) {
            query = query.offset(options.offset);
        }
        return (await query);
    },
    async countOrders(options) {
        const conditions = [];
        if (options?.userId) {
            conditions.push(eq(orders.userId, options.userId));
        }
        if (options?.status) {
            conditions.push(eq(orders.status, options.status));
        }
        if (options?.paymentStatus) {
            conditions.push(eq(orders.paymentStatus, options.paymentStatus));
        }
        let query = db.select({ count: sql `count(*)` }).from(orders);
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        const [result] = await query;
        return Number(result?.count || 0);
    },
    async getRevenueTotal() {
        const [result] = await db
            .select({ total: sql `coalesce(sum(${orders.total}), 0)` })
            .from(orders)
            .where(eq(orders.paymentStatus, "paid"));
        return Number(result?.total ?? 0);
    },
    async getOrderWithItems(id, userId) {
        const order = await this.findOrderById(id, userId);
        if (!order) {
            return null;
        }
        const items = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, id))
            .orderBy(orderItems.createdAt);
        return {
            ...order,
            items: items
        };
    },
    async createOrder(data) {
        const [order] = await db
            .insert(orders)
            .values({
            userId: data.userId,
            shippingAddressId: data.shippingAddressId,
            orderNumber: data.orderNumber,
            subtotal: data.subtotal,
            shippingFee: data.shippingFee,
            total: data.total,
            notes: data.notes
        })
            .returning();
        return order;
    },
    async createOrderItem(data) {
        const [item] = await db
            .insert(orderItems)
            .values(data)
            .returning();
        return item;
    },
    async updateOrderStatus(id, status, notes) {
        const updateData = {
            status,
            updatedAt: new Date()
        };
        if (notes) {
            updateData.notes = notes;
        }
        if (status === "cancelled") {
            updateData.cancelledAt = new Date();
        }
        else {
            updateData.cancelledAt = null;
            updateData.cancelledReason = null;
        }
        const [order] = await db
            .update(orders)
            .set(updateData)
            .where(eq(orders.id, id))
            .returning();
        return order;
    },
    async cancelOrder(id, reason) {
        const [order] = await db
            .update(orders)
            .set({
            status: "cancelled",
            cancelledAt: new Date(),
            cancelledReason: reason,
            updatedAt: new Date()
        })
            .where(eq(orders.id, id))
            .returning();
        return order;
    },
    async updatePaymentStatus(id, paymentStatus, paymentId) {
        const updateData = {
            paymentStatus,
            updatedAt: new Date()
        };
        if (paymentId) {
            updateData.paymentId = paymentId;
        }
        const [order] = await db
            .update(orders)
            .set(updateData)
            .where(eq(orders.id, id))
            .returning();
        return order;
    },
    async setPaymentReference(id, paymentReference) {
        const [order] = await db
            .update(orders)
            .set({
            paymentReference,
            updatedAt: new Date()
        })
            .where(eq(orders.id, id))
            .returning();
        return order;
    }
};
