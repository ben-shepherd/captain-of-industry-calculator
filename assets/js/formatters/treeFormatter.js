import { resources } from "../data/resources.js";

/**
 * Recursively annotate a dependency tree with display-friendly fields.
 *
 * @param {import("../calculator/resolver.js").DependencyNode} node
 * @param {number} [depth=0]
 * @returns {FormattedNode}
 *
 * @typedef {Object} FormattedNode
 * @property {string}  id
 * @property {string}  label
 * @property {number}  amount
 * @property {string}  unit
 * @property {number}  depth
 * @property {FormattedNode[]} children
 */
export function formatTree(node, depth = 0) {
  const res = resources[node.id];

  return {
    id: node.id,
    label: res?.label ?? node.id,
    amount: node.amount,
    unit: res?.unit ?? "",
    depth,
    children: node.children.map((child) => formatTree(child, depth + 1)),
  };
}

/**
 * Walk a formatted (or raw) tree depth-first and return a flat array.
 * Each entry carries a `depth` value so the UI can indent without recursion.
 *
 * @param {import("../calculator/resolver.js").DependencyNode} node
 * @param {number} [depth=0]
 * @returns {Array<{ id: string, label: string, amount: number, unit: string, depth: number }>}
 */
export function flattenTree(node, depth = 0) {
  const res = resources[node.id];

  const entry = {
    id: node.id,
    label: res?.label ?? node.id,
    amount: node.amount,
    unit: res?.unit ?? "",
    depth,
  };

  const childEntries = node.children.flatMap((child) =>
    flattenTree(child, depth + 1),
  );

  return [entry, ...childEntries];
}
