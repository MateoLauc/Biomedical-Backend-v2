# 03 — File map (what lives where)

## Runtime entrypoints

- `src/server.ts` — local/dev server (listens on `PORT`)
- `src/app.ts` — Express app factory (`createApp()`)
- `api/index.ts` — Vercel serverless entrypoint (exports the Express app)
- `vercel.json` — build and output config. On Vercel, the `/api` prefix is stripped before the request reaches the app, so `app.ts` mounts routes at `/v1` when `VERCEL=1` (see `apiBase` in `app.ts`).

## Configuration

- `src/config/env.ts` — env loading + Zod validation
- `env.example` — env template you copy into `.env`

## Middleware / cross-cutting concerns

- `src/middleware/request-id.ts` — adds `x-request-id`
- `src/middleware/error-handler.ts` — centralized error handler

## Libraries

- `src/lib/logger.ts` — Pino logger with redaction
- `src/lib/http-errors.ts` — typed HTTP errors

## Database

- `src/db/index.ts` — Drizzle + Neon DB client
- `src/db/schema/*` — Drizzle schema definitions (tables/enums)
- `drizzle.config.ts` — drizzle-kit config
- `drizzle/*` — generated migrations and drizzle metadata

## Tooling

- `tsconfig.json` — TypeScript config (typecheck-only build)
- `eslint.config.js` — ESLint config for TS
- `prettier.config.cjs` — Prettier config
- `vitest.config.ts` — Vitest config

