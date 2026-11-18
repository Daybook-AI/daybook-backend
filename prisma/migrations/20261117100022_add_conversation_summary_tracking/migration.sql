-- AlterTable
ALTER TABLE "ChatConversation" ADD COLUMN     "summary" TEXT,
ADD COLUMN     "summaryThroughMessageId" INTEGER,
ADD COLUMN     "summaryUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "summaryVersion" INTEGER NOT NULL DEFAULT 0;
