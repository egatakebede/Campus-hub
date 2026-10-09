ALTER TABLE "User"
ADD COLUMN "studentIdNumber" TEXT,
ADD COLUMN "idPhotoPath" TEXT,
ADD COLUMN "verificationSubmittedAt" TIMESTAMP(3);

CREATE INDEX "User_verificationSubmittedAt_idx"
ON "User"("verificationSubmittedAt");
