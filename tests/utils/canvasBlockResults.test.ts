import { describe, expect, it } from 'vitest';
import type { CalculationResult } from '../../assets/js/contracts';
import {
  baseTotalsRowsForCanvasDisplay,
  baseTotalsRowsForBlockResourceOrder,
} from '../../src/utils/canvasBlockResults';

function mockResult(totals: Record<string, number>): CalculationResult {
  return {
    resourceId: 'root',
    targetRate: 1,
    totals,
    tree: { id: 'root', label: 'Root', amount: 1, children: [] },
  };
}

describe('baseTotalsRowsForCanvasDisplay', () => {
  it('uses full totals list when mode is full even with block order', () => {
    const result = mockResult({ iron_ore: 10, coal: 5, steel: 2 });
    const blockOrder = ['steel'];
    const direct = baseTotalsRowsForCanvasDisplay(result, blockOrder, 'direct');
    expect(direct.map((r) => r.id)).toEqual(['steel']);
    const full = baseTotalsRowsForCanvasDisplay(result, blockOrder, 'full');
    expect(new Set(full.map((r) => r.id))).toEqual(
      new Set(['iron_ore', 'coal', 'steel']),
    );
  });

  it('matches block-order helper in direct mode', () => {
    const result = mockResult({ a: 1, b: 2 });
    const order = ['b', 'a'];
    expect(baseTotalsRowsForCanvasDisplay(result, order, 'direct')).toEqual(
      baseTotalsRowsForBlockResourceOrder(result, order),
    );
  });
});
