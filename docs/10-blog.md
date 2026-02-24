# 10 — Blog Module

This document describes the blog post CRUD and image upload via Cloudinary.

## Overview

The blog module provides:
- **List / get posts** — Public list with filters (status) and pagination; get by ID or by slug
- **Create / update / delete** — Admin-only; posts have title, slug, body, optional image URL, **type** (press_releases | videos | news_article), status (draft/published)
- **Upload image** — Admin-only; multipart upload to Cloudinary, returns URL for use in post `imageUrl`

**Access:** List and get are public. Create, update, delete, and upload require authentication and role `super_admin` or `admin`.

## Architecture

- `src/modules/blog/routes.ts` — Routes under `/api/v1/blog`; public for list/get, protected for write and upload
- `src/modules/blog/controller.ts` — Request/response; upload uses `req.file` (multer memory buffer)
- `src/modules/blog/service.ts` — Slug generation/uniqueness, publishedAt when status is published
- `src/modules/blog/repo.ts` — Drizzle CRUD on `blog_posts` table
- `src/modules/blog/schema.ts` — Zod validation for create/update/list query
- `src/modules/blog/types.ts` — BlogPost, CreateBlogPostInput, UpdateBlogPostInput, ListBlogPostsQuery
- `src/lib/cloudinary.ts` — Cloudinary config and `uploadImage(buffer, options)` / `deleteImage(publicId)`
- `src/db/schema/blog-posts.ts` — Table: id, title, slug, body, image_url, status, published_at, created_at, updated_at

## Database

- **Migrations:** `0006_create_blog_posts_table.sql`, `0007_add_blog_post_type.sql`
- **Enums:** `blog_post_status` — `draft`, `published`; `blog_post_type` — `press_releases`, `videos`, `news_article`
- **Table:** `blog_posts` — slug unique; type default `news_article`; indexes on slug, type, status, published_at, created_at

## Cloudinary

- **Env:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (optional; upload returns 503 if not set)
- **Upload:** Buffer from multer → `uploadImage(buffer, { folder: "blog" })` → returns `{ url, publicId }`
- **Usage:** Client uploads image via `POST /api/v1/blog/upload-image`, then sends returned `url` in create/update body as `imageUrl`
- **PDF delivery (e.g. professional credentials):** On the free plan, enable **“Allow delivery of PDF and ZIP files”** in [Cloudinary Console → Settings → Security](https://console.cloudinary.com/settings/security). Otherwise PDF URLs may return an error when opened. Paid plans have no such restriction.

## API Endpoints

Base path: `/api/v1/blog`.

### Public

- **`GET /posts`** — List posts  
  Query: `type` (press_releases | videos | news_article), `status` (draft | published), `page`, `limit`  
  Response: `{ posts, pagination: { page, limit, total, totalPages } }`

- **`GET /posts/:id`** — Get post by ID  
  Response: `{ post }`

- **`GET /posts/slug/:slug`** — Get post by slug  
  Response: `{ post }`

### Admin (Bearer token, super_admin or admin)

- **`POST /posts`** — Create post  
  Body: `title`, `body`, optional `slug`, optional `imageUrl`, optional `type` (press_releases | videos | news_article), optional `status` (draft | published)  
  Slug is auto-generated from title if omitted. Type defaults to `news_article`.  
  Response: `{ message, post }`

- **`PATCH /posts/:id`** — Update post (partial)  
  Body: optional `title`, `slug`, `body`, `imageUrl`, `type`, `status`  
  Response: `{ message, post }`

- **`DELETE /posts/:id`** — Delete post  
  Response: `{ message }`

- **`POST /upload-image`** — Upload image (multipart/form-data, field `image`)  
  Max 5 MB; allowed types: JPEG, PNG, GIF, WebP.  
  Response: `{ message, url }` — use `url` as `imageUrl` in create/update.

## Slug and status

- Slug: URL-safe, unique; generated from title (lowercase, hyphens) if not provided; uniqueness enforced with numeric suffix if needed.
- Status `published`: on create or update to `published`, `publishedAt` is set to current time when not already set.
