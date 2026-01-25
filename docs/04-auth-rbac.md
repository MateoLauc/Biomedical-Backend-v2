# 04 — Auth + RBAC Module

This document explains the authentication and role-based access control (RBAC) implementation.

## Overview

The auth module provides:
- User signup and signin
- Email verification
- Password reset and change
- JWT-based authentication with refresh token rotation
- RBAC middleware (super_admin, admin, customer)
- Purchase policy gating (checks verification statuses)

## Architecture

Following the modular pattern:
- `src/modules/auth/routes.ts` - HTTP route definitions
- `src/modules/auth/controller.ts` - Request/response handling
- `src/modules/auth/service.ts` - Business logic
- `src/modules/auth/repo.ts` - Database operations
- `src/modules/auth/schema.ts` - Zod validation schemas
- `src/modules/auth/types.ts` - TypeScript types

## Core Utilities

### JWT (`src/lib/auth/jwt.ts`)
- `generateAccessToken(payload)` - Creates short-lived access token (default 15 min)
- `generateRefreshToken(payload)` - Creates long-lived refresh token (default 30 days)
- `verifyAccessToken(token)` - Verifies and decodes access token
- `verifyRefreshToken(token)` - Verifies and decodes refresh token

Uses `jose` library with HS256 algorithm.

### Password Hashing (`src/lib/auth/password.ts`)
- `hashPassword(plain)` - Hashes password with Argon2id
- `verifyPassword(plain, hash)` - Verifies password against hash

Uses Argon2id with secure defaults (64MB memory, 3 iterations, 4 parallelism).

### Token Generation (`src/lib/auth/tokens.ts`)
- `generateToken()` - Generates cryptographically secure random token (64 hex chars)
- `hashToken(token)` - SHA-256 hashes token for storage (never store raw tokens)

## Email Service (`src/lib/email/index.ts`)

- `sendVerificationEmail(email, token)` - Sends email verification link
- `sendPasswordResetEmail(email, token)` - Sends password reset link

Uses Nodemailer with Mailtrap configuration. Gracefully falls back to logging if Mailtrap not configured (useful for development).

## API Endpoints

All endpoints are under `/api/v1/auth`:

### Public Endpoints

- `POST /api/v1/auth/signup` - Create new user account
  - Body: `{ firstName, lastName, whoYouAre, email, phoneNumber, password, countryOfPractice }`
  - Returns: `{ user }` (no password, includes verification token in email)

- `POST /api/v1/auth/signin` - Sign in with email and password
  - Body: `{ email, password }`
  - Returns: `{ user, accessToken }`
  - Sets httpOnly `refreshToken` cookie

- `POST /api/v1/auth/verify-email` - Verify email address
  - Body: `{ token }`
  - Returns: `{ user }`
  - Sets `identityVerified=true` upon successful verification

- `POST /api/v1/auth/resend-verification` - Resend verification email
  - Body: `{ email }`
  - Returns: `{ message }` (always 202, doesn't reveal if email exists)

- `POST /api/v1/auth/forgot-password` - Request password reset
  - Body: `{ email }`
  - Returns: `{ message }` (always 202, doesn't reveal if email exists)

- `POST /api/v1/auth/reset-password` - Reset password with token
  - Body: `{ token, newPassword }`
  - Returns: `{ message }`

- `POST /api/v1/auth/refresh` - Refresh access token
  - Reads `refreshToken` from httpOnly cookie
  - Returns: `{ accessToken }`
  - Rotates refresh token (old one revoked, new one set in cookie)

- `POST /api/v1/auth/logout` - Logout
  - Reads `refreshToken` from cookie and revokes it
  - Clears cookie
  - Returns: `{ message }`

### Protected Endpoints

- `POST /api/v1/auth/change-password` - Change password (requires authentication)
  - Headers: `Authorization: Bearer <accessToken>`
  - Body: `{ currentPassword, newPassword }`
  - Returns: `{ message }`

## Authentication Middleware

### `requireAuth` (`src/middleware/auth.ts`)
- Verifies `Authorization: Bearer <token>` header
- Attaches `req.user` with `{ userId, role, emailVerified }`
- Throws `401 Unauthorized` if invalid/missing

### `requireRole(...roles)`
- Checks user role is in allowed list
- Must be used after `requireAuth`
- Throws `403 Forbidden` if role not allowed

### `requireEmailVerified`
- Checks `emailVerified` is true
- Must be used after `requireAuth`
- Throws `403 Forbidden` if email not verified

## Purchase Policy (`src/lib/policies/purchase-policy.ts`)

Function `canPurchaseProduct(user, requirements)` checks:
1. `identityVerified` must be `true` (set when email is verified)
2. If product `requiresBusinessLicense`, user's `businessLicenseStatus` must be `"approved"`
3. If product `requiresPrescriptionAuthority`, user's `prescriptionAuthorityStatus` must be `"approved"`

Returns `{ allowed: boolean, reason?: string }`.

This will be used by cart/checkout flows later.

## Security Features

- **Password hashing**: Argon2id (memory-hard, resistant to GPU attacks)
- **Token storage**: All tokens (refresh, email verification, password reset) are SHA-256 hashed before storage
- **Refresh tokens**: httpOnly, secure (in production), sameSite cookies
- **Token expiration**:
  - Access tokens: 15 minutes (configurable via `JWT_ACCESS_TTL_SECONDS`)
  - Refresh tokens: 30 days (configurable via `JWT_REFRESH_TTL_SECONDS`)
  - Email verification: 24 hours
  - Password reset: 1 hour
- **Token rotation**: Refresh tokens are rotated on each use (old one revoked, new one issued)
- **Input validation**: All endpoints use Zod schemas via `validateBody` middleware

## Database Operations

All auth-related DB operations are in `src/modules/auth/repo.ts`:
- User CRUD (create, find by email/id, update email verified, update password)
- Refresh token management (create, find by hash, revoke)
- Email verification token management (create, find by hash, mark used)
- Password reset token management (create, find by hash, mark used)

## Testing the Auth Module

### 1. Signup
```bash
curl -X POST http://localhost:4000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "whoYouAre": "Pharmacist",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "password": "SecurePass123",
    "countryOfPractice": "USA"
  }'
```

### 2. Verify Email
Check your Mailtrap inbox (or logs if not configured) for the verification token, then:
```bash
curl -X POST http://localhost:4000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token": "<token-from-email>"}'
```

### 3. Signin
```bash
curl -X POST http://localhost:4000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }' \
  -c cookies.txt
```

This returns `accessToken` and sets `refreshToken` cookie.

### 4. Use Access Token
```bash
curl -X POST http://localhost:4000/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "currentPassword": "SecurePass123",
    "newPassword": "NewSecurePass123"
  }'
```

### 5. Refresh Token
```bash
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -b cookies.txt
```

Returns new `accessToken` and rotates refresh token.

## Next Steps

After testing auth, we'll implement:
- Products/catalog module
- Cart module
- Orders + Paystack integration
- Admin features
