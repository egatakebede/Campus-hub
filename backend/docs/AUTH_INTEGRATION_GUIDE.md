# AUTH Integration Guide

This guide explains how to use the authentication middleware in Campus Hub.

It covers:
- JWT verification
- Active user validation
- Moderator authorization
- Protecting routes
- Testing authenticated endpoints

## Student Verification Deployment

Verification submissions are stored on the user record and their ID photos
are stored in a private Supabase Storage bucket. Create a private bucket named
`verification-ids` (or set `SUPABASE_VERIFICATION_BUCKET` to another private
bucket name) before accepting submissions. Do not make this bucket public;
moderator review uses short-lived signed URLs.

The Render backend environment must also define `SUPABASE_URL` and
`SUPABASE_KEY` with credentials authorized to upload to and create signed URLs
from that bucket. If photo storage fails, the backend logs the storage error
while returning a safe, actionable message to the student.

The backend applies pending Prisma migrations on startup, including when the
hosting service starts it with `node index.js` directly. You can also apply
migrations manually from the backend directory with `npm run migrate:deploy`.

After a student submits verification, the backend sends a Telegram DM to each
numeric ID in the comma-separated `ADMIN_TELEGRAM_IDS` setting. Configure this
on the backend host, and have each moderator start the Campus Hub bot once so
Telegram allows the bot to message them. The notification includes the review
queue link but never includes the student ID number or photo.

## Public schema row-level security

The RLS migrations enable row-level security on `User`, `Category`, `Listing`,
`ServiceProfile`, `Bookmark`, `Report`, `Rating`, `SavedSearch`, `AdminAuditLog`,
and `_prisma_migrations`. Supabase Data API roles may read only active categories,
active non-deleted listings, and active non-deleted services. No direct Data API
policies are provided for user records, bookmarks, reports, ratings, saved
searches, admin activity, or Prisma migration metadata; access to those records
must go through the backend's authenticated routes.

The backend uses Prisma over its server-only `DATABASE_URL`. Keep that
credential out of the frontend and use the trusted migration/table-owner
database role for the backend connection. The migration enables RLS without
forcing it on the table owner, so the backend's trusted Prisma connection can
continue to perform its API operations. Do not add a browser-side Supabase
database credential or expose private table policies to anonymous clients.

After deployment, verify in Supabase Advisor that RLS is enabled on all ten
tables and test public catalog reads plus private table denial through the
Supabase Data API.

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