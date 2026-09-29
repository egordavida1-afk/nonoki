import { syncKodikCatalog, type KodikSyncResult } from "@/lib/kodik";

export type CatalogSyncResult = {
  kodik: KodikSyncResult | null;
  errors: string[];
};

export async function syncCatalog(): Promise<CatalogSyncResult> {
  const errors: string[] = [];
  let kodik: CatalogSyncResult["kodik"] = null;

  if (process.env.KODIK_AUTO_TOKEN?.trim()) {
    try {
      kodik = await syncKodikCatalog();
    } catch (error) {
      errors.push(`Kodik: ${error instanceof Error ? error.message : "Ошибка Kodik"}`);
    }
  }

  return { kodik, errors };
}
