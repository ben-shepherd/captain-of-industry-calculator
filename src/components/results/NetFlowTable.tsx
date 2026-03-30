import type { ReactNode } from 'react';
import { useCoiStore } from '../../../assets/js/app/coiExternalStore';
import { setResourceId } from '../../../assets/js/app/state';
import { calculateNet } from '../../../assets/js/calculator/net';
import type { CalculationResult } from '../../../assets/js/contracts';
import { formatNetTotals } from '../../../assets/js/formatters/flatFormatter';
import type { CalculationOutcome } from '../../hooks/useCalculation';
import { netRowsForBlockResourceOrder } from '../../utils/canvasBlockResults';
import { ResourceTargetButton } from '../shared/ResourceTargetButton';

function PlaceholderRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan}>{text}</td>
    </tr>
  );
}

const DEFAULT_NO_TARGET = 'Choose a target resource above to see net flow';

export function NetFlowTable({
  outcome,
  noTargetMessage = DEFAULT_NO_TARGET,
  filterResourceIds,
  filteredEmptyMessage = 'No net flow rows for resources in this block (they may not appear in the current target chain).',
  targetResourceIdForDisplay,
  /** Canvas: unique resource ids in placement order — shows one row per resource the user placed in the block. */
  blockResourceOrder,
}: {
  outcome: CalculationOutcome;
  /** Shown when no global target resource is set (e.g. canvas uses Calculator-specific copy). */
  noTargetMessage?: string;
  /** When set, only rows whose resource id is in this set are shown (e.g. canvas block selection). */
  filterResourceIds?: ReadonlySet<string>;
  /** Shown when the filter leaves no rows. */
  filteredEmptyMessage?: string;
  /**
   * Effective target for placeholders and “current target” highlighting (canvas: store OR block anchor).
   */
  targetResourceIdForDisplay?: string | null;
  blockResourceOrder?: string[];
}) {
  const state = useCoiStore();
  const resourceId = targetResourceIdForDisplay ?? state.resourceId;
  const production = state.production;

  function renderBody(result: CalculationResult): ReactNode {
    let rows: ReturnType<typeof formatNetTotals>;
    if (blockResourceOrder && blockResourceOrder.length > 0) {
      rows = netRowsForBlockResourceOrder(result, production, blockResourceOrder);
    } else {
      const net = calculateNet(result.totals, production);
      rows = formatNetTotals(net);
      if (filterResourceIds) {
        rows = rows.filter((r) => filterResourceIds.has(r.id));
      }
    }
    if (rows.length === 0) {
      return (
        <PlaceholderRow
          colSpan={5}
          text={filterResourceIds ? filteredEmptyMessage : 'No net data'}
        />
      );
    }
    return (
      <>
        {rows.map((r) => (
          <tr key={r.id} className={`net-${r.status}`}>
            <td>
              <ResourceTargetButton
                id={r.id}
                label={r.label}
                currentResourceId={resourceId}
                onSetTarget={setResourceId}
              />
            </td>
            <td>{r.required.toFixed(2)}</td>
            <td>{r.production.toFixed(2)}</td>
            <td>
              {r.net > 0 ? '+' : ''}
              {r.net.toFixed(2)}
            </td>
            <td>
              <span className="net-status-badge">{r.status}</span>
            </td>
          </tr>
        ))}
      </>
    );
  }

  let tbody: ReactNode;
  if (!resourceId) {
    tbody = <PlaceholderRow colSpan={5} text={noTargetMessage} />;
  } else if (!outcome.ok) {
    tbody = <PlaceholderRow colSpan={5} text="Error running calculation" />;
  } else if (outcome.result) {
    tbody = renderBody(outcome.result);
  } else {
    tbody = null;
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Resource</th>
          <th>Required</th>
          <th>Production</th>
          <th>Net</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody id="net-body">{tbody}</tbody>
    </table>
  );
}
