CREATE TABLE "SavedSearch" (
    "id" UUID NOT NULL,
    "userId" BIGINT NOT NULL,
    "query" VARCHAR(80) NOT NULL,
    "normalizedQuery" VARCHAR(80) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("telegramId") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SavedSearch_userId_normalizedQuery_key"
    ON "SavedSearch"("userId", "normalizedQuery");

CREATE INDEX "SavedSearch_userId_idx" ON "SavedSearch"("userId");

ALTER TABLE public."SavedSearch" ENABLE ROW LEVEL SECURITY;