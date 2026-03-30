import type { ResourcesMap } from "../../contracts";
import { naturalResources } from "./natural";
import { semiProcessedResources } from "./semi-processed";
import { craftedResources } from "./crafted";
import { foodMedicalResources } from "./food-medical";
import { petrochemicalResources } from "./petrochemical";
import { powerNuclearResources } from "./power-nuclear";
import { wastePollutionResources } from "./waste-pollution";

/** Ordered layers used for picker grouping (natural → … → waste). */
export const RESOURCE_SEGMENTS: readonly {
  level: number;
  groupLabel: string;
  map: ResourcesMap;
}[] = [
  { level: 1, groupLabel: "Natural", map: naturalResources },
  { level: 2, groupLabel: "Semi-processed", map: semiProcessedResources },
  { level: 3, groupLabel: "Crafted", map: craftedResources },
  { level: 4, groupLabel: "Food & Medical", map: foodMedicalResources },
  { level: 5, groupLabel: "Petrochemical", map: petrochemicalResources },
  { level: 6, groupLabel: "Power & Nuclear", map: powerNuclearResources },
  { level: 7, groupLabel: "Waste & Pollution", map: wastePollutionResources },
];

/** Full game resource graph (from wiki Cargo RecipesImport). */
export const resources: ResourcesMap = Object.assign(
  {},
  ...RESOURCE_SEGMENTS.map((s) => s.map),
);

export interface ResourcePickerGroup {
  label: string;
  entries: { id: string; label: string }[];
}

/**
 * Groups for the target-resource dropdown: level headers, A–Z within each group.
 */
export function getResourcePickerGroups(): ResourcePickerGroup[] {
  return RESOURCE_SEGMENTS.map((seg) => ({
    label: `Level ${seg.level} — ${seg.groupLabel}`,
    entries: Object.entries(seg.map)
      .map(([id, res]) => ({ id, label: res.label }))
      .sort((a, b) => a.label.localeCompare(b.label, "en")),
  }));
}

/**
 * Flat list in the same order as the picker (group order, then label order).
 */
export function getResourceEntriesInPickerOrder(): { id: string; label: string }[] {
  return getResourcePickerGroups().flatMap((g) => g.entries);
}

let cachedConsumedInputIds: ReadonlySet<string> | undefined;

/**
 * Resource IDs that appear as an input to at least one recipe somewhere in the graph.
 * Resources that are only produced (e.g. unusable raw materials with no downstream use)
 * are omitted from this set and can be hidden from palette-style UIs.
 */
export function getResourceIdsConsumedInRecipes(): ReadonlySet<string> {
  if (cachedConsumedInputIds) return cachedConsumedInputIds;
  const ids = new Set<string>();
  for (const def of Object.values(resources)) {
    for (const recipe of def.recipes) {
      for (const inputId of Object.keys(recipe.inputs)) {
        ids.add(inputId);
      }
    }
  }
  cachedConsumedInputIds = ids;
  return ids;
}
