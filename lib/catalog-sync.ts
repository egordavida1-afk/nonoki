import { syncTmdbCatalog, type TmdbSyncResult } from "@/lib/tmdb";
import { syncKodikCatalog, type KodikSyncResult } from "@/lib/kodik";

export type CatalogSyncResult = {
  kodik: KodikSyncResult | null;
  tmdb: TmdbSyncResult | null;
  errors: string[];
};

export async function syncCatalog(): Promise<CatalogSyncResult> {
  const kodikEnabled =
    process.env.KODIK_AUTO_TOKEN?.trim().toLowerCase() !== "false" ||
    Boolean(process.env.KODIK_API_TOKEN?.trim());

  const errors: string[] = [];
  let kodik: CatalogSyncResult["kodik"] = null;
  let tmdb: CatalogSyncResult["tmdb"] = null;

  if (kodikEnabled) {
    try {
      kodik = await syncKodikCatalog();
    } catch (error) {
      errors.push(`Kodik: ${error instanceof Error ? error.message : "Ошибка Kodik"}`);
    }
  }

  if (process.env.TMDB_API_READ_ACCESS_TOKEN?.trim() || process.env.TMDB_API_TOKEN?.trim()) {
    try {
      tmdb = await syncTmdbCatalog();
    } catch (error) {
      errors.push(`TMDB: ${error instanceof Error ? error.message : "Ошибка TMDB"}`);
    }
  }

  return { kodik, tmdb, errors };
}
