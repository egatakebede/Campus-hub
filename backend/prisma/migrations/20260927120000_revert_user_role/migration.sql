-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "role";

-- DropEnum
DROP TYPE IF EXISTS "UserRole";
