import { useEffect, useRef, useState } from 'react';
import { useCoiStore } from '../../../assets/js/app/coiExternalStore';
import {
  addProductionExtraId,
  clearAllProductionRates,
  dismissProductionRow,
  getBaseRequirementsMode,
  getResourceId,
  getTargetRate,
  getTargetRecipeIdx,
  removeProductionExtraId,
  setInputsSectionExpanded,
  setProduction,
  setResourceId,
} from '../../../assets/js/app/state';
import { calculate } from '../../../assets/js/calculator/service';
import { resources, getResourcePickerGroups } from '../../../assets/js/data/resources';
import { getRelevantProductionResourceIds } from '../../../assets/js/ui/productionView';
import { ResourceLabel } from '../shared/ResourceLabel';

function isChainRequired(id: string, chainTotals: Record<string, number>): boolean {
  return Object.prototype.hasOwnProperty.call(chainTotals, id);
}

export function ProductionSection({ chainTotals }: { chainTotals: Record<string, number> }) {
  const state = useCoiStore();
  const production = state.production;
  const extras = state.productionExtraIds;
  const dismissed = state.productionDismissedIds;
  const inputsOpen = state.inputsSections.production;

  const ids = getRelevantProductionResourceIds(
    chainTotals,
    production,
    extras,
    dismissed,
  );

  const [pickerOpen, setPickerOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      setPickerOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [pickerOpen]);

  useEffect(() => {
    if (!pickerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      setPickerOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pickerOpen]);

  const currentIds = new Set(ids);
  const addableGroups = getResourcePickerGroups()
    .map((g) => ({
      ...g,
      entries: g.entries.filter((e) => !currentIds.has(e.id)),
    }))
    .filter((g) => g.entries.length > 0);
  const anyAddable = addableGroups.length > 0;

  return (
    <details
      className="results-section"
      id="config-section-production"
      open={inputsOpen}
      onToggle={(e) => {
        const el = e.currentTarget;
        setInputsSectionExpanded('production', el.open);
      }}
    >
      <summary className="results-section-summary production-section-summary">
        <span className="production-section-summary-title">Your Production</span>
        <a
          href="#"
          id="production-clear-all"
          className="production-clear-all"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!window.confirm('Clear all entered production rates?')) return;
            const rid = getResourceId();
            let totals: Record<string, number>;
            if (!rid) {
              totals = {};
            } else {
              try {
                totals = calculate(
                  rid,
                  getTargetRate(),
                  getTargetRecipeIdx(),
                  getBaseRequirementsMode(),
                ).totals;
              } catch {
                return;
              }
            }
            clearAllProductionRates(totals);
          }}
        >
          Clear all
        </a>
      </summary>
      <div className="results-section-body">
        <p className="production-hint">
          Shows your dependency chain, saved rates, and added resources. × clears the row; chain
          resources stay hidden until you change target or add them again.
        </p>
        <div id="production-fields">
          {ids.map((id) => {
            const label = resources[id]?.label ?? id;
            const val = production[id];
            const strVal = val !== undefined && val > 0 ? String(val) : '';
            return (
              <div key={id} className="production-row">
                <button
                  type="button"
                  className="production-row-target"
                  data-production-target={id}
                  aria-pressed={state.resourceId === id ? 'true' : 'false'}
                  aria-label={`Set ${label} as target resource`}
                  onClick={() => setResourceId(id)}
                >
                  <ResourceLabel id={id} label={label} />
                </button>
                <input
                  id={`prod-${id}`}
                  type="number"
                  min={0}
                  step="any"
                  data-resource-id={id}
                  defaultValue={strVal}
                  placeholder="0"
                  aria-label={`Production rate (per min) for ${label}`}
                  key={`${id}-${production[id] ?? 0}`}
                  onInput={(e) => {
                    const input = e.currentTarget;
                    const val = parseFloat(input.value);
                    const invalid = input.value !== '' && (isNaN(val) || val < 0);
                    input.classList.toggle('input-invalid', invalid);
                    if (!invalid) {
                      const num = isNaN(val) ? 0 : val;
                      setProduction(id, num);
                      if (
                        num <= 0
                        && state.productionExtraIds.includes(id)
                        && !isChainRequired(id, chainTotals)
                      ) {
                        removeProductionExtraId(id);
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  className="production-row-remove"
                  data-remove-resource={id}
                  aria-label={`Remove ${label}`}
                  onClick={() => {
                    setProduction(id, 0);
                    if (state.productionExtraIds.includes(id)) {
                      removeProductionExtraId(id);
                    }
                    if (isChainRequired(id, chainTotals)) {
                      dismissProductionRow(id);
                    }
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
        <div className="field production-add-field">
          <label htmlFor="production-add-trigger">Add resource</label>
          <div className="resource-picker-wrap production-add-picker-wrap" ref={wrapRef}>
            <button
              ref={triggerRef}
              type="button"
              id="production-add-trigger"
              className="resource-picker-trigger production-add-trigger"
              aria-haspopup="listbox"
              aria-expanded={pickerOpen ? 'true' : 'false'}
              aria-controls="production-add-panel"
              disabled={!anyAddable}
              onClick={(e) => {
                e.stopPropagation();
                if (!anyAddable) return;
                setPickerOpen((o) => !o);
              }}
            >
              {anyAddable ? 'Add a resource…' : 'Nothing left to add'}
            </button>
            <div
              ref={panelRef}
              id="production-add-panel"
              className="resource-picker-panel"
              role="listbox"
              aria-label="Add production for a resource by category"
              hidden={!pickerOpen}
            >
              {anyAddable ? (
                addableGroups.map((group) => (
                  <div key={group.label} className="resource-picker-group">
                    <div className="resource-picker-group-label">{group.label}</div>
                    <ul className="resource-picker-group-list" role="presentation">
                      {group.entries.map(({ id, label }) => (
                        <li
                          key={id}
                          className="resource-picker-option"
                          role="option"
                          data-resource-id={id}
                          id={`production-add-option-${id}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addProductionExtraId(id);
                            setPickerOpen(false);
                          }}
                        >
                          <ResourceLabel id={id} label={label} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <div className="resource-picker-empty" role="presentation">
                  All resources are already listed.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}
