import type { ProductionPreset } from "../contracts";

/**
 * Ship-with-the-app production templates (t/m). Merged at runtime with user presets.
 */
export const BUILTIN_PRODUCTION_PRESETS: readonly ProductionPreset[] = [
  {
    id: "builtin-mining-starter",
    name: "Starter ores & fuel",
    category: "Mining",
    isBuiltin: true,
    production: {
      ironOre: 120,
      copperOre: 60,
      coal: 80,
      limestone: 40,
      rock: 96,
    },
    productionExtraIds: [],
  },
  {
    id: "builtin-smelting-basic",
    name: "Basic metals",
    category: "Smelting",
    isBuiltin: true,
    production: {
      iron: 48,
      copper: 24,
      steel: 12,
    },
    productionExtraIds: [],
  },
  {
    id: "builtin-construction-core",
    name: "Building materials",
    category: "Construction",
    isBuiltin: true,
    production: {
      cement: 72,
      steel: 24,
      concreteSlab: 64,
    },
    productionExtraIds: [],
  },
  {
    id: "builtin-petro-mid",
    name: "Oil & polymers",
    category: "Petrochemical",
    isBuiltin: true,
    production: {
      diesel: 48,
      plastic: 32,
      rubber: 24,
    },
    productionExtraIds: [],
  },
  {
    id: "builtin-electronics-line",
    name: "Glass & electronics",
    category: "Electronics",
    isBuiltin: true,
    production: {
      glass: 48,
      electronics: 12,
    },
    productionExtraIds: [],
  },
];
