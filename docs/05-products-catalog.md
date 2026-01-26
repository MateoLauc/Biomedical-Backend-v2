# 05 — Products & Catalog Module

This document explains the products, categories, and product variants implementation.

## Overview

The products module provides:
- Hierarchical categories (parent-child relationships)
- Product management with variants (pack sizes)
- Product approval requirements
- Stock management (quantity tracking, low stock alerts)
- Tree-structured category listing
- Product filtering and pagination

## Architecture

Following the modular pattern:
- `src/modules/products/routes.ts` - HTTP route definitions
- `src/modules/products/controller.ts` - Request/response handling
- `src/modules/products/service.ts` - Business logic
- `src/modules/products/repo.ts` - Database operations
- `src/modules/products/schema.ts` - Zod validation schemas
- `src/modules/products/types.ts` - TypeScript types

## Database Schema

### Categories (`src/db/schema/categories.ts`)
- `id` - UUID primary key
- `parentCategoryId` - Optional UUID reference to parent category (for hierarchical structure)
- `name` - Category name
- `slug` - URL-friendly unique identifier
- `description` - Optional category description
- `createdAt`, `updatedAt` - Timestamps

### Products (`src/db/schema/products.ts`)
- `id` - UUID primary key
- `categoryId` - Foreign key to categories
- `name` - Product name
- `slug` - URL-friendly unique identifier
- `description` - Product description
- `composition` - Product composition details
- `indication` - Medical indications
- `requiresApproval` - Boolean flag (some products require admin approval before purchase)
- `isActive` - Product availability status
- `stockQuantity` - Total stock quantity
- `lowStockThreshold` - Alert threshold for low stock
- `createdAt`, `updatedAt` - Timestamps

### Product Variants (`src/db/schema/product-variants.ts`)
- `id` - UUID primary key
- `productId` - Foreign key to products
- `packSize` - Variant pack size (e.g., "500mls", "100mls")
- `price` - Decimal price (precision 10, scale 2)
- `stockQuantity` - Variant-specific stock
- `isActive` - Variant availability status
- `createdAt`, `updatedAt` - Timestamps

**Note:** Prices are stored in product variants, not directly on products, allowing different pack sizes to have different prices.

## API Endpoints

All endpoints are under `/api/v1/products`:

### Categories

#### `GET /categories`
List all categories (flat list).

**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "INTRAVENOUS FLUID",
      "slug": "intravenous-fluid",
      "description": "...",
      "parentCategoryId": null,
      "createdAt": "2026-01-20T...",
      "updatedAt": "2026-01-20T..."
    }
  ]
}
```

#### `GET /categories/tree`
List categories in hierarchical tree structure with nested sub-categories.

**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "INTRAVENOUS FLUID",
      "slug": "intravenous-fluid",
      "subCategories": [
        {
          "id": "uuid",
          "name": "Peritoneal Dialysis Fluids",
          "slug": "peritoneal-dialysis-fluids",
          "subCategories": []
        }
      ]
    }
  ]
}
```

#### `GET /categories/:id`
Get a single category by ID.

#### `POST /categories`
Create a new category (requires `super_admin` or `admin` role).

**Body:**
```json
{
  "name": "Category Name",
  "slug": "category-slug",
  "description": "Optional description",
  "parentCategoryId": "uuid" // Optional, for sub-categories
}
```

#### `PATCH /categories/:id`
Update a category (requires `super_admin` or `admin` role).

#### `DELETE /categories/:id`
Delete a category (requires `super_admin` or `admin` role).

### Products

#### `GET /products`
List products with filtering and pagination.

**Query Parameters:**
- `categoryId` or `subCategoryId` - Filter by category (UUID)
- `isActive` - Filter by active status (`true`/`false`)
- `requiresApproval` - Filter by approval requirement (`true`/`false`)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "categoryId": "uuid",
      "name": "Bioflex 0.9% Normal Saline",
      "slug": "bioflex-0-9-normal-saline",
      "description": "...",
      "composition": "...",
      "indication": "...",
      "requiresApproval": false,
      "isActive": true,
      "stockQuantity": 100,
      "lowStockThreshold": 10,
      "category": { ... },
      "variants": [
        {
          "id": "uuid",
          "packSize": "500mls",
          "price": "25.00",
          "stockQuantity": 50,
          "isActive": true
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### `GET /products/:id`
Get a single product with its variants and category.

#### `POST /products`
Create a new product (requires `super_admin` or `admin` role).

**Body:**
```json
{
  "categoryId": "uuid",
  "name": "Product Name",
  "slug": "product-slug",
  "description": "Optional",
  "composition": "Optional",
  "indication": "Optional",
  "requiresApproval": false,
  "stockQuantity": 0,
  "lowStockThreshold": 10
}
```

#### `PATCH /products/:id`
Update a product (requires `super_admin` or `admin` role).

#### `DELETE /products/:id`
Delete a product (requires `super_admin` or `admin` role).

### Product Variants

#### `POST /products/:productId/variants`
Create a product variant (requires `super_admin` or `admin` role).

**Body:**
```json
{
  "packSize": "500mls",
  "price": "25.00",
  "stockQuantity": 50
}
```

#### `PATCH /products/variants/:id`
Update a product variant (requires `super_admin` or `admin` role).

#### `DELETE /products/variants/:id`
Delete a product variant (requires `super_admin` or `admin` role).

## Business Logic

### Slug Generation
Product and category slugs are auto-generated from names using a `slugify` function that:
- Converts to lowercase
- Removes special characters
- Replaces spaces with hyphens
- Ensures uniqueness (appends numeric suffix if duplicate)

### Hierarchical Categories
- Main categories have `parentCategoryId: null`
- Sub-categories reference their parent via `parentCategoryId`
- The tree endpoint builds nested structures automatically
- Supports unlimited nesting levels

### Stock Management
- Products track total `stockQuantity` at product level
- Variants track `stockQuantity` at variant level
- `lowStockThreshold` triggers alerts when stock falls below threshold
- Stock can be managed independently for each variant

### Product Approval
- `requiresApproval: true` products cannot be purchased directly
- Admin approval workflow will be implemented in the Orders module
- Used for controlled substances or restricted medications

## Seeding Products

A seed script (`scripts/seed-products.ts`) parses `product.md` and populates the database:

```bash
npm run db:seed
```

The script:
- Parses markdown structure to identify categories, sub-categories, and products
- Handles hierarchical category relationships
- Creates products with variants (pack sizes)
- Handles duplicate slugs automatically
- Uses placeholder prices (should be updated manually)

## Validation

All endpoints use Zod schemas for input validation:
- UUID validation for IDs
- Required field checks
- String length limits
- Boolean type validation
- Decimal price validation

## Error Handling

User-friendly error messages for:
- Duplicate slugs
- Invalid category/product IDs
- Missing required fields
- Invalid data types
