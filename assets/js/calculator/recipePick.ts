import { resources } from '../data/resources';

/**
 * Index of the first recipe that outputs `resourceId` positively, or `null` if none.
 */
export function indexOfFirstProducingRecipe(resourceId: string): number | null {
  const def = resources[resourceId];
  if (!def?.recipes?.length) return null;
  const i = def.recipes.findIndex((r) => (r.outputs[resourceId] ?? 0) > 0);
  return i >= 0 ? i : null;
}
