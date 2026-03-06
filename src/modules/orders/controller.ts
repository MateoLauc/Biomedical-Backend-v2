import { randomUUID } from "crypto";
import type { Request, Response } from "express";
import { ordersService } from "./service.js";
import { authRepo } from "../auth/repo.js";
import { badRequest } from "../../lib/http-errors.js";
import { logger } from "../../lib/logger.js";
import { baseUrl, sendPaymentProofSubmittedAdminEmail } from "../../lib/email/index.js";
import { isCloudinaryConfigured, uploadImage, uploadPdf, uploadRaw } from "../../lib/cloudinary.js";
import type { CreateOrderInput, UpdateOrderStatusInput, CancelOrderInput } from "./types.js";

export const ordersController = {
  async createOrder(req: Request, res: Response) {
    logger.info({ path: req.path, method: req.method }, "[createOrder] request received");
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to create an order." });
    }
    if (!isCloudinaryConfigured) {
      throw badRequest("File upload is not configured.");
    }
    const file = req.file;
    if (!file?.buffer) {
      throw badRequest("Payment proof is required. Please upload an image or PDF.");
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
    // Upload payment proof (same request as order placement)
    const rawName = file.originalname?.trim();
    const hasValidExtension = rawName?.includes(".");
    const looksLikeUuid = rawName && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawName.replace(/\.[^.]*$/, ""));
    const fileName =
      rawName && hasValidExtension && !looksLikeUuid
        ? rawName
        : file.mimetype === "application/pdf"
          ? "document.pdf"
          : file.mimetype?.startsWith("image/")
            ? `document.${file.mimetype.replace("image/", "") === "jpeg" ? "jpg" : file.mimetype.replace("image/", "")}`
            : "document";
    const isPdf = file.mimetype === "application/pdf";
    const baseName = rawName ? rawName.replace(/\.[^.]*$/, "").trim() : "";
    const sanitized = baseName.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "") || undefined;
    let url: string;
    if (isPdf) {
      const publicId = sanitized || randomUUID().slice(0, 12);
      try {
        const result = await uploadPdf(file.buffer, { folder: "orders/payment-proof", publicId });
        url = result.url;
      } catch {
        const result = await uploadRaw(file.buffer, { folder: "orders/payment-proof", publicId });
        url = result.url;
      }
    } else {
      const result = await uploadImage(file.buffer, { folder: "orders/payment-proof" });
      url = result.url;
    }

    try {
      const result = await ordersService.createOrderFromCart(
        userId,
        req.body as CreateOrderInput,
        publicUser,
        { paymentProofUrl: url, paymentProofFileName: fileName }
      );
      res.status(201).json({
        message: "Order created successfully.",
        order: result.order
      });
    } catch (err) {
      logger.error(
        { err, userId, body: req.body, message: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined },
        "[createOrder] place order failed"
      );
      throw err;
    }
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

  async uploadPaymentProof(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to upload payment proof." });
    }
    if (!isCloudinaryConfigured) {
      throw badRequest("File upload is not configured.");
    }
    const orderId = typeof req.params.id === "string" ? req.params.id : "";
    const file = req.file;
    if (!file?.buffer) {
      throw badRequest("No file provided. Please upload an image or PDF.");
    }
    const rawName = file.originalname?.trim();
    const hasValidExtension = rawName?.includes(".");
    const looksLikeUuid = rawName && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawName.replace(/\.[^.]*$/, ""));
    const fileName =
      rawName && hasValidExtension && !looksLikeUuid
        ? rawName
        : file.mimetype === "application/pdf"
          ? "document.pdf"
          : file.mimetype?.startsWith("image/")
            ? `document.${file.mimetype.replace("image/", "") === "jpeg" ? "jpg" : file.mimetype.replace("image/", "")}`
            : "document";
    const isPdf = file.mimetype === "application/pdf";
    const baseName = rawName ? rawName.replace(/\.[^.]*$/, "").trim() : "";
    const sanitized = baseName.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "") || undefined;
    let url: string;
    if (isPdf) {
      const publicId = sanitized || randomUUID().slice(0, 12);
      try {
        const result = await uploadPdf(file.buffer, { folder: "orders/payment-proof", publicId });
        url = result.url;
      } catch {
        const result = await uploadRaw(file.buffer, { folder: "orders/payment-proof", publicId });
        url = result.url;
      }
    } else {
      const result = await uploadImage(file.buffer, { folder: "orders/payment-proof" });
      url = result.url;
    }
    const order = await ordersService.uploadPaymentProof(orderId, userId, url, fileName);
    const user = await authRepo.findUserById(order.userId);
    const customerName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Customer" : "Customer";
    const customerEmail = user?.email ?? "";
    const reviewUrl = `${baseUrl()}/admin/orders?orderId=${order.id}`;
    const superAdmins = await authRepo.listUsers({ role: "admin", limit: 100 });
    for (const admin of superAdmins) {
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
          console.error("Failed to send payment proof admin email to", admin.email, err);
        }
      }
    }
    res.status(200).json({
      message: "Payment proof uploaded. An admin will verify and approve your order.",
      order
    });
  },

  async updatePaymentStatus(req: Request, res: Response) {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(401).json({ error: "Please sign in to update payment status." });
    }
    const orderId = typeof req.params.id === "string" ? req.params.id : "";
    const body = req.body as { paymentStatus: "paid" | "failed" | "refunded"; status?: "pending" | "processing" | "shipped" | "delivered" | "cancelled" };
    const order = await ordersService.updatePaymentStatus(orderId, body, userRole);
    res.json({
      message: "Payment status updated successfully.",
      order
    });
  }
};
