import { useMemo, useState } from 'react';
import { resources } from '../../../assets/js/data/resources';

export function CanvasView() {
  const [search, setSearch] = useState('');

  const filteredIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    const ids = Object.keys(resources);
    if (!q) return ids;
    return ids.filter((id) => {
      const def = resources[id];
      if (!def) return false;
      return def.label.toLowerCase().includes(q) || id.toLowerCase().includes(q);
    });
  }, [search]);

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
        <div className="canvas-resource-strip" role="list" aria-label="Resource icons">
          {filteredIds.map((id) => {
            const def = resources[id];
            if (!def) return null;
            const url = def.imageUrl;
            return (
              <div key={id} className="canvas-resource-thumb" role="listitem" title={def.label}>
                {url ? (
                  <img
                    className="resource-icon canvas-resource-icon"
                    src={url}
                    alt={def.label}
                  />
                ) : (
                  <span className="canvas-resource-fallback" aria-hidden>
                    {def.label.slice(0, 1)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </aside>
      <div className="canvas-workspace">
        <p className="canvas-workspace-hint">Canvas</p>
      </div>
    </div>
  );
}
