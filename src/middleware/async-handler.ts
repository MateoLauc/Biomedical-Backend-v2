import type { Request, Response, NextFunction } from "express";

/**
 * Wraps async route handlers so that rejected promises (e.g. thrown HttpError)
 * are passed to next(err) and handled by the global error handler.
 * Without this, Express does not catch async errors and they become unhandled rejections (500).
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
