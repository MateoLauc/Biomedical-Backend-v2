import "./lib/sentry";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { createApp } from "./app";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "HTTP server listening");
});

