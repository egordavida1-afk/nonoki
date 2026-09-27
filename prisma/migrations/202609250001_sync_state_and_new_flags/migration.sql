ALTER TABLE "Anime"
ADD COLUMN "isNew" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "markedNewAt" TIMESTAMP(3);

CREATE INDEX "Anime_isNew_markedNewAt_idx"
ON "Anime"("isNew", "markedNewAt");

CREATE TABLE "SyncState" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "cursor" TEXT,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "lastStartedAt" TIMESTAMP(3),
    "lastCompletedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SyncState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SyncState_source_key"
ON "SyncState"("source");
