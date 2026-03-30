import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { DependencyNode } from '../../../assets/js/contracts';
import { firstProducingRecipeIndex } from '../../../assets/js/app/state';
import { resolve } from '../../../assets/js/calculator/resolver';
import {
  getResourceIdsConsumedInRecipes,
  RESOURCE_SEGMENTS,
  resources,
} from '../../../assets/js/data/resources';
import {
  clampPlacedPositions,
  CANVAS_PLACE_DEFAULT_RATE,
  CANVAS_CARD_HEIGHT_PX,
  CANVAS_CARD_WIDTH_PX,
  collectDependencyEdges,
  flattenDependencyTreeUniqueFirst,
  layoutPlacedNodes,
  type CanvasDependencyEdge,
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
import { CanvasDependencyLinks } from './CanvasDependencyLinks';
import { CanvasPlacedCard } from './CanvasPlacedCard';
import { CanvasPlacementGhost } from './CanvasPlacementGhost';
import { CanvasPlacementPicker } from './CanvasPlacementPicker';
import { CanvasResourceThumb } from './CanvasResourceThumb';

/** Shown on the canvas when the user leaves the block name empty. */
const DEFAULT_CANVAS_BLOCK_LABEL = 'Unnamed';

/** Horizontal gap from card edge when anchoring an “expand upstream” placement. */
const EXPAND_UPSTREAM_FROM_CARD_GAP_PX = 28;

type PlacedCanvasNode = {
  key: string;
  batchId: number;
  resourceId: string;
  label: string;
  x: number;
  y: number;
  /** User-entered production rate (per minute); string for controlled input / future parsing. */
  productionPerMin: string;
  /** User-entered consumption rate (per minute). */
  consumptionPerMin: string;
};

type PendingPlacement = {
  anchorX: number;
  anchorY: number;
  resourceId: string;
  uniqueNodes: DependencyNode[];
  tree: DependencyNode;
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
  const [blockLabelDraft, setBlockLabelDraft] = useState('');
  const [placedBlockLabels, setPlacedBlockLabels] = useState<Record<number, string>>({});
  const [placementStyle, setPlacementStyle] = useState<CanvasPlacementStyle>(loadCanvasPlacementStyle);
  const [placedEdges, setPlacedEdges] = useState<CanvasDependencyEdge[]>([]);
  const [linkLayerSize, setLinkLayerSize] = useState({ w: 0, h: 0 });
  const dragStateRef = useRef<{ batchId: number; lastX: number; lastY: number } | null>(null);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const placedNodesRef = useRef(placedNodes);
  placedNodesRef.current = placedNodes;

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
        setBlockLabelDraft('');
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
    tree: DependencyNode,
    blockTitle: string,
  ) {
    if (nodesToPlace.length === 0) return;
    const el = workspaceRef.current;
    const raw = layoutPlacedNodes(anchorX, anchorY, nodesToPlace.length, style);
    const positions =
      el && el.clientWidth > 0 && el.clientHeight > 0
        ? clampPlacedPositions(raw, el.clientWidth, el.clientHeight)
        : raw;
    const batch = placementSeq;
    setPlacementSeq((s) => s + 1);

    const keyByResourceId = new Map<string, string>();
    const nodes: PlacedCanvasNode[] = nodesToPlace.map((node, i) => {
      const key = `p${batch}-${i}-${node.id}`;
      keyByResourceId.set(node.id, key);
      return {
        key,
        batchId: batch,
        resourceId: node.id,
        label: node.label,
        x: positions[i]?.x ?? anchorX,
        y: positions[i]?.y ?? anchorY,
        productionPerMin: '',
        consumptionPerMin: '',
      };
    });

    const placedIds = new Set(nodesToPlace.map((n) => n.id));
    const edges = collectDependencyEdges(tree, placedIds, keyByResourceId);
    setPlacedEdges((prev) => [...prev, ...edges]);
    setPlacedNodes((prev) => [...prev, ...nodes]);
    const displayLabel = blockTitle.trim() || DEFAULT_CANVAS_BLOCK_LABEL;
    setPlacedBlockLabels((prev) => ({ ...prev, [batch]: displayLabel }));
    setPlaceError(null);
  }

  function beginExpandUpstreamFromCard(resourceId: string, cardX: number, cardY: number) {
    if (pendingPlacement) {
      setPendingPlacement(null);
      setDependentPick({});
      setBlockLabelDraft('');
    }
    try {
      const recipeIdx = firstProducingRecipeIndex(resourceId);
      const { tree } = resolve(resourceId, CANVAS_PLACE_DEFAULT_RATE, recipeIdx, 'full');
      const unique = flattenDependencyTreeUniqueFirst(tree);
      const anchorX = cardX + CANVAS_CARD_WIDTH_PX + EXPAND_UPSTREAM_FROM_CARD_GAP_PX;
      const anchorY = cardY + CANVAS_CARD_HEIGHT_PX / 2;
      setPendingPlacement({
        anchorX,
        anchorY,
        resourceId,
        uniqueNodes: unique,
        tree,
      });
      setDependentPick({});
      setBlockLabelDraft('');
      setSelectedResourceId(null);
      setPlaceError(null);
    } catch {
      setPlaceError('Could not resolve this resource chain.');
    }
  }

  function handleWorkspaceClick(e: React.MouseEvent<HTMLDivElement>) {
    if (pendingPlacement) return;
    if (!selectedResourceId || !workspaceRef.current) return;
    const target = e.target as HTMLElement;
    if (target.closest('.canvas-block-label')) return;
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

      setPendingPlacement({
        anchorX,
        anchorY,
        resourceId: selectedResourceId,
        uniqueNodes: unique,
        tree,
      });
      setDependentPick({});
      setBlockLabelDraft('');
      setSelectedResourceId(null);
    } catch {
      setPlaceError('Could not resolve this resource chain. Try another resource.');
    }
  }

  function confirmPendingPlacement() {
    if (!pendingPlacement) return;
    const { anchorX, anchorY, uniqueNodes, tree } = pendingPlacement;
    const toPlace = uniqueNodes.filter((node, i) => i === 0 || dependentPick[node.id] === true);
    commitPlacementAtAnchor(anchorX, anchorY, toPlace, placementStyle, tree, blockLabelDraft);
    setPendingPlacement(null);
    setDependentPick({});
    setBlockLabelDraft('');
  }

  function cancelPendingPlacement() {
    setPendingPlacement(null);
    setDependentPick({});
    setBlockLabelDraft('');
  }

  function updatePlacedNodeProduction(key: string, value: string) {
    setPlacedNodes((prev) =>
      prev.map((n) => (n.key === key ? { ...n, productionPerMin: value } : n)),
    );
  }

  function updatePlacedNodeConsumption(key: string, value: string) {
    setPlacedNodes((prev) =>
      prev.map((n) => (n.key === key ? { ...n, consumptionPerMin: value } : n)),
    );
  }

  const pendingRootDef = pendingPlacement ? resources[pendingPlacement.resourceId] : undefined;
  const pendingDependents = pendingPlacement ? pendingPlacement.uniqueNodes.slice(1) : [];

  const nodePositions = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const n of placedNodes) {
      m.set(n.key, { x: n.x, y: n.y });
    }
    return m;
  }, [placedNodes]);

  const blockLabelOverlays = useMemo(() => {
    const byBatch = new Map<number, PlacedCanvasNode[]>();
    for (const n of placedNodes) {
      const list = byBatch.get(n.batchId) ?? [];
      list.push(n);
      byBatch.set(n.batchId, list);
    }
    const out: Array<{ batchId: number; title: string; left: number; top: number }> = [];
    for (const [bid, batchNodes] of byBatch) {
      if (!batchNodes.length) continue;
      const title =
        placedBlockLabels[bid]?.trim() || DEFAULT_CANVAS_BLOCK_LABEL;
      const minX = Math.min(...batchNodes.map((n) => n.x));
      const maxX = Math.max(...batchNodes.map((n) => n.x + CANVAS_CARD_WIDTH_PX));
      const minY = Math.min(...batchNodes.map((n) => n.y));
      out.push({
        batchId: bid,
        title,
        left: (minX + maxX) / 2,
        top: minY - 6,
      });
    }
    return out;
  }, [placedNodes, placedBlockLabels]);

  function removePlacedBlock(batchId: number) {
    const prev = placedNodesRef.current;
    const keySet = new Set(
      prev.filter((n) => n.batchId === batchId).map((n) => n.key),
    );
    setPlacedNodes((nodes) => nodes.filter((n) => n.batchId !== batchId));
    setPlacedEdges((ePrev) =>
      ePrev.filter((e) => !keySet.has(e.fromKey) && !keySet.has(e.toKey)),
    );
    setPlacedBlockLabels((lPrev) => {
      const next = { ...lPrev };
      delete next[batchId];
      return next;
    });
  }

  function requestRemoveBlock(batchId: number, title: string) {
    const name = title.trim() || DEFAULT_CANVAS_BLOCK_LABEL;
    if (
      !window.confirm(
        `Remove “${name}” and all resources in this block? This cannot be undone.`,
      )
    ) {
      return;
    }
    removePlacedBlock(batchId);
  }

  useLayoutEffect(() => {
    const el = workspaceRef.current;
    if (!el) return;
    const measure = () => {
      setLinkLayerSize({ w: el.scrollWidth, h: el.scrollHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [placedNodes]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragStateRef.current;
      if (!d) return;
      const dx = e.clientX - d.lastX;
      const dy = e.clientY - d.lastY;
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      const bid = d.batchId;
      setPlacedNodes((prev) =>
        prev.map((n) => (n.batchId === bid ? { ...n, x: n.x + dx, y: n.y + dy } : n)),
      );
    };
    const onUp = () => {
      const d = dragStateRef.current;
      if (!d) return;
      dragStateRef.current = null;
      document.body.style.removeProperty('cursor');
      const bid = d.batchId;
      setPlacedNodes((prev) => {
        const batch = prev.filter((n) => n.batchId === bid);
        const rest = prev.filter((n) => n.batchId !== bid);
        const wel = workspaceRef.current;
        if (!wel || batch.length === 0) return prev;
        const positions = batch.map((n) => ({ x: n.x, y: n.y }));
        const clamped = clampPlacedPositions(positions, wel.clientWidth, wel.clientHeight);
        const merged = batch.map((n, i) => ({
          ...n,
          x: clamped[i]!.x,
          y: clamped[i]!.y,
        }));
        return [...rest, ...merged];
      });
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  function handleBatchPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('input, textarea, select, button, label')) return;
    e.preventDefault();
    e.stopPropagation();
    const raw = e.currentTarget.getAttribute('data-batch-id');
    const batchId = raw != null ? Number(raw) : NaN;
    if (Number.isNaN(batchId)) return;
    dragStateRef.current = { batchId, lastX: e.clientX, lastY: e.clientY };
    document.body.style.cursor = 'grabbing';
  }

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

        {blockLabelOverlays.map((bl) => (
          <div
            key={`block-label-${bl.batchId}`}
            className="canvas-block-label"
            style={{
              position: 'absolute',
              left: bl.left,
              top: bl.top,
              transform: 'translate(-50%, -100%)',
              zIndex: 3,
            }}
          >
            <span className="canvas-block-label-text">{bl.title}</span>
            <button
              type="button"
              className="canvas-block-label-remove"
              aria-label={`Remove block ${bl.title}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                requestRemoveBlock(bl.batchId, bl.title);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              ×
            </button>
          </div>
        ))}

        {placedEdges.length > 0 && linkLayerSize.w > 0 && linkLayerSize.h > 0 ? (
          <div
            className="canvas-workspace-links-wrap"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: linkLayerSize.w,
              height: linkLayerSize.h,
              pointerEvents: 'none',
              zIndex: 1,
            }}
            aria-hidden
          >
            <CanvasDependencyLinks
              width={linkLayerSize.w}
              height={linkLayerSize.h}
              edges={placedEdges}
              nodePositions={nodePositions}
            />
          </div>
        ) : null}

        {placedNodes.map((node) => (
          <CanvasPlacedCard
            key={node.key}
            canvasNodeKey={node.key}
            resourceId={node.resourceId}
            def={resources[node.resourceId]}
            label={node.label}
            batchId={node.batchId}
            productionPerMin={node.productionPerMin}
            consumptionPerMin={node.consumptionPerMin}
            onProductionChange={updatePlacedNodeProduction}
            onConsumptionChange={updatePlacedNodeConsumption}
            onAddUpstreamChain={() =>
              beginExpandUpstreamFromCard(node.resourceId, node.x, node.y)
            }
            onBatchPointerDown={handleBatchPointerDown}
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
          blockLabel={blockLabelDraft}
          onBlockLabelChange={setBlockLabelDraft}
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
