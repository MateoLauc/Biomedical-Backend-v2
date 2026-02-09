import type { Request, Response } from "express";
import { notificationsService } from "./service.js";
import type { ListNotificationsQuery } from "./types.js";

export const notificationsController = {
  async list(req: Request, res: Response) {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to view notifications." });
    }

    const q = req.query as Record<string, unknown>;
    const query: ListNotificationsQuery = {};
    if (q.unreadOnly === "true" || q.unreadOnly === true) query.unreadOnly = true;
    if (typeof q.page === "number" && q.page >= 1) query.page = q.page;
    if (typeof q.limit === "number" && q.limit >= 1 && q.limit <= 100) query.limit = q.limit;

    const result = await notificationsService.list(userId, query);
    res.json(result);
  },

  async getById(req: Request, res: Response) {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to view this notification." });
    }

    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!id) {
      return res.status(400).json({ error: "Notification ID is required." });
    }

    const notification = await notificationsService.getById(id, userId);
    res.json({ notification });
  },

  async markAsRead(req: Request, res: Response) {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to update this notification." });
    }

    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!id) {
      return res.status(400).json({ error: "Notification ID is required." });
    }

    const notification = await notificationsService.markAsRead(id, userId);
    res.json({ message: "Notification marked as read.", notification });
  },

  async markAllAsRead(req: Request, res: Response) {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to update notifications." });
    }

    const result = await notificationsService.markAllAsRead(userId);
    res.json({ message: "All notifications marked as read.", marked: result.marked });
  }
};
