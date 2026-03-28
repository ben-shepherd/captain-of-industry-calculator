import { resources } from '../data/resources';
import type { DependencyNode, ResolveResult } from '../contracts';
import { indexOfFirstProducingRecipe } from './recipePick';

const cache = new Map<string, ResolveResult>();

/** Stop expanding past this many ancestors on a path (avoids combinatorial blow-ups). */
const MAX_EXPANSION_PATH = 32;

export type ResolveMode = 'direct' | 'full';

/**
 * Resolves the selected target recipe. In **`direct`** mode, only immediate recipe
 * inputs are listed in `totals` and the tree is one level deep under the root.
 * In **`full`** mode, `totals` are **leaf-only** requirements (aggregated), and the
 * tree expands through the default production recipe at each node.
 */
export function resolve(
  resourceId: string,
  amount: number,
  recipeIdx = 0,
  mode: ResolveMode = 'direct',
): ResolveResult {
  const key = `${resourceId}|${amount}|${recipeIdx}|${mode}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const result =
    mode === 'full'
      ? buildExpanded(resourceId, amount, recipeIdx)
      : buildDirect(resourceId, amount, recipeIdx);
  cache.set(key, result);
  return result;
}

/** Flush the resolve cache (call when resource data changes). */
export function clearResolveCache(): void {
  cache.clear();
}

function mergeTotals(
  into: Record<string, number>,
  from: Record<string, number>,
): void {
  for (const [k, v] of Object.entries(from)) {
    into[k] = (into[k] ?? 0) + v;
  }
}

interface ExpandedNode {
  tree: DependencyNode;
  leafTotals: Record<string, number>;
}

function leafExpanded(id: string, amount: number): ExpandedNode {
  const def = resources[id];
  return {
    tree: {
      id,
      label: def?.label ?? id,
      amount,
      children: [],
    },
    leafTotals: { [id]: amount },
  };
}

function leafResolveResult(id: string, amount: number): ResolveResult {
  const { tree, leafTotals } = leafExpanded(id, amount);
  return { totals: leafTotals, tree };
}

/**
 * Recursively expand `id` at `amount` t/m using the recipe at `recipeIdx` when
 * provided, otherwise the first recipe that outputs `id`. Stops at extractors,
 * raw resources, cycles, or missing producers.
 */
function expandNode(
  id: string,
  amount: number,
  ancestors: Set<string>,
): ExpandedNode {
  if (ancestors.size >= MAX_EXPANSION_PATH) {
    return leafExpanded(id, amount);
  }

  if (ancestors.has(id)) {
    return leafExpanded(id, amount);
  }

  const resource = resources[id];
  if (!resource) {
    throw new Error(`Unknown resource: "${id}"`);
  }

  const idx = indexOfFirstProducingRecipe(id);

  if (idx === null) {
    return leafExpanded(id, amount);
  }

  const recipe = resource.recipes[idx];
  if (!recipe) {
    return leafExpanded(id, amount);
  }

  const produced = recipe.outputs[id] ?? 0;
  if (produced <= 0) {
    return leafExpanded(id, amount);
  }

  const inputEntries = Object.entries(recipe.inputs);

  if (inputEntries.length === 0) {
    return leafExpanded(id, amount);
  }

  const nextAncestors = new Set(ancestors).add(id);
  const children: DependencyNode[] = [];
  const leafTotals: Record<string, number> = {};

  for (const [inputId, inputAmount] of inputEntries) {
    const rate = (inputAmount * amount) / produced;
    const sub = expandNode(inputId, rate, nextAncestors);
    children.push(sub.tree);
    mergeTotals(leafTotals, sub.leafTotals);
  }

  return {
    tree: {
      id,
      label: resource.label,
      amount,
      children,
    },
    leafTotals,
  };
}

function buildExpanded(
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
    return leafResolveResult(id, amount);
  }

  const produced = recipe.outputs[id] ?? 0;
  if (produced <= 0) {
    throw new Error(
      `Recipe "${recipe.name}" does not list output "${id}" in outputs`,
    );
  }

  const inputEntries = Object.entries(recipe.inputs);

  if (inputEntries.length === 0) {
    return leafResolveResult(id, amount);
  }

  const ancestors = new Set<string>().add(id);
  const children: DependencyNode[] = [];
  const leafTotals: Record<string, number> = {};

  for (const [inputId, inputAmount] of inputEntries) {
    const rate = (inputAmount * amount) / produced;
    const sub = expandNode(inputId, rate, ancestors);
    children.push(sub.tree);
    mergeTotals(leafTotals, sub.leafTotals);
  }

  return {
    totals: leafTotals,
    tree: {
      id,
      label: resource.label,
      amount,
      children,
    },
  };
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
