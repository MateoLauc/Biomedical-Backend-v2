import { ordersRepo } from "./repo";
import { cartRepo } from "../cart/repo";
import { shippingRepo } from "../shipping/repo";
import { authRepo } from "../auth/repo";
import { canPurchaseProduct } from "../../lib/policies/purchase-policy";
import { initializePayment, verifyPayment } from "../../lib/payments/paystack";
import { badRequest, notFound, forbidden, unauthorized } from "../../lib/http-errors";
import type { CreateOrderInput, UpdateOrderStatusInput, CancelOrderInput, OrderWithItems } from "./types";
import type { PublicUser } from "../auth/types";

function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0];
  if (!dateStr) {
    throw new Error("Failed to generate date string");
  }
  const formattedDate = dateStr.replace(/-/g, "");
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${formattedDate}-${randomStr}`;
}

export const ordersService = {
  async createOrderFromCart(userId: string, input: CreateOrderInput, user: PublicUser): Promise<{ order: OrderWithItems; paymentReference: string; authorizationUrl: string }> {
    // Get user's cart
    const cartItems = await cartRepo.getCartItemsWithDetails(userId);
    if (cartItems.length === 0) {
      throw badRequest("Your cart is empty. Please add items to your cart before placing an order.");
    }

    // Verify shipping address belongs to user
    const shippingAddress = await shippingRepo.findShippingAddressById(input.shippingAddressId, userId);
    if (!shippingAddress) {
      throw notFound("Shipping address not found.");
    }

    // Calculate totals and validate products
    let subtotal = 0;
    const orderItemsData = [];

    for (const cartItem of cartItems) {
      const variant = cartItem.productVariant;
      const product = variant.product;

      // Check if product requires approval
      if (product.requiresApproval) {
        const policyCheck = canPurchaseProduct(user, {
          requiresBusinessLicense: product.requiresApproval,
          requiresPrescriptionAuthority: product.requiresApproval
        });

        if (!policyCheck.allowed) {
          throw forbidden(`This product requires approval. ${policyCheck.reason || "Please complete your verification."}`);
        }
      }

      // Check stock availability
      if (variant.stockQuantity < cartItem.quantity) {
        throw badRequest(`Insufficient stock for ${product.name} (${variant.packSize}). Available: ${variant.stockQuantity}, Requested: ${cartItem.quantity}`);
      }

      // Check if variant is still active
      if (!variant.isActive || !product.isActive) {
        throw badRequest(`${product.name} (${variant.packSize}) is no longer available.`);
      }

      const itemTotal = parseFloat(variant.price) * cartItem.quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        productVariantId: variant.id,
        productName: product.name,
        productSlug: product.slug,
        packSize: variant.packSize,
        price: variant.price,
        quantity: cartItem.quantity
      });
    }

    // Calculate shipping fee (for now, set to 0 - can be calculated based on region/weight later)
    const shippingFee = 0;
    const total = subtotal + shippingFee;

    // Generate unique order number
    let orderNumber = generateOrderNumber();
    let attempts = 0;
    while (await ordersRepo.findOrderByOrderNumber(orderNumber)) {
      orderNumber = generateOrderNumber();
      attempts++;
      if (attempts > 10) {
        throw new Error("Failed to generate unique order number");
      }
    }

    // Create order
    const orderData: {
      userId: string;
      shippingAddressId: string;
      orderNumber: string;
      subtotal: string;
      shippingFee: string;
      total: string;
      notes?: string;
    } = {
      userId,
      shippingAddressId: input.shippingAddressId,
      orderNumber,
      subtotal: subtotal.toFixed(2),
      shippingFee: shippingFee.toFixed(2),
      total: total.toFixed(2)
    };
    if (input.notes) {
      orderData.notes = input.notes;
    }
    const order = await ordersRepo.createOrder(orderData);

    // Create order items
    for (const itemData of orderItemsData) {
      await ordersRepo.createOrderItem({
        orderId: order.id,
        ...itemData
      });
    }

    // Get user email for Paystack
    const userRecord = await authRepo.findUserById(userId);
    if (!userRecord) {
      throw notFound("User not found.");
    }

    // Initialize Paystack payment
    const amountInKobo = Math.round(total * 100); // Convert to kobo (smallest currency unit)
    const paymentReference = order.orderNumber; // Use order number as payment reference

    const paymentInitData: {
      email: string;
      amount: number;
      reference: string;
      callback_url?: string;
      metadata: {
        orderId: string;
        userId: string;
        orderNumber: string;
      };
    } = {
      email: userRecord.email,
      amount: amountInKobo,
      reference: paymentReference,
      metadata: {
        orderId: order.id,
        userId: userId,
        orderNumber: order.orderNumber
      }
    };
    if (input.callbackUrl) {
      paymentInitData.callback_url = input.callbackUrl;
    }
    const paymentInit = await initializePayment(paymentInitData);

    // Store payment reference
    await ordersRepo.setPaymentReference(order.id, paymentReference);

    // Clear cart after successful order creation
    await cartRepo.clearCart(userId);

    // Get full order with items
    const orderWithItems = await ordersRepo.getOrderWithItems(order.id, userId);
    if (!orderWithItems) {
      throw new Error("Failed to retrieve created order");
    }

    return {
      order: orderWithItems,
      paymentReference: paymentInit.data.reference,
      authorizationUrl: paymentInit.data.authorization_url
    };
  },

  async getOrder(id: string, userId: string, userRole: string): Promise<OrderWithItems> {
    // Admins can view any order, users can only view their own
    const order = await ordersRepo.getOrderWithItems(id, userRole === "customer" ? userId : undefined);
    if (!order) {
      throw notFound("Order not found.");
    }

    // If customer, verify ownership
    if (userRole === "customer" && order.userId !== userId) {
      throw forbidden("You don't have permission to view this order.");
    }

    return order;
  },

  async listOrders(options: {
    userId?: string;
    status?: string;
    paymentStatus?: string;
    page?: number;
    limit?: number;
    userRole: string;
  }): Promise<{ items: OrderWithItems[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    // Customers can only see their own orders
    const effectiveUserId = options.userRole === "customer" ? options.userId : options.userId;

    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const offset = (page - 1) * limit;

    const listOptions: {
      userId?: string;
      status?: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
      paymentStatus?: "pending" | "paid" | "failed" | "refunded";
      limit: number;
      offset: number;
    } = {
      limit,
      offset
    };

    if (effectiveUserId) {
      listOptions.userId = effectiveUserId;
    }
    if (options.status) {
      listOptions.status = options.status as "pending" | "processing" | "shipped" | "delivered" | "cancelled";
    }
    if (options.paymentStatus) {
      listOptions.paymentStatus = options.paymentStatus as "pending" | "paid" | "failed" | "refunded";
    }

    const countOptions: {
      userId?: string;
      status?: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
      paymentStatus?: "pending" | "paid" | "failed" | "refunded";
    } = {};
    if (effectiveUserId) {
      countOptions.userId = effectiveUserId;
    }
    if (listOptions.status) {
      countOptions.status = listOptions.status;
    }
    if (listOptions.paymentStatus) {
      countOptions.paymentStatus = listOptions.paymentStatus;
    }

    const [ordersList, total] = await Promise.all([
      ordersRepo.listOrders(listOptions),
      ordersRepo.countOrders(countOptions)
    ]);

    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      ordersList.map(async (order) => {
        const orderWithItems = await ordersRepo.getOrderWithItems(order.id, effectiveUserId);
        return orderWithItems || { ...order, items: [] };
      })
    );

    return {
      items: ordersWithItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async updateOrderStatus(id: string, input: UpdateOrderStatusInput, userRole: string): Promise<OrderWithItems> {
    if (userRole !== "super_admin" && userRole !== "admin") {
      throw forbidden("Only administrators can update order status.");
    }

    const order = await ordersRepo.findOrderById(id);
    if (!order) {
      throw notFound("Order not found.");
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: []
    };

    const allowedNextStatuses = validTransitions[order.status] || [];
    if (!allowedNextStatuses.includes(input.status)) {
      throw badRequest(`Cannot change order status from ${order.status} to ${input.status}. Valid transitions: ${allowedNextStatuses.join(", ") || "none"}`);
    }

     await ordersRepo.updateOrderStatus(id, input.status, input.notes);
    const orderWithItems = await ordersRepo.getOrderWithItems(id);
    if (!orderWithItems) {
      throw new Error("Failed to retrieve updated order");
    }

    return orderWithItems;
  },

  async cancelOrder(id: string, input: CancelOrderInput, userId: string, userRole: string): Promise<OrderWithItems> {
    const order = await ordersRepo.findOrderById(id, userRole === "customer" ? userId : undefined);
    if (!order) {
      throw notFound("Order not found.");
    }

    // Customers can only cancel their own pending orders
    if (userRole === "customer") {
      if (order.userId !== userId) {
        throw forbidden("You can only cancel your own orders.");
      }
      if (order.status !== "pending") {
        throw badRequest("Only pending orders can be cancelled by customers.");
      }
    }

    // Admins can cancel any order (except delivered)
    if (userRole !== "customer" && order.status === "delivered") {
      throw badRequest("Delivered orders cannot be cancelled.");
    }

     await ordersRepo.cancelOrder(id, input.reason);
    const orderWithItems = await ordersRepo.getOrderWithItems(id);
    if (!orderWithItems) {
      throw new Error("Failed to retrieve cancelled order");
    }

    return orderWithItems;
  },

  async verifyPayment(reference: string, userId: string, userRole: string): Promise<OrderWithItems> {
    // Verify payment with Paystack
    const paymentData = await verifyPayment(reference);

    // Find order by payment reference
    const order = await ordersRepo.findOrderByPaymentReference(reference);
    if (!order) {
      throw notFound("Order not found for this payment reference.");
    }

    // Verify ownership (customers can only verify their own orders)
    if (userRole === "customer" && order.userId !== userId) {
      throw forbidden("You don't have permission to verify this payment.");
    }

    // Update payment status based on Paystack response
    let paymentStatus: "pending" | "paid" | "failed" | "refunded" = "pending";
    if (paymentData.data.status === "success") {
      paymentStatus = "paid";
    } else if (paymentData.data.status === "failed") {
      paymentStatus = "failed";
    }

    // Update order payment status
    await ordersRepo.updatePaymentStatus(order.id, paymentStatus, paymentData.data.id.toString());

    // If payment is successful and order is still pending, update to processing
    if (paymentStatus === "paid" && order.status === "pending") {
      await ordersRepo.updateOrderStatus(order.id, "processing");
    }

    const orderWithItems = await ordersRepo.getOrderWithItems(order.id, userRole === "customer" ? userId : undefined);
    if (!orderWithItems) {
      throw new Error("Failed to retrieve order after payment verification");
    }

    return orderWithItems;
  },

  async handleWebhook(payload: string, signature: string): Promise<void> {
    // Verify webhook signature
    const { verifyPaystackWebhook } = await import("../../lib/payments/paystack");
    const isValid = verifyPaystackWebhook(payload, signature);
    if (!isValid) {
      throw unauthorized("Invalid webhook signature.");
    }

    const event = JSON.parse(payload) as {
      event: string;
      data: {
        reference: string;
        status: string;
        id: number;
        amount: number;
        customer: { email: string };
      };
    };

    // Handle charge.success event
    if (event.event === "charge.success") {
      const order = await ordersRepo.findOrderByPaymentReference(event.data.reference);
      if (!order) {
        // Order not found - log but don't throw (webhook should return 200)
        return;
      }

      // Update payment status to paid
      await ordersRepo.updatePaymentStatus(order.id, "paid", event.data.id.toString());

      // If order is still pending, update to processing
      if (order.status === "pending") {
        await ordersRepo.updateOrderStatus(order.id, "processing");
      }
    }

    // Handle charge.failed event
    if (event.event === "charge.failed") {
      const order = await ordersRepo.findOrderByPaymentReference(event.data.reference);
      if (!order) {
        return;
      }

      await ordersRepo.updatePaymentStatus(order.id, "failed");
    }
  }
};
