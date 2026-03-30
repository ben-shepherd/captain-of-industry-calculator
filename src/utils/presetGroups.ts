import type { ProductionPreset } from '../../assets/js/contracts';

const PRESET_CATEGORY_ORDER = [
  'Mining',
  'Smelting',
  'Construction',
  'Petrochemical',
  'Electronics',
  'Mid — Chemicals',
  'Mid — Metals & alloys',
  'Mid — Construction & maintenance',
  'Mid — Electronics',
  'Mid — Petrochemical',
  'Late — Nuclear & power',
  'Late — Microchips & computing',
  'Late — High-tier construction',
  'Late — Vehicles & space',
  'Saved',
];

const PRESET_CATEGORY_RANK = new Map(
  PRESET_CATEGORY_ORDER.map((c, i) => [c, i]),
);

function presetCategoryLabel(p: ProductionPreset): string {
  return p.category ?? 'Saved';
}

function sortCategoryLabels(categories: string[]): string[] {
  const fallback = PRESET_CATEGORY_ORDER.length;
  return [...categories].sort((a, b) => {
    const ra = PRESET_CATEGORY_RANK.get(a) ?? fallback;
    const rb = PRESET_CATEGORY_RANK.get(b) ?? fallback;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b, 'en');
  });
}

/** Group presets by category for `<optgroup>` rendering. */
export function groupProductionPresets(presets: readonly ProductionPreset[]): {
  category: string;
  presets: ProductionPreset[];
}[] {
  const categories = sortCategoryLabels([
    ...new Set(presets.map(presetCategoryLabel)),
  ]);
  return categories
    .map((cat) => ({
      category: cat,
      presets: presets
        .filter((p) => presetCategoryLabel(p) === cat)
        .sort((a, b) => a.name.localeCompare(b.name, 'en')),
    }))
    .filter((g) => g.presets.length > 0);
}
