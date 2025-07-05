/*
  Warnings:

  - You are about to drop the `conversations` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[filename]` on the table `files` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_fileId_fkey";

-- DropTable
DROP TABLE "conversations";

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chatSessionId" TEXT NOT NULL,
    "context" JSONB,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ChatSessionFiles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ChatSessionFiles_AB_unique" ON "_ChatSessionFiles"("A", "B");

-- CreateIndex
CREATE INDEX "_ChatSessionFiles_B_index" ON "_ChatSessionFiles"("B");

-- CreateIndex
CREATE UNIQUE INDEX "files_filename_key" ON "files"("filename");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatSessionFiles" ADD CONSTRAINT "_ChatSessionFiles_A_fkey" FOREIGN KEY ("A") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatSessionFiles" ADD CONSTRAINT "_ChatSessionFiles_B_fkey" FOREIGN KEY ("B") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
