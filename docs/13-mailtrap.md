# Mailtrap transactional email

Transactional emails are sent via **Mailtrap API v2** using the official [mailtrap-nodejs](https://github.com/mailtrap/mailtrap-nodejs) client.

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `MAILTRAP_API_KEY` | Yes (for sending) | API token from [Mailtrap API Tokens](https://mailtrap.io/api-tokens). |
| `MAIL_FROM` | No | Sender address, e.g. `"Biomedical <no-reply@biomedicalng.com>"`. |
| `MAILTRAP_USE_SANDBOX` | No | Set to `"true"` to send to Mailtrap **Email Sandbox** (test inbox) instead of production. |
| `MAILTRAP_INBOX_ID` | No | Inbox ID when using sandbox (required if `MAILTRAP_USE_SANDBOX=true`). See below. |
| `BRAND_LOGO_URL` | No | Logo URL for email templates (align with frontend). |
| `BRAND_PRIMARY_COLOR` | No | Primary color hex, e.g. `#0192DD`. |
| `BRAND_BG_COLOR` | No | Background color for layout. |
| `BRAND_TEXT_COLOR` | No | Body text color. |

If `MAILTRAP_API_KEY` is not set, the app still runs; send functions no-op and log that email is not configured.

## Sandbox vs production

- **Sandbox** (Email Sandbox): Set `MAILTRAP_USE_SANDBOX=true` and `MAILTRAP_INBOX_ID` to your **inbox ID**. Emails are captured in Mailtrap and do not go to real addresses. In the Mailtrap UI this is under **Sandboxes** (or **Email Sandbox**).
- **Production**: Use a Sending API token and leave sandbox unset. Verify your sending domain and set `MAIL_FROM` to a verified address (e.g. `no-reply@biomedicalng.com`).

## Finding your Inbox ID (for sandbox)

Mailtrap’s testing product is now called **Email Sandbox**; in the app you see **Sandboxes**.

1. **From the dashboard**: Open [Mailtrap](https://mailtrap.io) → **Sandboxes** (or **Email Sandbox**) → open a **Project** → open an **Inbox**. The **inbox ID** is often in the URL (e.g. `.../inboxes/4015` → use `4015`) or in the inbox’s **API** / **Integrations** section.
2. **From the API**: Get your **account ID** (e.g. from the URL when in Mailtrap, or from account settings), then list inboxes:
   ```bash
   curl -s -H "Api-Token: YOUR_MAILTRAP_API_KEY" "https://mailtrap.io/api/accounts/YOUR_ACCOUNT_ID/inboxes"
   ```
   Use the `id` of the inbox you want (e.g. `3538`) as `MAILTRAP_INBOX_ID`.

## Emails sent

1. **Verification** – after signup and on resend verification (link to verify email).
2. **Password reset** – on forgot password (link to reset password).
3. **Welcome** – after signup (welcome message; verify email first).
4. **New device** – when a user signs in from a device we have not seen before (device/browser + time; link to reset password if not them).

## Templates

Templates live under `src/lib/email/`:

- **Layout**: Table-based HTML (`layout.ts`) for deliverability; shared wrapper with a **banner** (primary-50 background) and **embedded logo** (`cid:logo`). The logo is read from `src/lib/email/assets/logo.png` (copied from the frontend `public/assets/logos/logo.png`), so no URL is required and emails work offline.
- **Templates**: `templates/verification.ts`, `templates/password-reset.ts`, `templates/welcome.ts`, `templates/new-device.ts`. Each exports `*Subject()`, `*Html()`, `*Text()`.

Brand colors come from env (`BRAND_PRIMARY_COLOR`, `BRAND_PRIMARY_50`, etc.); match your frontend (e.g. `globals.css` primary scale). To update the logo, replace `src/lib/email/assets/logo.png` with the new file from the frontend.

## New device detection

On **sign-in**, the backend:

1. Computes a stable device fingerprint from IP + user agent (SHA-256 hash).
2. Looks up `user_devices` by user ID and device hash.
3. If no row exists: creates a device row and sends the **new device** email.
4. If a row exists: updates `last_seen_at` only (no email).

Device description in the email is derived from the user agent (e.g. "Chrome on Windows", "Safari on macOS").

## Testing email

1. **See emails in Mailtrap (sandbox)** – In `.env` set `MAILTRAP_USE_SANDBOX=true` and `MAILTRAP_INBOX_ID=<your-inbox-id>` (inbox ID from **Sandboxes** → Project → Inbox, see “Finding your Inbox ID” above). Restart the backend. Emails will appear in that inbox in the Mailtrap dashboard, not in real mailboxes.

2. **Trigger each email** (backend on port 4000; replace `YOUR_EMAIL` with a real address):

   - **Verification + Welcome** – signup:
     ```bash
     curl -X POST http://localhost:4000/api/v1/auth/signup -H "Content-Type: application/json" -d '{"firstName":"Test","lastName":"User","whoYouAre":"Pharmacist","email":"YOUR_EMAIL","phoneNumber":"+1234567890","password":"password123","countryOfPractice":"Nigeria"}'
     ```
   - **Resend verification**:
     ```bash
     curl -X POST http://localhost:4000/api/v1/auth/resend-verification -H "Content-Type: application/json" -d '{"email":"YOUR_EMAIL"}'
     ```
   - **Password reset**:
     ```bash
     curl -X POST http://localhost:4000/api/v1/auth/forgot-password -H "Content-Type: application/json" -d '{"email":"YOUR_EMAIL"}'
     ```
   - **New device** – first sign-in from this IP/browser sends the new-device email:
     ```bash
     curl -X POST http://localhost:4000/api/v1/auth/signin -H "Content-Type: application/json" -d '{"email":"YOUR_EMAIL","password":"password123"}'
     ```
