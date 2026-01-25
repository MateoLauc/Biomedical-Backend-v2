# Postman Collection for Biomedical Backend

## How to Import

1. Open Postman
2. Click **Import** (top left)
3. Select **File** tab
4. Choose `Biomedical_Backend.postman_collection.json`
5. Click **Import**

## Collection Variables

The collection includes these variables (automatically set):
- `baseUrl` - Default: `http://localhost:4000` (change if your server runs on a different port)
- `accessToken` - Automatically saved after signin/refresh (used for protected endpoints)

## Testing Flow

### 1. Health Check
- Run **Health Check** to verify server is running
- Should return `200 OK` with `{ ok: true, ... }`

### 2. Signup
- Run **Signup** with your test data
- Check your Mailtrap inbox (or server logs) for verification token
- Response: `201 Created` with user object (no password)

### 3. Verify Email
- Copy the token from email/logs
- Paste into **Verify Email** request body
- Response: `200 OK` with verified user

### 4. Signin
- Run **Signin** with email and password
- **Important**: The `accessToken` is automatically saved to collection variables
- Response: `200 OK` with `{ user, accessToken }`
- Refresh token is set as httpOnly cookie (handled automatically by Postman)

### 5. Use Protected Endpoints
- **Change Password** automatically uses the saved `accessToken`
- Add `Authorization: Bearer {{accessToken}}` header to other protected endpoints

### 6. Refresh Token
- Run **Refresh Token** (reads cookie automatically)
- New `accessToken` is automatically saved
- Response: `200 OK` with `{ accessToken }`

### 7. Logout
- Run **Logout** to revoke refresh token
- Clears the cookie
- Response: `200 OK` with `{ message: "Logged out successfully" }`

## Notes

- **Cookies**: Postman automatically handles httpOnly cookies from signin/refresh
- **Access Token**: Automatically saved after signin/refresh - no manual copying needed
- **Base URL**: Change `baseUrl` variable if your server runs on a different port
- **Email Tokens**: Check Mailtrap (if configured) or server terminal logs for verification/reset tokens

## Troubleshooting

- **401 Unauthorized**: Make sure you've signed in and the access token is saved
- **400 Bad Request**: Check request body format matches the schema
- **404 Not Found**: Verify `baseUrl` is correct and server is running
- **Cookies not working**: Make sure Postman's cookie handling is enabled (Settings → General → Cookies)
