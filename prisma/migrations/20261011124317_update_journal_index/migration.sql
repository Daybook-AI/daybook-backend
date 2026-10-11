-- DropIndex
DROP INDEX "Journal_userId_createdAt_idx";

-- AlterTable
ALTER TABLE "Journal" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Journal_userId_isDeleted_createdAt_idx" ON "Journal"("userId", "isDeleted", "createdAt");
