CREATE TYPE "RatingTargetType" AS ENUM ('SELLER', 'LISTING', 'APP');

CREATE TABLE "Rating" (
    "id" UUID NOT NULL,
    "reviewerId" BIGINT NOT NULL,
    "targetType" "RatingTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Rating_score_check" CHECK ("score" >= 1 AND "score" <= 5),
    CONSTRAINT "Rating_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("telegramId") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Rating_reviewerId_targetType_targetId_key"
    ON "Rating"("reviewerId", "targetType", "targetId");

CREATE INDEX "Rating_targetType_targetId_idx"
    ON "Rating"("targetType", "targetId");

ALTER TABLE public."Rating" ENABLE ROW LEVEL SECURITY;