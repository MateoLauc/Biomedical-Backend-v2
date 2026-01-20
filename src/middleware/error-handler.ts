import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/http-errors";
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

  logger.error({ err, requestId }, "Unhandled server error");
  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
      requestId
    }
  });
}

