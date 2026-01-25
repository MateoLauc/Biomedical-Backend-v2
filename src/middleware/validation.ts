import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { badRequest } from "../lib/http-errors";

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errorMessages = err.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        throw badRequest(`Validation error: ${errorMessages}`);
      }
      next(err);
    }
  };
}
