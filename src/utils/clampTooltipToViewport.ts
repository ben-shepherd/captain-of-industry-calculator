export type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type Viewport = {
  width: number;
  height: number;
};

export type TooltipPlacement = {
  left: number;
  top: number;
};

export function clampTooltipToViewport(args: {
  anchorRect: Rect;
  tooltipRect: Rect;
  viewport: Viewport;
  padding: number;
  gap: number;
}): TooltipPlacement {
  const { anchorRect, tooltipRect, viewport, padding, gap } = args;

  const centerX = anchorRect.left + anchorRect.width / 2;
  const halfW = tooltipRect.width / 2;
  const minLeft = padding + halfW;
  const maxLeft = viewport.width - padding - halfW;
  const left = Math.max(minLeft, Math.min(centerX, maxLeft));

  const belowTop = anchorRect.top + anchorRect.height + gap;
  const belowFits = belowTop + tooltipRect.height <= viewport.height - padding;
  const aboveTop = anchorRect.top - gap - tooltipRect.height;
  const top = belowFits ? belowTop : Math.max(padding, aboveTop);

  return { left, top };
}

