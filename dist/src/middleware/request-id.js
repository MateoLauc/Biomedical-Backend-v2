import crypto from "node:crypto";
export function requestIdMiddleware(req, res, next) {
    const existing = req.header("x-request-id");
    const requestId = existing?.trim() || crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    next();
}
