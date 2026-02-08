import { Router } from "express";
import { adminController } from "./controller";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/auth";
import { validateBody, validateQuery } from "../../middleware/validation";
import { asyncHandler } from "../../middleware/async-handler";
import { listUsersQuerySchema, updateUserVerificationSchema, createAdminSchema } from "./schema";

export const adminRoutes = Router();

adminRoutes.use(requireAuth);
adminRoutes.use(requireRole("super_admin", "admin"));

adminRoutes.get("/users", validateQuery(listUsersQuerySchema), asyncHandler((req, res) => adminController.listUsers(req, res)));
adminRoutes.patch("/users/:id/verification", validateBody(updateUserVerificationSchema), asyncHandler((req, res) =>
  adminController.updateUserVerification(req, res)
));
adminRoutes.get("/dashboard", asyncHandler((req, res) => adminController.getDashboard(req, res)));
adminRoutes.get("/inventory", asyncHandler((req, res) => adminController.getInventoryOverview(req, res)));

// Create admin user (super_admin only)
adminRoutes.post("/users", requireRole("super_admin"), validateBody(createAdminSchema), asyncHandler((req, res) =>
  adminController.createAdmin(req, res)
));
