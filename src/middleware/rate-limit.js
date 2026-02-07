import { rateLimit } from "express-rate-limit";
import { env, isTest } from "../config/env";
const windowMs = env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000; // 15 minutes
const max = env.RATE_LIMIT_MAX ?? 100; // requests per window per IP
export const apiRateLimiter = rateLimit({
    windowMs,
    limit: max,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => isTest,
    handler: (req, res, _next) => {
        const requestId = req.requestId;
        res.status(429).json({
            error: {
                code: "TOO_MANY_REQUESTS",
                message: "Too many requests. Please try again later.",
                requestId
            }
        });
    }
});
