import { syncKodikCatalog } from "./lib/kodik";

async function main() {
  const result = await syncKodikCatalog();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
