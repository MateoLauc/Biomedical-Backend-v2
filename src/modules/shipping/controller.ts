import type { Request, Response } from "express";
import { shippingService } from "./service.js";
import type { ShippingAddressInput, ShippingAddressUpdate } from "./types.js";

export const shippingController = {
  async listShippingAddresses(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to view your shipping addresses." });
    }

    const result = await shippingService.listShippingAddresses(userId);
    res.json(result);
  },

  async getShippingAddress(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to view this shipping address." });
    }

    const id = typeof req.params.id === "string" ? req.params.id : "";
    const address = await shippingService.getShippingAddress(id, userId);
    res.json(address);
  },

  async createShippingAddress(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to add a shipping address." });
    }

    const result = await shippingService.createShippingAddress(userId, req.body as ShippingAddressInput);
    res.status(201).json({ message: "Shipping address added successfully.", address: result });
  },

  async updateShippingAddress(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to update this shipping address." });
    }

    const id = typeof req.params.id === "string" ? req.params.id : "";
    const result = await shippingService.updateShippingAddress(id, userId, req.body as ShippingAddressUpdate);
    res.json({ message: "Shipping address updated successfully.", address: result });
  },

  async deleteShippingAddress(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to delete this shipping address." });
    }

    const id = typeof req.params.id === "string" ? req.params.id : "";
    await shippingService.deleteShippingAddress(id, userId);
    res.json({ message: "Shipping address deleted successfully." });
  }
};
