-- CreateTable
CREATE TABLE "EntryAnalysis" (
    "id" SERIAL NOT NULL,
    "journalId" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "themes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emotionalTone" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reflection" TEXT NOT NULL,
    "suggestedActions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contentHash" TEXT NOT NULL,
    "aiModel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntryAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntryAnalysis_journalId_createdAt_idx" ON "EntryAnalysis"("journalId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "EntryAnalysis" ADD CONSTRAINT "EntryAnalysis_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
