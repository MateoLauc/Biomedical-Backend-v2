# 01 — Scaffold (Express + TypeScript)

This document explains what was scaffolded and why.

## Goals

- Production-friendly Express API foundation
- Strict configuration validation (fail-fast on missing env vars)
- Standardized error responses (no accidental stack traces in prod)
- Security headers + CORS + request size limits
- Works on **Vercel serverless** via `api/index.ts`

## Key files

### App composition

- `src/app.ts`
  - Creates the Express app.
  - Adds:
    - request-id middleware
    - HTTP request logging (Pino)
    - security headers (Helmet)
    - CORS allowlist support
    - JSON/body parsing with size limits
  - Defines:
    - `GET /health`
    - a default 404 handler
    - a centralized error handler

- `src/server.ts`
  - Local/dev server entrypoint (listens on `PORT`).

### Vercel serverless entrypoint

- `api/index.ts`
  - Exports the Express app as a Vercel handler (Vercel can invoke the Express function directly).

- `vercel.json`
  - Rewrites all paths to `/api`, so `GET /health` works as expected when deployed.

### Environment validation

- `src/config/env.ts`
  - Loads environment variables via `dotenv`.
  - Validates and parses them using **Zod**.
  - Exposes:
    - `env` — validated env values
    - `corsOrigins` — parsed list from `CORS_ORIGINS`
    - helpers `isProd`, `isTest`

- `env.example`
  - Template for required env variables.
  - You should copy to `.env` locally (create `.env` manually).

### Logging and errors

- `src/lib/logger.ts`
  - Pino logger with **redaction** for sensitive fields (auth headers, password fields, tokens).

- `src/lib/http-errors.ts`
  - A small `HttpError` class + helpers (`badRequest`, `unauthorized`, etc.).
  - Used so we can consistently send safe error responses.

- `src/middleware/error-handler.ts`
  - One centralized error handler.
  - Emits a stable JSON error shape:
    - `{ error: { code, message, requestId } }`

- `src/middleware/request-id.ts`
  - Adds a `requestId` to each request and echoes it in `x-request-id`.
  - Useful for correlating logs with client errors.

## Scripts you can run

From `package.json`:

- `npm run dev` — run the server with hot reload (tsx)
- `npm run build` — TypeScript typecheck (`--noEmit`)
- `npm run lint` — eslint
- `npm run format` — prettier

## Quick smoke test

1) Install dependencies (local cache is used in this repo to avoid global npm cache permission issues):

```bash
npm install --cache ./npm-cache
```

2) Create a `.env` (copy values from `env.example`) and set minimum required values:

```bash
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=some_long_secret_16+chars
JWT_REFRESH_SECRET=some_long_secret_16+chars
```

3) Run:

```bash
npm run dev
```

4) Test:

- `GET http://localhost:4000/health`

