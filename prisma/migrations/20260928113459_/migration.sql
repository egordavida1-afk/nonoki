/*
  Warnings:

  - You are about to drop the column `newReleaseOrder` on the `Anime` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Anime_isNew_newReleaseOrder_markedNewAt_idx";

-- AlterTable
ALTER TABLE "Anime" DROP COLUMN "newReleaseOrder";
