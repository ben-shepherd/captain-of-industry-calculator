import type { ReactNode } from 'react';
import { useCoiStore } from '../../../assets/js/app/coiExternalStore';
import { setResourceId, setResultsSectionExpanded } from '../../../assets/js/app/state';
import type { CalculationOutcome } from '../../hooks/useCalculation';
import { BaseResourcesTable } from './BaseResourcesTable';
import { DependencyTree } from './DependencyTree';
import { NetFlowTable } from './NetFlowTable';
export function ResultsSection({
  outcome,
}: {
  outcome: CalculationOutcome;
}) {
  const state = useCoiStore();
  const resourceId = state.resourceId;
  const rs = state.resultsSections;

  let treeContent: ReactNode;

  if (!resourceId) {
    treeContent = null;
  } else if (!outcome.ok) {
    treeContent = null;
  } else if (outcome.result) {
    treeContent = (
      <DependencyTree
        tree={outcome.result.tree}
        currentResourceId={resourceId}
        onSetTarget={setResourceId}
      />
    );
  } else {
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
          <BaseResourcesTable outcome={outcome} />
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
          <NetFlowTable outcome={outcome} />
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
