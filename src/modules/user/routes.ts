import { Router } from "express";
import { userController } from "./controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validation.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { updateProfileSchema } from "./schema.js";

export const userRoutes = Router();

userRoutes.use(requireAuth);

userRoutes.get("/me", asyncHandler((req, res) => userController.getMe(req, res)));
userRoutes.patch("/me", validateBody(updateProfileSchema), asyncHandler((req, res) => userController.updateProfile(req, res)));
