# Listing submission and moderation

Authenticated, active students submit a listing with `POST /listings`. Its photos must first be uploaded with the authenticated `POST /listings/upload-image` endpoint. New submissions are stored with `PENDING` status and are not returned by public listing endpoints.

Moderators use the authenticated endpoints:

- `GET /admin/listings` to load pending submissions.
- `PATCH /admin/listings/:id/approve` to publish a new listing or apply a pending edit.
- `PATCH /admin/listings/:id/reject` to remove a pending submission from the review queue.

Students can inspect their own active and pending listings with `GET /listings/mine`. Public `GET /listings` and listing search only return active, non-deleted listings.

The listing migration is applied at server startup by `prisma migrate deploy`. Listing photos are stored in the public Supabase `listing-images` bucket; verification ID photos remain in the separate private bucket.
