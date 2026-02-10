import type { Request, Response } from "express";
import { authService } from "./service.js";
import { badRequest } from "../../lib/http-errors.js";
import type { SignupInput, SigninInput } from "./types.js";

export const authController = {
  async signup(req: Request, res: Response) {
    const result = await authService.signup(req.body as SignupInput);
    res.status(201).json({ user: result.user });
  },

  async signin(req: Request, res: Response) {
    const ip = req.ip || req.socket.remoteAddress || undefined;
    const userAgent = req.get("user-agent") || undefined;

    const result = await authService.signin(req.body as SigninInput, ip, userAgent);

    res.cookie("refreshToken", result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // In production allow cross-site cookies (frontend may be on different origin).
      // In development keep Lax for easier local testing without HTTPS.
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      user: result.user,
      accessToken: result.tokens.accessToken
    });
  },

  async verifyEmail(req: Request, res: Response) {
    const body = req.body as { token: string };
    const user = await authService.verifyEmail(body.token);
    res.json({ user });
  },

  async resendVerificationEmail(req: Request, res: Response) {
    const body = req.body as { email: string };
    await authService.resendVerificationEmail(body.email);
    res.status(202).json({ message: "If an account exists with this email, a verification link has been sent." });
  },

  async forgotPassword(req: Request, res: Response) {
    const body = req.body as { email: string };
    await authService.forgotPassword(body.email);
    res.status(202).json({ message: "If an account exists with this email, a password reset link has been sent." });
  },

  async resetPassword(req: Request, res: Response) {
    const body = req.body as { token: string; newPassword: string };
    await authService.resetPassword(body.token, body.newPassword);
    res.json({ message: "Your password has been reset successfully. You can now sign in with your new password." });
  },

  async changePassword(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw badRequest("Please sign in to continue.");
    }

    const body = req.body as { currentPassword: string; newPassword: string };
    await authService.changePassword(userId, body.currentPassword, body.newPassword);
    res.json({ message: "Your password has been changed successfully." });
  },

  async refreshToken(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken as string | undefined;
    if (!refreshToken) {
      throw badRequest("Your session has expired. Please sign in again.");
    }

    const ip = req.ip || req.socket.remoteAddress || undefined;
    const userAgent = req.get("user-agent") || undefined;

    const tokens = await authService.refreshAccessToken(refreshToken, ip, userAgent);

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken: tokens.accessToken });
  },

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken as string | undefined;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie("refreshToken");
    res.json({ message: "You have been signed out successfully." });
  }
};
