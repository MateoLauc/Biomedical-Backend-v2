import { Router } from "express";
import { ordersController } from "./controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/auth.js";
import { validateBody, validateQuery } from "../../middleware/validation.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { createOrderSchema, updateOrderStatusSchema, cancelOrderSchema, listOrdersQuerySchema } from "./schema.js";

export const ordersRoutes = Router();

// Webhook endpoint (no auth required, uses signature verification)
// Must be defined BEFORE requireAuth middleware
ordersRoutes.post("/webhook", asyncHandler((req, res) => ordersController.handleWebhook(req, res)));

// All other order routes require authentication
ordersRoutes.use(requireAuth);

ordersRoutes.post("/", validateBody(createOrderSchema), asyncHandler((req, res) => ordersController.createOrder(req, res)));
ordersRoutes.get("/", validateQuery(listOrdersQuerySchema), asyncHandler((req, res) => ordersController.listOrders(req, res)));
ordersRoutes.get("/verify-payment", asyncHandler((req, res) => ordersController.verifyPayment(req, res)));
ordersRoutes.get("/:id", asyncHandler((req, res) => ordersController.getOrder(req, res)));
ordersRoutes.patch("/:id/status", requireRole("super_admin", "admin"), validateBody(updateOrderStatusSchema), asyncHandler((req, res) =>
  ordersController.updateOrderStatus(req, res)
));
ordersRoutes.post("/:id/cancel", validateBody(cancelOrderSchema), asyncHandler((req, res) => ordersController.cancelOrder(req, res)));
