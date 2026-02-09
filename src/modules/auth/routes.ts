import { Router } from "express";
import { authController } from "./controller.js";
import { validateBody } from "../../middleware/validation.js";
import { requireAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import {
  signupSchema,
  signinSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema
} from "./schema.js";

export const authRoutes = Router();

authRoutes.post("/signup", validateBody(signupSchema), asyncHandler((req, res) => authController.signup(req, res)));
authRoutes.post("/signin", validateBody(signinSchema), asyncHandler((req, res) => authController.signin(req, res)));
authRoutes.post("/verify-email", validateBody(verifyEmailSchema), asyncHandler((req, res) => authController.verifyEmail(req, res)));
authRoutes.post("/resend-verification", validateBody(resendVerificationSchema), asyncHandler((req, res) =>
  authController.resendVerificationEmail(req, res)
));
authRoutes.post("/forgot-password", validateBody(forgotPasswordSchema), asyncHandler((req, res) => authController.forgotPassword(req, res)));
authRoutes.post("/reset-password", validateBody(resetPasswordSchema), asyncHandler((req, res) => authController.resetPassword(req, res)));
authRoutes.post("/change-password", requireAuth, validateBody(changePasswordSchema), asyncHandler((req, res) =>
  authController.changePassword(req, res)
));
authRoutes.post("/refresh", asyncHandler((req, res) => authController.refreshToken(req, res)));
authRoutes.post("/logout", asyncHandler((req, res) => authController.logout(req, res)));
