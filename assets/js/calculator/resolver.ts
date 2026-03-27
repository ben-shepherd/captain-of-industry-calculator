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
  const tree = buildTree(resourceId, amount, recipeIdx, totals, new Set());
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
  stack: Set<string>,
): DependencyNode {
  const resource = resources[id];

  if (!resource) {
    throw new Error(`Unknown resource: "${id}"`);
  }

  /** Break recipe cycles (game graph has feedback loops) by treating as a leaf. */
  if (stack.has(id)) {
    totals[id] = (totals[id] ?? 0) + amount;
    return { id, label: resource.label, amount, children: [] };
  }

  const recipe = resource.recipes[recipeIdx];

  if (!recipe) {
    totals[id] = (totals[id] ?? 0) + amount;
    return { id, label: resource.label, amount, children: [] };
  }

  const produced = recipe.outputs[id] ?? 0;
  if (produced <= 0) {
    throw new Error(
      `Recipe "${recipe.name}" does not list output "${id}" in outputs`,
    );
  }

  stack.add(id);
  try {
    /** Per-cycle ratios: inputRate = inputQty * targetRate / producedQty */
    const children = Object.entries(recipe.inputs).map(
      ([inputId, inputAmount]) =>
        buildTree(
          inputId,
          (inputAmount * amount) / produced,
          0,
          totals,
          stack,
        ),
    );
    return { id, label: resource.label, amount, children };
  } finally {
    stack.delete(id);
  }
}
