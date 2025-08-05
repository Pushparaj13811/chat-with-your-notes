/*
  Warnings:

  - You are about to drop the column `cloudinaryPublicId` on the `files` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[publicId]` on the table `files` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "files" DROP COLUMN "cloudinaryPublicId",
ADD COLUMN     "publicId" TEXT,
ADD COLUMN     "url" TEXT,
ALTER COLUMN "path" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "files_publicId_key" ON "files"("publicId");
