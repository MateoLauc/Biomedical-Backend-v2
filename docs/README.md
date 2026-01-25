# Docs (what's implemented so far)

This folder explains **everything implemented so far** in this backend repo, so you can review/understand before we move to the next module.

## Contents

- [`01-scaffold.md`](01-scaffold.md) — Express + TypeScript scaffold, security middleware, `/health`, Vercel entrypoint, scripts
- [`02-database.md`](02-database.md) — Neon + Drizzle ORM wiring, schema files, and how migrations work
- [`03-file-map.md`](03-file-map.md) — quick "what lives where" map of the current codebase
- [`04-auth-rbac.md`](04-auth-rbac.md) — Authentication flows, JWT tokens, RBAC middleware, purchase policy gating

## Current status

- ✅ Scaffold (Express + TS) is running with `GET /health`
- ✅ Drizzle schema exists + initial migration generated in `drizzle/`
- ✅ Auth + RBAC module complete (signup, signin, email verification, password reset/change, refresh tokens, RBAC middleware)
- ⏭️ Next planned module: **Products/Catalog + Cart** (we will pause again for testing when done)
