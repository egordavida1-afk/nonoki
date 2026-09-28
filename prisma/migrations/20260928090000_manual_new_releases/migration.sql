ALTER TABLE "Anime" ADD COLUMN "newReleaseOrder" INTEGER;

CREATE INDEX "Anime_isNew_newReleaseOrder_markedNewAt_idx" ON "Anime"("isNew", "newReleaseOrder", "markedNewAt");
