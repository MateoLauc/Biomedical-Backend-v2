import { Router } from "express";
import { careersController } from "./controller.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validateBody, validateQuery } from "../../middleware/validation.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { createJobSchema, updateJobSchema, listJobsQuerySchema } from "./schema.js";

export const careersRoutes = Router();

// Public: list and get by id
careersRoutes.get("/jobs", validateQuery(listJobsQuerySchema), asyncHandler((req, res) => careersController.list(req, res)));
careersRoutes.get("/jobs/:id", asyncHandler((req, res) => careersController.getById(req, res)));

// Admin only: create, update, delete
careersRoutes.post("/jobs", requireAuth, requireRole("super_admin", "admin"), validateBody(createJobSchema), asyncHandler((req, res) =>
  careersController.create(req, res)
));
careersRoutes.patch("/jobs/:id", requireAuth, requireRole("super_admin", "admin"), validateBody(updateJobSchema), asyncHandler((req, res) =>
  careersController.update(req, res)
));
careersRoutes.delete("/jobs/:id", requireAuth, requireRole("super_admin", "admin"), asyncHandler((req, res) =>
  careersController.delete(req, res)
));
