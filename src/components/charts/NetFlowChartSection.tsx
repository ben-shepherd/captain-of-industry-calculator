import { useMemo } from 'react';
import { useCoiStore } from '../../../assets/js/app/coiExternalStore';
import { setNetFlowChartStyle } from '../../../assets/js/app/state';
import { calculateNet } from '../../../assets/js/calculator/net';
import type { FormattedNetTotal, NetFlowChartStyle } from '../../../assets/js/contracts';
import { formatNetTotals } from '../../../assets/js/formatters/flatFormatter';
import type { CalculationOutcome } from '../../hooks/useCalculation';
import { netRowsForBlockResourceOrder } from '../../utils/canvasBlockResults';
import { NetFlowChartPanel } from './NetFlowChartPanel';

export type NetFlowChartContext = 'calculator' | 'canvas';

const EMPTY_BY_CONTEXT: Record<
  NetFlowChartContext,
  { noTarget: string; noResult: string }
> = {
  calculator: {
    noTarget: 'Choose a target resource above to see net flow.',
    noResult: 'Choose a target resource above to see net flow.',
  },
  canvas: {
    noTarget:
      'Select a block on the canvas or set a target resource in the Calculator view to see net flow.',
    noResult:
      'Select a block on the canvas or set a target resource in the Calculator view to see net flow.',
  },
};

export function NetFlowChartSection({
  outcome,
  context = 'calculator',
  filterResourceIds,
  filteredEmptyMessage = 'No chart data for resources in this block (they may not appear in the current target chain).',
  targetResourceIdForDisplay,
  blockResourceOrder,
  canvasBlockProduction,
}: {
  outcome: CalculationOutcome;
  /** Placeholder copy when the user is on Canvas (no target panel on this view). */
  context?: NetFlowChartContext;
  /** When set, only series for resources in this set are shown (e.g. canvas block selection). */
  filterResourceIds?: ReadonlySet<string>;
  filteredEmptyMessage?: string;
  /** Effective target for empty checks (canvas: store OR block anchor). */
  targetResourceIdForDisplay?: string | null;
  /** Canvas: chart series match every resource in the selected block (placement order). */
  blockResourceOrder?: string[];
  /** Canvas: merge over global production (card rates for the selected block). */
  canvasBlockProduction?: Record<string, number>;
}) {
  const state = useCoiStore();
  const netChartStyle = state.netFlowChartStyle;
  const production = useMemo(() => {
    if (!canvasBlockProduction) return state.production;
    return { ...state.production, ...canvasBlockProduction };
  }, [state.production, canvasBlockProduction]);
  const effectiveTargetId = targetResourceIdForDisplay ?? state.resourceId;

  const { rows, emptyMessage } = useMemo((): {
    rows: FormattedNetTotal[];
    emptyMessage: string;
  } => {
    const emptyText = EMPTY_BY_CONTEXT[context];
    if (!effectiveTargetId) {
      return { rows: [], emptyMessage: emptyText.noTarget };
    }
    if (!outcome.ok) {
      return { rows: [], emptyMessage: 'Error running calculation.' };
    }
    if (!outcome.result) {
      return { rows: [], emptyMessage: emptyText.noResult };
    }
    let formatted: FormattedNetTotal[];
    if (blockResourceOrder && blockResourceOrder.length > 0) {
      formatted = netRowsForBlockResourceOrder(
        outcome.result,
        production,
        blockResourceOrder,
      );
    } else {
      const net = calculateNet(outcome.result.totals, production);
      formatted = formatNetTotals(net);
      if (filterResourceIds) {
        formatted = formatted.filter((r) => filterResourceIds.has(r.id));
      }
    }
    return {
      rows: formatted,
      emptyMessage:
        formatted.length === 0
          ? filterResourceIds && !blockResourceOrder?.length
            ? filteredEmptyMessage
            : 'No net data'
          : '',
    };
  }, [
    effectiveTargetId,
    outcome,
    production,
    context,
    filterResourceIds,
    filteredEmptyMessage,
    blockResourceOrder,
  ]);

  return (
    <section className="panel net-flow-chart-panel" aria-label="Net flow chart">
      <h2 className="net-flow-chart-heading">Net flow chart</h2>
      <div className="net-flow-chart-toolbar">
        <label htmlFor="net-flow-chart-style">Chart style</label>
        <select
          id="net-flow-chart-style"
          aria-label="Net flow chart style"
          value={netChartStyle}
          onChange={(e) => setNetFlowChartStyle(e.target.value as NetFlowChartStyle)}
        >
          <option value="line">Line chart</option>
          <option value="horizontal-grouped">Horizontal grouped bars</option>
          <option value="vertical-grouped">Vertical grouped bars</option>
        </select>
      </div>
      <NetFlowChartPanel rows={rows} emptyMessage={emptyMessage} style={netChartStyle} />
    </section>
  );
}
