import { useId } from 'react';
import { NetFlowChartSection } from '../charts/NetFlowChartSection';
import { BaseResourcesTable } from '../results/BaseResourcesTable';
import { NetFlowTable } from '../results/NetFlowTable';
import type { CalculationOutcome } from '../../hooks/useCalculation';

const CANVAS_NO_TARGET =
  'Select a block on the canvas or set a target resource in the Calculator view.';

const RESIZE_HELP_TOOLTIP =
  'Drag the border between the canvas and this panel to change its width.';

export function CanvasResultsSidebar({
  outcome,
  onHide,
  blockResourceOrder,
  selectedBlockLabel,
  effectiveTargetResourceId,
}: {
  outcome: CalculationOutcome;
  onHide: () => void;
  /** Unique resource ids in placement order for the selected block (one row per placed type). */
  blockResourceOrder?: string[];
  /** Human-readable block name when a block is selected. */
  selectedBlockLabel?: string | null;
  /** Resource id used for calculation (global target OR first resource in selected block). */
  effectiveTargetResourceId: string | null;
}) {
  const headingId = useId();
  const regionId = useId();
  const resizeHintTextId = useId();

  return (
    <aside
      id={regionId}
      className="canvas-results-sidebar"
      role="region"
      aria-labelledby={headingId}
    >
      <div className="canvas-results-sidebar-header">
        <div className="canvas-results-sidebar-title-wrap">
          <h2 id={headingId} className="canvas-results-sidebar-title">
            Results
          </h2>
          {selectedBlockLabel ? (
            <p className="canvas-results-sidebar-subtitle" aria-live="polite">
              Block: {selectedBlockLabel}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="btn btn-secondary canvas-results-sidebar-hide"
          aria-label="Hide results panel"
          onClick={onHide}
        >
          Hide
        </button>
      </div>
      <p className="canvas-results-sidebar-width-hint">
        <span className="canvas-results-sidebar-width-hint-text" id={resizeHintTextId}>
          Drag the left edge to expand or narrow this panel.
        </span>
        <button
          type="button"
          className="canvas-results-sidebar-help"
          title={RESIZE_HELP_TOOLTIP}
          aria-label="More help: how to resize this panel"
          aria-describedby={resizeHintTextId}
        >
          ?
        </button>
      </p>
      <div className="canvas-results-sidebar-body">
        <section className="canvas-results-sidebar-section" aria-label="Base resources required">
          <h3 className="canvas-results-sidebar-section-heading">Base resources required</h3>
          <BaseResourcesTable
            outcome={outcome}
            targetResourceIdForDisplay={effectiveTargetResourceId}
            noTargetMessage={CANVAS_NO_TARGET}
            blockResourceOrder={blockResourceOrder}
          />
        </section>
        <section className="canvas-results-sidebar-section" aria-label="Net flow">
          <h3 className="canvas-results-sidebar-section-heading">Net flow</h3>
          <NetFlowTable
            outcome={outcome}
            noTargetMessage={CANVAS_NO_TARGET}
            targetResourceIdForDisplay={effectiveTargetResourceId}
            blockResourceOrder={blockResourceOrder}
          />
        </section>
        <NetFlowChartSection
          outcome={outcome}
          context="canvas"
          targetResourceIdForDisplay={effectiveTargetResourceId}
          blockResourceOrder={blockResourceOrder}
        />
      </div>
    </aside>
  );
}
