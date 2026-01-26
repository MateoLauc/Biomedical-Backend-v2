import { ordersRepo } from "./repo";
import { cartRepo } from "../cart/repo";
import { shippingRepo } from "../shipping/repo";
import { canPurchaseProduct } from "../../lib/policies/purchase-policy";
import { badRequest, notFound, forbidden } from "../../lib/http-errors";
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
  async createOrderFromCart(userId: string, input: CreateOrderInput, user: PublicUser): Promise<{ order: OrderWithItems; paymentReference: string }> {
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

    // Generate payment reference (will be used with Paystack)
    const paymentReference = order.id.substring(0, 8).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
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
      paymentReference
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

    const updated = await ordersRepo.updateOrderStatus(id, input.status, input.notes);
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

    const cancelled = await ordersRepo.cancelOrder(id, input.reason);
    const orderWithItems = await ordersRepo.getOrderWithItems(id);
    if (!orderWithItems) {
      throw new Error("Failed to retrieve cancelled order");
    }

    return orderWithItems;
  }
};
