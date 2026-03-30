import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DependencyNode } from '../../../assets/js/contracts';
import { firstProducingRecipeIndex } from '../../../assets/js/app/state';
import { resolve } from '../../../assets/js/calculator/resolver';
import {
  getResourceIdsConsumedInRecipes,
  RESOURCE_SEGMENTS,
  resources,
} from '../../../assets/js/data/resources';
import {
  CANVAS_PLACE_DEFAULT_RATE,
  flattenDependencyTreeUniqueFirst,
  layoutPlacedNodes,
  type CanvasPlacementStyle,
} from '../../utils/canvasPlacement';
import {
  loadCanvasPlacementStyle,
  saveCanvasPlacementStyle,
} from '../../utils/canvasPlacementStyleStorage';
import {
  createExpandedMapAll,
  loadCanvasSidebarExpanded,
  saveCanvasSidebarExpanded,
} from '../../utils/canvasSidebarStorage';
import { CanvasPlacedCard } from './CanvasPlacedCard';
import { CanvasPlacementGhost } from './CanvasPlacementGhost';
import { CanvasPlacementPicker } from './CanvasPlacementPicker';
import { CanvasResourceThumb } from './CanvasResourceThumb';

type PlacedCanvasNode = {
  key: string;
  resourceId: string;
  label: string;
  x: number;
  y: number;
};

type PendingPlacement = {
  anchorX: number;
  anchorY: number;
  resourceId: string;
  uniqueNodes: DependencyNode[];
};

export function CanvasView() {
  const [search, setSearch] = useState('');
  const [expandedByLevel, setExpandedByLevel] = useState(loadCanvasSidebarExpanded);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [placementSeq, setPlacementSeq] = useState(0);
  const [placedNodes, setPlacedNodes] = useState<PlacedCanvasNode[]>([]);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [pointerInWorkspace, setPointerInWorkspace] = useState(false);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [pendingPlacement, setPendingPlacement] = useState<PendingPlacement | null>(null);
  const [dependentPick, setDependentPick] = useState<Record<string, boolean>>({});
  const [placementStyle, setPlacementStyle] = useState<CanvasPlacementStyle>(loadCanvasPlacementStyle);

  const workspaceRef = useRef<HTMLDivElement>(null);

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

  const selectedDef = selectedResourceId ? resources[selectedResourceId] : undefined;

  const selectResource = useCallback((id: string) => {
    setSelectedResourceId((prev) => (prev === id ? null : id));
    setPlaceError(null);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (pendingPlacement) {
        setPendingPlacement(null);
        setDependentPick({});
        return;
      }
      setSelectedResourceId(null);
      setPlaceError(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingPlacement]);

  function toggleCategory(level: number) {
    setExpandedByLevel((prev) => {
      const next = { ...prev, [level]: !(prev[level] ?? true) };
      saveCanvasSidebarExpanded(next);
      return next;
    });
  }

  function expandAllCategories() {
    const next = createExpandedMapAll(true);
    saveCanvasSidebarExpanded(next);
    setExpandedByLevel(next);
  }

  function collapseAllCategories() {
    const next = createExpandedMapAll(false);
    saveCanvasSidebarExpanded(next);
    setExpandedByLevel(next);
  }

  function commitPlacementAtAnchor(
    anchorX: number,
    anchorY: number,
    nodesToPlace: DependencyNode[],
    style: CanvasPlacementStyle,
  ) {
    if (nodesToPlace.length === 0) return;
    const positions = layoutPlacedNodes(anchorX, anchorY, nodesToPlace.length, style);
    const batch = placementSeq;
    setPlacementSeq((s) => s + 1);

    const next: PlacedCanvasNode[] = nodesToPlace.map((node, i) => ({
      key: `p${batch}-${i}-${node.id}`,
      resourceId: node.id,
      label: node.label,
      x: positions[i]?.x ?? anchorX,
      y: positions[i]?.y ?? anchorY,
    }));

    setPlacedNodes((prev) => [...prev, ...next]);
    setPlaceError(null);
  }

  function handleWorkspaceClick(e: React.MouseEvent<HTMLDivElement>) {
    if (pendingPlacement) return;
    if (!selectedResourceId || !workspaceRef.current) return;
    const target = e.target as HTMLElement;
    if (target.closest('.canvas-placed-card')) return;

    const rect = workspaceRef.current.getBoundingClientRect();
    const anchorX = e.clientX - rect.left;
    const anchorY = e.clientY - rect.top;

    try {
      const recipeIdx = firstProducingRecipeIndex(selectedResourceId);
      const { tree } = resolve(
        selectedResourceId,
        CANVAS_PLACE_DEFAULT_RATE,
        recipeIdx,
        'full',
      );
      const unique = flattenDependencyTreeUniqueFirst(tree);
      const dependents = unique.slice(1);

      if (dependents.length === 0) {
        commitPlacementAtAnchor(anchorX, anchorY, unique, placementStyle);
        setSelectedResourceId(null);
      } else {
        setPendingPlacement({
          anchorX,
          anchorY,
          resourceId: selectedResourceId,
          uniqueNodes: unique,
        });
        setDependentPick({});
        setSelectedResourceId(null);
      }
    } catch {
      setPlaceError('Could not resolve this resource chain. Try another resource.');
    }
  }

  function confirmPendingPlacement() {
    if (!pendingPlacement) return;
    const { anchorX, anchorY, uniqueNodes } = pendingPlacement;
    const toPlace = uniqueNodes.filter((node, i) => i === 0 || dependentPick[node.id] === true);
    commitPlacementAtAnchor(anchorX, anchorY, toPlace, placementStyle);
    setPendingPlacement(null);
    setDependentPick({});
  }

  function cancelPendingPlacement() {
    setPendingPlacement(null);
    setDependentPick({});
  }

  const pendingRootDef = pendingPlacement ? resources[pendingPlacement.resourceId] : undefined;
  const pendingDependents = pendingPlacement ? pendingPlacement.uniqueNodes.slice(1) : [];

  const workspaceClassName = [
    'canvas-workspace',
    selectedResourceId ? 'canvas-workspace--placing' : '',
    selectedResourceId && pointerInWorkspace ? 'canvas-workspace--placing-hover' : '',
  ]
    .filter(Boolean)
    .join(' ');

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
        <div
          className="canvas-placement-style field"
          role="group"
          aria-label="Resource placement layout on canvas"
        >
          <span id="canvas-placement-style-label" className="canvas-placement-style-label">
            Placement
          </span>
          <div
            className="canvas-placement-style-toggle"
            role="radiogroup"
            aria-labelledby="canvas-placement-style-label"
          >
            <button
              type="button"
              role="radio"
              className="canvas-placement-style-option"
              aria-checked={placementStyle === 'horizontal'}
              onClick={() => {
                setPlacementStyle('horizontal');
                saveCanvasPlacementStyle('horizontal');
              }}
            >
              Horizontal
            </button>
            <button
              type="button"
              role="radio"
              className="canvas-placement-style-option"
              aria-checked={placementStyle === 'vertical'}
              onClick={() => {
                setPlacementStyle('vertical');
                saveCanvasPlacementStyle('vertical');
              }}
            >
              Vertical
            </button>
          </div>
        </div>
        {categories.length > 0 ? (
          <div
            className="canvas-category-actions"
            role="group"
            aria-label="Expand or collapse all resource categories"
          >
            <button
              type="button"
              className="btn btn-secondary canvas-category-action-btn"
              onClick={expandAllCategories}
            >
              Expand all
            </button>
            <button
              type="button"
              className="btn btn-secondary canvas-category-action-btn"
              onClick={collapseAllCategories}
            >
              Collapse all
            </button>
          </div>
        ) : null}
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
                          isSelected={selectedResourceId === id}
                          onSelect={selectResource}
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
      <div
        ref={workspaceRef}
        className={workspaceClassName}
        onMouseEnter={() => setPointerInWorkspace(true)}
        onMouseLeave={() => {
          setPointerInWorkspace(false);
          setPointer(null);
        }}
        onMouseMove={(e) => {
          if (!workspaceRef.current) return;
          const r = workspaceRef.current.getBoundingClientRect();
          setPointer({ x: e.clientX - r.left, y: e.clientY - r.top });
        }}
        onClick={handleWorkspaceClick}
      >
        {placedNodes.length === 0 && !selectedResourceId ? (
          <p className="canvas-workspace-hint">Canvas</p>
        ) : null}

        {selectedResourceId && pointerInWorkspace && pointer && selectedDef ? (
          <>
            <div className="canvas-workspace-place-hint" aria-live="polite">
              Click to place {selectedDef.label}
            </div>
            <CanvasPlacementGhost
              left={pointer.x}
              top={pointer.y}
              label={selectedDef.label}
              imageUrl={selectedDef.imageUrl || undefined}
            />
          </>
        ) : null}

        {placeError ? (
          <p className="canvas-workspace-error" role="alert">
            {placeError}
          </p>
        ) : null}

        {placedNodes.map((node) => (
          <CanvasPlacedCard
            key={node.key}
            resourceId={node.resourceId}
            def={resources[node.resourceId]}
            label={node.label}
            style={{
              position: 'absolute',
              left: node.x,
              top: node.y,
            }}
          />
        ))}
      </div>

      {pendingPlacement && pendingRootDef ? (
        <CanvasPlacementPicker
          rootId={pendingPlacement.resourceId}
          rootLabel={pendingRootDef.label}
          dependents={pendingDependents}
          resources={resources}
          selected={dependentPick}
          onToggle={(id) =>
            setDependentPick((prev) => ({ ...prev, [id]: !prev[id] }))
          }
          onSelectAllDependents={() => {
            const next: Record<string, boolean> = {};
            for (const d of pendingDependents) {
              next[d.id] = true;
            }
            setDependentPick(next);
          }}
          onClearDependents={() => setDependentPick({})}
          onConfirm={confirmPendingPlacement}
          onCancel={cancelPendingPlacement}
        />
      ) : null}
    </div>
  );
}
