import type { ReactNode } from 'react';
import { useCoiStore } from '../../assets/js/app/coiExternalStore';
import {
  setBaseRequirementsMode,
  setResourceId,
  setResultsSectionExpanded,
} from '../../assets/js/app/state';
import { calculateNet } from '../../assets/js/calculator/net';
import type { CalculationResult } from '../../assets/js/contracts';
import { formatNetTotals, formatTotals } from '../../assets/js/formatters/flatFormatter';
import type { CalculationOutcome } from '../hooks/useCalculation';
import { DependencyTree } from './DependencyTree';
import { ResourceTargetButton } from './ResourceTargetButton';

function TotalsPlaceholderRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan}>{text}</td>
    </tr>
  );
}

export function ResultsSection({
  outcome,
}: {
  outcome: CalculationOutcome;
}) {
  const state = useCoiStore();
  const resourceId = state.resourceId;
  const production = state.production;
  const baseMode = state.baseRequirementsMode;
  const rs = state.resultsSections;

  function renderTotalsBody(result: CalculationResult) {
    const rows = formatTotals(result.totals);
    if (rows.length === 0) {
      return <TotalsPlaceholderRow colSpan={3} text="No base resources required" />;
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

  function renderNetBody(result: CalculationResult) {
    const net = calculateNet(result.totals, production);
    const rows = formatNetTotals(net);
    if (rows.length === 0) {
      return <TotalsPlaceholderRow colSpan={5} text="No net data" />;
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

  let totalsContent: ReactNode;
  let netContent: ReactNode;
  let treeContent: ReactNode;

  if (!resourceId) {
    totalsContent = (
      <TotalsPlaceholderRow
        colSpan={3}
        text="Choose a target resource above to see base requirements"
      />
    );
    netContent = (
      <TotalsPlaceholderRow colSpan={5} text="Choose a target resource above to see net flow" />
    );
    treeContent = null;
  } else if (!outcome.ok) {
    totalsContent = <TotalsPlaceholderRow colSpan={3} text="Error running calculation" />;
    netContent = <TotalsPlaceholderRow colSpan={5} text="Error running calculation" />;
    treeContent = null;
  } else if (outcome.result) {
    totalsContent = renderTotalsBody(outcome.result);
    netContent = renderNetBody(outcome.result);
    treeContent = (
      <DependencyTree
        tree={outcome.result.tree}
        currentResourceId={resourceId}
        onSetTarget={setResourceId}
      />
    );
  } else {
    totalsContent = null;
    netContent = null;
    treeContent = null;
  }

  return (
    <section className="panel panel-results">
      <details
        className="results-section"
        id="results-section-base"
        open={rs.base}
        onToggle={(e) => setResultsSectionExpanded('base', e.currentTarget.open)}
      >
        <summary className="results-section-summary">Base Resources Required</summary>
        <div className="results-section-body">
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
          <table className="data-table">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Amount</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody id="totals-body">{totalsContent}</tbody>
          </table>
        </div>
      </details>

      <details
        className="results-section"
        id="results-section-net"
        open={rs.net}
        onToggle={(e) => setResultsSectionExpanded('net', e.currentTarget.open)}
      >
        <summary className="results-section-summary">Net Flow</summary>
        <div className="results-section-body">
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
            <tbody id="net-body">{netContent}</tbody>
          </table>
        </div>
      </details>

      <details
        className="results-section"
        id="results-section-tree"
        open={rs.tree}
        onToggle={(e) => setResultsSectionExpanded('tree', e.currentTarget.open)}
      >
        <summary className="results-section-summary">Dependency Tree</summary>
        <div className="results-section-body">{treeContent}</div>
      </details>
    </section>
  );
}
