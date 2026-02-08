import { Router } from "express";
import { userController } from "./controller";
import { requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validation";
import { asyncHandler } from "../../middleware/async-handler";
import { updateProfileSchema } from "./schema";

export const userRoutes = Router();

userRoutes.use(requireAuth);

userRoutes.get("/me", asyncHandler((req, res) => userController.getMe(req, res)));
userRoutes.patch("/me", validateBody(updateProfileSchema), asyncHandler((req, res) => userController.updateProfile(req, res)));
