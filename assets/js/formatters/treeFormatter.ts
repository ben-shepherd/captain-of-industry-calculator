import { resources } from '../data/resources';
import type { DependencyNode, FormattedNode, FlattenedNode } from '../contracts';

/**
 * Recursively annotate a dependency tree with display-friendly fields.
 */
export function formatTree(node: DependencyNode, depth = 0): FormattedNode {
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
 */
export function flattenTree(
  node: DependencyNode,
  depth = 0,
): FlattenedNode[] {
  const res = resources[node.id];

  const entry: FlattenedNode = {
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
