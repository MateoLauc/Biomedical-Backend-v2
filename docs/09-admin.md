# 09 — Admin Module

This document describes the admin-only endpoints for user management, dashboard stats, and inventory overview.

## Overview

The admin module provides:
- **List users** — Paginated list with filters (role, verification status)
- **Dashboard** — Totals (users, products, orders), revenue, pending verifications, low stock count, orders by status
- **Inventory overview** — Product counts: total, available, out of stock, low stock

**Access:** All admin endpoints require authentication and the role `super_admin` or `admin`. Customers receive 403 Forbidden.

## Architecture

- `src/modules/admin/routes.ts` — Routes under `/api/v1/admin`, protected by `requireAuth` and `requireRole("super_admin", "admin")`
- `src/modules/admin/controller.ts` — Request/response handling
- `src/modules/admin/service.ts` — Permission checks and orchestration (uses auth, products, orders repos)
- `src/modules/admin/schema.ts` — Zod query validation for list users
- `src/modules/admin/types.ts` — Types for dashboard, inventory, list-users response

Supporting repo methods (used by admin service):
- `src/modules/auth/repo.ts` — `listUsers`, `countUsers`, `countPendingVerifications`
- `src/modules/products/repo.ts` — `countProducts`, `getInventoryCounts`
- `src/modules/orders/repo.ts` — `countOrders`, `getRevenueTotal`

## API Endpoints

Base path: `/api/v1/admin`. All require `Authorization` (Bearer token) and role `super_admin` or `admin`.

### `GET /users` — List users

**Query (optional):**
- `role` — Filter by role: `super_admin`, `admin`, `customer`
- `identityVerified` — Filter by identity (email) verification: `true`, `false`
- `businessLicenseStatus` — Filter by business license: `not_submitted`, `pending`, `approved`, `rejected`
- `prescriptionAuthorityStatus` — Filter by prescription authority: `not_submitted`, `pending`, `approved`, `rejected`
- `page` — Page number (default 1)
- `limit` — Items per page, 1–100 (default 20)

**Response (200):**
```json
{
  "users": [
    {
      "id": "uuid",
      "role": "customer",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@example.com",
      "emailVerifiedAt": "2026-01-20T...",
      "identityVerified": true,
      "businessLicenseStatus": "pending",
      "prescriptionAuthorityStatus": "not_submitted",
      "whoYouAre": "Pharmacist",
      "countryOfPractice": "Nigeria",
      "phoneNumber": "+234...",
      "createdAt": "2026-01-20T...",
      "updatedAt": "2026-01-20T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

**Note:** `passwordHash` is never returned. Other sensitive fields can be excluded or redacted in future.

### `GET /dashboard` — Dashboard stats

Returns aggregate counts and revenue for the admin dashboard.

**Response (200):**
```json
{
  "totalUsers": 150,
  "totalProducts": 85,
  "totalOrders": 320,
  "revenue": 1250000.50,
  "pendingVerifications": 12,
  "lowStockCount": 5,
  "ordersByStatus": {
    "pending": 10,
    "processing": 8,
    "shipped": 5,
    "delivered": 290,
    "cancelled": 7
  }
}
```

- **totalUsers** — Count of all users
- **totalProducts** — Count of all products
- **totalOrders** — Count of all orders
- **revenue** — Sum of `orders.total` where `paymentStatus` is `paid`
- **pendingVerifications** — Count of users with `businessLicenseStatus = 'pending'` or `prescriptionAuthorityStatus = 'pending'`
- **lowStockCount** — Count of products where `stockQuantity > 0` and `stockQuantity <= lowStockThreshold`
- **ordersByStatus** — Count of orders per status

### `GET /inventory` — Inventory overview

Returns product counts by stock level.

**Response (200):**
```json
{
  "total": 85,
  "available": 80,
  "outOfStock": 5,
  "lowStock": 5
}
```

- **total** — All products
- **available** — Products with `stockQuantity > 0` (total minus out of stock)
- **outOfStock** — Products with `stockQuantity = 0`
- **lowStock** — Products with `0 < stockQuantity <= lowStockThreshold` (subset of available)

## Business Logic

### User listing
- Uses `authRepo.listUsers` with optional filters; selects only safe fields (no password hash).
- Count uses same filters for pagination total.
- Results ordered by `createdAt` descending.

### Pending verifications
- Users with either `businessLicenseStatus = 'pending'` or `prescriptionAuthorityStatus = 'pending'` are counted once (not double-counted if both are pending).

### Inventory counts
- **Available** = total products minus out-of-stock (product-level `stockQuantity`).
- **Low stock** = products where stock is positive but at or below `lowStockThreshold`.

### Revenue
- Sum of `orders.total` where `paymentStatus = 'paid'`. Decimal values summed in DB and returned as a number.

## Validation

### List users query
- `role` — If present, must be `super_admin`, `admin`, or `customer`
- `identityVerified` — If present, must be `true` or `false` (string)
- `businessLicenseStatus`, `prescriptionAuthorityStatus` — If present, must be `not_submitted`, `pending`, `approved`, or `rejected`
- `page` — Integer ≥ 1
- `limit` — Integer 1–100

## Error Handling

- **401** — Not authenticated
- **403** — Authenticated but not `super_admin` or `admin` (e.g. customer)
- **400** — Invalid query (validation errors with user-friendly messages)
