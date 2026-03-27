/**
 * Fetches all rows from wiki Cargo table RecipesImport and writes scripts/wiki-recipes.json
 * Run: node scripts/scrape-recipes.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "wiki-recipes.json");

const FIELDS = [
  "Building",
  "RecipeId",
  "Input1Name",
  "Input1Qty",
  "Input2Name",
  "Input2Qty",
  "Input3Name",
  "Input3Qty",
  "Input4Name",
  "Input4Qty",
  "Input5Name",
  "Input5Qty",
  "Input6Name",
  "Input6Qty",
  "Time",
  "Output1Name",
  "Output1Qty",
  "Output2Name",
  "Output2Qty",
  "Output3Name",
  "Output3Qty",
  "Output4Name",
  "Output4Qty",
  "Output5Name",
  "Output5Qty",
  "Output6Name",
  "Output6Qty",
].join(",");

const BASE =
  "https://wiki.coigame.com/api.php?action=cargoquery&format=json&tables=RecipesImport";

async function fetchPage(offset) {
  const url = `${BASE}&fields=${encodeURIComponent(FIELDS)}&limit=500&offset=${offset}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const data = await res.json();
  return data;
}

async function main() {
  const all = [];
  let offset = 0;
  for (;;) {
    const data = await fetchPage(offset);
    const rows = data.cargoquery ?? [];
    if (!rows.length) break;
    for (const row of rows) {
      const title = row.title;
      const fields = row.fields ?? {};
      all.push({ title, ...fields });
    }
    if (rows.length < 500) break;
    offset += 500;
  }
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify({ fetchedAt: Date.now(), count: all.length, rows: all }, null, 2), "utf8");
  console.log(`Wrote ${all.length} rows to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
