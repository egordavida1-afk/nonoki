import { syncKodikCatalog, type KodikSyncResult } from "@/lib/kodik";

export type CatalogSyncResult = {
  kodik: KodikSyncResult | null;
  errors: string[];
};

export async function syncCatalog(): Promise<CatalogSyncResult> {
  const kodikEnabled =
    process.env.KODIK_AUTO_TOKEN?.trim().toLowerCase() !== "false" ||
    Boolean(process.env.KODIK_API_TOKEN?.trim());

  const errors: string[] = [];
  let kodik: CatalogSyncResult["kodik"] = null;

  if (kodikEnabled) {
    try {
      kodik = await syncKodikCatalog();
    } catch (error) {
      errors.push(`Kodik: ${error instanceof Error ? error.message : "Ошибка Kodik"}`);
    }
  }

  return { kodik, errors };
}