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
  {
    id: "builtin-mid-chemicals-hub",
    name: "Industrial gases hub",
    category: "Mid — Chemicals",
    isBuiltin: true,
    production: {
      hydrogen: 48,
      oxygen: 48,
      nitrogen: 36,
      chlorine: 24,
    },
    productionExtraIds: [],
  },
  {
    id: "builtin-mid-refinery-light-ends",
    name: "Refinery & light ends",
    category: "Mid — Petrochemical",
    isBuiltin: true,
    production: {
      fuelGas: 40,
      naphtha: 32,
      diesel: 48,
      heavyOil: 28,
    },
    productionExtraIds: [],
  },
  {
    id: "builtin-mid-aluminum-gold",
    name: "Aluminum & precious metals",
    category: "Mid — Metals & alloys",
    isBuiltin: true,
    production: {
      aluminum: 36,
      gold: 8,
    },
    productionExtraIds: [],
  },
  {
    id: "builtin-mid-construction-tier2",
    name: "Tier 2 industry",
    category: "Mid — Construction & maintenance",
    isBuiltin: true,
    production: {
      constructionParts: 24,
      constructionPartsIi: 16,
      maintenanceI: 20,
      maintenanceIi: 12,
    },
    productionExtraIds: [],
  },
  {
    id: "builtin-mid-electronics-advanced",
    name: "Boards & silicon",
    category: "Mid — Electronics",
    isBuiltin: true,
    production: {
      electronicsIi: 16,
      pcb: 20,
      siliconWafer: 24,
    },
    productionExtraIds: [],
  },
  {
    id: "builtin-late-nuclear-power",
    name: "Fuel & generation",
    category: "Late — Nuclear & power",
    isBuiltin: true,
    production: {
      electricity: 20000,
      yellowcake: 10,
      uraniumRod: 6,
    },
    productionExtraIds: [],
  },
  {
    id: "builtin-late-microchips-computing",
    name: "Advanced silicon",
    category: "Late — Microchips & computing",
    isBuiltin: true,
    production: {
      microchips: 8,
      computing: 12,
      server: 6,
    },
    productionExtraIds: [],
  },
  {
    id: "builtin-late-construction-tier4",
    name: "Tier IV industry",
    category: "Late — High-tier construction",
    isBuiltin: true,
    production: {
      constructionPartsIii: 12,
      constructionPartsIv: 8,
      maintenanceIii: 10,
    },
    productionExtraIds: [],
  },
  {
    id: "builtin-late-vehicles-space",
    name: "Endgame assemblies",
    category: "Late — Vehicles & space",
    isBuiltin: true,
    production: {
      vehiclePartsIii: 10,
      stationParts: 6,
      spaceProbeParts: 4,
    },
    productionExtraIds: [],
  },
];
