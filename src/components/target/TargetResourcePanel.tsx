import { useEffect, useRef, useState } from 'react';
import { useCoiStore } from '../../../assets/js/app/coiExternalStore';
import {
  setResourceId,
  setTargetRate,
  setTargetRecipeIdx,
} from '../../../assets/js/app/state';
import { getResourcePickerGroups, resources } from '../../../assets/js/data/resources';
import { matchResourcesForSearch, TARGET_RESOURCE_PLACEHOLDER } from '../../../assets/js/ui/resourceSearch';
import { TargetRecipeSection } from './TargetRecipeSection';

const SEARCH_HIT_ACTIVE = 'resource-search-hit-active';

export function TargetResourcePanel() {
  const state = useCoiStore();
  const resourceId = state.resourceId;
  const targetRate = state.targetRate;
  const targetRecipeIdx = state.targetRecipeIdx;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchListDismissed, setSearchListDismissed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [targetRateText, setTargetRateText] = useState(() => String(targetRate));

  const searchWrapRef = useRef<HTMLDivElement>(null);
  const pickerWrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchListRef = useRef<HTMLUListElement>(null);
  const pickerTriggerRef = useRef<HTMLButtonElement>(null);
  const pickerPanelRef = useRef<HTMLDivElement>(null);
  const targetRateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = targetRateInputRef.current;
    const isFocused = input != null && document.activeElement === input;
    if (!isFocused) setTargetRateText(String(targetRate));
  }, [targetRate]);

  useEffect(() => {
    setSearchListDismissed(false);
  }, [searchQuery]);

  const matches = matchResourcesForSearch(searchQuery);
  const q = searchQuery.trim();
  const listOpen = q !== '' && !searchListDismissed && matches.length > 0;
  const showEmptySearch = q !== '' && !searchListDismissed && matches.length === 0;
  const showSearchPanel = listOpen || showEmptySearch;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (searchWrapRef.current?.contains(t)) return;
      if (q !== '') {
        setSearchListDismissed(true);
        searchInputRef.current?.setAttribute('aria-expanded', 'false');
        setHighlightIndex(-1);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [q]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (pickerWrapRef.current?.contains(t)) return;
      setPickerOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (pickerOpen) {
        e.preventDefault();
        setPickerOpen(false);
        pickerTriggerRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pickerOpen]);

  useEffect(() => {
    const input = searchInputRef.current;
    if (!input) return;
    if (highlightIndex >= 0 && matches[highlightIndex]) {
      const id = matches[highlightIndex]!.id;
      input.setAttribute('aria-activedescendant', `resource-search-hit-${id}`);
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }, [highlightIndex, matches]);

  function applyTargetResource(id: string): void {
    setHighlightIndex(-1);
    setSearchQuery('');
    setSearchListDismissed(true);
    setPickerOpen(false);
    searchInputRef.current?.setAttribute('aria-expanded', 'false');
    setResourceId(id);
  }

  const wikiUrl = resourceId ? resources[resourceId]?.wikiUrl : '';

  return (
    <section className="panel app-target-panel" aria-label="Target resource and production rate">
      <h2>Target resource &amp; rate</h2>
      <div className="app-target-panel-body">
        <div className="app-target-fields-row">
          <div className="field field-resource-target app-target-field-col">
            <label htmlFor="resource-search">Target Resource</label>
            <div className="resource-search-wrap" ref={searchWrapRef}>
              <input
                ref={searchInputRef}
                type="search"
                id="resource-search"
                placeholder="Search resources…"
                autoComplete="off"
                role="combobox"
                aria-label="Search target resources"
                aria-expanded={showSearchPanel ? 'true' : 'false'}
                aria-controls="resource-search-results"
                aria-autocomplete="list"
                aria-haspopup="listbox"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightIndex(-1);
                  if (e.target.value.trim() !== '') {
                    setPickerOpen(false);
                  }
                }}
                onFocus={(e) => {
                  if (e.target.value.trim()) {
                    e.target.setAttribute('aria-expanded', 'true');
                    setSearchListDismissed(false);
                  }
                }}
                onKeyDown={(e) => {
                  const hits = matches;
                  const open = q !== '' && hits.length > 0 && !searchListDismissed;
                  if (e.key === 'Escape') {
                    setSearchQuery('');
                    setSearchListDismissed(true);
                    e.currentTarget.setAttribute('aria-expanded', 'false');
                    setHighlightIndex(-1);
                    return;
                  }
                  if (open && e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightIndex((i) => {
                      if (hits.length === 0) return -1;
                      if (i < 0) return 0;
                      return Math.min(i + 1, hits.length - 1);
                    });
                    return;
                  }
                  if (open && e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightIndex((i) => Math.max(i - 1, -1));
                    return;
                  }
                  if (e.key === 'Enter') {
                    if (!q) return;
                    if (highlightIndex >= 0 && highlightIndex < hits.length) {
                      e.preventDefault();
                      applyTargetResource(hits[highlightIndex]!.id);
                      return;
                    }
                    const first = matchResourcesForSearch(q)[0];
                    if (!first) return;
                    e.preventDefault();
                    applyTargetResource(first.id);
                  }
                }}
              />
              <ul
                ref={searchListRef}
                id="resource-search-results"
                className="resource-search-results"
                role="listbox"
                aria-label="Matching resources"
                hidden={!showSearchPanel}
              >
                {showEmptySearch && (
                  <li className="resource-search-empty" role="presentation">
                    No matching resources
                  </li>
                )}
                {matches.map((m, idx) => (
                  <li
                    key={m.id}
                    id={`resource-search-hit-${m.id}`}
                    role="option"
                    data-resource-id={m.id}
                    className={`resource-search-hit${idx === highlightIndex ? ` ${SEARCH_HIT_ACTIVE}` : ''}`}
                    aria-selected={idx === highlightIndex ? 'true' : undefined}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyTargetResource(m.id);
                    }}
                  >
                    {resources[m.id]?.imageUrl && (
                      <img
                        className="resource-icon"
                        src={resources[m.id]!.imageUrl}
                        alt=""
                        width={20}
                        height={20}
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <span className="resource-search-hit-label">{m.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="resource-picker-wrap" ref={pickerWrapRef}>
              <button
                ref={pickerTriggerRef}
                type="button"
                id="resource-picker-trigger"
                className="resource-picker-trigger"
                aria-haspopup="listbox"
                aria-expanded={pickerOpen ? 'true' : 'false'}
                aria-controls="resource-picker-panel"
                onClick={(e) => {
                  e.stopPropagation();
                  if (pickerOpen) {
                    setPickerOpen(false);
                    return;
                  }
                  if (searchQuery.trim()) {
                    setSearchQuery('');
                    setSearchListDismissed(true);
                    searchInputRef.current?.setAttribute('aria-expanded', 'false');
                    setHighlightIndex(-1);
                  }
                  setPickerOpen(true);
                }}
              >
                {!resourceId ? (
                  TARGET_RESOURCE_PLACEHOLDER
                ) : (
                  <span className="resource-label-with-icon">
                    {resources[resourceId]?.imageUrl && (
                      <img
                        className="resource-icon"
                        src={resources[resourceId]!.imageUrl}
                        alt=""
                        width={20}
                        height={20}
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <span className="resource-label-text">
                      {resources[resourceId]?.label ?? resourceId}
                    </span>
                  </span>
                )}
              </button>
              <div
                ref={pickerPanelRef}
                id="resource-picker-panel"
                className="resource-picker-panel"
                role="listbox"
                aria-label="Browse resources by category"
                hidden={!pickerOpen}
              >
                {getResourcePickerGroups().map((group) => (
                  <div key={group.label} className="resource-picker-group">
                    <div className="resource-picker-group-label">{group.label}</div>
                    <ul className="resource-picker-group-list" role="presentation">
                      {group.entries.map(({ id, label }) => (
                        <li
                          key={id}
                          className="resource-picker-option"
                          role="option"
                          data-resource-id={id}
                          id={`resource-picker-option-${id}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            applyTargetResource(id);
                          }}
                        >
                          <span className="resource-label-with-icon">
                            {resources[id]?.imageUrl && (
                              <img
                                className="resource-icon"
                                src={resources[id]!.imageUrl}
                                alt=""
                                width={20}
                                height={20}
                                loading="lazy"
                                decoding="async"
                              />
                            )}
                            <span className="resource-label-text">{label}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <select
                id="resource-select"
                className="resource-select-sr"
                aria-hidden="true"
                tabIndex={-1}
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
              >
                <option value="">{TARGET_RESOURCE_PLACEHOLDER}</option>
                {getResourcePickerGroups().map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.entries.map(({ id, label }) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div className="field field-target-rate app-target-field-col">
            <label htmlFor="target-rate">Target Rate (per min)</label>
            <input
              ref={targetRateInputRef}
              id="target-rate"
              type="number"
              min={0.01}
              step="any"
              inputMode="decimal"
              value={targetRateText}
              onChange={(e) => {
                const input = e.currentTarget;
                const text = input.value;
                setTargetRateText(text);

                const val = parseFloat(text);
                const valid = val > 0 && isFinite(val);
                input.classList.toggle('input-invalid', !valid && text !== '');
                if (valid) setTargetRate(val);
              }}
            />
            <p
              className="resource-wiki-link-wrap"
              id="resource-wiki-link-wrap"
              hidden={!wikiUrl}
            >
              {wikiUrl && (
                <a
                  className="resource-wiki-link"
                  href={wikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on wiki
                </a>
              )}
            </p>
          </div>
        </div>

        <TargetRecipeSection
          resourceId={resourceId}
          selectedRecipeIdx={targetRecipeIdx}
          onSelectRecipe={(idx) => setTargetRecipeIdx(idx)}
        />
      </div>
    </section>
  );
}
