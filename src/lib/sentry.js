import * as Sentry from "@sentry/node";
import { env } from "../config/env";
const dsn = env.SENTRY_DSN;
if (dsn) {
    Sentry.init({
        dsn,
        environment: env.NODE_ENV,
        enabled: true,
        tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0
    });
}
export const isSentryEnabled = Boolean(dsn);
export { Sentry };
