# 07 — Shipping Addresses Module

This document explains the shipping addresses implementation.

## Overview

The shipping addresses module provides:
- Create shipping addresses
- List user's shipping addresses
- Update shipping addresses
- Delete shipping addresses
- Default address management (only one default per user)

## Architecture

Following the modular pattern:
- `src/modules/shipping/routes.ts` - HTTP route definitions
- `src/modules/shipping/controller.ts` - Request/response handling
- `src/modules/shipping/service.ts` - Business logic
- `src/modules/shipping/repo.ts` - Database operations
- `src/modules/shipping/schema.ts` - Zod validation schemas
- `src/modules/shipping/types.ts` - TypeScript types

## Database Schema

### Shipping Addresses (`src/db/schema/shipping-addresses.ts`)
- `id` - UUID primary key
- `userId` - Foreign key to users (cascade delete)
- `firstName` - Recipient first name
- `lastName` - Recipient last name
- `phoneNumber` - Primary phone number (validated)
- `additionalPhoneNumber` - Optional secondary phone number
- `deliveryAddress` - Full delivery address (5-500 characters)
- `additionalInformation` - Optional delivery instructions
- `region` - Delivery region/state
- `message` - Optional message for delivery
- `isDefault` - Boolean flag (only one default per user)
- `createdAt`, `updatedAt` - Timestamps

**Constraints:**
- Index on `userId` for fast lookups
- Cascade delete when user is deleted

## API Endpoints

All endpoints are under `/api/v1/shipping` and require authentication:

### `GET /`
List all shipping addresses for the authenticated user.

**Response:**
```json
{
  "addresses": [
    {
      "id": "uuid",
      "userId": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "+1234567890",
      "additionalPhoneNumber": "+1234567891",
      "deliveryAddress": "123 Main St, Apartment 4B",
      "additionalInformation": "Ring doorbell twice",
      "region": "Lagos",
      "message": "Please call before delivery",
      "isDefault": true,
      "createdAt": "2026-01-20T...",
      "updatedAt": "2026-01-20T..."
    }
  ]
}
```

**Note:** Addresses are sorted with default address first, then by creation date (newest first).

### `GET /:id`
Get a specific shipping address by ID.

**Response:** Single address object (same structure as above).

### `POST /`
Create a new shipping address.

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "additionalPhoneNumber": "+1234567891", // Optional
  "deliveryAddress": "123 Main St, Apartment 4B",
  "additionalInformation": "Ring doorbell twice", // Optional
  "region": "Lagos",
  "message": "Please call before delivery", // Optional
  "isDefault": true // Optional, defaults to false
}
```

**Validation:**
- `firstName`, `lastName` - Required, max 100 characters
- `phoneNumber` - Required, must match phone regex pattern
- `additionalPhoneNumber` - Optional, must match phone regex if provided
- `deliveryAddress` - Required, 5-500 characters
- `additionalInformation` - Optional, max 500 characters
- `region` - Required, max 100 characters
- `message` - Optional, max 1000 characters

**Behavior:**
- If `isDefault: true`, all other addresses for the user are set to `isDefault: false`
- Ensures only one default address per user

**Response:**
```json
{
  "message": "Shipping address added successfully.",
  "address": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    // ... full address object
  }
}
```

### `PATCH /:id`
Update a shipping address.

**Body:** Same as POST, but all fields are optional (partial update).

**Behavior:**
- If updating `isDefault` to `true`, all other addresses are set to `false`
- Only the authenticated user can update their own addresses

**Response:**
```json
{
  "message": "Shipping address updated successfully.",
  "address": {
    // ... updated address object
  }
}
```

### `DELETE /:id`
Delete a shipping address.

**Response:**
```json
{
  "message": "Shipping address deleted successfully."
}
```

## Business Logic

### Default Address Management
- Only one address can be `isDefault: true` per user
- When setting an address as default:
  1. All other addresses for the user are set to `isDefault: false`
  2. The selected address is set to `isDefault: true`
- This ensures data consistency and prevents multiple defaults

### Phone Number Validation
- Uses regex pattern: `/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/`
- Supports various international formats:
  - `+1234567890`
  - `(123) 456-7890`
  - `123-456-7890`
  - `123.456.7890`
  - `1234567890`

### Address Sorting
- Default addresses appear first
- Non-default addresses sorted by creation date (newest first)
- Implemented in repository layer for efficient database queries

### User Scoping
- All operations are scoped to the authenticated user
- Users can only access their own shipping addresses
- `userId` is automatically set from JWT token
- Attempts to access other users' addresses return 404

## Data Flow

1. **Create Address:**
   - Validate all required fields
   - If `isDefault: true`, unset all other defaults
   - Create address record
   - Return success with address details

2. **Update Address:**
   - Verify address belongs to user
   - If updating `isDefault` to `true`, unset other defaults
   - Update address fields
   - Return success with updated address

3. **List Addresses:**
   - Fetch all addresses for user
   - Sort: default first, then by creation date
   - Return formatted list

4. **Delete Address:**
   - Verify address belongs to user
   - Delete address record
   - Return success message

## Validation

### Phone Number Regex
Validates international phone number formats:
- Supports country codes with `+`
- Supports parentheses for area codes
- Supports dashes, dots, and spaces as separators
- Minimum length validation

### Field Length Limits
- `firstName`, `lastName`: 1-100 characters
- `deliveryAddress`: 5-500 characters
- `additionalInformation`: max 500 characters
- `region`: 1-100 characters
- `message`: max 1000 characters

## Error Handling

User-friendly error messages for:
- Invalid phone number format
- Missing required fields
- Field length violations
- Address not found
- Unauthorized access attempts
