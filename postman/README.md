# Postman — Biomedical Backend API

This folder contains everything you need to call and understand the Biomedical Backend API from Postman: a full request collection, **Development** and **Production** environments, and scripts that automatically save your JWT after login so you don’t have to copy tokens by hand.

---

## 1. Import into Postman

1. Open **Postman**.
2. Click **Import** (top left).
3. Drag and drop (or choose):
   - **Collection:** `Biomedical_Backend_API.postman_collection.json`
   - **Environments:**  
     - `Biomedical_Backend_Development.postman_environment.json`  
     - `Biomedical_Backend_Production.postman_environment.json`
4. Click **Import**.

You should see:
- One collection: **Biomedical Backend API**
- Two environments: **Biomedical Backend - Development** and **Biomedical Backend - Production**

---

## 2. Environments and variables

Each environment defines two variables used by the collection:

| Variable      | Purpose |
|---------------|--------|
| **baseUrl**   | API base URL (e.g. `http://localhost:4000` for dev, your production URL for prod). |
| **accessToken** | JWT access token. Filled automatically after **Signin** or **Refresh Token** (see below). |

- **Development:** `baseUrl` = `http://localhost:4000`, `accessToken` = empty (filled on first signin).
- **Production:** `baseUrl` = `https://api.your-domain.com` (change to your real API URL), `accessToken` = empty.

**Important:** In the top-right of Postman, select the environment you’re using (e.g. **Biomedical Backend - Development**). All requests use `{{baseUrl}}` and `{{accessToken}}` from the selected environment.

---

## 3. How authentication works (JWT auto-save)

- **Signin** and **Refresh Token** both return an **access token**.
- The collection has **Test scripts** on those two requests that:
  - Read the token from the JSON response.
  - Save it into:
    - The **current environment** (so `{{accessToken}}` is set), and
    - The **collection variables** (fallback if no environment is selected).

So you **don’t need to copy the token manually**. After you run **Signin** or **Refresh Token** once, every other request that uses `Authorization: Bearer {{accessToken}}` will use that token as long as you keep the same environment selected.

**Typical flow:**
1. Select **Biomedical Backend - Development** (or Production).
2. Run **Auth → Signin** with valid email/password.
3. Check the response: you should see `user` and `accessToken`.
4. From then on, all protected requests (Cart, Orders, User, Admin, etc.) automatically send the saved token.

**Refresh when token expires:**  
Access tokens expire after 15 minutes. When you get **401 Unauthorized**, run **Auth → Refresh Token** (no body; it uses the refresh token stored in the cookie). The script will save the new access token into the same environment and collection variables.

---

## 4. Recommended testing flow

1. **Select environment**  
   Top-right: **Biomedical Backend - Development** (or Production).

2. **Check the server**  
   Run **Health Check**. You should get `200` and something like `{ "ok": true, "env": "development", ... }`.

3. **Sign in**  
   Run **Auth → Signin** with a real user (e.g. after **Signup** and **Verify Email**). The access token is saved automatically.

4. **Use the API**  
   Run any request in **Cart**, **Shipping**, **Orders**, **User**, **Notifications**, **Admin**, **Careers**, or **Blog** as needed. They already use `{{baseUrl}}` and `{{accessToken}}`.

5. **Admin-only endpoints**  
   For **Products** (create/update/delete categories/products/variants), **Admin**, **Careers** (create/update/delete jobs), **Blog** (create/update/delete posts, upload image), you must be signed in as a user with role **super_admin** or **admin**.

6. **When you get 401**  
   Run **Auth → Refresh Token** to get a new access token (script will save it again).

---

## 5. API overview (by module)

Below is a short, human-oriented overview of what each part of the API does. For exact request/response shapes, use the **description** on each request in the collection.

### Health
- **GET /health** — Check if the server is up. No auth. Returns `ok`, `env`, `uptimeSeconds`, `timestamp`.

### Auth
- **POST /api/v1/auth/signup** — Register (firstName, lastName, whoYouAre, email, phoneNumber, password, countryOfPractice). Sends verification email.
- **POST /api/v1/auth/signin** — Log in with email/password. Returns `user` and `accessToken`; sets httpOnly cookie `refreshToken`. **Script saves `accessToken` to environment.**
- **POST /api/v1/auth/verify-email** — Verify email with `token` from email.
- **POST /api/v1/auth/resend-verification** — Resend verification email (body: `email`).
- **POST /api/v1/auth/forgot-password** — Request password reset (body: `email`).
- **POST /api/v1/auth/reset-password** — Reset password with `token` and `newPassword` from email.
- **POST /api/v1/auth/change-password** — Change password (auth required; body: `currentPassword`, `newPassword`).
- **POST /api/v1/auth/refresh** — New access token using refresh cookie. **Script saves new `accessToken` to environment.**
- **POST /api/v1/auth/logout** — Invalidate refresh token and clear cookie.

### Products
- **Categories:** List (flat), list as tree, get by ID (public). Create, update, delete (admin).
- **Products:** List (with categoryId, isActive, requiresApproval, pagination), get by ID (public). Create, update, delete (admin).
- **Variants:** Create, update, delete (admin); need productId, packSize, price (string decimal), optional stockQuantity.

### Cart
All require auth. Get cart, add item (productVariantId, quantity), update item quantity, remove item, clear cart.

### Shipping
All require auth. List addresses, get by ID, create, update, delete. Create/update can set `isDefault`.

### Orders
- Create order from cart (body: shippingAddressId, optional notes, callbackUrl); returns order and payment URL.
- List orders, get order, verify payment (query: reference) — auth required.
- Update order status (admin): body `status` (pending, processing, shipped, delivered, cancelled), optional notes.
- Cancel order: body `reason` (5–500 chars).
- **Webhook** — POST /api/v1/orders/webhook for Paystack; no auth (verified by signature).

### Admin
All require **admin** or **super_admin**. List users (filters: role, identityVerified, businessLicenseStatus, prescriptionAuthorityStatus, page, limit). Update user verification (businessLicenseStatus, prescriptionAuthorityStatus). Dashboard (counts, revenue, etc.). Inventory overview (totals, available, out of stock, low stock).

### User
- **GET /api/v1/users/me** — Current user profile (auth required).
- **PATCH /api/v1/users/me** — Update profile (optional: firstName, lastName, whoYouAre, phoneNumber, countryOfPractice, email).

### Notifications
All require auth. List (query: unreadOnly, page, limit), get by ID, mark one as read, mark all as read.

### Careers (Jobs)
- List jobs (query: status open/closed, page, limit), get job by ID — **public**.
- Create, update, delete job — **admin only**. Body for create: title, type, department, optional icon, responsibilities (array), optional status (open/closed).

### Blog
- List posts (query: type press_releases|videos|news_article, status draft|published, page, limit), get by ID, get by slug — **public**.
- Create, update, delete post — **admin only**. Types: press_releases, videos, news_article. Slug optional (auto from title). imageUrl optional (use URL from upload).
- **Upload image** — POST form-data field `image` (JPEG/PNG/GIF/WebP, max 5 MB). Returns `url`; use it as `imageUrl` in create/update. **Admin only.** Requires Cloudinary configured.

---

## 6. Common issues

- **401 Unauthorized**  
  You’re not signed in or the access token expired. Run **Auth → Signin** (or **Refresh Token** if you were already signed in). Ensure an environment is selected so the script can save the token.

- **403 Forbidden**  
  Your user doesn’t have permission (e.g. admin-only endpoint). Use an account with role **super_admin** or **admin** for Admin, Products CRUD, Careers CRUD, Blog CRUD.

- **429 Too Many Requests**  
  Rate limit hit (e.g. 100 requests per 15 minutes per IP on /api/v1). Wait or adjust server rate-limit config.

- **Cookies (refresh token)**  
  Signin and Refresh set an httpOnly cookie. Postman keeps it per domain. For **Refresh Token** to work, use the same **baseUrl** (same environment) as when you signed in.

- **Base URL wrong**  
  If every request fails with connection error, check the environment: **baseUrl** for Development should be `http://localhost:4000` (or whatever port your server uses). For Production, set your real API URL.

- **Blog upload-image 503**  
  Server returns 503 when Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in the server environment.

---

## 7. Documentation in the collection

Each request in the collection includes:

- **Description** — What the endpoint does, required/optional body or query params, and **example request and response JSON** (in markdown code blocks) so you can see the shape of the API without calling it.
- **Example request body** — Pre-filled JSON for POST/PATCH requests (e.g. Signup, Signin, Create Order, Create Post). Replace placeholders like `<uuid>` or `<variant-uuid>` with real IDs from your data.
- **Response examples** (where applicable) — For important endpoints (Health, Signup, Signin, Refresh Token, Get Cart, Create Order, List Products, Get Profile), the collection stores **saved example responses**. In Postman, open a request and use the **Examples** dropdown (under the Send button) to view a sample 200/201 or 401 response body. This helps you understand the exact structure of success and error responses.

**Standard error shape** (documented in the collection info): All errors return `{ "error": { "code": "...", "message": "...", "requestId": "..." } }` with an appropriate HTTP status (400, 401, 403, 404, 429, 500).

---

## 8. Files in this folder

| File | Purpose |
|------|--------|
| **Biomedical_Backend_API.postman_collection.json** | All API requests with descriptions, example request bodies, saved response examples for key endpoints, and auth scripts. |
| **Biomedical_Backend_Development.postman_environment.json** | Environment for local dev: baseUrl = localhost:4000, accessToken (filled by scripts). |
| **Biomedical_Backend_Production.postman_environment.json** | Environment for production: baseUrl = your API URL, accessToken (filled by scripts). |
| **README.md** (this file) | Human-oriented guide to importing, environments, auth, and the API. |

Use the collection with either environment; switch environments when you move from local testing to production. The same scripts will keep saving the JWT into whichever environment you have selected.

**Tip:** To see example responses without calling the server, open any request that has saved examples (e.g. Health Check, Signin, Get Cart) and choose an example from the **Examples** dropdown. The response panel will show the sample body, status code, and headers.
