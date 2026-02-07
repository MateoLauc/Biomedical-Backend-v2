import { verifyAccessToken } from "../lib/auth/jwt";
import { unauthorized, forbidden } from "../lib/http-errors";
export async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw unauthorized("Please sign in to access this resource.");
        }
        const token = authHeader.substring(7);
        const payload = await verifyAccessToken(token);
        req.user = {
            userId: payload.userId,
            role: payload.role,
            emailVerified: payload.emailVerified
        };
        next();
    }
    catch (err) {
        next(err);
    }
}
export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(unauthorized("Please sign in to continue."));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(forbidden("You don't have permission to perform this action."));
        }
        next();
    };
}
export function requireEmailVerified(req, res, next) {
    if (!req.user) {
        return next(unauthorized("Please sign in to continue."));
    }
    if (!req.user.emailVerified) {
        return next(forbidden("Please verify your email address to continue."));
    }
    next();
}
