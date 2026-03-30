import type { DependencyNode } from '../../assets/js/contracts';

/** Directed link from input card key → consumer card key (material flow in the dependency tree). */
export type CanvasDependencyEdge = { fromKey: string; toKey: string };

/** Default output rate (per minute) when resolving a placed resource — mirrors app default target rate. */
export const CANVAS_PLACE_DEFAULT_RATE = 12;

/** How multiple cards are arranged relative to the click anchor. */
export type CanvasPlacementStyle = 'horizontal' | 'vertical';

/** Layout dimensions — keep in sync with `.canvas-placed-card` in CSS. */
export const CANVAS_CARD_WIDTH_PX = 140;
/** Includes header, icon, production/consumption rows, and bulk step buttons. */
export const CANVAS_CARD_HEIGHT_PX = 164;
const GAP_PX = 12;

/** Minimum inset from the workspace edges when clamping placed cards. */
export const CANVAS_WORKSPACE_EDGE_PAD_PX = 8;

/** Extra space around the furthest content when sizing the scrollable canvas surface. */
export const CANVAS_SURFACE_PAD_PX = 80;

const BLOCK_LABEL_HALF_WIDTH_PX = 120;
const BLOCK_LABEL_ABOVE_PX = 36;

/**
 * Minimum width/height for the inner canvas surface so absolutely positioned content
 * can scroll. Uses card bounds and approximate block-label bounds.
 */
export function computeCanvasContentExtent(
  nodes: Array<{ x: number; y: number }>,
  blockLabels: Array<{ left: number; top: number }>,
  cardW: number,
  cardH: number,
  pad: number,
): { width: number; height: number } {
  if (nodes.length === 0 && blockLabels.length === 0) {
    return { width: 0, height: 0 };
  }
  let maxR = pad;
  let maxB = pad;
  let minY = 0;
  for (const n of nodes) {
    maxR = Math.max(maxR, n.x + cardW);
    maxB = Math.max(maxB, n.y + cardH);
    minY = Math.min(minY, n.y);
  }
  for (const bl of blockLabels) {
    maxR = Math.max(maxR, bl.left + BLOCK_LABEL_HALF_WIDTH_PX);
    maxB = Math.max(maxB, bl.top + 12);
    minY = Math.min(minY, bl.top - BLOCK_LABEL_ABOVE_PX);
  }
  const width = Math.max(pad * 2, maxR + pad);
  const height = Math.max(pad * 2, maxB - Math.min(0, minY) + pad);
  return { width, height };
}

/**
 * Shift a group of card positions so the bounding box stays inside the workspace rectangle.
 * Uses a few iterations so fixing one edge (e.g. left) can be followed by the opposite (right).
 * Does not scale; if the group is wider/taller than the inner area, it stays left/top aligned with padding.
 */
export function clampPlacedPositions(
  positions: Array<{ x: number; y: number }>,
  workspaceWidth: number,
  workspaceHeight: number,
): Array<{ x: number; y: number }> {
  if (positions.length === 0) return [];
  if (workspaceWidth <= 0 || workspaceHeight <= 0) return positions;
  const w = CANVAS_CARD_WIDTH_PX;
  const h = CANVAS_CARD_HEIGHT_PX;
  const pad = CANVAS_WORKSPACE_EDGE_PAD_PX;

  const out = positions.map((p) => ({ x: p.x, y: p.y }));

  for (let iter = 0; iter < 4; iter++) {
    let minX = Math.min(...out.map((p) => p.x));
    let maxX = Math.max(...out.map((p) => p.x + w));
    let dx = 0;
    if (minX < pad) dx = pad - minX;
    if (maxX + dx > workspaceWidth - pad) dx = workspaceWidth - pad - maxX;
    if (dx !== 0) {
      for (const p of out) p.x += dx;
    }

    let minY = Math.min(...out.map((p) => p.y));
    let maxY = Math.max(...out.map((p) => p.y + h));
    let dy = 0;
    if (minY < pad) dy = pad - minY;
    if (maxY + dy > workspaceHeight - pad) dy = workspaceHeight - pad - maxY;
    if (dy !== 0) {
      for (const p of out) p.y += dy;
    }

    if (dx === 0 && dy === 0) break;
  }

  return out;
}

/**
 * Walk the dependency tree in pre-order and collect each resource once (first occurrence wins).
 * Order places the root first, then upstream inputs in traversal order.
 */
export function flattenDependencyTreeUniqueFirst(root: DependencyNode): DependencyNode[] {
  const seen = new Set<string>();
  const out: DependencyNode[] = [];

  function walk(node: DependencyNode): void {
    if (!seen.has(node.id)) {
      seen.add(node.id);
      out.push(node);
    }
    for (const child of node.children) {
      walk(child);
    }
  }

  walk(root);
  return out;
}

/**
 * Edges for resources that appear in the placed set: each child (input) → parent (consumer).
 */
export function collectDependencyEdges(
  tree: DependencyNode,
  placedIds: Set<string>,
  keyByResourceId: Map<string, string>,
): CanvasDependencyEdge[] {
  const edges: CanvasDependencyEdge[] = [];

  function walk(node: DependencyNode): void {
    for (const child of node.children) {
      if (placedIds.has(node.id) && placedIds.has(child.id)) {
        const toKey = keyByResourceId.get(node.id);
        const fromKey = keyByResourceId.get(child.id);
        if (fromKey && toKey) {
          edges.push({ fromKey, toKey });
        }
      }
      walk(child);
    }
  }

  walk(tree);
  return edges;
}

/**
 * Center a block on the anchor so the click point sits in the middle of the group.
 * Horizontal: one row, left to right. Vertical: one column, top to bottom.
 */
export function layoutPlacedNodes(
  anchorX: number,
  anchorY: number,
  count: number,
  style: CanvasPlacementStyle = 'horizontal',
): Array<{ x: number; y: number }> {
  if (count <= 0) return [];
  const cols = style === 'horizontal' ? count : 1;
  const rows = style === 'horizontal' ? 1 : count;
  const totalW = cols * CANVAS_CARD_WIDTH_PX + (cols - 1) * GAP_PX;
  const totalH = rows * CANVAS_CARD_HEIGHT_PX + (rows - 1) * GAP_PX;
  const startX = anchorX - totalW / 2;
  const startY = anchorY - totalH / 2;
  const out: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    out.push({
      x: startX + col * (CANVAS_CARD_WIDTH_PX + GAP_PX),
      y: startY + row * (CANVAS_CARD_HEIGHT_PX + GAP_PX),
    });
  }
  return out;
}
