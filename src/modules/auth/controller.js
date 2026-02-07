import { authService } from "./service";
import { badRequest } from "../../lib/http-errors";
export const authController = {
    async signup(req, res) {
        const result = await authService.signup(req.body);
        res.status(201).json({ user: result.user });
    },
    async signin(req, res) {
        const ip = req.ip || req.socket.remoteAddress || undefined;
        const userAgent = req.get("user-agent") || undefined;
        const result = await authService.signin(req.body, ip, userAgent);
        res.cookie("refreshToken", result.tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
        res.json({
            user: result.user,
            accessToken: result.tokens.accessToken
        });
    },
    async verifyEmail(req, res) {
        const body = req.body;
        const user = await authService.verifyEmail(body.token);
        res.json({ user });
    },
    async resendVerificationEmail(req, res) {
        const body = req.body;
        await authService.resendVerificationEmail(body.email);
        res.status(202).json({ message: "If an account exists with this email, a verification link has been sent." });
    },
    async forgotPassword(req, res) {
        const body = req.body;
        await authService.forgotPassword(body.email);
        res.status(202).json({ message: "If an account exists with this email, a password reset link has been sent." });
    },
    async resetPassword(req, res) {
        const body = req.body;
        await authService.resetPassword(body.token, body.newPassword);
        res.json({ message: "Your password has been reset successfully. You can now sign in with your new password." });
    },
    async changePassword(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw badRequest("Please sign in to continue.");
        }
        const body = req.body;
        await authService.changePassword(userId, body.currentPassword, body.newPassword);
        res.json({ message: "Your password has been changed successfully." });
    },
    async refreshToken(req, res) {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            throw badRequest("Your session has expired. Please sign in again.");
        }
        const ip = req.ip || req.socket.remoteAddress || undefined;
        const userAgent = req.get("user-agent") || undefined;
        const tokens = await authService.refreshAccessToken(refreshToken, ip, userAgent);
        res.cookie("refreshToken", tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000
        });
        res.json({ accessToken: tokens.accessToken });
    },
    async logout(req, res) {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await authService.logout(refreshToken);
        }
        res.clearCookie("refreshToken");
        res.json({ message: "You have been signed out successfully." });
    }
};
