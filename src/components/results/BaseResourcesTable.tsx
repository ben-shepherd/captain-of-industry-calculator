import type { ReactNode } from 'react';
import { useCoiStore } from '../../../assets/js/app/coiExternalStore';
import { setBaseRequirementsMode, setResourceId } from '../../../assets/js/app/state';
import type { CalculationResult } from '../../../assets/js/contracts';
import { formatTotals } from '../../../assets/js/formatters/flatFormatter';
import type { CalculationOutcome } from '../../hooks/useCalculation';
import { baseTotalsRowsForBlockResourceOrder } from '../../utils/canvasBlockResults';
import { ResourceTargetButton } from '../shared/ResourceTargetButton';

function TotalsPlaceholderRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan}>{text}</td>
    </tr>
  );
}

const DEFAULT_NO_TARGET = 'Choose a target resource above to see base requirements';

export function BaseResourcesTable({
  outcome,
  targetResourceIdForDisplay,
  filterResourceIds,
  noTargetMessage = DEFAULT_NO_TARGET,
  showModeToolbar = true,
  blockResourceOrder,
}: {
  outcome: CalculationOutcome;
  /**
   * Effective target for this panel (e.g. canvas uses global store OR selected block anchor).
   * When omitted, uses global `resourceId` from the store.
   */
  targetResourceIdForDisplay?: string | null;
  filterResourceIds?: ReadonlySet<string>;
  noTargetMessage?: string;
  showModeToolbar?: boolean;
  /** Canvas: one row per placed resource type, in placement order. */
  blockResourceOrder?: string[];
}) {
  const state = useCoiStore();
  const resourceId = targetResourceIdForDisplay ?? state.resourceId;
  const baseMode = state.baseRequirementsMode;

  function renderTotalsBody(result: CalculationResult) {
    let rows: ReturnType<typeof formatTotals>;
    if (blockResourceOrder && blockResourceOrder.length > 0) {
      rows = baseTotalsRowsForBlockResourceOrder(result, blockResourceOrder);
    } else {
      rows = formatTotals(result.totals);
      if (filterResourceIds) {
        rows = rows.filter((r) => filterResourceIds.has(r.id));
      }
    }
    if (rows.length === 0) {
      return (
        <TotalsPlaceholderRow
          colSpan={3}
          text={
            filterResourceIds
              ? 'No base requirements rows for resources in this block (they may not appear in the current target chain).'
              : 'No base resources required'
          }
        />
      );
    }
    return (
      <>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>
              <ResourceTargetButton
                id={r.id}
                label={r.label}
                currentResourceId={resourceId}
                onSetTarget={setResourceId}
              />
            </td>
            <td>{r.amount.toFixed(2)}</td>
            <td>{r.unit}</td>
          </tr>
        ))}
      </>
    );
  }

  let tbody: ReactNode;
  if (!resourceId) {
    tbody = <TotalsPlaceholderRow colSpan={3} text={noTargetMessage} />;
  } else if (!outcome.ok) {
    tbody = <TotalsPlaceholderRow colSpan={3} text="Error running calculation" />;
  } else if (outcome.result) {
    tbody = renderTotalsBody(outcome.result);
  } else {
    tbody = null;
  }

  return (
    <>
      {showModeToolbar ? (
        <div
          className="tree-toolbar base-requirements-toolbar"
          role="group"
          aria-label="Base requirements scope"
        >
          <button
            type="button"
            id="base-requirements-direct"
            className="btn btn-secondary tree-bulk-btn"
            aria-pressed={baseMode === 'direct' ? 'true' : 'false'}
            onClick={() => setBaseRequirementsMode('direct')}
          >
            This recipe only
          </button>
          <button
            type="button"
            id="base-requirements-full"
            className="btn btn-secondary tree-bulk-btn"
            aria-pressed={baseMode === 'full' ? 'true' : 'false'}
            onClick={() => setBaseRequirementsMode('full')}
          >
            Full dependency chain
          </button>
        </div>
      ) : null}
      <table className="data-table">
        <thead>
          <tr>
            <th>Resource</th>
            <th>Amount</th>
            <th>Unit</th>
          </tr>
        </thead>
        <tbody id="totals-body">{tbody}</tbody>
      </table>
    </>
  );
}
