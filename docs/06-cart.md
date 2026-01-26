# 06 — Cart Module

This document explains the shopping cart implementation.

## Overview

The cart module provides:
- Add items to cart
- Update item quantities
- Remove items from cart
- Clear entire cart
- View cart with full product details
- Automatic quantity merging for duplicate items

## Architecture

Following the modular pattern:
- `src/modules/cart/routes.ts` - HTTP route definitions
- `src/modules/cart/controller.ts` - Request/response handling
- `src/modules/cart/service.ts` - Business logic
- `src/modules/cart/repo.ts` - Database operations
- `src/modules/cart/schema.ts` - Zod validation schemas
- `src/modules/cart/types.ts` - TypeScript types

## Database Schema

### Cart Items (`src/db/schema/cart-items.ts`)
- `id` - UUID primary key
- `userId` - Foreign key to users (cascade delete)
- `productVariantId` - Foreign key to product variants (cascade delete)
- `quantity` - Integer quantity (default: 1, max: 100)
- `createdAt`, `updatedAt` - Timestamps

**Constraints:**
- Unique composite index on `(userId, productVariantId)` - prevents duplicate items per user
- Cascade delete when user or product variant is deleted

## API Endpoints

All endpoints are under `/api/v1/cart` and require authentication:

### `GET /`
Get user's cart with full product details.

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "userId": "uuid",
      "productVariantId": "uuid",
      "quantity": 2,
      "createdAt": "2026-01-20T...",
      "updatedAt": "2026-01-20T...",
      "productVariant": {
        "id": "uuid",
        "productId": "uuid",
        "packSize": "500mls",
        "price": "25.00",
        "stockQuantity": 50,
        "isActive": true,
        "product": {
          "id": "uuid",
          "name": "Bioflex 0.9% Normal Saline",
          "slug": "bioflex-0-9-normal-saline",
          "description": "...",
          "requiresApproval": false,
          "isActive": true
        }
      }
    }
  ],
  "totalItems": 5
}
```

**Note:** `totalItems` is the sum of all quantities, not the count of unique items.

### `POST /`
Add item to cart.

**Body:**
```json
{
  "productVariantId": "uuid",
  "quantity": 2
}
```

**Behavior:**
- If item already exists in cart, quantities are merged (added together)
- If merged quantity exceeds 100, returns error
- Validates that product variant exists and is active
- Returns user-friendly error if variant not found

**Response:**
```json
{
  "message": "Item added to cart successfully.",
  "item": {
    "id": "uuid",
    "productVariantId": "uuid",
    "quantity": 2
  }
}
```

### `PATCH /:id`
Update cart item quantity.

**Body:**
```json
{
  "quantity": 3
}
```

**Validation:**
- Quantity must be between 1 and 100
- Item must belong to the authenticated user

**Response:**
```json
{
  "message": "Cart item updated successfully.",
  "item": {
    "id": "uuid",
    "quantity": 3
  }
}
```

### `DELETE /:id`
Remove a specific item from cart.

**Response:**
```json
{
  "message": "Item removed from cart successfully."
}
```

### `DELETE /`
Clear entire cart (remove all items).

**Response:**
```json
{
  "message": "Cart cleared successfully."
}
```

## Business Logic

### Quantity Merging
When adding an item that already exists in the cart:
- Existing quantity is retrieved
- New quantity is added to existing
- If total exceeds 100, error is returned
- Otherwise, item is updated with new total

### Product Variant Validation
Before adding to cart:
- Verifies product variant exists
- Checks variant is active (`isActive: true`)
- Returns user-friendly error if unavailable

### User Scoping
- All cart operations are scoped to the authenticated user
- Users can only access their own cart items
- `userId` is automatically set from JWT token

### Quantity Limits
- Minimum quantity: 1
- Maximum quantity: 100 per item
- Enforced at both add and update operations

## Data Flow

1. **Add to Cart:**
   - Validate product variant exists and is active
   - Check if item already in cart
   - If exists: merge quantities (with max check)
   - If new: create cart item
   - Return success with item details

2. **Get Cart:**
   - Fetch all cart items for user
   - Join with product variants and products
   - Calculate total items (sum of quantities)
   - Return formatted response with full product details

3. **Update/Delete:**
   - Verify item belongs to user
   - Perform operation
   - Return success message

## Validation

- `productVariantId` - Must be valid UUID
- `quantity` - Integer between 1 and 100
- All operations require authentication

## Error Handling

User-friendly error messages for:
- Product variant not found or inactive
- Quantity exceeds maximum (100)
- Cart item not found
- Unauthorized access attempts
