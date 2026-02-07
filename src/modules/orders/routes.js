import { Router } from "express";
import { ordersController } from "./controller";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/auth";
import { validateBody, validateQuery } from "../../middleware/validation";
import { createOrderSchema, updateOrderStatusSchema, cancelOrderSchema, listOrdersQuerySchema } from "./schema";
export const ordersRoutes = Router();
// Webhook endpoint (no auth required, uses signature verification)
// Must be defined BEFORE requireAuth middleware
ordersRoutes.post("/webhook", (req, res) => ordersController.handleWebhook(req, res));
// All other order routes require authentication
ordersRoutes.use(requireAuth);
ordersRoutes.post("/", validateBody(createOrderSchema), (req, res) => ordersController.createOrder(req, res));
ordersRoutes.get("/", validateQuery(listOrdersQuerySchema), (req, res) => ordersController.listOrders(req, res));
ordersRoutes.get("/verify-payment", (req, res) => ordersController.verifyPayment(req, res));
ordersRoutes.get("/:id", (req, res) => ordersController.getOrder(req, res));
ordersRoutes.patch("/:id/status", requireRole("super_admin", "admin"), validateBody(updateOrderStatusSchema), (req, res) => ordersController.updateOrderStatus(req, res));
ordersRoutes.post("/:id/cancel", validateBody(cancelOrderSchema), (req, res) => ordersController.cancelOrder(req, res));
