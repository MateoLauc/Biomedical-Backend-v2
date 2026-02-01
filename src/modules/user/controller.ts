import type { Request, Response } from "express";
import { userService } from "./service";
import type { UpdateProfileInput } from "./types";

export const userController = {
  async getMe(req: Request, res: Response) {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to view your profile." });
    }
    const user = await userService.getMe(userId);
    res.json({ user });
  },

  async updateProfile(req: Request, res: Response) {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to update your profile." });
    }
    const user = await userService.updateProfile(userId, req.body as UpdateProfileInput);
    res.json({ message: "Your profile has been updated successfully.", user });
  }
};
