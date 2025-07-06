-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "isSummarized" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN     "conversationSummary" TEXT,
ADD COLUMN     "isSummarized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastSummarizedAt" TIMESTAMP(3),
ADD COLUMN     "messageCount" INTEGER NOT NULL DEFAULT 0;
