# 08 — Orders Module

This document explains the orders implementation, including order creation from cart, status management, and Paystack payment integration.

## Overview

The orders module provides:
- Create order from cart (with Paystack payment initialization)
- List orders (with filters and pagination)
- Get a single order with items
- Verify payment (manual verification by reference)
- Update order status (admin only)
- Cancel order (with reason)
- Paystack webhook (signature-verified, no auth)

## Architecture

Following the modular pattern:
- `src/modules/orders/routes.ts` — HTTP route definitions (webhook before auth)
- `src/modules/orders/controller.ts` — Request/response handling
- `src/modules/orders/service.ts` — Business logic (cart validation, stock, approval policy, Paystack)
- `src/modules/orders/repo.ts` — Database operations
- `src/modules/orders/schema.ts` — Zod validation schemas
- `src/modules/orders/types.ts` — TypeScript types
- `src/lib/payments/paystack.ts` — Paystack API (initialize, verify, webhook signature)

## Database Schema

### Orders (`src/db/schema/orders.ts`)
- `id` — UUID primary key
- `userId` — Foreign key to users (restrict delete)
- `shippingAddressId` — Foreign key to shipping_addresses (restrict delete)
- `orderNumber` — Unique text (e.g. `ORD-20260120-ABC123`)
- `status` — Enum: `pending`, `processing`, `shipped`, `delivered`, `cancelled`
- `paymentStatus` — Enum: `pending`, `paid`, `failed`, `refunded`
- `paymentMethod` — Text (default `paystack`)
- `paymentReference` — Paystack reference (nullable)
- `paymentId` — Paystack payment ID after verification (nullable)
- `subtotal`, `shippingFee`, `total` — Decimal (snapshot at order time)
- `notes` — Optional customer/admin notes
- `cancelledAt`, `cancelledReason` — Set when order is cancelled
- `createdAt`, `updatedAt` — Timestamps

**Indexes:** `userId`, `orderNumber`, `status`, `paymentStatus`, `paymentReference`, `createdAt`

### Order Items (`src/db/schema/order-items.ts`)
- `id` — UUID primary key
- `orderId` — Foreign key to orders (cascade delete)
- `productVariantId` — Foreign key to product_variants (restrict delete)
- `productName`, `productSlug`, `packSize` — Snapshot at order time
- `price` — Price at order time (decimal)
- `quantity` — Integer
- `createdAt`, `updatedAt` — Timestamps

**Indexes:** `orderId`, `productVariantId`

## API Endpoints

Base path: `/api/v1/orders`.

### `POST /` (create order from cart)

**Auth:** Required.

**Body:**
```json
{
  "shippingAddressId": "uuid-of-shipping-address",
  "notes": "Please deliver before 5pm",
  "callbackUrl": "https://yoursite.com/orders/thank-you"
}
```

- `shippingAddressId` — Required, UUID of a shipping address belonging to the user.
- `notes` — Optional, max 1000 characters.
- `callbackUrl` — Optional, URL for Paystack to redirect after payment.

**Validation:**
- Cart must not be empty.
- All cart items must have valid, active variants and sufficient stock.
- Products that require approval must be allowed by the user’s verification status (see purchase policy).
- Shipping address must belong to the user.

**Flow:**
1. Validate cart and build order lines (subtotal from variant prices).
2. Generate unique `orderNumber`, create order and order items.
3. Decrement variant stock, then clear cart.
4. Initialize Paystack payment (amount in kobo, reference = `orderNumber`, metadata includes `orderId`, `userId`, `orderNumber`).
5. Store `paymentReference` on the order and return order + payment URLs.

**Response (201):**
```json
{
  "message": "Order created successfully. Please proceed to payment.",
  "order": {
    "id": "uuid",
    "userId": "uuid",
    "shippingAddressId": "uuid",
    "orderNumber": "ORD-20260120-ABC123",
    "status": "pending",
    "paymentStatus": "pending",
    "paymentMethod": "paystack",
    "paymentReference": "ORD-20260120-ABC123",
    "subtotal": "15000.00",
    "shippingFee": "0.00",
    "total": "15000.00",
    "notes": "Please deliver before 5pm",
    "items": [
      {
        "id": "uuid",
        "productName": "Product A",
        "productSlug": "product-a",
        "packSize": "500ml",
        "price": "5000.00",
        "quantity": 2
      }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  },
  "paymentReference": "ORD-20260120-ABC123",
  "authorizationUrl": "https://checkout.paystack.com/..."
}
```

**Client:** Redirect the user to `authorizationUrl` to complete payment. Optionally use `callbackUrl` as Paystack’s redirect URL after payment.

---

### `GET /` (list orders)

**Auth:** Required.

**Query (optional):**
- `status` — Filter by order status: `pending`, `processing`, `shipped`, `delivered`, `cancelled`.
- `paymentStatus` — Filter by payment status: `pending`, `paid`, `failed`, `refunded`.
- `page` — Page number (default 1).
- `limit` — Items per page, 1–100 (default 20).

**Behavior:**
- **Customer:** Sees only their own orders.
- **Admin / Super admin:** Sees all orders (no user filter).

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "orderNumber": "ORD-20260120-ABC123",
      "status": "processing",
      "paymentStatus": "paid",
      "total": "15000.00",
      "items": [ ... ],
      "createdAt": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### `GET /verify-payment` (verify payment by reference)

**Auth:** Required.

**Query:**
- `reference` — Required. Paystack transaction reference (same as `orderNumber` or the reference returned at order creation).

**Behavior:**
- Calls Paystack’s verify API for the given reference.
- Finds order by `paymentReference`, updates `paymentStatus` (and optionally `paymentId`).
- If payment is successful and order is still `pending`, status is set to `processing`.
- **Customer:** Can only verify orders belonging to them.
- **Admin / Super admin:** Can verify any order.

**Response (200):**
```json
{
  "message": "Payment verified successfully.",
  "order": {
    "id": "uuid",
    "orderNumber": "ORD-20260120-ABC123",
    "status": "processing",
    "paymentStatus": "paid",
    "items": [ ... ],
    ...
  }
}
```

Use this after redirect from Paystack (e.g. on your thank-you page) to refresh order and payment status.

---

### `GET /:id` (get single order)

**Auth:** Required.

**Behavior:**
- **Customer:** Can only access their own orders (404 otherwise).
- **Admin / Super admin:** Can access any order.

**Response (200):** Single order object with `items` array (same shape as in list/create responses).

---

### `PATCH /:id/status` (update order status)

**Auth:** Required. **Role:** `super_admin` or `admin` only.

**Body:**
```json
{
  "status": "processing",
  "notes": "Packed and handed to courier"
}
```

- `status` — Required. One of: `pending`, `processing`, `shipped`, `delivered`, `cancelled`.
- `notes` — Optional, max 1000 characters.

**Behavior:**
- Valid status transitions are enforced (e.g. cannot move from `cancelled` back to `processing`).
- Response returns the updated order with items.

**Response (200):**
```json
{
  "message": "Order status updated successfully.",
  "order": { ... }
}
```

---

### `POST /:id/cancel` (cancel order)

**Auth:** Required.

**Body:**
```json
{
  "reason": "Customer requested cancellation - duplicate order"
}
```

- `reason` — Required, 5–500 characters.

**Behavior:**
- Only orders that can be cancelled (e.g. not already shipped/delivered/cancelled) are updated; otherwise an error is returned.
- **Customer:** Can only cancel their own orders.
- **Admin / Super admin:** Can cancel any cancellable order.
- Sets `status` to `cancelled`, `cancelledAt` to now, and `cancelledReason` to the provided reason.

**Response (200):**
```json
{
  "message": "Order cancelled successfully.",
  "order": { ... }
}
```

---

### `POST /webhook` (Paystack webhook)

**Auth:** None. **Verification:** Paystack signature via `x-paystack-signature` (HMAC SHA512 of raw body using `PAYSTACK_WEBHOOK_SECRET`).

**Behavior:**
- Request body must be the raw JSON payload (same as sent by Paystack). Signature is computed over this raw body.
- If signature is invalid, respond with 401.
- If signature is valid, process event and always respond 200 so Paystack does not retry unnecessarily.

**Handled events:**
- `charge.success` — Find order by `data.reference` (payment reference). Set `paymentStatus` to `paid`, store Paystack payment ID if needed. If order status is `pending`, set to `processing`.
- `charge.failed` — Find order by reference, set `paymentStatus` to `failed`.

**Response:** Always `200` with body e.g. `{ "received": true }` after processing (or after acknowledging but logging any processing error).

**Configuration:** Set `PAYSTACK_WEBHOOK_SECRET` in Paystack dashboard (Webhook URL: `https://your-api.com/api/v1/orders/webhook`).

## Business Logic

### Order creation
- Order number format: `ORD-YYYYMMDD-<random>` (unique).
- Subtotal = sum of (variant price × quantity) for each cart line; shipping fee default 0.
- Order and order items are created in a single flow; then stock is decremented and cart cleared.
- Paystack is initialized with amount in **kobo** (total × 100), reference = order number, and metadata for reconciliation.

### Purchase policy
- Products that require approval can only be purchased if the user’s verification status allows it (see auth/purchase policy). Otherwise creation fails with a clear message.

### Stock
- Creation checks sufficient stock for each variant; if any variant has insufficient stock, the request fails and no order is created, no cart change.

### Status transitions
- Only valid transitions are allowed (e.g. pending → processing → shipped → delivered; or to cancelled where applicable). Cancelled orders are not moved back to other statuses.

### Scoping
- Customers see and act only on their own orders. Admins and super admins see all orders and can update status and cancel any order.

## Paystack Integration

### Initialize (`src/lib/payments/paystack.ts`)
- `initializePayment({ email, amount, reference, callback_url?, metadata? })` — Calls Paystack `POST /transaction/initialize`, returns `authorization_url` and `reference`.
- Amount must be in kobo. Reference should be unique (we use `orderNumber`).

### Verify
- `verifyPayment(reference)` — Calls Paystack `GET /transaction/verify/:reference`. Used by `GET /verify-payment` to update order payment status and optionally move order to `processing`.

### Webhook
- `verifyPaystackWebhook(payload, signature)` — Computes HMAC SHA512 of `payload` with `PAYSTACK_WEBHOOK_SECRET` and compares to `signature`. Used in `POST /webhook` before processing events.

**Environment:**
- `PAYSTACK_SECRET_KEY` — Required for initialize and verify.
- `PAYSTACK_WEBHOOK_SECRET` — Required for webhook signature verification.

## Validation

- **Create:** `shippingAddressId` UUID; `notes` max 1000 chars; `callbackUrl` valid URL if present.
- **Update status:** `status` one of the five values; `notes` max 1000 chars.
- **Cancel:** `reason` 5–500 characters.
- **List:** `status` and `paymentStatus` optional, must be valid enum values; `page` ≥ 1; `limit` 1–100.

## Error Handling

User-friendly messages for:
- Empty cart
- Invalid or inactive variant / insufficient stock
- Purchase not allowed (approval requirement)
- Shipping address not found or not owned by user
- Order not found
- Invalid payment reference
- Invalid or disallowed status transition
- Unauthorized or forbidden (e.g. customer accessing another user’s order or admin-only action)

Errors from Paystack (e.g. initialize or verify) are mapped to clear, user-facing messages where possible.
