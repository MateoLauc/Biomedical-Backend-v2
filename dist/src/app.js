import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { corsOrigins, env, isProd } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { errorHandler } from "./middleware/error-handler.js";
export function createApp() {
    const app = express();
    app.set("trust proxy", 1);
    app.use(requestIdMiddleware);
    app.use(pinoHttp({ logger }));
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));
    app.use(cors({
        origin: corsOrigins.length > 0 ? corsOrigins : false,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
        maxAge: 600
    }));
    app.use(express.json({ limit: "1mb" }));
    app.use(express.urlencoded({ extended: true, limit: "1mb" }));
    app.get("/health", (_req, res) => {
        res.json({
            ok: true,
            env: env.NODE_ENV,
            uptimeSeconds: Math.floor(process.uptime()),
            timestamp: new Date().toISOString()
        });
    });
    app.use((_req, res) => {
        res.status(404).json({
            error: { code: "NOT_FOUND", message: "Route not found" }
        });
    });
    if (!isProd) {
        logger.info({ corsOrigins }, "CORS origins loaded");
    }
    app.use(errorHandler);
    return app;
}
