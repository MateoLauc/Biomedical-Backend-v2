import type { Request, Response } from "express";
import { ordersService } from "./service";
import { authRepo } from "../auth/repo";
import type { CreateOrderInput, UpdateOrderStatusInput, CancelOrderInput } from "./types";

export const ordersController = {
  async createOrder(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to create an order." });
    }

    // Get full user details for purchase policy checks
    const user = await authRepo.findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Convert to PublicUser format (matching the structure expected by purchase policy)
    const publicUser = {
      id: user.id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      identityVerified: user.identityVerified,
      businessLicenseStatus: user.businessLicenseStatus,
      prescriptionAuthorityStatus: user.prescriptionAuthorityStatus
    };
    const result = await ordersService.createOrderFromCart(userId, req.body as CreateOrderInput, publicUser);
    res.status(201).json({
      message: "Order created successfully. Please proceed to payment.",
      order: result.order,
      paymentReference: result.paymentReference,
      authorizationUrl: result.authorizationUrl
    });
  },

  async getOrder(req: Request, res: Response) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || !userRole) {
      return res.status(401).json({ error: "Please sign in to view this order." });
    }

    const id = typeof req.params.id === "string" ? req.params.id : "";
    const order = await ordersService.getOrder(id, userId, userRole);
    res.json(order);
  },

  async listOrders(req: Request, res: Response) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || !userRole) {
      return res.status(401).json({ error: "Please sign in to view your orders." });
    }

    const options: {
      userId?: string;
      status?: string;
      paymentStatus?: string;
      page?: number;
      limit?: number;
      userRole: string;
    } = {
      userRole
    };

    // Customers can only see their own orders
    if (userRole === "customer") {
      options.userId = userId;
    } else if (req.query.userId && typeof req.query.userId === "string") {
      // Admins can filter by userId
      options.userId = req.query.userId;
    }

    if (typeof req.query.status === "string") {
      options.status = req.query.status;
    }
    if (typeof req.query.paymentStatus === "string") {
      options.paymentStatus = req.query.paymentStatus;
    }

    const page = typeof req.query.page === "string" ? parseInt(req.query.page, 10) : undefined;
    if (page && !isNaN(page)) {
      options.page = page;
    }

    const limit = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : undefined;
    if (limit && !isNaN(limit)) {
      options.limit = limit;
    }

    const result = await ordersService.listOrders(options);
    res.json(result);
  },

  async updateOrderStatus(req: Request, res: Response) {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(401).json({ error: "Please sign in to update order status." });
    }

    const id = typeof req.params.id === "string" ? req.params.id : "";
    const order = await ordersService.updateOrderStatus(id, req.body as UpdateOrderStatusInput, userRole);
    res.json({
      message: "Order status updated successfully.",
      order
    });
  },

  async cancelOrder(req: Request, res: Response) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || !userRole) {
      return res.status(401).json({ error: "Please sign in to cancel this order." });
    }

    const id = typeof req.params.id === "string" ? req.params.id : "";
    const order = await ordersService.cancelOrder(id, req.body as CancelOrderInput, userId, userRole);
    res.json({
      message: "Order cancelled successfully.",
      order
    });
  },

  async verifyPayment(req: Request, res: Response) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || !userRole) {
      return res.status(401).json({ error: "Please sign in to verify payment." });
    }

    const reference = typeof req.query.reference === "string" ? req.query.reference : "";
    if (!reference) {
      return res.status(400).json({ error: "Payment reference is required." });
    }

    const order = await ordersService.verifyPayment(reference, userId, userRole);
    res.json({
      message: "Payment verified successfully.",
      order
    });
  },

  async handleWebhook(req: Request, res: Response) {
    // Get signature from header
    const signature = req.headers["x-paystack-signature"];
    if (!signature || typeof signature !== "string") {
      return res.status(401).json({ error: "Missing webhook signature." });
    }

    // Get raw body - Express parses JSON, so we need to stringify it back for signature verification
    // In production, you might want to use express.raw() middleware for this route specifically
    const payload = JSON.stringify(req.body);

    try {
      await ordersService.handleWebhook(payload, signature);
      // Always return 200 to acknowledge receipt (even if processing fails)
      res.status(200).json({ received: true });
    } catch (error) {
      // Log error but still return 200 to prevent Paystack retries
      // In production, you'd want to log this properly
      console.error("Webhook processing error:", error);
      res.status(200).json({ received: true, error: "Processing failed but acknowledged" });
    }
  }
};
