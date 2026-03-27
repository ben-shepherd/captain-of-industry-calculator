import type { ResourcesMap } from "../../contracts";
import { naturalResources } from "./natural";
import { semiProcessedResources } from "./semi-processed";
import { craftedResources } from "./crafted";
import { foodMedicalResources } from "./food-medical";
import { petrochemicalResources } from "./petrochemical";
import { powerNuclearResources } from "./power-nuclear";
import { wastePollutionResources } from "./waste-pollution";

/** Ordered layers used for picker grouping (natural → … → waste). */
const RESOURCE_SEGMENTS: readonly {
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
