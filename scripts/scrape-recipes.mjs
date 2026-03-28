/**
 * Fetches all rows from wiki Cargo table RecipesImport and writes scripts/wiki-recipes.json.
 * Resolves File:{label}.png URLs via MediaWiki imageinfo and writes scripts/wiki-resource-images.json.
 * Run: node scripts/scrape-recipes.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "wiki-recipes.json");
const OUT_IMAGES = join(__dirname, "wiki-resource-images.json");

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

const MW_API = "https://wiki.coigame.com/api.php";
const BATCH = 50;
const BATCH_DELAY_MS = 150;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Same field object as build-resources-from-wiki (row.title or flattened row). */
function recipeFields(row) {
  const t = row.title;
  if (t && typeof t === "object" && !Array.isArray(t) && t.Building !== undefined) {
    return t;
  }
  if (t && typeof t === "object" && !Array.isArray(t) && "Input1Name" in t) {
    return t;
  }
  return row;
}

function collectResourceLabels(rows) {
  const labels = new Set();
  for (const row of rows) {
    const r = recipeFields(row);
    if (!r || typeof r !== "object") continue;
    for (let i = 1; i <= 6; i++) {
      const inn = r[`Input${i}Name`];
      const out = r[`Output${i}Name`];
      if (inn && String(inn).trim()) labels.add(String(inn));
      if (out && String(out).trim()) labels.add(String(out));
    }
  }
  return labels;
}

function fileTitleForLabel(label) {
  return `File:${label}.png`;
}

function labelFromFileTitle(wikiTitle) {
  if (!wikiTitle || typeof wikiTitle !== "string") return null;
  if (!wikiTitle.startsWith("File:") || !wikiTitle.endsWith(".png")) return null;
  return wikiTitle.slice("File:".length, -".png".length);
}

function normalizeImageUrl(url) {
  if (!url || typeof url !== "string") return "";
  if (url.startsWith("http://")) return `https://${url.slice("http://".length)}`;
  return url;
}

async function fetchImageUrlsForLabels(labels) {
  const list = [...labels].sort((a, b) => a.localeCompare(b));
  const images = {};
  let resolved = 0;

  for (let i = 0; i < list.length; i += BATCH) {
    const batch = list.slice(i, i + BATCH);
    const titles = batch.map(fileTitleForLabel).join("|");
    const url = `${MW_API}?action=query&format=json&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(titles)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: imageinfo batch`);
    const data = await res.json();
    const pages = data.query?.pages ?? {};
    for (const page of Object.values(pages)) {
      const label = labelFromFileTitle(page.title);
      if (!label) continue;
      const info = page.imageinfo?.[0];
      const u = info?.url;
      if (u) {
        images[label] = normalizeImageUrl(u);
        resolved++;
      }
    }
    if (i + BATCH < list.length) await delay(BATCH_DELAY_MS);
  }

  return { images, resolved, total: list.length };
}

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

  const labels = collectResourceLabels(all);
  console.log(`Resolving images for ${labels.size} unique resource labels…`);
  const { images, resolved, total } = await fetchImageUrlsForLabels(labels);
  writeFileSync(
    OUT_IMAGES,
    JSON.stringify({ fetchedAt: Date.now(), count: total, resolved, images }, null, 2),
    "utf8",
  );
  console.log(`Wrote wiki-resource-images.json (${resolved}/${total} URLs resolved)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
