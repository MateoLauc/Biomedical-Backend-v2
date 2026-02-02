import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import type { RequestHandler } from "express";

import { corsOrigins, env, isProd } from "./config/env";
import { logger } from "./lib/logger";
import { requestIdMiddleware } from "./middleware/request-id";
import { apiRateLimiter } from "./middleware/rate-limit";
import { errorHandler } from "./middleware/error-handler";
import { Sentry, isSentryEnabled } from "./lib/sentry";
import { authRoutes } from "./modules/auth/routes";
import { productsRoutes } from "./modules/products/routes";
import { cartRoutes } from "./modules/cart/routes";
import { shippingRoutes } from "./modules/shipping/routes";
import { ordersRoutes } from "./modules/orders/routes";
import { adminRoutes } from "./modules/admin/routes";
import { userRoutes } from "./modules/user/routes";
import { notificationsRoutes } from "./modules/notifications/routes";
import { careersRoutes } from "./modules/careers/routes";
import { blogRoutes } from "./modules/blog/routes";

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

  app.use("/api/v1", apiRateLimiter);
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/products", productsRoutes);
  app.use("/api/v1/cart", cartRoutes);
  app.use("/api/v1/shipping", shippingRoutes);
  app.use("/api/v1/orders", ordersRoutes);
  app.use("/api/v1/admin", adminRoutes);
  app.use("/api/v1/users", userRoutes);
  app.use("/api/v1/notifications", notificationsRoutes);
  app.use("/api/v1/careers", careersRoutes);
  app.use("/api/v1/blog", blogRoutes);

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

