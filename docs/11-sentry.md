# 11 — Sentry (Error Monitoring)

This document describes the Sentry integration for error monitoring and performance tracing.

## Overview

- **Error monitoring** — Unhandled exceptions and errors passed to Express error handlers are captured and sent to Sentry when `SENTRY_DSN` is set.
- **Request context** — Sentry’s Express error handler attaches request data (URL, method, etc.) to events.
- **Tracing** — Optional; `tracesSampleRate` is set (0.1 in production, 1.0 in development) for performance sampling.

## Configuration

- **Env:** `SENTRY_DSN` (optional). If unset, Sentry is not initialized and no events are sent.
- **Init:** `src/lib/sentry.ts` — Initializes Sentry as soon as the app loads (imported first in `server.ts`).
- **Express:** `Sentry.setupExpressErrorHandler(app)` is registered in `app.ts` before the app’s own error handler, so Sentry captures errors and then passes them to the JSON error responder.

## Flow

1. `server.ts` imports `./lib/sentry` first so Sentry runs before any other app code.
2. If `SENTRY_DSN` is set, `Sentry.init()` runs with `environment`, `tracesSampleRate`, etc.
3. In `createApp()`, after all routes, `Sentry.setupExpressErrorHandler(app)` is added when Sentry is enabled.
4. When an error is passed to `next(err)`, Sentry’s handler captures it and calls `next(err)`; the app’s error handler then sends the JSON response.

## Optional: Manual capture

You can report errors manually:

```ts
import { Sentry, isSentryEnabled } from "../lib/sentry";

if (isSentryEnabled) {
  Sentry.captureException(err);
  // or Sentry.captureMessage("Something went wrong");
}
```

## Source maps (optional)

For readable stack traces in Sentry, upload source maps (e.g. with `npx @sentry/wizard@latest -i sourcemaps` or your build pipeline).
