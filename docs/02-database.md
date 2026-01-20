# 02 — Database (Neon Postgres + Drizzle)

This document explains the database layer that’s implemented so far.

## Goals

- Safe, parameterized DB access (no string-concatenated SQL in app code)
- Migrations tracked in-repo and applied consistently
- Neon-friendly driver for serverless workloads

## Drizzle setup

### Key files

- `src/db/index.ts`
  - Creates the Neon HTTP SQL client:
    - `neon(env.DATABASE_URL)`
  - Wraps it in Drizzle:
    - `drizzle(sql, { schema })`
  - Exports `db` for repositories to use later.

- `src/db/schema/*`
  - Defines the database schema using Drizzle `pg-core`.
  - Currently includes:
    - `users`
    - `refresh_tokens`
    - `email_verification_tokens`
    - `password_reset_tokens`
    - `audit_logs`
    - enums: `role`, `verification_status`

- `drizzle.config.ts`
  - Drizzle Kit config (migration generator + runner).
  - Uses `DATABASE_URL` and points to:
    - schema entry: `./src/db/schema/index.ts`
    - migrations out dir: `./drizzle`

## Migrations

### Where migrations live

- `drizzle/0000_smiling_scrambler.sql` — initial migration
- `drizzle/meta/*` — Drizzle metadata used to track snapshots

### About `pgcrypto`

The migration includes:

- `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`

This enables `gen_random_uuid()` used by Drizzle for UUID defaults.

## How to generate migrations (when schema changes)

1) Update schema files in `src/db/schema/*`
2) Generate a new migration:

```bash
npm run db:generate
```

This creates a new SQL file in `drizzle/`.

## How to apply migrations (Neon or any Postgres)

Set `DATABASE_URL` to your Neon connection string, then run:

```bash
npm run db:migrate
```

## Notes for serverless

- Because this is intended for **Vercel serverless**, the DB layer uses `@neondatabase/serverless` + Drizzle’s `neon-http` adapter.
- This avoids keeping long-lived TCP connections open from serverless functions.

