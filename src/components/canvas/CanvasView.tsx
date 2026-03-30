import { useMemo, useState } from 'react';
import {
  getResourceIdsConsumedInRecipes,
  RESOURCE_SEGMENTS,
} from '../../../assets/js/data/resources';
import { CanvasResourceThumb } from './CanvasResourceThumb';
import {
  loadCanvasSidebarExpanded,
  saveCanvasSidebarExpanded,
} from '../../utils/canvasSidebarStorage';

export function CanvasView() {
  const [search, setSearch] = useState('');
  const [expandedByLevel, setExpandedByLevel] = useState(loadCanvasSidebarExpanded);

  const consumedInputIds = useMemo(() => getResourceIdsConsumedInRecipes(), []);

  const categories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return RESOURCE_SEGMENTS.map((seg) => {
      const entries = Object.entries(seg.map)
        .filter(([id]) => consumedInputIds.has(id))
        .filter(([id, def]) => {
          if (!q) return true;
          return def.label.toLowerCase().includes(q) || id.toLowerCase().includes(q);
        })
        .sort((a, b) => a[1].label.localeCompare(b[1].label, 'en'));
      return {
        level: seg.level,
        groupLabel: seg.groupLabel,
        entries,
      };
    }).filter((seg) => seg.entries.length > 0);
  }, [search, consumedInputIds]);

  function toggleCategory(level: number) {
    setExpandedByLevel((prev) => {
      const next = { ...prev, [level]: !(prev[level] ?? true) };
      saveCanvasSidebarExpanded(next);
      return next;
    });
  }

  return (
    <div className="canvas-view" id="app-canvas-view" aria-label="Blueprint canvas">
      <aside className="canvas-sidebar">
        <div className="canvas-search field">
          <label htmlFor="canvas-resource-search">Search resources</label>
          <input
            id="canvas-resource-search"
            type="search"
            className="canvas-search-input"
            placeholder="Filter by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="canvas-resource-strip">
          {categories.length === 0 ? (
            <p className="canvas-resource-empty">No resources match your filter.</p>
          ) : (
            categories.map((seg) => {
              const expanded = expandedByLevel[seg.level] ?? true;
              const headingId = `canvas-cat-${seg.level}`;
              const gridId = `canvas-cat-grid-${seg.level}`;
              return (
                <section
                  key={seg.level}
                  className="canvas-resource-category"
                  aria-labelledby={headingId}
                >
                  <button
                    type="button"
                    id={headingId}
                    className="canvas-resource-category-toggle"
                    aria-expanded={expanded}
                    aria-controls={gridId}
                    onClick={() => toggleCategory(seg.level)}
                  >
                    <span className="canvas-resource-category-toggle-label">
                      Level {seg.level} — {seg.groupLabel}
                    </span>
                    <span className="canvas-resource-category-toggle-chevron" aria-hidden />
                  </button>
                  {expanded ? (
                    <div
                      className="canvas-resource-grid"
                      id={gridId}
                      role="list"
                      aria-label={seg.groupLabel}
                    >
                      {seg.entries.map(([id, def]) => (
                        <CanvasResourceThumb
                          key={id}
                          resourceId={id}
                          def={def}
                          category={{ level: seg.level, groupLabel: seg.groupLabel }}
                        />
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })
          )}
        </div>
      </aside>
      <div className="canvas-workspace">
        <p className="canvas-workspace-hint">Canvas</p>
      </div>
    </div>
  );
}
