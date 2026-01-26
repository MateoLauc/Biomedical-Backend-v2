# Docs (what's implemented so far)

This folder explains **everything implemented so far** in this backend repo, so you can review/understand before we move to the next module.

## Contents

- [`01-scaffold.md`](01-scaffold.md) — Express + TypeScript scaffold, security middleware, `/health`, Vercel entrypoint, scripts
- [`02-database.md`](02-database.md) — Neon + Drizzle ORM wiring, schema files, and how migrations work
- [`03-file-map.md`](03-file-map.md) — quick "what lives where" map of the current codebase
- [`04-auth-rbac.md`](04-auth-rbac.md) — Authentication flows, JWT tokens, RBAC middleware, purchase policy gating
- [`05-products-catalog.md`](05-products-catalog.md) — Products, categories, variants, hierarchical categories, stock management
- [`06-cart.md`](06-cart.md) — Shopping cart operations, quantity management, product details
- [`07-shipping-addresses.md`](07-shipping-addresses.md) — Shipping address CRUD, default address management

## Current status

- ✅ Scaffold (Express + TS) is running with `GET /health`
- ✅ Drizzle schema exists + migrations organized in `drizzle/migrations/`
- ✅ Auth + RBAC module complete (signup, signin, email verification, password reset/change, refresh tokens, RBAC middleware)
- ✅ Products & Catalog module complete (categories, products, variants, hierarchical structure, stock management)
- ✅ Cart module complete (add, update, remove items, quantity merging, product details)
- ✅ Shipping Addresses module complete (CRUD operations, default address management)
- ⏭️ Next planned module: **Orders + Paystack Integration** (order creation, payment processing, order management)
