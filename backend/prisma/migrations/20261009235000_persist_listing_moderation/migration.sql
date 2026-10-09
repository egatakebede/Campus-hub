ALTER TYPE "ListingStatus" ADD VALUE 'PENDING';
ALTER TYPE "ListingStatus" ADD VALUE 'PAUSED';
ALTER TYPE "ListingStatus" ADD VALUE 'RENTED';

CREATE TYPE "ListingType" AS ENUM ('SELL', 'RENT', 'SERVICE');

ALTER TABLE "Listing"
  ADD COLUMN "listingType" "ListingType" NOT NULL DEFAULT 'SELL',
  ADD COLUMN "details" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "campus" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "originalListingId" UUID;

CREATE INDEX "Listing_originalListingId_idx" ON "Listing"("originalListingId");
