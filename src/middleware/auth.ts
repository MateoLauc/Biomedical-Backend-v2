import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/auth/jwt";
import { unauthorized, forbidden } from "../lib/http-errors";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      userId: string;
      role: "super_admin" | "admin" | "customer";
      emailVerified: boolean;
    };
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
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
  } catch (err) {
    next(err);
  }
}

export function requireRole(...allowedRoles: Array<"super_admin" | "admin" | "customer">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(unauthorized("Please sign in to continue."));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(forbidden("You don't have permission to perform this action."));
    }

    next();
  };
}

export function requireEmailVerified(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(unauthorized("Please sign in to continue."));
  }

  if (!req.user.emailVerified) {
    return next(forbidden("Please verify your email address to continue."));
  }

  next();
}
