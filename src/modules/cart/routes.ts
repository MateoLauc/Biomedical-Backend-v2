import { Router } from "express";
import { cartController } from "./controller";
import { requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validation";
import { asyncHandler } from "../../middleware/async-handler";
import { addToCartSchema, updateCartItemSchema } from "./schema";

export const cartRoutes = Router();

// All cart routes require authentication
cartRoutes.use(requireAuth);

cartRoutes.get("/", asyncHandler((req, res) => cartController.getCart(req, res)));
cartRoutes.post("/", validateBody(addToCartSchema), asyncHandler((req, res) => cartController.addToCart(req, res)));
cartRoutes.patch("/:id", validateBody(updateCartItemSchema), asyncHandler((req, res) => cartController.updateCartItem(req, res)));
cartRoutes.delete("/:id", asyncHandler((req, res) => cartController.removeFromCart(req, res)));
cartRoutes.delete("/", asyncHandler((req, res) => cartController.clearCart(req, res)));
