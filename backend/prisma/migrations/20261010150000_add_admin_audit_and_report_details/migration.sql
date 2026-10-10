ALTER TABLE "Report"
    ADD COLUMN "details" TEXT,
    ADD COLUMN "resolutionNotes" TEXT;

CREATE TABLE "AdminAuditLog" (
    "id" UUID NOT NULL,
    "actorId" BIGINT NOT NULL,
    "action" VARCHAR(80) NOT NULL,
    "targetType" VARCHAR(32) NOT NULL,
    "targetId" VARCHAR(128),
    "details" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AdminAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("telegramId") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");
CREATE INDEX "AdminAuditLog_actorId_idx" ON "AdminAuditLog"("actorId");

ALTER TABLE public."AdminAuditLog" ENABLE ROW LEVEL SECURITY;