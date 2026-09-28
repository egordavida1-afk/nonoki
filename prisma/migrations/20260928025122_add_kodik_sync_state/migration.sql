-- AlterTable
ALTER TABLE "Anime" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SiteSettings" ALTER COLUMN "id" SET DEFAULT 'global';

-- CreateTable
CREATE TABLE "KodikSyncState" (
    "id" TEXT NOT NULL,
    "typeGroup" TEXT NOT NULL,
    "nextPage" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KodikSyncState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KodikSyncState_typeGroup_key" ON "KodikSyncState"("typeGroup");
