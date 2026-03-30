import { useMemo } from 'react';
import { useCoiStore } from '../../../assets/js/app/coiExternalStore';
import { setNetFlowChartStyle } from '../../../assets/js/app/state';
import { calculateNet } from '../../../assets/js/calculator/net';
import type { FormattedNetTotal, NetFlowChartStyle } from '../../../assets/js/contracts';
import { formatNetTotals } from '../../../assets/js/formatters/flatFormatter';
import type { CalculationOutcome } from '../../hooks/useCalculation';
import { NetFlowChartPanel } from './NetFlowChartPanel';

export function NetFlowChartSection({ outcome }: { outcome: CalculationOutcome }) {
  const state = useCoiStore();
  const netChartStyle = state.netFlowChartStyle;
  const production = state.production;

  const { rows, emptyMessage } = useMemo((): {
    rows: FormattedNetTotal[];
    emptyMessage: string;
  } => {
    if (!state.resourceId) {
      return { rows: [], emptyMessage: 'Choose a target resource above to see net flow.' };
    }
    if (!outcome.ok) {
      return { rows: [], emptyMessage: 'Error running calculation.' };
    }
    if (!outcome.result) {
      return { rows: [], emptyMessage: 'Choose a target resource above to see net flow.' };
    }
    const net = calculateNet(outcome.result.totals, production);
    const formatted = formatNetTotals(net);
    return {
      rows: formatted,
      emptyMessage: formatted.length === 0 ? 'No net data' : '',
    };
  }, [state.resourceId, outcome, production]);

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
