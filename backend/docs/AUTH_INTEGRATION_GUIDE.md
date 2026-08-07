# AUTH Integration Guide

This guide explains how to use the authentication middleware in Campus Hub.

It covers:
- JWT verification
- Active user validation
- Moderator authorization
- Protecting routes
- Testing authenticated endpoints

## Import the Authentication Middleware

```javascript
const jwtVerify = require("../middleware/jwtVerify");
const requireActive = require("../middleware/requireActive");
const requireModerator = require("../middleware/requireModerator");
```

These middleware functions are used to protect routes by:
- **jwtVerify** – Verifies the JWT token and attaches the decoded user to `req.user`.
- **requireActive** – Allows access only to users with an active account.
- **requireModerator** – Allows access only to moderators.

## Before and After Authentication

### Before (Hardcoded Telegram ID)

```javascript
router.get("/profile", async (req, res) => {
  const telegramId = BigInt(123456789); // TODO: Replace with authenticated user

  const user = await prisma.user.findUnique({
    where: { telegramId },
  });

  res.json(user);
});
```

### After (Using Authentication Middleware)

```javascript
router.get("/profile", jwtVerify, async (req, res) => {
  const telegramId = BigInt(req.user.telegramId);

  const user = await prisma.user.findUnique({
    where: { telegramId },
  });

  res.json(user);
});
```

Using `jwtVerify` removes the need for hardcoded user IDs. The authenticated user's Telegram ID is available from `req.user`.

## Route Protection

### Routes that require `requireActive`

These routes modify data and should only be accessible to authenticated users with an active account.

Examples:
- Create a listing
- Edit a listing
- Delete a listing
- Create a service profile
- Update a service profile
- Delete a service profile
- Create a bookmark
- Remove a bookmark
- Submit a report

Example:

```javascript
router.post("/listings", jwtVerify, requireActive, createListing);
```

---

### Public Routes

These routes can be accessed without authentication.

Examples:
- View listings
- View listing details
- Search listings
- Browse categories

Example:

```javascript
router.get("/listings", getListings);
```

---

### Routes that require `requireModerator`

Moderator-only routes require all three middleware.

Example:

```javascript
router.delete(
  "/admin/listings/:id",
  jwtVerify,
  requireActive,
  requireModerator,
  deleteListing
);
```

## Testing Authentication with a Real JWT

To test protected routes, first obtain a JWT token from the Telegram authentication endpoint.

### 1. Authenticate through `/auth/telegram`

Send a POST request:

```
POST /auth/telegram
```

Example request body:

```json
{
  "initData": "TELEGRAM_INIT_DATA_FROM_MINI_APP"
}
```

The backend validates the Telegram authentication data and returns a JWT token.

Example response:

```json
{
  "token": "your_jwt_token_here",
  "user": {
    "telegramId": "123456789",
    "status": "ACTIVE"
  }
}
```

### 2. Use the JWT in Postman

For protected routes:

```
GET /users/profile
```

Add this header:

```
Authorization: Bearer your_jwt_token_here
```

### 3. Use the JWT with curl

Example:

```bash
curl -X GET http://localhost:4000/users/profile \
-H "Authorization: Bearer your_jwt_token_here"
```

The `jwtVerify` middleware checks the token before allowing access to protected routes.