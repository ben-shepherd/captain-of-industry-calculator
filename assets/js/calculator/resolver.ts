import { resources } from '../data/resources';
import type { DependencyNode, ResolveResult } from '../contracts';

const cache = new Map<string, ResolveResult>();

export function resolve(
  resourceId: string,
  amount: number,
  recipeIdx = 0,
): ResolveResult {
  const key = `${resourceId}|${amount}|${recipeIdx}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const totals: Record<string, number> = {};
  const tree = buildTree(resourceId, amount, recipeIdx, totals);
  const result: ResolveResult = { totals, tree };

  cache.set(key, result);
  return result;
}

/** Flush the resolve cache (call when resource data changes). */
export function clearResolveCache(): void {
  cache.clear();
}

function buildTree(
  id: string,
  amount: number,
  recipeIdx: number,
  totals: Record<string, number>,
): DependencyNode {
  const resource = resources[id];

  if (!resource) {
    throw new Error(`Unknown resource: "${id}"`);
  }

  const recipe = resource.recipes[recipeIdx];

  if (!recipe) {
    totals[id] = (totals[id] ?? 0) + amount;
    return { id, label: resource.label, amount, children: [] };
  }

  const scale = amount / recipe.output;

  const children = Object.entries(recipe.inputs).map(
    ([inputId, inputAmount]) =>
      buildTree(inputId, inputAmount * scale, 0, totals),
  );

  return { id, label: resource.label, amount, children };
}
