# Docs (what’s implemented so far)

This folder explains **everything implemented so far** in this backend repo, so you can review/understand before we move to the next module.

## Contents

- [`01-scaffold.md`](01-scaffold.md) — Express + TypeScript scaffold, security middleware, `/health`, Vercel entrypoint, scripts
- [`02-database.md`](02-database.md) — Neon + Drizzle ORM wiring, schema files, and how migrations work
- [`03-file-map.md`](03-file-map.md) — quick “what lives where” map of the current codebase

## Current status

- ✅ Scaffold (Express + TS) is running with `GET /health`
- ✅ Drizzle schema exists + initial migration generated in `drizzle/`
- ⏭️ Next planned module: **Auth + RBAC** (we will pause again for testing when done)

