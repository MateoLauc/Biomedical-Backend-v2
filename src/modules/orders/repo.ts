import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../../db";
import { orders, orderItems, productVariants, products } from "../../db/schema";
import type { Order, OrderItem, OrderWithItems, OrderStatus, PaymentStatus } from "./types";

export const ordersRepo = {
  async findOrderById(id: string, userId?: string): Promise<Order | null> {
    const conditions = [eq(orders.id, id)];
    if (userId) {
      conditions.push(eq(orders.userId, userId));
    }
    const [order] = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .limit(1);
    return (order as Order) || null;
  },

  async findOrderByOrderNumber(orderNumber: string, userId?: string): Promise<Order | null> {
    const conditions = [eq(orders.orderNumber, orderNumber)];
    if (userId) {
      conditions.push(eq(orders.userId, userId));
    }
    const [order] = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .limit(1);
    return (order as Order) || null;
  },

  async findOrderByPaymentReference(paymentReference: string): Promise<Order | null> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.paymentReference, paymentReference))
      .limit(1);
    return (order as Order) || null;
  },

  async listOrders(options?: {
    userId?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    limit?: number;
    offset?: number;
  }): Promise<Order[]> {
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
      query = query.where(and(...conditions)) as typeof query;
    }

    query = query.orderBy(desc(orders.createdAt)) as typeof query;

    if (options?.limit) {
      query = query.limit(options.limit) as typeof query;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as typeof query;
    }

    return (await query) as Order[];
  },

  async countOrders(options?: {
    userId?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
  }): Promise<number> {
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

    let query = db.select({ count: sql<number>`count(*)` }).from(orders);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const [result] = await query;
    return Number(result?.count || 0);
  },

  async getRevenueTotal(): Promise<number> {
    const [result] = await db
      .select({ total: sql<number>`coalesce(sum(${orders.total}), 0)` })
      .from(orders)
      .where(eq(orders.paymentStatus, "paid"));
    return Number(result?.total ?? 0);
  },

  async getOrderWithItems(id: string, userId?: string): Promise<OrderWithItems | null> {
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
      items: items as OrderItem[]
    };
  },

  async createOrder(data: {
    userId: string;
    shippingAddressId: string;
    orderNumber: string;
    subtotal: string;
    shippingFee: string;
    total: string;
    notes?: string;
  }): Promise<Order> {
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
    return order as Order;
  },

  async createOrderItem(data: {
    orderId: string;
    productVariantId: string;
    productName: string;
    productSlug: string;
    packSize: string;
    price: string;
    quantity: number;
  }): Promise<OrderItem> {
    const [item] = await db
      .insert(orderItems)
      .values(data)
      .returning();
    return item as OrderItem;
  },

  async updateOrderStatus(id: string, status: OrderStatus, notes?: string): Promise<Order> {
    const updateData: { status: OrderStatus; updatedAt: Date; notes?: string; cancelledAt?: Date; cancelledReason?: null } = {
      status,
      updatedAt: new Date()
    };
    
    if (notes) {
      updateData.notes = notes;
    }
    
    if (status === "cancelled") {
      updateData.cancelledAt = new Date();
    } else {
      updateData.cancelledAt = null as unknown as Date;
      updateData.cancelledReason = null;
    }

    const [order] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    return order as Order;
  },

  async cancelOrder(id: string, reason: string): Promise<Order> {
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
    return order as Order;
  },

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus, paymentId?: string): Promise<Order> {
    const updateData: { paymentStatus: PaymentStatus; updatedAt: Date; paymentId?: string } = {
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
    return order as Order;
  },

  async setPaymentReference(id: string, paymentReference: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({
        paymentReference,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return order as Order;
  }
};
