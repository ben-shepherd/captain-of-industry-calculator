/**
 * Resource definitions for the Captain of Industry calculator.
 *
 * Structure:
 *   resources.<id> = {
 *     label   – Human-readable display name
 *     unit    – Unit of measurement (default: "t/m" = tons per minute)
 *     recipes – Array of possible recipes that produce this resource.
 *               Each recipe contains:
 *                 name   – Descriptive recipe name
 *                 output – Amount produced per minute
 *                 inputs – Map of resource id → amount consumed per minute
 *   }
 *
 * Design notes:
 *   • A resource can have zero recipes (raw / mined material).
 *   • A resource can have multiple recipes (alternative production paths).
 *   • inputs reference other resource ids, keeping the graph self-contained.
 */

export const resources = {
  ore: {
    label: "Iron Ore",
    unit: "t/m",
    recipes: [],
  },

  iron: {
    label: "Iron",
    unit: "t/m",
    recipes: [
      {
        name: "Smelt iron ore",
        output: 24,
        inputs: {
          ore: 24,
        },
      },
    ],
  },

  steel: {
    label: "Steel",
    unit: "t/m",
    recipes: [
      {
        name: "Smelt iron into steel",
        output: 12,
        inputs: {
          iron: 24,
        },
      },
    ],
  },
};
