import { describe, it, expect } from 'vitest';
import { clampTooltipToViewport } from '../../src/utils/clampTooltipToViewport';

describe('clampTooltipToViewport', () => {
  it('clamps horizontally so tooltip stays in viewport', () => {
    const viewport = { width: 300, height: 200 };
    const tooltipRect = { left: 0, top: 0, width: 200, height: 40 };
    const padding = 12;
    const gap = 8;

    const leftAnchor = { left: 0, top: 20, width: 20, height: 20 };
    const p1 = clampTooltipToViewport({ anchorRect: leftAnchor, tooltipRect, viewport, padding, gap });
    expect(p1.left).toBeGreaterThanOrEqual(padding + tooltipRect.width / 2);

    const rightAnchor = { left: 280, top: 20, width: 20, height: 20 };
    const p2 = clampTooltipToViewport({ anchorRect: rightAnchor, tooltipRect, viewport, padding, gap });
    expect(p2.left).toBeLessThanOrEqual(viewport.width - padding - tooltipRect.width / 2);
  });

  it('places below when it fits, otherwise flips above (clamped to padding)', () => {
    const viewport = { width: 400, height: 120 };
    const tooltipRect = { left: 0, top: 0, width: 180, height: 60 };
    const padding = 12;
    const gap = 8;

    const fitsBelow = { left: 100, top: 10, width: 20, height: 20 };
    const p1 = clampTooltipToViewport({ anchorRect: fitsBelow, tooltipRect, viewport, padding, gap });
    expect(p1.top).toBe(fitsBelow.top + fitsBelow.height + gap);

    const nearBottom = { left: 100, top: 70, width: 20, height: 20 };
    const p2 = clampTooltipToViewport({ anchorRect: nearBottom, tooltipRect, viewport, padding, gap });
    expect(p2.top).toBeLessThanOrEqual(nearBottom.top - gap);
    expect(p2.top).toBeGreaterThanOrEqual(padding);
  });
});

