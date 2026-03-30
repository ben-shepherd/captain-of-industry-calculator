import { createPortal } from 'react-dom';
import type { DependencyNode, ResourcesMap } from '../../../assets/js/contracts';

type Props = {
  rootLabel: string;
  rootId: string;
  dependents: DependencyNode[];
  resources: ResourcesMap;
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
  onSelectAllDependents: () => void;
  onClearDependents: () => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function CanvasPlacementPicker({
  rootLabel,
  rootId,
  dependents,
  resources: resMap,
  selected,
  onToggle,
  onSelectAllDependents,
  onClearDependents,
  onConfirm,
  onCancel,
}: Props) {
  return createPortal(
    <div
      className="canvas-placement-picker-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="canvas-placement-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="canvas-placement-picker-title"
      >
        <h2 id="canvas-placement-picker-title" className="canvas-placement-picker-title">
          Choose resources to add
        </h2>
        <p className="canvas-placement-picker-lead">
          <strong>{rootLabel}</strong> is always placed. Pick which upstream resources to add now — you can
          add more later.
        </p>

        <div className="canvas-placement-picker-primary">
          <span className="canvas-placement-picker-badge">Primary</span>
          <span className="canvas-placement-picker-primary-label">{rootLabel}</span>
          <span className="canvas-placement-picker-id" title={rootId}>
            {rootId}
          </span>
        </div>

        {dependents.length > 0 ? (
          <>
            <div className="canvas-placement-picker-deps-header">
              <span className="canvas-placement-picker-deps-heading">Dependents (upstream chain)</span>
              <div className="canvas-placement-picker-deps-actions">
                <button type="button" className="btn btn-secondary canvas-placement-picker-linkish" onClick={onSelectAllDependents}>
                  Select all
                </button>
                <button type="button" className="btn btn-secondary canvas-placement-picker-linkish" onClick={onClearDependents}>
                  Clear
                </button>
              </div>
            </div>
            <ul className="canvas-placement-picker-list" role="list">
              {dependents.map((node) => {
                const def = resMap[node.id];
                const url = def?.imageUrl;
                const checked = selected[node.id] === true;
                return (
                  <li key={node.id} className="canvas-placement-picker-row">
                    <label className="canvas-placement-picker-label">
                      <input
                        type="checkbox"
                        className="canvas-placement-picker-check"
                        checked={checked}
                        onChange={() => onToggle(node.id)}
                      />
                      {url ? (
                        <img className="canvas-placement-picker-icon" src={url} alt="" aria-hidden />
                      ) : (
                        <span className="canvas-placement-picker-fallback" aria-hidden>
                          {node.label.slice(0, 1)}
                        </span>
                      )}
                      <span className="canvas-placement-picker-name">{node.label}</span>
                      <span className="canvas-placement-picker-id" title={node.id}>
                        {node.id}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="canvas-placement-picker-empty">No upstream resources in the chain for this selection.</p>
        )}

        <div className="canvas-placement-picker-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            Add to canvas
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
