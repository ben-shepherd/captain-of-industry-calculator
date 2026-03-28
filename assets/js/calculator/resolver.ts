import { resources } from '../data/resources';
import type { DependencyNode, ResolveResult } from '../contracts';

const cache = new Map<string, ResolveResult>();

/**
 * Resolves the selected target recipe to **direct inputs only** (scaled to the
 * target output rate). No nested recipe expansion — each input appears once in
 * `totals` at the rate required to run the chosen recipe at `amount` t/m output.
 */
export function resolve(
  resourceId: string,
  amount: number,
  recipeIdx = 0,
): ResolveResult {
  const key = `${resourceId}|${amount}|${recipeIdx}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const result = buildDirect(resourceId, amount, recipeIdx);
  cache.set(key, result);
  return result;
}

/** Flush the resolve cache (call when resource data changes). */
export function clearResolveCache(): void {
  cache.clear();
}

function buildDirect(
  id: string,
  amount: number,
  recipeIdx: number,
): ResolveResult {
  const resource = resources[id];

  if (!resource) {
    throw new Error(`Unknown resource: "${id}"`);
  }

  const recipe = resource.recipes[recipeIdx];

  if (!recipe) {
    const totals: Record<string, number> = { [id]: amount };
    const tree: DependencyNode = {
      id,
      label: resource.label,
      amount,
      children: [],
    };
    return { totals, tree };
  }

  const produced = recipe.outputs[id] ?? 0;
  if (produced <= 0) {
    throw new Error(
      `Recipe "${recipe.name}" does not list output "${id}" in outputs`,
    );
  }

  const inputEntries = Object.entries(recipe.inputs);

  /** Extractors / pumps: no upstream inputs — count output as the “base” line. */
  if (inputEntries.length === 0) {
    const totals: Record<string, number> = { [id]: amount };
    const tree: DependencyNode = {
      id,
      label: resource.label,
      amount,
      children: [],
    };
    return { totals, tree };
  }

  const totals: Record<string, number> = {};
  const children: DependencyNode[] = [];

  for (const [inputId, inputAmount] of inputEntries) {
    const rate = (inputAmount * amount) / produced;
    totals[inputId] = (totals[inputId] ?? 0) + rate;
    const inputRes = resources[inputId];
    children.push({
      id: inputId,
      label: inputRes?.label ?? inputId,
      amount: rate,
      children: [],
    });
  }

  const tree: DependencyNode = {
    id,
    label: resource.label,
    amount,
    children,
  };

  return { totals, tree };
}
