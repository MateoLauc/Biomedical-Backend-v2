import type { NextFunction, Request, Response } from "express";
import { HttpError, badRequest } from "../lib/http-errors";
import { logger } from "../lib/logger";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req as Request & { requestId?: string }).requestId;

  if (err instanceof HttpError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId }, "Unhandled server error (HttpError)");
    }
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.expose ? err.message : "Internal server error",
        requestId
      }
    });
  }

  // Handle database constraint violations
  if (err && typeof err === "object" && "message" in err) {
    const errorMessage = String(err.message);
    
    // Check for unique constraint violations
    if (errorMessage.includes("duplicate key value violates unique constraint")) {
      if (errorMessage.includes("users_email_lower_uq") || errorMessage.includes("email")) {
        logger.warn({ err, requestId }, "Database constraint violation: duplicate email");
        return res.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: "This email address is already registered. Please use a different email or sign in.",
            requestId
          }
        });
      }
      
      if (errorMessage.includes("users_phone_uq") || errorMessage.includes("phone")) {
        logger.warn({ err, requestId }, "Database constraint violation: duplicate phone number");
        return res.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: "This phone number is already registered. Please use a different phone number or sign in.",
            requestId
          }
        });
      }
      
      // Generic unique constraint violation
      logger.warn({ err, requestId }, "Database constraint violation: duplicate value");
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "This information is already in use. Please use different values.",
          requestId
        }
      });
    }
  }

  logger.error({ err, requestId }, "Unhandled server error");
  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
      requestId
    }
  });
}

