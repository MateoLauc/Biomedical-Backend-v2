import { Router } from "express";
import { cartController } from "./controller";
import { requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validation";
import { addToCartSchema, updateCartItemSchema } from "./schema";

export const cartRoutes = Router();

// All cart routes require authentication
cartRoutes.use(requireAuth);

cartRoutes.get("/", (req, res) => cartController.getCart(req, res));
cartRoutes.post("/", validateBody(addToCartSchema), (req, res) => cartController.addToCart(req, res));
cartRoutes.patch("/:id", validateBody(updateCartItemSchema), (req, res) => cartController.updateCartItem(req, res));
cartRoutes.delete("/:id", (req, res) => cartController.removeFromCart(req, res));
cartRoutes.delete("/", (req, res) => cartController.clearCart(req, res));
