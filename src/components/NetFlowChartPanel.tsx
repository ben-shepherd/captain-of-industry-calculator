import { useEffect, useRef } from 'react';
import type { FormattedNetTotal, NetFlowChartStyle } from '../../assets/js/contracts';
import { destroyNetFlowChart, renderNetFlowChart } from '../../assets/js/ui/netFlowChart';

export function NetFlowChartPanel({
  rows,
  emptyMessage,
  style,
}: {
  rows: FormattedNetTotal[];
  emptyMessage: string;
  style: NetFlowChartStyle;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    renderNetFlowChart(el, rows, emptyMessage, style);
    return () => destroyNetFlowChart(el);
  }, [rows, emptyMessage, style]);
  return (
    <div ref={ref} id="net-flow-chart" className="net-flow-chart-root" aria-live="polite" />
  );
}
