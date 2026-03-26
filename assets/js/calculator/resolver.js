import { resources } from "../data/resources.js";

/**
 * Resolve the full dependency chain for a given resource and desired amount.
 *
 * @param {string} resourceId  – Key in the resources map (e.g. "steel")
 * @param {number} amount      – Desired output per minute
 * @param {number} [recipeIdx] – Which recipe to use when multiple exist (default: 0)
 * @returns {{ totals: Record<string, number>, tree: DependencyNode }}
 *
 * totals – Flat map of every base resource id → total amount required.
 * tree   – Recursive tree mirroring the production chain.
 *
 * @typedef {Object} DependencyNode
 * @property {string}  id       – Resource id
 * @property {string}  label    – Human-readable name
 * @property {number}  amount   – Amount required at this point in the chain
 * @property {DependencyNode[]} children – Inputs needed by the chosen recipe
 */

const cache = new Map();

export function resolve(resourceId, amount, recipeIdx = 0) {
  const key = `${resourceId}|${amount}|${recipeIdx}`;
  if (cache.has(key)) return cache.get(key);

  const totals = {};
  const tree = buildTree(resourceId, amount, recipeIdx, totals);
  const result = { totals, tree };

  cache.set(key, result);
  return result;
}

/** Flush the resolve cache (call when resource data changes). */
export function clearResolveCache() {
  cache.clear();
}

/**
 * Recursively walk the recipe graph, accumulating totals and building a tree.
 *
 * @param {string} id
 * @param {number} amount
 * @param {number} recipeIdx
 * @param {Record<string, number>} totals – Mutated accumulator for flat totals
 * @returns {DependencyNode}
 */
function buildTree(id, amount, recipeIdx, totals) {
  const resource = resources[id];

  if (!resource) {
    throw new Error(`Unknown resource: "${id}"`);
  }

  const recipe = resource.recipes[recipeIdx];

  // Base resource (no recipe) — accumulate and return a leaf node.
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
