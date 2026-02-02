# 12 — Rate Limiting

This document describes the API rate limiting setup.

## Overview

- **Scope:** All requests under `/api/v1/*`. `/health` is not rate limited.
- **Limit:** Per IP (or `X-Forwarded-For` when behind a proxy; app uses `trust proxy: 1`).
- **Default:** 100 requests per 15 minutes per IP.
- **Response:** When exceeded, `429 Too Many Requests` with JSON body matching the app error shape (`code: "TOO_MANY_REQUESTS"`, `message`, `requestId`).
- **Headers:** `RateLimit` header (draft-8) is set on responses so clients can see limit, remaining, and reset.

## Configuration

- **Env (optional):**
  - `RATE_LIMIT_WINDOW_MS` — Window length in milliseconds (default: `900000` = 15 min).
  - `RATE_LIMIT_MAX` — Max requests per window per IP (default: `100`).

## Behavior

- **Test:** Rate limiter is skipped when `NODE_ENV === "test"` so tests don’t hit 429.
- **Store:** In-memory (single process). For multiple instances, use a shared store (e.g. Redis) via `express-rate-limit`’s `store` option.

## Middleware

- **File:** `src/middleware/rate-limit.ts` — Exports `apiRateLimiter`.
- **Mount:** In `app.ts`, `app.use("/api/v1", apiRateLimiter)` is applied before all `/api/v1/*` route handlers.
