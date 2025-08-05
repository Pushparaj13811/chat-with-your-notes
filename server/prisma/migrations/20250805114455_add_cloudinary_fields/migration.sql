/*
  Warnings:

  - You are about to drop the column `publicId` on the `files` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `files` table. All the data in the column will be lost.
  - Made the column `path` on table `files` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "files_publicId_key";

-- AlterTable
ALTER TABLE "files" DROP COLUMN "publicId",
DROP COLUMN "url",
ADD COLUMN     "cloudinaryPublicId" TEXT,
ADD COLUMN     "cloudinaryUrl" TEXT,
ALTER COLUMN "path" SET NOT NULL;
