import { HttpError } from "../lib/http-errors.js";
import { logger } from "../lib/logger.js";
export function errorHandler(err, req, res, _next) {
    const requestId = req.requestId;
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
