import { Router } from "express";
import { careersController } from "./controller";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validateBody, validateQuery } from "../../middleware/validation";
import { createJobSchema, updateJobSchema, listJobsQuerySchema } from "./schema";

export const careersRoutes = Router();

// Public: list and get by id
careersRoutes.get("/jobs", validateQuery(listJobsQuerySchema), (req, res) => careersController.list(req, res));
careersRoutes.get("/jobs/:id", (req, res) => careersController.getById(req, res));

// Admin only: create, update, delete
careersRoutes.post("/jobs", requireAuth, requireRole("super_admin", "admin"), validateBody(createJobSchema), (req, res) =>
  careersController.create(req, res)
);
careersRoutes.patch("/jobs/:id", requireAuth, requireRole("super_admin", "admin"), validateBody(updateJobSchema), (req, res) =>
  careersController.update(req, res)
);
careersRoutes.delete("/jobs/:id", requireAuth, requireRole("super_admin", "admin"), (req, res) =>
  careersController.delete(req, res)
);
