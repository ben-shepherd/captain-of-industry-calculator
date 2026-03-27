/**
 * Reads scripts/wiki-recipes.json and emits TypeScript resource modules under assets/js/data/resources/
 * Run: node scripts/build-resources-from-wiki.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const JSON_PATH = join(__dirname, "wiki-recipes.json");
const OUT_DIR = join(ROOT, "assets", "js", "data", "resources");

function displayToId(display) {
  const s = display
    .replace(/\(([^)]*)\)/g, " $1")
    .replace(/%/g, "")
    .trim();
  const words = s.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (words.length === 0) return "unknown";
  return (
    words[0].toLowerCase() +
    words
      .slice(1)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join("")
  );
}

function wikiUrl(display) {
  const title = display
    .replace(/ /g, "_")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/%/g, "%25");
  return `https://wiki.coigame.com/${title}`;
}

const CATEGORY = {
  natural: new Set([
    "bauxite",
    "coal",
    "copperOre",
    "dirt",
    "goldOre",
    "ironOre",
    "limestone",
    "quartz",
    "rock",
    "sand",
    "seawater",
    "sulfur",
    "titaniumOre",
    "uraniumOre",
    "wood",
    "water",
  ]),
  semiProcessed: new Set([
    "alumina",
    "acid",
    "brine",
    "brokenGlass",
    "cement",
    "chilledWater",
    "copperOreCrushed",
    "copperScrap",
    "copperScrapPressed",
    "glassMix",
    "goldOreConcentrate",
    "goldOreCrushed",
    "goldOrePowder",
    "goldScrap",
    "goldScrapPressed",
    "graphite",
    "gravel",
    "hydratedAlumina",
    "impureCopper",
    "ironOreCrushed",
    "ironScrap",
    "ironScrapPressed",
    "manufacturedSand",
    "moltenAluminum",
    "moltenCopper",
    "moltenGlass",
    "moltenIron",
    "moltenSilicon",
    "moltenSteel",
    "moltenTitanium",
    "moltenTitaniumAlloy",
    "quartzCrushed",
    "recyclables",
    "recyclablesPressed",
    "salt",
    "slagCrushed",
    "uraniumOrePowder",
    "woodchips",
    "bauxitePowder",
    "aluminumScrap",
    "aluminumScrapPressed",
    "titaniumOreCrushed",
    "titaniumSlag",
    "titaniumSponge",
    "titaniumChloride",
    "titaniumChloridePure",
    "titaniumAlloy",
    "diamondPaste",
  ]),
  foodMedical: new Set([
    "anesthetics",
    "animalFeed",
    "antibiotics",
    "bread",
    "cake",
    "canola",
    "chickenCarcass",
    "compost",
    "cookingOil",
    "cornMash",
    "corn",
    "disinfectant",
    "eggs",
    "ethanol",
    "fertilizerOrganic",
    "fertilizerI",
    "fertilizerIi",
    "flour",
    "foodPack",
    "fruit",
    "meatTrimmings",
    "meat",
    "medicalEquipment",
    "medicalSupplies",
    "medicalSuppliesIi",
    "medicalSuppliesIii",
    "morphine",
    "poppy",
    "potato",
    "sausage",
    "snack",
    "soybean",
    "sugarCane",
    "sugar",
    "tofu",
    "treeSapling",
    "vegetables",
    "wheat",
  ]),
  petrochemical: new Set([
    "crudeOil",
    "sourWater",
    "heavyOil",
    "mediumOil",
    "diesel",
    "lightOil",
    "fuelGas",
    "naphtha",
    "ammonia",
    "chlorine",
    "hydrogen",
    "nitrogen",
    "oxygen",
    "hydrogenFluoride",
    "plastic",
    "rubber",
  ]),
  powerNuclear: new Set([
    "electricity",
    "mechanicalPower",
    "chemicalFuel",
    "blanketFuel",
    "blanketFuelEnriched",
    "coreFuel",
    "coreFuelSpent",
    "depletedUranium",
    "enrichedUranium20",
    "enrichedUranium4",
    "fissionProduct",
    "moxRod",
    "plutonium",
    "reprocessedUranium1",
    "retiredWaste",
    "spentFuel",
    "spentMox",
    "uraniumRod",
    "yellowcake",
    "steamDepleted",
    "steamHigh",
    "steamLow",
    "steamSuper",
    "compactReactor",
  ]),
  wastePollution: new Set([
    "airPollution",
    "biomass",
    "carbonDioxide",
    "exhaust",
    "radiation",
    "redMud",
    "slag",
    "sludge",
    "toxicSlurry",
    "waste",
    "waterPollution",
    "wastePressed",
    "wasteWater",
  ]),
};

function categoryForId(id) {
  for (const [cat, set] of Object.entries(CATEGORY)) {
    if (set.has(id)) return cat;
  }
  return "crafted";
}

function escapeStr(s) {
  return JSON.stringify(s);
}

function formatRecipe(rec) {
  const inputs = JSON.stringify(rec.inputs);
  const outputs = JSON.stringify(rec.outputs);
  return `      {\n        name: ${escapeStr(rec.name)},\n        building: ${escapeStr(rec.building)},\n        durationSec: ${rec.durationSec},\n        inputs: ${inputs},\n        outputs: ${outputs},\n      }`;
}

function main() {
  const raw = JSON.parse(readFileSync(JSON_PATH, "utf8"));
  const rows = raw.rows;

  const nameToId = new Map();
  const resources = new Map();

  function ensureResource(displayName) {
    if (!displayName) return null;
    let id = nameToId.get(displayName);
    if (!id) {
      id = displayToId(displayName);
      nameToId.set(displayName, id);
    }
    if (!resources.has(id)) {
      resources.set(id, {
        label: displayName,
        wikiUrl: wikiUrl(displayName),
      });
    }
    return id;
  }

  const recipesByResource = new Map();

  function addRecipeForOutputs(recipe) {
    for (const outId of Object.keys(recipe.outputs)) {
      if (!recipesByResource.has(outId)) recipesByResource.set(outId, []);
      recipesByResource.get(outId).push(recipe);
    }
  }

  for (const row of rows) {
    const r = row.title;
    if (!r || typeof r !== "object") continue;

    const building = String(r.Building ?? "");
    const recipeId = String(r.RecipeId ?? "");
    const durationSec = Math.max(1, parseInt(String(r.Time ?? "1"), 10) || 1);

    const inputs = {};
    for (let i = 1; i <= 6; i++) {
      const n = r[`Input${i}Name`];
      const q = parseInt(String(r[`Input${i}Qty`] ?? "0"), 10);
      if (n && q > 0) {
        const id = ensureResource(n);
        inputs[id] = q;
      }
    }

    const outputs = {};
    for (let i = 1; i <= 6; i++) {
      const n = r[`Output${i}Name`];
      const q = parseInt(String(r[`Output${i}Qty`] ?? "0"), 10);
      if (n && q > 0) {
        const id = ensureResource(n);
        outputs[id] = q;
      }
    }

    if (Object.keys(outputs).length === 0) continue;

    const name = `${building}: ${recipeId}`;
    const recipe = {
      name,
      building,
      durationSec,
      inputs,
      outputs,
    };
    addRecipeForOutputs(recipe);
  }

  for (const id of resources.keys()) {
    const list = recipesByResource.get(id) ?? [];
    const seen = new Set();
    const unique = [];
    for (const rec of list) {
      const key = JSON.stringify(rec);
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(rec);
    }
    recipesByResource.set(id, unique);
  }

  const byCat = {
    natural: [],
    semiProcessed: [],
    crafted: [],
    foodMedical: [],
    petrochemical: [],
    powerNuclear: [],
    wastePollution: [],
  };

  const sortedIds = [...resources.keys()].sort((a, b) => a.localeCompare(b));
  for (const id of sortedIds) {
    const meta = resources.get(id);
    const cat = categoryForId(id);
    const key =
      cat === "semiProcessed"
        ? "semiProcessed"
        : cat === "foodMedical"
          ? "foodMedical"
          : cat === "petrochemical"
            ? "petrochemical"
            : cat === "powerNuclear"
              ? "powerNuclear"
              : cat === "wastePollution"
                ? "wastePollution"
                : cat === "natural"
                  ? "natural"
                  : "crafted";
    byCat[key].push({ id, meta, recipes: recipesByResource.get(id) ?? [] });
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const files = [
    { key: "natural", varName: "naturalResources", file: "natural.ts" },
    { key: "semiProcessed", varName: "semiProcessedResources", file: "semi-processed.ts" },
    { key: "crafted", varName: "craftedResources", file: "crafted.ts" },
    { key: "foodMedical", varName: "foodMedicalResources", file: "food-medical.ts" },
    { key: "petrochemical", varName: "petrochemicalResources", file: "petrochemical.ts" },
    { key: "powerNuclear", varName: "powerNuclearResources", file: "power-nuclear.ts" },
    { key: "wastePollution", varName: "wastePollutionResources", file: "waste-pollution.ts" },
  ];

  for (const { key, varName, file } of files) {
    const entries = byCat[key];
    const lines = [];
    lines.push(`import type { ResourcesMap } from "../../contracts";`);
    lines.push("");
    lines.push(`export const ${varName}: ResourcesMap = {`);

    for (const { id, meta, recipes } of entries) {
      lines.push(`  ${id}: {`);
      lines.push(`    label: ${escapeStr(meta.label)},`);
      lines.push(`    unit: "t/m",`);
      lines.push(`    wikiUrl: ${escapeStr(meta.wikiUrl)},`);
      lines.push(`    recipes: [`);
      if (recipes.length === 0) {
        lines.push(`    ],`);
      } else {
        for (const rec of recipes) {
          lines.push(formatRecipe(rec) + ",");
        }
        lines.push(`    ],`);
      }
      lines.push(`  },`);
    }

    lines.push(`};`);
    lines.push("");
    writeFileSync(join(OUT_DIR, file), lines.join("\n"), "utf8");
    console.log(`Wrote ${file} (${entries.length} resources)`);
  }

  const indexLines = [];
  indexLines.push(`import type { ResourcesMap } from "../../contracts";`);
  for (const { varName, file } of files) {
    const base = file.replace(/\.ts$/, "");
    indexLines.push(`import { ${varName} } from "./${base}";`);
  }
  indexLines.push("");
  indexLines.push(`/** Full game resource graph (from wiki Cargo RecipesImport). */`);
  indexLines.push(`export const resources: ResourcesMap = {`);
  for (const { varName } of files) {
    indexLines.push(`  ...${varName},`);
  }
  indexLines.push(`};`);
  indexLines.push("");
  writeFileSync(join(OUT_DIR, "index.ts"), indexLines.join("\n"), "utf8");
  console.log("Wrote index.ts");
  console.log(`Total resources: ${sortedIds.length}`);
}

main();
