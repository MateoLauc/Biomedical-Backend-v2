import { Router } from "express";
import { notificationsController } from "./controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { validateQuery } from "../../middleware/validation.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { listNotificationsQuerySchema } from "./schema.js";

export const notificationsRoutes = Router();

notificationsRoutes.use(requireAuth);

notificationsRoutes.get(
  "/",
  validateQuery(listNotificationsQuerySchema),
  asyncHandler((req, res) => notificationsController.list(req, res))
);
notificationsRoutes.get("/:id", asyncHandler((req, res) => notificationsController.getById(req, res)));
notificationsRoutes.patch("/:id/read", asyncHandler((req, res) => notificationsController.markAsRead(req, res)));
notificationsRoutes.post("/read-all", asyncHandler((req, res) => notificationsController.markAllAsRead(req, res)));
