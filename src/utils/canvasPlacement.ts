import type { DependencyNode } from '../../assets/js/contracts';

/** Default output rate (per minute) when resolving a placed resource — mirrors app default target rate. */
export const CANVAS_PLACE_DEFAULT_RATE = 12;

/** How multiple cards are arranged relative to the click anchor. */
export type CanvasPlacementStyle = 'horizontal' | 'vertical';

/** Layout dimensions — keep in sync with `.canvas-placed-card` in CSS. */
export const CANVAS_CARD_WIDTH_PX = 140;
export const CANVAS_CARD_HEIGHT_PX = 72;
const GAP_PX = 12;

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
