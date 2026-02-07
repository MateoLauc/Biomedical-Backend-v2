import { Router } from "express";
import { userController } from "./controller";
import { requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validation";
import { updateProfileSchema } from "./schema";
export const userRoutes = Router();
userRoutes.use(requireAuth);
userRoutes.get("/me", (req, res) => userController.getMe(req, res));
userRoutes.patch("/me", validateBody(updateProfileSchema), (req, res) => userController.updateProfile(req, res));
