import type { ResourceDef } from '../../assets/js/contracts';

export type CanvasResourceTooltipContext = {
  level: number;
  groupLabel: string;
};

export type CanvasResourceTooltipModel = {
  label: string;
  resourceId: string;
  recipeLine: string;
  unitLine: string;
  categoryLine: string;
  buildingsLine: string | null;
};

function uniqueBuildingNames(def: ResourceDef): string[] {
  return [...new Set(def.recipes.map((r) => r.building))];
}

export function buildCanvasResourceTooltipModel(
  resourceId: string,
  def: ResourceDef,
  ctx: CanvasResourceTooltipContext,
): CanvasResourceTooltipModel {
  const n = def.recipes.length;
  const recipeLine = `${n} ${n === 1 ? 'recipe' : 'recipes'} available`;

  const buildings = uniqueBuildingNames(def);
  let buildingsLine: string | null = null;
  if (buildings.length > 0) {
    const maxShow = 5;
    if (buildings.length <= maxShow) {
      buildingsLine = buildings.join(' · ');
    } else {
      buildingsLine = `${buildings.slice(0, maxShow).join(' · ')} · +${buildings.length - maxShow} more`;
    }
  }

  return {
    label: def.label,
    resourceId,
    recipeLine,
    unitLine: `Unit: ${def.unit}`,
    categoryLine: `Level ${ctx.level} — ${ctx.groupLabel}`,
    buildingsLine,
  };
}

export function canvasResourceAriaSummary(model: CanvasResourceTooltipModel): string {
  const parts = [model.label, model.recipeLine, model.unitLine, model.categoryLine];
  if (model.buildingsLine) parts.push(`Buildings: ${model.buildingsLine}`);
  return parts.join('. ');
}
