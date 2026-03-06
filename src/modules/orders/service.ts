import { ordersRepo } from "./repo.js";
import { cartRepo } from "../cart/repo.js";
import { shippingRepo } from "../shipping/repo.js";
import { authRepo } from "../auth/repo.js";
import { productsRepo } from "../products/repo.js";
import { canPurchaseProduct } from "../../lib/policies/purchase-policy.js";
import { badRequest, notFound, forbidden } from "../../lib/http-errors.js";
import { logger } from "../../lib/logger.js";
import {
  baseUrl,
  sendOrderPaymentApprovedEmail,
  sendOrderPaymentRejectedEmail,
  sendPaymentProofSubmittedAdminEmail,
  sendOrderStatusUpdatedEmail,
} from "../../lib/email/index.js";
import { notificationsRepo } from "../notifications/repo.js";
import type { CreateOrderInput, UpdateOrderStatusInput, CancelOrderInput, OrderWithItems } from "./types.js";
import type { PublicUser } from "../auth/types.js";

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
  async createOrderFromCart(
    userId: string,
    input: CreateOrderInput,
    user: PublicUser,
    paymentProof?: { paymentProofUrl: string; paymentProofFileName: string }
  ): Promise<{ order: OrderWithItems }> {
    logger.info({ userId, shippingAddressId: input?.shippingAddressId }, "[createOrderFromCart] start");
    // Get user's cart
    const cartItems = await cartRepo.getCartItemsWithDetails(userId);
    logger.info({ cartItemsCount: cartItems.length }, "[createOrderFromCart] cart loaded");
    if (cartItems.length === 0) {
      throw badRequest("Your cart is empty. Please add items to your cart before placing an order.");
    }
    const first = cartItems[0];
    const firstVariant = first?.productVariant;
    logger.info(
      {
        firstItemVariantPrice: firstVariant?.price,
        firstItemVariantPriceType: typeof firstVariant?.price,
      },
      "[createOrderFromCart] first cart item variant.price"
    );

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

      // Check stock from DB (authoritative): fetch current variant and product so we use latest stock
      const currentVariant = await productsRepo.findProductVariantById(variant.id);
      const currentProduct = currentVariant
        ? await productsRepo.findProductById(currentVariant.productId)
        : null;
      const variantStock = currentVariant ? Number(currentVariant.stockQuantity) || 0 : 0;
      const productStock = currentProduct ? Number(currentProduct.stockQuantity) || 0 : 0;
      const availableStock = Math.max(variantStock, productStock);
      if (availableStock < cartItem.quantity) {
        throw badRequest(
          `Insufficient stock for ${product.name} (${variant.packSize}). Available: ${availableStock}, Requested: ${cartItem.quantity}`
        );
      }

      // Check if variant is still active
      if (!variant.isActive || !product.isActive) {
        throw badRequest(`${product.name} (${variant.packSize}) is no longer available.`);
      }

      const priceNum = Number(parseFloat(String(variant.price ?? 0))) || 0;
      const itemTotal = priceNum * cartItem.quantity;
      if (!Number.isFinite(itemTotal)) {
        throw badRequest(`Invalid price for ${product.name} (${variant.packSize}). Please refresh and try again.`);
      }
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

    // Calculate shipping fee (for now, set to 0)
    const shippingFee = 0;
    const total = subtotal + shippingFee;
    if (!Number.isFinite(subtotal) || !Number.isFinite(total)) {
      throw badRequest("Unable to calculate order total. Please check your cart and try again.");
    }
    logger.info({ subtotal, total, shippingFee }, "[createOrderFromCart] totals computed");

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

    // Create order (bank transfer only)
    const orderData: {
      userId: string;
      shippingAddressId: string;
      orderNumber: string;
      subtotal: string;
      shippingFee: string;
      total: string;
      notes?: string;
      paymentMethod: string;
    } = {
      userId,
      shippingAddressId: input.shippingAddressId,
      orderNumber,
      subtotal: Number(subtotal).toFixed(2),
      shippingFee: Number(shippingFee).toFixed(2),
      total: Number(total).toFixed(2),
      paymentMethod: "bank_transfer"
    };
    if (input.notes) {
      orderData.notes = input.notes;
    }
    logger.info({ orderData }, "[createOrderFromCart] creating order");
    const order = await ordersRepo.createOrder(orderData);
    logger.info({ orderId: order.id }, "[createOrderFromCart] order created");

    // Create order items
    for (const itemData of orderItemsData) {
      await ordersRepo.createOrderItem({
        orderId: order.id,
        ...itemData
      });
    }

    if (paymentProof?.paymentProofUrl) {
      await ordersRepo.setPaymentProof(order.id, paymentProof.paymentProofUrl, paymentProof.paymentProofFileName);
      const dbUser = await authRepo.findUserById(order.userId);
      const customerName = dbUser ? `${dbUser.firstName ?? ""} ${dbUser.lastName ?? ""}`.trim() || "Customer" : "Customer";
      const customerEmail = dbUser?.email ?? "";
      const reviewUrl = `${baseUrl()}/admin/orders?orderId=${order.id}`;
      const admins = await authRepo.listUsers({ role: "admin", limit: 100 });
      for (const admin of admins) {
        if (admin.email) {
          try {
            await sendPaymentProofSubmittedAdminEmail(admin.email, {
              orderNumber: order.orderNumber,
              orderId: order.id,
              customerName,
              customerEmail,
              total: order.total,
              reviewUrl
            });
          } catch (err) {
            logger.error({ err, email: admin.email, orderId: order.id }, "Failed to send payment proof admin email");
          }
        }
      }
    }

    // Clear cart after successful order creation
    await cartRepo.clearCart(userId);

    // Get full order with items
    logger.info({ orderId: order.id }, "[createOrderFromCart] fetching order with items");
    const orderWithItems = await ordersRepo.getOrderWithItems(order.id, userId);
    if (!orderWithItems) {
      throw new Error("Failed to retrieve created order");
    }
    logger.info({ orderId: orderWithItems.id }, "[createOrderFromCart] done");
    return { order: orderWithItems };
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
    const customer = await authRepo.findUserById(order.userId);
    return {
      ...order,
      customerFirstName: customer?.firstName ?? null,
      customerLastName: customer?.lastName ?? null,
      customerEmail: customer?.email ?? null,
    };
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

    // Fetch items and customer info for each order
    const ordersWithItems = await Promise.all(
      ordersList.map(async (order) => {
        const orderWithItems = await ordersRepo.getOrderWithItems(order.id, effectiveUserId);
        if (!orderWithItems) {
          return { ...order, items: [] } as OrderWithItems;
        }
        const customer = await authRepo.findUserById(orderWithItems.userId);
        return {
          ...orderWithItems,
          customerFirstName: customer?.firstName ?? null,
          customerLastName: customer?.lastName ?? null,
          customerEmail: customer?.email ?? null,
        };
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

    // In-app notification for customer
    await notificationsRepo.create({
      userId: order.userId,
      title: "Order update",
      body: `Your order ${order.orderNumber} is now ${input.status.replace(/_/g, " ")}.`
    });

    const orderWithItems = await ordersRepo.getOrderWithItems(id);
    if (!orderWithItems) {
      throw new Error("Failed to retrieve updated order");
    }

    // Email notification for customer
    const customer = await authRepo.findUserById(order.userId);
    if (customer?.email) {
      try {
        await sendOrderStatusUpdatedEmail(customer.email, {
          firstName: customer.firstName ?? "there",
          orderNumber: order.orderNumber,
          status: input.status,
          orderDetailUrl: `${baseUrl()}/profile/orders/${order.id}`
        });
      } catch (err) {
        logger.error({ err, orderId: order.id, email: customer.email }, "Failed to send order status email");
      }
    }

    return {
      ...orderWithItems,
      customerFirstName: customer?.firstName ?? null,
      customerLastName: customer?.lastName ?? null,
      customerEmail: customer?.email ?? null,
    };
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

  async uploadPaymentProof(orderId: string, userId: string, fileUrl: string, fileName: string): Promise<OrderWithItems> {
    const order = await ordersRepo.findOrderById(orderId, userId);
    if (!order) {
      throw notFound("Order not found.");
    }
    if (order.paymentStatus !== "pending") {
      throw badRequest("Payment proof can only be submitted for orders with pending payment.");
    }
    await ordersRepo.setPaymentProof(orderId, fileUrl, fileName);
    const orderWithItems = await ordersRepo.getOrderWithItems(orderId, userId);
    if (!orderWithItems) {
      throw new Error("Failed to retrieve order after uploading proof");
    }
    return orderWithItems;
  },

  async updatePaymentStatus(
    orderId: string,
    input: { paymentStatus: "paid" | "failed" | "refunded"; status?: OrderWithItems["status"] },
    userRole: string
  ): Promise<OrderWithItems> {
    if (userRole !== "super_admin" && userRole !== "admin") {
      throw forbidden("Only administrators can update payment status.");
    }
    const order = await ordersRepo.findOrderById(orderId);
    if (!order) {
      throw notFound("Order not found.");
    }
    if (order.paymentStatus !== "pending") {
      throw badRequest(`Order payment is already ${order.paymentStatus}.`);
    }
    await ordersRepo.updatePaymentStatus(orderId, input.paymentStatus);
    if (input.paymentStatus === "paid" && order.status === "pending") {
      await ordersRepo.updateOrderStatus(orderId, "processing");
    }
    // In-app notification for customer
    if (input.paymentStatus === "paid") {
      await notificationsRepo.create({
        userId: order.userId,
        title: "Payment confirmed",
        body: `Your payment for order ${order.orderNumber} has been confirmed.`
      });
    } else if (input.paymentStatus === "failed") {
      await notificationsRepo.create({
        userId: order.userId,
        title: "Payment not confirmed",
        body: `Your payment for order ${order.orderNumber} could not be confirmed. Please reach out if you need help.`
      });
    } else if (input.paymentStatus === "refunded") {
      await notificationsRepo.create({
        userId: order.userId,
        title: "Payment refunded",
        body: `Your payment for order ${order.orderNumber} has been refunded.`
      });
    }
    const user = await authRepo.findUserById(order.userId);
    if (user?.email) {
      const firstName = user.firstName ?? "";
      const orderDetailUrl = `${baseUrl()}/orders`;
      const ordersUrl = `${baseUrl()}/orders`;
      try {
        if (input.paymentStatus === "paid") {
          await sendOrderPaymentApprovedEmail(user.email, {
            firstName,
            orderNumber: order.orderNumber,
            orderDetailUrl
          });
        } else if (input.paymentStatus === "failed") {
          await sendOrderPaymentRejectedEmail(user.email, {
            firstName,
            orderNumber: order.orderNumber,
            ordersUrl
          });
        }
      } catch (err) {
        console.error("Failed to send order payment status email to", user.email, err);
      }
    }
    const orderWithItems = await ordersRepo.getOrderWithItems(orderId);
    if (!orderWithItems) {
      throw new Error("Failed to retrieve updated order");
    }
    return orderWithItems;
  }
};
