import type { ResourcesMap } from "../../contracts";

export const naturalResources: ResourcesMap = {
  bauxite: {
    label: "Bauxite",
    unit: "t/m",
    wikiUrl: "https://wiki.coigame.com/Bauxite",
    recipes: [
    ],
  },
  coal: {
    label: "Coal",
    unit: "t/m",
    wikiUrl: "https://wiki.coigame.com/Coal",
    recipes: [
      {
        name: "Coal maker: CharcoalBurning",
        building: "Coal maker",
        durationSec: 40,
        inputs: {"wood":12},
        outputs: {"coal":5,"exhaust":4},
      },
    ],
  },
  copperOre: {
    label: "Copper Ore",
    unit: "t/m",
    wikiUrl: "https://wiki.coigame.com/Copper_Ore",
    recipes: [
    ],
  },
  dirt: {
    label: "Dirt",
    unit: "t/m",
    wikiUrl: "https://wiki.coigame.com/Dirt",
    recipes: [
      {
        name: "Mixer: DirtMixing",
        building: "Mixer",
        durationSec: 20,
        inputs: {"gravel":8,"compost":8},
        outputs: {"dirt":16},
      },
      {
        name: "Mixer II: DirtMixingT2",
        building: "Mixer II",
        durationSec: 10,
        inputs: {"gravel":8,"compost":8},
        outputs: {"dirt":16},
      },
    ],
  },
  goldOre: {
    label: "Gold Ore",
    unit: "t/m",
    wikiUrl: "https://wiki.coigame.com/Gold_Ore",
    recipes: [
    ],
  },
  ironOre: {
    label: "Iron Ore",
    unit: "t/m",
    wikiUrl: "https://wiki.coigame.com/Iron_Ore",
    recipes: [
    ],
  },
  limestone: {
    label: "Limestone",
    unit: "t/m",
    wikiUrl: "https://wiki.coigame.com/Limestone",
    recipes: [
    ],
  },
  quartz: {
    label: "Quartz",
    unit: "t/m",
    wikiUrl: "https://wiki.coigame.com/Quartz",
    recipes: [
    ],
  },
  rock: {
    label: "Rock",
    unit: "t/m",
    wikiUrl: "https://wiki.coigame.com/Rock",
    recipes: [
    ],
  },
  sand: {
    label: "Sand",
    unit: "t/m",
    wikiUrl: "https://wiki.coigame.com/Sand",
    recipes: [
      {
        name: "Crusher: QuartzMilling",
        building: "Crusher",
        durationSec: 60,
        inputs: {"quartzCrushed":16},
        outputs: {"sand":16},
      },
      {
        name: "Crusher (large): QuartzMillingT2",
        building: "Crusher (large)",
        durationSec: 60,
        inputs: {"quartzCrushed":96},
        outputs: {"sand":96},
      },
    ],
  },
  seawater: {
    label: "Seawater",
    unit: "t/m",
    wikiUrl: "https://wiki.coigame.com/Seawater",
    recipes: [
      {
        name: "Seawater pump: OceanWaterPumping",
        building: "Seawater pump",
        durationSec: 10,
        inputs: {},
        outputs: {"seawater":18},
      },
      {
        name: "Seawater pump: OceanWaterPumping2x",
        building: "Seawater pump",
        durationSec: 5,
        inputs: {},
        outputs: {"seawater":18},
      },
      {
        name: "Seawater pump (tall): OceanWaterPumping2xT2",
        building: "Seawater pump (tall)",
        durationSec: 5,
        inputs: {},
        outputs: {"seawater":18},
      },
      {
        name: "Seawater pump (tall): OceanWaterPumpingT2",
        building: "Seawater pump (tall)",
        durationSec: 10,
        inputs: {},
        outputs: {"seawater":18},
      },
    ],
  },
  sulfur: {
    label: "Sulfur",
    unit: "t/m",
    wikiUrl: "https://wiki.coigame.com/Sulfur",
    recipes: [
      {
        name: "Exhaust scrubber: ExhaustFiltering",
        building: "Exhaust scrubber",
        durationSec: 40,
        inputs: {"exhaust":160,"water":16},
        outputs: {"sulfur":4,"carbonDioxide":64,"steamLow":16,"airPollution":16},
      },
      {
        name: "Exhaust scrubber: ExhaustFilteringLime",
        building: "Exhaust scrubber",
        durationSec: 20,
        inputs: {"exhaust":160,"water":16,"limestone":3},
        outputs: {"sulfur":4,"carbonDioxide":64,"steamLow":16,"slag":3},
      },
      {
        name: "Sour water stripper: SourWaterStripping",
        building: "Sour water stripper",
        durationSec: 20,
        inputs: {"sourWater":12,"steamHigh":1},
        outputs: {"sulfur":3,"ammonia":3,"water":7},
      },
    ],
  },
  titaniumOre: {
    label: "Titanium Ore",
    unit: "t/m",
    wikiUrl: "https://wiki.coigame.com/Titanium_Ore",
    recipes: [
    ],
  },
  uraniumOre: {
    label: "Uranium Ore",
    unit: "t/m",
    wikiUrl: "https://wiki.coigame.com/Uranium_Ore",
    recipes: [
    ],
  },
  water: {
    label: "Water",
    unit: "t/m",
    wikiUrl: "https://wiki.coigame.com/Water",
    recipes: [
      {
        name: "Basic distiller: WaterDesalinationBasic",
        building: "Basic distiller",
        durationSec: 10,
        inputs: {"seawater":10,"coal":1},
        outputs: {"water":6,"brine":4,"exhaust":2},
      },
      {
        name: "Chemical plant II: CarbonToEthanolProduction",
        building: "Chemical plant II",
        durationSec: 20,
        inputs: {"hydrogen":12,"carbonDioxide":9},
        outputs: {"ethanol":6,"water":3},
      },
      {
        name: "Chemical plant II: FuelGasSynthesis",
        building: "Chemical plant II",
        durationSec: 30,
        inputs: {"hydrogen":14,"carbonDioxide":12},
        outputs: {"fuelGas":12,"water":1},
      },
      {
        name: "Cooling tower: SteamDepletedCondensation",
        building: "Cooling tower",
        durationSec: 10,
        inputs: {"steamDepleted":4},
        outputs: {"water":2},
      },
      {
        name: "Cooling tower: SteamHpCondensation",
        building: "Cooling tower",
        durationSec: 10,
        inputs: {"steamHigh":4},
        outputs: {"water":2},
      },
      {
        name: "Cooling tower: SteamLpCondensation",
        building: "Cooling tower",
        durationSec: 10,
        inputs: {"steamLow":4},
        outputs: {"water":2},
      },
      {
        name: "Cooling tower (large): SteamDepletedCondensationT2",
        building: "Cooling tower (large)",
        durationSec: 10,
        inputs: {"steamDepleted":16},
        outputs: {"water":12},
      },
      {
        name: "Cooling tower (large): SteamHpCondensationT2",
        building: "Cooling tower (large)",
        durationSec: 10,
        inputs: {"steamHigh":16},
        outputs: {"water":10},
      },
      {
        name: "Cooling tower (large): SteamLpCondensationT2",
        building: "Cooling tower (large)",
        durationSec: 10,
        inputs: {"steamLow":16},
        outputs: {"water":12},
      },
      {
        name: "Cooling tower (large): SteamSpCondensationT2",
        building: "Cooling tower (large)",
        durationSec: 10,
        inputs: {"steamSuper":16},
        outputs: {"water":8},
      },
      {
        name: "Cracking unit: FuelGasReforming",
        building: "Cracking unit",
        durationSec: 20,
        inputs: {"fuelGas":12,"oxygen":6},
        outputs: {"diesel":8,"water":2},
      },
      {
        name: "Data center: BasicServerRack",
        building: "Data center",
        durationSec: 60,
        inputs: {"chilledWater":24,"maintenanceIii":42,"electricity":4080},
        outputs: {"water":24,"computing":192},
      },
      {
        name: "Groundwater pump: LandWaterPumping",
        building: "Groundwater pump",
        durationSec: 10,
        inputs: {},
        outputs: {"water":8},
      },
      {
        name: "Rainwater harvester: RainwaterHarvester",
        building: "Rainwater harvester",
        durationSec: 720,
        inputs: {},
        outputs: {"water":37},
      },
      {
        name: "Sour water stripper: SourWaterStripping",
        building: "Sour water stripper",
        durationSec: 20,
        inputs: {"sourWater":12,"steamHigh":1},
        outputs: {"sulfur":3,"ammonia":3,"water":7},
      },
      {
        name: "Thermal desalinator: DesalinationFromDepleted",
        building: "Thermal desalinator",
        durationSec: 20,
        inputs: {"seawater":5,"steamDepleted":8},
        outputs: {"water":11,"brine":2},
      },
      {
        name: "Thermal desalinator: DesalinationFromHP",
        building: "Thermal desalinator",
        durationSec: 10,
        inputs: {"seawater":18,"steamHigh":2},
        outputs: {"water":13,"brine":7},
      },
      {
        name: "Thermal desalinator: DesalinationFromLP",
        building: "Thermal desalinator",
        durationSec: 10,
        inputs: {"seawater":12,"steamLow":4},
        outputs: {"water":12,"brine":4},
      },
      {
        name: "Thermal desalinator: DesalinationFromSP",
        building: "Thermal desalinator",
        durationSec: 10,
        inputs: {"seawater":18,"steamSuper":1},
        outputs: {"water":12,"brine":7},
      },
      {
        name: "Wastewater treatment: ToxicSlurryTreatment",
        building: "Wastewater treatment",
        durationSec: 20,
        inputs: {"toxicSlurry":36,"filterMedia":2,"brine":6},
        outputs: {"water":12,"slag":20},
      },
      {
        name: "Wastewater treatment: WaterTreatment",
        building: "Wastewater treatment",
        durationSec: 30,
        inputs: {"wasteWater":80,"sand":4,"chlorine":4},
        outputs: {"water":40,"sludge":12},
      },
      {
        name: "Wastewater treatment: WaterTreatmentT2",
        building: "Wastewater treatment",
        durationSec: 30,
        inputs: {"wasteWater":80,"filterMedia":4,"chlorine":8},
        outputs: {"water":60,"sludge":18},
      },
    ],
  },
  wood: {
    label: "Wood",
    unit: "t/m",
    wikiUrl: "https://wiki.coigame.com/Wood",
    recipes: [
    ],
  },
};
