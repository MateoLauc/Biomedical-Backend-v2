import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import type { RequestHandler } from "express";

import { corsOrigins, env, isProd } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { apiRateLimiter } from "./middleware/rate-limit.js";
import { errorHandler } from "./middleware/error-handler.js";
import { Sentry, isSentryEnabled } from "./lib/sentry.js";
import { authRoutes } from "./modules/auth/routes.js";
import { productsRoutes } from "./modules/products/routes.js";
import { cartRoutes } from "./modules/cart/routes.js";
import { shippingRoutes } from "./modules/shipping/routes.js";
import { ordersRoutes } from "./modules/orders/routes.js";
import { adminRoutes } from "./modules/admin/routes.js";
import { userRoutes } from "./modules/user/routes.js";
import { notificationsRoutes } from "./modules/notifications/routes.js";
import { careersRoutes } from "./modules/careers/routes.js";
import { blogRoutes } from "./modules/blog/routes.js";

export function createApp(): Express {
  const app = express();

  app.set("trust proxy", 1);

  app.use(requestIdMiddleware);
  app.use(pinoHttp({ logger }));

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );

  app.use(
    cors({
      origin: corsOrigins.length > 0 ? corsOrigins : false,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
      maxAge: 600
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use((cookieParser as unknown as () => RequestHandler)());

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      env: env.NODE_ENV,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  });

  // Friendly root page
  app.get("/", (_req, res) => {
    res.send(`<html>
      <head><title>Biomedical Backend</title></head>
      <body style="font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; padding:24px;">
        <h1>Biomedical Backend</h1>
        <p>Health check: <a href="/health">/health</a></p>
      </body>
    </html>`);
  });

  // On Vercel, the /api prefix is stripped before the request reaches this app, so we mount at /v1.
  // Locally (and if not behind Vercel), the full path /api/v1 is used.
  const apiBase = process.env.VERCEL === "1" ? "/v1" : "/api/v1";

  app.use(apiBase, apiRateLimiter);
  app.use(`${apiBase}/auth`, authRoutes);
  app.use(`${apiBase}/products`, productsRoutes);
  app.use(`${apiBase}/cart`, cartRoutes);
  app.use(`${apiBase}/shipping`, shippingRoutes);
  app.use(`${apiBase}/orders`, ordersRoutes);
  app.use(`${apiBase}/admin`, adminRoutes);
  app.use(`${apiBase}/users`, userRoutes);
  app.use(`${apiBase}/notifications`, notificationsRoutes);
  app.use(`${apiBase}/careers`, careersRoutes);
  app.use(`${apiBase}/blog`, blogRoutes);

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: "NOT_FOUND", message: "The page you're looking for doesn't exist." }
    });
  });

  if (!isProd) {
    logger.info({ corsOrigins }, "CORS origins loaded");
  }

  if (isSentryEnabled) {
    Sentry.setupExpressErrorHandler(app);
  }
  app.use(errorHandler);

  return app;
}

// Default export for Vercel serverless: entry must be a function or server
export default createApp();

