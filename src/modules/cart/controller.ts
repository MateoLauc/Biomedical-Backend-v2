import type { Request, Response } from "express";
import { cartService } from "./service";
import type { CartItemInput, CartItemUpdate } from "./types";

export const cartController = {
  async getCart(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to access your cart." });
    }

    const result = await cartService.getCart(userId);
    res.json(result);
  },

  async addToCart(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to add items to your cart." });
    }

    const result = await cartService.addToCart(userId, req.body as CartItemInput);
    res.status(201).json({ message: "Item added to cart successfully.", item: result });
  },

  async updateCartItem(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to update your cart." });
    }

    const itemId = typeof req.params.id === "string" ? req.params.id : "";
    const result = await cartService.updateCartItem(userId, itemId, req.body as CartItemUpdate);
    res.json({ message: "Cart item updated successfully.", item: result });
  },

  async removeFromCart(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to remove items from your cart." });
    }

    const itemId = typeof req.params.id === "string" ? req.params.id : "";
    await cartService.removeFromCart(userId, itemId);
    res.json({ message: "Item removed from cart successfully." });
  },

  async clearCart(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to clear your cart." });
    }

    await cartService.clearCart(userId);
    res.json({ message: "Cart cleared successfully." });
  }
};
