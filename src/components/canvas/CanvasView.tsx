import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  CANVAS_CARD_HEIGHT_PX,
  CANVAS_CARD_WIDTH_PX,
  CANVAS_SURFACE_MIN_SIZE_PX,
  CANVAS_SURFACE_PAD_PX,
  CANVAS_WORKSPACE_EDGE_PAD_PX,
  collectDependencyEdges,
  computeCanvasContentExtent,
  finalizeNewBatchPositions,
  finalizeSingleCardPosition,
  flattenDependencyTreeUniqueFirst,
  layoutPlacedNodes,
  nodeToAxisRect,
  computeBlockSelectionHighlightRect,
  scrollWorkspaceToShowRect,
  type CanvasDependencyEdge,
  type CanvasPlacementStyle,
} from '../../utils/canvasPlacement';
import { parseCanvasRateString } from '../../utils/canvasBlockResults';
import {
  loadCanvasPlacementStyle,
  saveCanvasPlacementStyle,
} from '../../utils/canvasPlacementStyleStorage';
import {
  createExpandedMapAll,
  loadCanvasSidebarExpanded,
  saveCanvasSidebarExpanded,
} from '../../utils/canvasSidebarStorage';
import type { PersistedPlacedNode, WorkspaceScroll } from '../../utils/canvasWorkspaceStorage';
import {
  CANVAS_WORKSPACE_STORAGE_KEY,
  loadCanvasWorkspace,
  saveCanvasWorkspace,
} from '../../utils/canvasWorkspaceStorage';
import {
  loadCanvasResultsSidebarVisible,
  saveCanvasResultsSidebarVisible,
} from '../../utils/canvasResultsSidebarStorage';
import {
  CANVAS_RESULTS_SIDEBAR_WIDTH_MAX_PX,
  CANVAS_RESULTS_SIDEBAR_WIDTH_MIN_PX,
  clampCanvasResultsSidebarWidthPx,
  clampCanvasResultsSidebarWidthPxForViewport,
  loadCanvasResultsSidebarWidthPx,
  saveCanvasResultsSidebarWidthPx,
} from '../../utils/canvasResultsSidebarWidthStorage';
import { useCoiStore } from '../../../assets/js/app/coiExternalStore';
import { calculate } from '../../../assets/js/calculator/service';
import type { CalculationOutcome } from '../../hooks/useCalculation';
import { CanvasResultsSidebar } from './CanvasResultsSidebar';
import { CanvasWorkspaceLayer } from './CanvasWorkspaceLayer';
import { CanvasPlacedCard } from './CanvasPlacedCard';
import { CanvasPlacementGhost } from './CanvasPlacementGhost';
import { CanvasPlacementPicker } from './CanvasPlacementPicker';
import { CanvasResourceThumb } from './CanvasResourceThumb';

/** Shown on the canvas when the user leaves the block name empty. */
const DEFAULT_CANVAS_BLOCK_LABEL = 'Unnamed';

/** Horizontal gap from card edge when anchoring an “expand upstream” placement. */
const EXPAND_UPSTREAM_FROM_CARD_GAP_PX = 28;

/** If the pointer moves farther than this while panning, the following click is ignored (e.g. place). */
const CANVAS_PAN_SUPPRESS_CLICK_PX = 5;

/** Card pointer movement below this is treated as a click (block selection), not a drag. */
const CANVAS_CARD_CLICK_MAX_MOVE_PX = 28;

/** Left-drag on empty canvas, or middle-drag anywhere on the viewport, pans the scroll area. */
function isCanvasViewportPanTarget(e: React.PointerEvent): boolean {
  if (e.button === 1) return true;
  if (e.button !== 0) return false;
  const t = e.target as HTMLElement;
  if (t.closest('.canvas-placed-card')) return false;
  if (t.closest('.canvas-block-label')) return false;
  if (t.closest('.canvas-placement-ghost')) return false;
  if (t.closest('.canvas-workspace-place-hint')) return false;
  if (t.closest('.canvas-workspace-error')) return false;
  if (t.closest('.canvas-workspace-hint')) return false;
  if (t.closest('input, textarea, select, button, label')) return false;
  return true;
}

type PlacedCanvasNode = PersistedPlacedNode;

type PendingPlacement = {
  anchorX: number;
  anchorY: number;
  resourceId: string;
  uniqueNodes: DependencyNode[];
  tree: DependencyNode;
  /** When set, confirm merges into this block instead of creating a new batch. */
  mergeIntoBatchId?: number;
};

export function CanvasView() {
  const state = useCoiStore();
  const initialCanvas = useMemo(() => loadCanvasWorkspace(), []);
  const [search, setSearch] = useState(initialCanvas.search);
  const [blocksPanelOpen, setBlocksPanelOpen] = useState(false);
  const [resultsSidebarVisible, setResultsSidebarVisible] = useState(
    loadCanvasResultsSidebarVisible,
  );
  const [resultsSidebarWidthPx, setResultsSidebarWidthPx] = useState(
    loadCanvasResultsSidebarWidthPx,
  );
  const [viewportWidthForSidebar, setViewportWidthForSidebar] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1920,
  );
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [expandedByLevel, setExpandedByLevel] = useState(loadCanvasSidebarExpanded);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [placementSeq, setPlacementSeq] = useState(initialCanvas.placementSeq);
  const [placedNodes, setPlacedNodes] = useState<PlacedCanvasNode[]>(initialCanvas.placedNodes);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [pointerInWorkspace, setPointerInWorkspace] = useState(false);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [pendingPlacement, setPendingPlacement] = useState<PendingPlacement | null>(null);
  const [dependentPick, setDependentPick] = useState<Record<string, boolean>>({});
  const [blockLabelDraft, setBlockLabelDraft] = useState('');
  const [placedBlockLabels, setPlacedBlockLabels] = useState<Record<number, string>>(
    initialCanvas.placedBlockLabels,
  );
  const [blockLabelRename, setBlockLabelRename] = useState<{
    batchId: number;
    draft: string;
  } | null>(null);
  const skipBlockLabelRenameCommitRef = useRef(false);
  const blockLabelRenameInputRef = useRef<HTMLInputElement>(null);
  const [placementStyle, setPlacementStyle] = useState<CanvasPlacementStyle>(loadCanvasPlacementStyle);
  const [placedEdges, setPlacedEdges] = useState<CanvasDependencyEdge[]>(initialCanvas.placedEdges);
  const [workspaceViewport, setWorkspaceViewport] = useState({ w: 0, h: 0 });
  const [canvasPanning, setCanvasPanning] = useState(false);
  const canvasPanRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startScrollLeft: number;
    startScrollTop: number;
  } | null>(null);
  const suppressCanvasClickRef = useRef(false);
  const resultsSidebarResizeRef = useRef<{
    pointerId: number;
    startClientX: number;
    startDesiredWidthPx: number;
  } | null>(null);
  const dragStateRef = useRef<
    | { kind: 'batch'; batchId: number; lastX: number; lastY: number }
    | {
        kind: 'card';
        canvasKey: string;
        lastX: number;
        lastY: number;
        startX: number;
        startY: number;
      }
    | null
  >(null);

  const workspaceRef = useRef<HTMLDivElement>(null);
  /** Inner surface; card `left`/`top` are relative to this element (not the scroll container). */
  const workspaceSurfaceRef = useRef<HTMLDivElement>(null);
  const hasCenteredInitialCanvasScrollRef = useRef(false);

  /** Map viewport coordinates to the same space as `node.x` / `node.y` (surface-relative). */
  const clientPointToSurfaceCoords = useCallback((clientX: number, clientY: number) => {
    const surf = workspaceSurfaceRef.current;
    if (!surf) return null;
    const r = surf.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }, []);
  const pendingScrollRestoreRef = useRef<WorkspaceScroll | null>(initialCanvas.workspaceScroll);
  const workspacePersistRef = useRef({
    placementSeq,
    placedNodes,
    placedEdges,
    placedBlockLabels,
    search,
  });
  workspacePersistRef.current = {
    placementSeq,
    placedNodes,
    placedEdges,
    placedBlockLabels,
    search,
  };
  const placedNodesRef = useRef(placedNodes);
  placedNodesRef.current = placedNodes;

  const resultsSidebarWidthPxRef = useRef(resultsSidebarWidthPx);
  resultsSidebarWidthPxRef.current = resultsSidebarWidthPx;

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

  const effectiveResultsSidebarWidthPx = useMemo(
    () =>
      clampCanvasResultsSidebarWidthPxForViewport(
        resultsSidebarWidthPx,
        viewportWidthForSidebar,
      ),
    [resultsSidebarWidthPx, viewportWidthForSidebar],
  );

  const selectResource = useCallback((id: string) => {
    setSelectedResourceId((prev) => (prev === id ? null : id));
    setPlaceError(null);
  }, []);

  const handleResultsSidebarResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      resultsSidebarResizeRef.current = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startDesiredWidthPx: resultsSidebarWidthPxRef.current,
      };
      document.body.style.userSelect = 'none';
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        resultsSidebarResizeRef.current = null;
        document.body.style.userSelect = '';
      }
    },
    [],
  );

  const handleResultsSidebarResizePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const s = resultsSidebarResizeRef.current;
      if (!s || e.pointerId !== s.pointerId) return;
      const nextDesired = clampCanvasResultsSidebarWidthPx(
        s.startDesiredWidthPx + (s.startClientX - e.clientX),
      );
      setResultsSidebarWidthPx(nextDesired);
    },
    [],
  );

  const handleResultsSidebarResizePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const s = resultsSidebarResizeRef.current;
      if (!s || e.pointerId !== s.pointerId) return;
      resultsSidebarResizeRef.current = null;
      document.body.style.userSelect = '';
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [],
  );

  useEffect(() => {
    saveCanvasResultsSidebarVisible(resultsSidebarVisible);
  }, [resultsSidebarVisible]);

  useEffect(() => {
    saveCanvasResultsSidebarWidthPx(resultsSidebarWidthPx);
  }, [resultsSidebarWidthPx]);

  useEffect(() => {
    const onResize = () => setViewportWidthForSidebar(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (blockLabelRename) {
        e.preventDefault();
        skipBlockLabelRenameCommitRef.current = true;
        setBlockLabelRename(null);
        return;
      }
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
  }, [pendingPlacement, blockLabelRename]);

  /** Only when entering rename for a batch — not on every draft keystroke (select() would replace text). */
  useLayoutEffect(() => {
    if (!blockLabelRename) return;
    const el = blockLabelRenameInputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [blockLabelRename?.batchId]);

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
    const pad = CANVAS_WORKSPACE_EDGE_PAD_PX;
    const wrapW =
      el && el.clientWidth > 0
        ? Math.max(CANVAS_CARD_WIDTH_PX, el.clientWidth - pad * 2)
        : undefined;
    const raw = layoutPlacedNodes(anchorX, anchorY, nodesToPlace.length, style, wrapW);
    const staticRects = placedNodesRef.current.map((n) =>
      nodeToAxisRect(n.x, n.y, CANVAS_CARD_WIDTH_PX, CANVAS_CARD_HEIGHT_PX),
    );
    const restNodes = placedNodesRef.current.map((n) => ({ x: n.x, y: n.y }));
    const positions =
      el && el.clientWidth > 0
        ? finalizeNewBatchPositions(
            raw,
            staticRects,
            restNodes,
            CANVAS_CARD_WIDTH_PX,
            CANVAS_CARD_HEIGHT_PX,
            pad,
            el,
          )
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
    setSelectedBatchId(batch);

    if (el && el.clientWidth > 0 && positions.length > 0) {
      const minX = Math.min(...positions.map((p) => p.x));
      const maxX = Math.max(...positions.map((p) => p.x + CANVAS_CARD_WIDTH_PX));
      const minY = Math.min(...positions.map((p) => p.y));
      const maxY = Math.max(...positions.map((p) => p.y + CANVAS_CARD_HEIGHT_PX));
      scrollWorkspaceToShowRect(
        el,
        { left: minX, top: minY, right: maxX, bottom: maxY },
        32,
      );
    }
  }

  function commitMergeIntoBatch(
    batchId: number,
    anchorX: number,
    anchorY: number,
    newNodes: DependencyNode[],
    tree: DependencyNode,
  ) {
    if (newNodes.length === 0) return;
    const el = workspaceRef.current;
    const pad = CANVAS_WORKSPACE_EDGE_PAD_PX;
    const wrapW =
      el && el.clientWidth > 0
        ? Math.max(CANVAS_CARD_WIDTH_PX, el.clientWidth - pad * 2)
        : undefined;
    const raw = layoutPlacedNodes(anchorX, anchorY, newNodes.length, placementStyle, wrapW);
    const prev = placedNodesRef.current;
    const staticRects = prev.map((n) =>
      nodeToAxisRect(n.x, n.y, CANVAS_CARD_WIDTH_PX, CANVAS_CARD_HEIGHT_PX),
    );
    const restNodes = prev.map((n) => ({ x: n.x, y: n.y }));
    const positions =
      el && el.clientWidth > 0
        ? finalizeNewBatchPositions(
            raw,
            staticRects,
            restNodes,
            CANVAS_CARD_WIDTH_PX,
            CANVAS_CARD_HEIGHT_PX,
            pad,
            el,
          )
        : raw;

    const batchInBatch = prev.filter((n) => n.batchId === batchId);
    const batchOldKeys = new Set(batchInBatch.map((n) => n.key));
    const startIdx = batchInBatch.length;

    const keyByResourceId = new Map<string, string>();
    for (const n of batchInBatch) {
      keyByResourceId.set(n.resourceId, n.key);
    }

    const newPlaced: PlacedCanvasNode[] = newNodes.map((node, i) => {
      const key = `p${batchId}-${startIdx + i}-${node.id}`;
      keyByResourceId.set(node.id, key);
      return {
        key,
        batchId,
        resourceId: node.id,
        label: node.label,
        x: positions[i]?.x ?? anchorX,
        y: positions[i]?.y ?? anchorY,
        productionPerMin: '',
        consumptionPerMin: '',
      };
    });

    const placedIds = new Set<string>();
    for (const n of batchInBatch) {
      placedIds.add(n.resourceId);
    }
    for (const n of newNodes) {
      placedIds.add(n.id);
    }

    const newEdges = collectDependencyEdges(tree, placedIds, keyByResourceId);

    setPlacedEdges((prevEdges) => [
      ...prevEdges.filter((e) => !(batchOldKeys.has(e.fromKey) && batchOldKeys.has(e.toKey))),
      ...newEdges,
    ]);
    setPlacedNodes((p) => [...p, ...newPlaced]);
    setPlaceError(null);
    setSelectedBatchId(batchId);

    if (el && el.clientWidth > 0 && positions.length > 0) {
      const minX = Math.min(...positions.map((p) => p.x));
      const maxX = Math.max(...positions.map((p) => p.x + CANVAS_CARD_WIDTH_PX));
      const minY = Math.min(...positions.map((p) => p.y));
      const maxY = Math.max(...positions.map((p) => p.y + CANVAS_CARD_HEIGHT_PX));
      scrollWorkspaceToShowRect(
        el,
        { left: minX, top: minY, right: maxX, bottom: maxY },
        32,
      );
    }
  }

  function beginExpandUpstreamFromCard(
    resourceId: string,
    cardX: number,
    cardY: number,
    batchId: number,
  ) {
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
      const blockTitle = placedBlockLabels[batchId]?.trim() ?? '';
      setPendingPlacement({
        anchorX,
        anchorY,
        resourceId,
        uniqueNodes: unique,
        tree,
        mergeIntoBatchId: batchId,
      });
      setDependentPick({});
      setBlockLabelDraft(blockTitle);
      setSelectedResourceId(null);
      setSelectedBatchId(batchId);
      setPlaceError(null);
    } catch {
      setPlaceError('Could not resolve this resource chain.');
    }
  }

  function confirmPendingPlacement() {
    if (!pendingPlacement) return;
    const { anchorX, anchorY, uniqueNodes, tree, mergeIntoBatchId } = pendingPlacement;
    if (mergeIntoBatchId != null) {
      const already = new Set(
        placedNodesRef.current
          .filter((n) => n.batchId === mergeIntoBatchId)
          .map((n) => n.resourceId),
      );
      const toPlace = uniqueNodes.filter(
        (node, i) => i > 0 && dependentPick[node.id] === true && !already.has(node.id),
      );
      commitMergeIntoBatch(mergeIntoBatchId, anchorX, anchorY, toPlace, tree);
    } else {
      const toPlace = uniqueNodes.filter((node, i) => i === 0 || dependentPick[node.id] === true);
      commitPlacementAtAnchor(anchorX, anchorY, toPlace, placementStyle, tree, blockLabelDraft);
    }
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
  const resourceIdsInMergeTargetBatch = useMemo(() => {
    const bid = pendingPlacement?.mergeIntoBatchId;
    if (bid == null) return null;
    const s = new Set<string>();
    for (const n of placedNodes) {
      if (n.batchId === bid) s.add(n.resourceId);
    }
    return s;
  }, [pendingPlacement?.mergeIntoBatchId, placedNodes]);

  const pendingDependents = useMemo(() => {
    if (!pendingPlacement) return [];
    const rest = pendingPlacement.uniqueNodes.slice(1);
    if (!resourceIdsInMergeTargetBatch) return rest;
    return rest.filter((n) => !resourceIdsInMergeTargetBatch.has(n.id));
  }, [pendingPlacement, resourceIdsInMergeTargetBatch]);

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

  /** Hit-test bounds per block (cards + title), same geometry as the selection ring. */
  const batchHighlightRectsById = useMemo(() => {
    const byBatch = new Map<number, PlacedCanvasNode[]>();
    for (const n of placedNodes) {
      const list = byBatch.get(n.batchId) ?? [];
      list.push(n);
      byBatch.set(n.batchId, list);
    }
    const m = new Map<number, { left: number; top: number; width: number; height: number }>();
    for (const [bid, batchNodes] of byBatch) {
      if (!batchNodes.length) continue;
      const label = blockLabelOverlays.find((bl) => bl.batchId === bid);
      const r = computeBlockSelectionHighlightRect(
        batchNodes,
        label ? { left: label.left, top: label.top } : undefined,
        CANVAS_CARD_WIDTH_PX,
        CANVAS_CARD_HEIGHT_PX,
      );
      if (r) m.set(bid, r);
    }
    return m;
  }, [placedNodes, blockLabelOverlays]);

  const findBatchAtCanvasPoint = useCallback((x: number, y: number): number | null => {
    let best: { bid: number; area: number } | null = null;
    for (const [bid, r] of batchHighlightRectsById) {
      if (x >= r.left && x <= r.left + r.width && y >= r.top && y <= r.top + r.height) {
        const area = r.width * r.height;
        if (!best || area < best.area) best = { bid, area };
      }
    }
    return best?.bid ?? null;
  }, [batchHighlightRectsById]);

  const handleWorkspaceClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (suppressCanvasClickRef.current) {
        e.preventDefault();
        return;
      }
      if (pendingPlacement) return;
      const target = e.target as HTMLElement;
      if (target.closest('.canvas-block-label')) return;
      if (target.closest('.canvas-placed-card')) return;

      const wel = workspaceRef.current;
      if (!wel) return;

      const pt = clientPointToSurfaceCoords(e.clientX, e.clientY);
      if (!pt) return;
      const { x: anchorX, y: anchorY } = pt;

      const hitBatchId = findBatchAtCanvasPoint(anchorX, anchorY);

      if (!selectedResourceId) {
        setSelectedBatchId(hitBatchId != null ? hitBatchId : null);
        return;
      }

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
    },
    [pendingPlacement, selectedResourceId, findBatchAtCanvasPoint, clientPointToSurfaceCoords],
  );

  /** Unique resource ids in first-seen (placement) order within the selected block. */
  const selectedBlockResourceIdsOrdered = useMemo(() => {
    if (selectedBatchId == null) return null;
    const seen = new Set<string>();
    const out: string[] = [];
    for (const n of placedNodes) {
      if (n.batchId !== selectedBatchId) continue;
      if (seen.has(n.resourceId)) continue;
      seen.add(n.resourceId);
      out.push(n.resourceId);
    }
    return out;
  }, [placedNodes, selectedBatchId]);

  /** First placed card in the selected block — used as calculation target when Calculator has no target. */
  const blockAnchorResourceId = useMemo(() => {
    if (selectedBatchId == null) return null;
    const node = placedNodes.find((n) => n.batchId === selectedBatchId);
    return node?.resourceId ?? null;
  }, [placedNodes, selectedBatchId]);

  const blockAnchorNode = useMemo(() => {
    if (selectedBatchId == null) return null;
    return placedNodes.find((n) => n.batchId === selectedBatchId) ?? null;
  }, [placedNodes, selectedBatchId]);

  /** While a block is selected on the canvas, sidebar math uses that block only (not the Calculator target). */
  const effectiveTargetResourceId =
    selectedBatchId != null ? blockAnchorResourceId : state.resourceId ?? null;

  /** Target rate for `calculate`: block anchor production, or Calculator target rate. */
  const effectiveCanvasTargetRate = useMemo(() => {
    if (selectedBatchId == null) return state.targetRate;
    const anchor = blockAnchorNode;
    if (!anchor) return state.targetRate;
    const r = parseCanvasRateString(anchor.productionPerMin);
    if (r > 0 && Number.isFinite(r)) return r;
    return CANVAS_PLACE_DEFAULT_RATE;
  }, [selectedBatchId, blockAnchorNode, state.targetRate]);

  /** Recipe index for `calculate`: anchor’s first producing recipe when a block is selected. */
  const effectiveCanvasTargetRecipeIdx = useMemo(() => {
    if (selectedBatchId == null) return state.targetRecipeIdx;
    if (!effectiveTargetResourceId) return state.targetRecipeIdx;
    return firstProducingRecipeIndex(effectiveTargetResourceId);
  }, [selectedBatchId, effectiveTargetResourceId, state.targetRecipeIdx]);

  /**
   * Per-resource effective supply (production − consumption) from cards in the selected block,
   * merged over global production for net flow.
   */
  const canvasBlockProductionForNet = useMemo(() => {
    if (selectedBatchId == null) return undefined;
    const out: Record<string, number> = {};
    for (const n of placedNodes) {
      if (n.batchId !== selectedBatchId) continue;
      const p = parseCanvasRateString(n.productionPerMin);
      const c = parseCanvasRateString(n.consumptionPerMin);
      const add = Math.max(0, p - c);
      out[n.resourceId] = (out[n.resourceId] ?? 0) + add;
    }
    return out;
  }, [placedNodes, selectedBatchId]);

  const canvasOutcome = useMemo((): CalculationOutcome => {
    if (!effectiveTargetResourceId) {
      return { ok: true, result: null };
    }
    try {
      const canvasBaseRequirementsMode = selectedBatchId != null ? 'full' : state.baseRequirementsMode;
      const result = calculate(
        effectiveTargetResourceId,
        effectiveCanvasTargetRate,
        effectiveCanvasTargetRecipeIdx,
        canvasBaseRequirementsMode,
      );
      return { ok: true, result };
    } catch {
      return { ok: false, result: null };
    }
  }, [
    effectiveTargetResourceId,
    effectiveCanvasTargetRate,
    effectiveCanvasTargetRecipeIdx,
    selectedBatchId,
    state.baseRequirementsMode,
  ]);

  const selectedBlockTitle = useMemo(() => {
    if (selectedBatchId == null) return null;
    const raw = placedBlockLabels[selectedBatchId]?.trim();
    return raw || DEFAULT_CANVAS_BLOCK_LABEL;
  }, [placedBlockLabels, selectedBatchId]);

  const blockSelectionHighlightRect = useMemo(() => {
    if (selectedBatchId == null) return null;
    const batchNodes = placedNodes.filter((n) => n.batchId === selectedBatchId);
    if (batchNodes.length === 0) return null;
    const label = blockLabelOverlays.find((bl) => bl.batchId === selectedBatchId);
    return computeBlockSelectionHighlightRect(
      batchNodes,
      label ? { left: label.left, top: label.top } : undefined,
      CANVAS_CARD_WIDTH_PX,
      CANVAS_CARD_HEIGHT_PX,
    );
  }, [placedNodes, selectedBatchId, blockLabelOverlays]);

  useEffect(() => {
    if (selectedBatchId == null) return;
    if (!placedNodes.some((n) => n.batchId === selectedBatchId)) {
      setSelectedBatchId(null);
    }
  }, [placedNodes, selectedBatchId]);

  const canvasContentExtent = useMemo(
    () =>
      computeCanvasContentExtent(
        placedNodes,
        blockLabelOverlays.map((bl) => ({ left: bl.left, top: bl.top })),
        CANVAS_CARD_WIDTH_PX,
        CANVAS_CARD_HEIGHT_PX,
        CANVAS_SURFACE_PAD_PX,
      ),
    [placedNodes, blockLabelOverlays],
  );

  const canvasSurfaceSize = useMemo(() => {
    const vw = Math.max(1, workspaceViewport.w);
    const vh = Math.max(1, workspaceViewport.h);
    const { width: cw, height: ch } = canvasContentExtent;
    const min = CANVAS_SURFACE_MIN_SIZE_PX;
    if (cw === 0 && ch === 0) {
      return { w: Math.max(min, vw), h: Math.max(min, vh) };
    }
    return {
      w: Math.max(min, vw, cw),
      h: Math.max(min, vh, ch),
    };
  }, [workspaceViewport, canvasContentExtent]);

  const canvasBlocks = useMemo(() => {
    const byBatch = new Map<number, PlacedCanvasNode[]>();
    for (const n of placedNodes) {
      const list = byBatch.get(n.batchId) ?? [];
      list.push(n);
      byBatch.set(n.batchId, list);
    }
    const out: Array<{
      batchId: number;
      title: string;
      rect: { left: number; top: number; width: number; height: number } | null;
    }> = [];
    for (const [bid, batchNodes] of byBatch) {
      if (!batchNodes.length) continue;
      const label = blockLabelOverlays.find((bl) => bl.batchId === bid);
      const title = placedBlockLabels[bid]?.trim() || DEFAULT_CANVAS_BLOCK_LABEL;
      const rect = computeBlockSelectionHighlightRect(
        batchNodes,
        label ? { left: label.left, top: label.top } : undefined,
        CANVAS_CARD_WIDTH_PX,
        CANVAS_CARD_HEIGHT_PX,
      );
      out.push({ batchId: bid, title, rect });
    }
    out.sort((a, b) => a.title.localeCompare(b.title, 'en') || a.batchId - b.batchId);
    return out;
  }, [placedNodes, placedBlockLabels, blockLabelOverlays]);

  const scrollWorkspaceToBlock = useCallback(
    (batchId: number) => {
      const wel = workspaceRef.current;
      if (!wel) return;
      const block = canvasBlocks.find((b) => b.batchId === batchId);
      if (!block?.rect) return;
      scrollWorkspaceToShowRect(
        wel,
        {
          left: block.rect.left,
          top: block.rect.top,
          right: block.rect.left + block.rect.width,
          bottom: block.rect.top + block.rect.height,
        },
        48,
      );
      setSelectedBatchId(batchId);
    },
    [canvasBlocks],
  );

  const fitCanvasToContent = useCallback(() => {
    const wel = workspaceRef.current;
    if (!wel) return;
    if (placedNodesRef.current.length === 0 && blockLabelOverlays.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const n of placedNodesRef.current) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + CANVAS_CARD_WIDTH_PX);
      maxY = Math.max(maxY, n.y + CANVAS_CARD_HEIGHT_PX);
    }
    for (const bl of blockLabelOverlays) {
      // Approximate label bounds to match `computeCanvasContentExtent`.
      minX = Math.min(minX, bl.left - 120);
      maxX = Math.max(maxX, bl.left + 120);
      minY = Math.min(minY, bl.top - 36);
      maxY = Math.max(maxY, bl.top + 12);
    }

    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
      return;
    }

    scrollWorkspaceToShowRect(wel, { left: minX, top: minY, right: maxX, bottom: maxY }, 72);
  }, [blockLabelOverlays]);

  function removePlacedBlock(batchId: number) {
    setSelectedBatchId((sel) => (sel === batchId ? null : sel));
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

  function removePlacedNode(canvasNodeKey: string) {
    const prev = placedNodesRef.current;
    const node = prev.find((n) => n.key === canvasNodeKey);
    if (!node) return;
    const batchId = node.batchId;
    const othersInBatch = prev.filter(
      (n) => n.batchId === batchId && n.key !== canvasNodeKey,
    );
    setPlacedNodes((nodes) => nodes.filter((n) => n.key !== canvasNodeKey));
    setPlacedEdges((ePrev) =>
      ePrev.filter((e) => e.fromKey !== canvasNodeKey && e.toKey !== canvasNodeKey),
    );
    if (othersInBatch.length === 0) {
      setSelectedBatchId((sel) => (sel === batchId ? null : sel));
      setPlacedBlockLabels((lPrev) => {
        const next = { ...lPrev };
        delete next[batchId];
        return next;
      });
    }
  }

  function requestRemovePlacedNode(canvasNodeKey: string) {
    const prev = placedNodesRef.current;
    const node = prev.find((n) => n.key === canvasNodeKey);
    if (!node) return;
    const isLastInBatch = prev.filter((n) => n.batchId === node.batchId).length === 1;
    const label = node.label;
    const msg = isLastInBatch
      ? `Remove “${label}” from this block? The block will be removed because no resources remain.`
      : `Remove “${label}” from this block?`;
    if (!window.confirm(msg)) return;
    removePlacedNode(canvasNodeKey);
  }

  useLayoutEffect(() => {
    const el = workspaceRef.current;
    if (!el) return;
    const measure = () => {
      setWorkspaceViewport({ w: el.clientWidth, h: el.clientHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Persist workspace (nodes, edges, labels, search, scroll). */
  useEffect(() => {
    saveCanvasWorkspace({
      placementSeq,
      placedNodes,
      placedEdges,
      placedBlockLabels,
      search,
      workspaceScroll: workspaceRef.current
        ? {
            scrollLeft: workspaceRef.current.scrollLeft,
            scrollTop: workspaceRef.current.scrollTop,
          }
        : undefined,
    });
  }, [placementSeq, placedNodes, placedEdges, placedBlockLabels, search]);

  /** Debounced save when the user only pans/scrolls the workspace. */
  useEffect(() => {
    const el = workspaceRef.current;
    if (!el) return;
    let tid: number | undefined;
    const onScroll = () => {
      if (tid !== undefined) window.clearTimeout(tid);
      tid = window.setTimeout(() => {
        tid = undefined;
        saveCanvasWorkspace({
          ...workspacePersistRef.current,
          workspaceScroll: {
            scrollLeft: el.scrollLeft,
            scrollTop: el.scrollTop,
          },
        });
      }, 350);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (tid !== undefined) window.clearTimeout(tid);
      el.removeEventListener('scroll', onScroll);
    };
  }, []);

  /** Flush latest scroll + graph state when leaving the canvas view (unmount). */
  useEffect(() => {
    return () => {
      // If the user hit the global Reset while on the canvas, storage is cleared before unmount.
      // In that case, don't re-persist the stale in-memory workspace during cleanup.
      try {
        if (localStorage.getItem(CANVAS_WORKSPACE_STORAGE_KEY) === null) {
          return;
        }
      } catch {
        // ignore (private mode / unavailable storage)
      }
      const el = workspaceRef.current;
      saveCanvasWorkspace({
        ...workspacePersistRef.current,
        workspaceScroll: el
          ? { scrollLeft: el.scrollLeft, scrollTop: el.scrollTop }
          : undefined,
      });
    };
  }, []);

  /**
   * Initial scroll: restore from storage if present; otherwise center the large default canvas
   * once sizes are known.
   */
  useLayoutEffect(() => {
    const el = workspaceRef.current;
    if (!el || hasCenteredInitialCanvasScrollRef.current) return;
    if (el.clientWidth <= 0 || el.clientHeight <= 0) return;
    const w = canvasSurfaceSize.w;
    const h = canvasSurfaceSize.h;
    if (w <= 0 || h <= 0) return;
    const pending = pendingScrollRestoreRef.current;
    if (pending) {
      el.scrollLeft = Math.min(
        Math.max(0, pending.scrollLeft),
        Math.max(0, w - el.clientWidth),
      );
      el.scrollTop = Math.min(
        Math.max(0, pending.scrollTop),
        Math.max(0, h - el.clientHeight),
      );
      pendingScrollRestoreRef.current = null;
    } else {
      el.scrollLeft = Math.max(0, (w - el.clientWidth) / 2);
      el.scrollTop = Math.max(0, (h - el.clientHeight) / 2);
    }
    hasCenteredInitialCanvasScrollRef.current = true;
  }, [canvasSurfaceSize.w, canvasSurfaceSize.h]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragStateRef.current;
      if (!d) return;
      const dx = e.clientX - d.lastX;
      const dy = e.clientY - d.lastY;
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      if (d.kind === 'batch') {
        const bid = d.batchId;
        setPlacedNodes((prev) =>
          prev.map((n) => (n.batchId === bid ? { ...n, x: n.x + dx, y: n.y + dy } : n)),
        );
      } else {
        const key = d.canvasKey;
        setPlacedNodes((prev) =>
          prev.map((n) => (n.key === key ? { ...n, x: n.x + dx, y: n.y + dy } : n)),
        );
      }
    };
    const onUp = () => {
      const d = dragStateRef.current;
      if (!d) return;
      dragStateRef.current = null;
      document.body.style.removeProperty('cursor');
      const pad = CANVAS_WORKSPACE_EDGE_PAD_PX;
      if (d.kind === 'card') {
        const moved =
          Math.abs(d.lastX - d.startX) + Math.abs(d.lastY - d.startY);
        if (moved < CANVAS_CARD_CLICK_MAX_MOVE_PX) {
          const node = placedNodesRef.current.find((n) => n.key === d.canvasKey);
          if (node) {
            setSelectedBatchId((prev) =>
              prev === node.batchId ? null : node.batchId,
            );
          }
        }
      }
      if (d.kind === 'batch') {
        const bid = d.batchId;
        setPlacedNodes((prev) => {
          const batch = prev.filter((n) => n.batchId === bid);
          const rest = prev.filter((n) => n.batchId !== bid);
          const wel = workspaceRef.current;
          if (!wel || batch.length === 0) return prev;
          const staticRects = rest.map((n) =>
            nodeToAxisRect(n.x, n.y, CANVAS_CARD_WIDTH_PX, CANVAS_CARD_HEIGHT_PX),
          );
          const restNodes = rest.map((n) => ({ x: n.x, y: n.y }));
          const positions = batch.map((n) => ({ x: n.x, y: n.y }));
          const finalized = finalizeNewBatchPositions(
            positions,
            staticRects,
            restNodes,
            CANVAS_CARD_WIDTH_PX,
            CANVAS_CARD_HEIGHT_PX,
            pad,
            wel,
          );
          const merged = batch.map((n, i) => ({
            ...n,
            x: finalized[i]!.x,
            y: finalized[i]!.y,
          }));
          return [...rest, ...merged];
        });
      } else {
        const canvasKey = d.canvasKey;
        setPlacedNodes((prev) => {
          const node = prev.find((n) => n.key === canvasKey);
          if (!node) return prev;
          const rest = prev.filter((n) => n.key !== canvasKey);
          const wel = workspaceRef.current;
          if (!wel) return prev;
          const staticRects = rest.map((n) =>
            nodeToAxisRect(n.x, n.y, CANVAS_CARD_WIDTH_PX, CANVAS_CARD_HEIGHT_PX),
          );
          const restNodes = rest.map((n) => ({ x: n.x, y: n.y }));
          const pos = finalizeSingleCardPosition(
            { x: node.x, y: node.y },
            staticRects,
            restNodes,
            CANVAS_CARD_WIDTH_PX,
            CANVAS_CARD_HEIGHT_PX,
            pad,
            wel,
          );
          return prev.map((n) =>
            n.key === canvasKey ? { ...n, x: pos.x, y: pos.y } : n,
          );
        });
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  function handleCardPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('input, textarea, select, button, label')) return;
    e.preventDefault();
    e.stopPropagation();
    const key = e.currentTarget.getAttribute('data-canvas-node-key');
    if (!key) return;
    dragStateRef.current = {
      kind: 'card',
      canvasKey: key,
      lastX: e.clientX,
      lastY: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
    };
    document.body.style.cursor = 'grabbing';
  }

  function handleBlockLabelPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    if ((e.target as HTMLElement).closest('input, textarea')) return;
    e.preventDefault();
    e.stopPropagation();
    const raw = e.currentTarget.getAttribute('data-batch-id');
    const batchId = raw != null ? Number(raw) : NaN;
    if (Number.isNaN(batchId)) return;
    if (blockLabelRename?.batchId === batchId) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let started = false;

    const onMove = (ev: PointerEvent) => {
      if (started) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (dx * dx + dy * dy < 25) return;
      started = true;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      dragStateRef.current = { kind: 'batch', batchId, lastX: ev.clientX, lastY: ev.clientY };
      document.body.style.cursor = 'grabbing';
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (!started) {
        setSelectedBatchId((prev) => (prev === batchId ? null : batchId));
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function handleWorkspacePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (dragStateRef.current) return;
    /** Placing from the sidebar: left-click must reach `handleWorkspaceClick`, not start a pan + capture. */
    if (selectedResourceId && e.button === 0) return;
    if (!isCanvasViewportPanTarget(e)) return;
    const wel = workspaceRef.current;
    if (!wel) return;
    if (e.button === 1) {
      e.preventDefault();
    }
    canvasPanRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startScrollLeft: wel.scrollLeft,
      startScrollTop: wel.scrollTop,
    };
    suppressCanvasClickRef.current = false;
    setCanvasPanning(true);
    try {
      wel.setPointerCapture(e.pointerId);
    } catch {
      canvasPanRef.current = null;
      setCanvasPanning(false);
    }
  }

  function handleWorkspacePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const p = canvasPanRef.current;
    if (!p || e.pointerId !== p.pointerId) return;
    const wel = workspaceRef.current;
    if (!wel) return;
    wel.scrollLeft = p.startScrollLeft - (e.clientX - p.startClientX);
    wel.scrollTop = p.startScrollTop - (e.clientY - p.startClientY);
    const moved =
      Math.abs(e.clientX - p.startClientX) + Math.abs(e.clientY - p.startClientY);
    if (moved > CANVAS_PAN_SUPPRESS_CLICK_PX) {
      suppressCanvasClickRef.current = true;
    }
  }

  function endCanvasPan(e: React.PointerEvent<HTMLDivElement>) {
    const p = canvasPanRef.current;
    if (!p || e.pointerId !== p.pointerId) return;
    const wel = workspaceRef.current;
    if (wel) {
      try {
        wel.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    }
    canvasPanRef.current = null;
    setCanvasPanning(false);
    if (suppressCanvasClickRef.current) {
      window.setTimeout(() => {
        suppressCanvasClickRef.current = false;
      }, 0);
    }
  }

  const workspaceClassName = [
    'canvas-workspace',
    selectedResourceId ? 'canvas-workspace--placing' : '',
    selectedResourceId && pointerInWorkspace ? 'canvas-workspace--placing-hover' : '',
    canvasPanning ? 'canvas-workspace--panning' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={[
        'canvas-view',
        resultsSidebarVisible ? '' : 'canvas-view--results-collapsed',
      ]
        .filter(Boolean)
        .join(' ')}
      id="app-canvas-view"
      aria-label="Blueprint canvas"
    >
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
              aria-checked={placementStyle === 'auto'}
              onClick={() => {
                setPlacementStyle('auto');
                saveCanvasPlacementStyle('auto');
              }}
            >
              Auto
            </button>
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
          const pt = clientPointToSurfaceCoords(e.clientX, e.clientY);
          if (!pt) return;
          setPointer({ x: pt.x, y: pt.y });
        }}
        onPointerDown={handleWorkspacePointerDown}
        onPointerMove={handleWorkspacePointerMove}
        onPointerUp={endCanvasPan}
        onPointerCancel={endCanvasPan}
        onClick={handleWorkspaceClick}
      >
        <div className="canvas-workspace-toolbar" role="group" aria-label="Canvas view controls">
          <button
            type="button"
            className="btn btn-secondary canvas-workspace-toolbar-btn"
            onClick={() => {
              setBlocksPanelOpen(false);
              fitCanvasToContent();
            }}
            disabled={placedNodes.length === 0 && blockLabelOverlays.length === 0}
            title="Scroll to show all blocks"
          >
            Fit
          </button>
          <div className="canvas-workspace-toolbar-popover-anchor">
            <button
              type="button"
              className="btn btn-secondary canvas-workspace-toolbar-btn"
              aria-expanded={blocksPanelOpen}
              aria-controls="canvas-blocks-panel"
              onClick={() => setBlocksPanelOpen((v) => !v)}
              disabled={canvasBlocks.length === 0}
              title="Jump to a block"
            >
              Blocks
            </button>
            {blocksPanelOpen ? (
              <div
                id="canvas-blocks-panel"
                className="canvas-blocks-panel"
                role="dialog"
                aria-label="Blocks on canvas"
              >
                <div className="canvas-blocks-panel-header">
                  <div className="canvas-blocks-panel-title">Blocks</div>
                  <button
                    type="button"
                    className="canvas-blocks-panel-close"
                    aria-label="Close blocks list"
                    onClick={() => setBlocksPanelOpen(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="canvas-blocks-panel-body">
                  {canvasBlocks.map((b) => (
                    <button
                      key={b.batchId}
                      type="button"
                      className={[
                        'canvas-blocks-panel-item',
                        selectedBatchId === b.batchId ? 'canvas-blocks-panel-item--active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => {
                        setBlocksPanelOpen(false);
                        scrollWorkspaceToBlock(b.batchId);
                      }}
                      title="Center this block in view"
                    >
                      <span className="canvas-blocks-panel-item-title">{b.title}</span>
                      <span className="canvas-blocks-panel-item-id">#{b.batchId}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div
          ref={workspaceSurfaceRef}
          className="canvas-workspace-surface"
          style={{
            width: canvasSurfaceSize.w,
            height: canvasSurfaceSize.h,
          }}
        >
          {placedEdges.length > 0 && canvasSurfaceSize.w > 0 && canvasSurfaceSize.h > 0 ? (
            <CanvasWorkspaceLayer
              width={canvasSurfaceSize.w}
              height={canvasSurfaceSize.h}
              edges={placedEdges}
              nodePositions={nodePositions}
            />
          ) : null}

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
              data-batch-id={bl.batchId}
              title="Drag to move entire block · Double-click label to rename"
              onPointerDown={handleBlockLabelPointerDown}
              style={{
                position: 'absolute',
                left: bl.left,
                top: bl.top,
                transform: 'translate(-50%, -100%)',
                zIndex: 3,
              }}
            >
              {blockLabelRename?.batchId === bl.batchId ? (
                <input
                  ref={blockLabelRenameInputRef}
                  type="text"
                  className="canvas-block-label-input"
                  aria-label="Block name"
                  value={blockLabelRename.draft}
                  onChange={(e) =>
                    setBlockLabelRename((prev) =>
                      prev && prev.batchId === bl.batchId
                        ? { ...prev, draft: e.target.value }
                        : prev,
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      (e.target as HTMLInputElement).blur();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      skipBlockLabelRenameCommitRef.current = true;
                      setBlockLabelRename(null);
                    }
                  }}
                  onBlur={() => {
                    if (skipBlockLabelRenameCommitRef.current) {
                      skipBlockLabelRenameCommitRef.current = false;
                      return;
                    }
                    setBlockLabelRename((prev) => {
                      if (!prev || prev.batchId !== bl.batchId) return prev;
                      const displayLabel = prev.draft.trim() || DEFAULT_CANVAS_BLOCK_LABEL;
                      setPlacedBlockLabels((p) => ({ ...p, [bl.batchId]: displayLabel }));
                      return null;
                    });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="canvas-block-label-text"
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setBlockLabelRename({
                      batchId: bl.batchId,
                      draft: placedBlockLabels[bl.batchId] ?? '',
                    });
                  }}
                >
                  {bl.title}
                </span>
              )}
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
              beginExpandUpstreamFromCard(node.resourceId, node.x, node.y, node.batchId)
            }
            onRemoveFromBlock={() => requestRemovePlacedNode(node.key)}
            onCardPointerDown={handleCardPointerDown}
              style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
              }}
            />
          ))}

          {blockSelectionHighlightRect ? (
            <div
              className="canvas-block-selection-highlight"
              aria-hidden
              style={{
                position: 'absolute',
                left: blockSelectionHighlightRect.left,
                top: blockSelectionHighlightRect.top,
                width: blockSelectionHighlightRect.width,
                height: blockSelectionHighlightRect.height,
              }}
            />
          ) : null}
        </div>
      </div>

      {resultsSidebarVisible ? (
        <div
          className="canvas-results-sidebar-shell"
          style={{
            flex: `0 0 ${effectiveResultsSidebarWidthPx}px`,
            width: effectiveResultsSidebarWidthPx,
            minWidth: 0,
          }}
        >
          <div
            className="canvas-results-sidebar-resize-handle"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize results panel"
            aria-valuenow={effectiveResultsSidebarWidthPx}
            aria-valuemin={CANVAS_RESULTS_SIDEBAR_WIDTH_MIN_PX}
            aria-valuemax={CANVAS_RESULTS_SIDEBAR_WIDTH_MAX_PX}
            onPointerDown={handleResultsSidebarResizePointerDown}
            onPointerMove={handleResultsSidebarResizePointerMove}
            onPointerUp={handleResultsSidebarResizePointerUp}
            onPointerCancel={handleResultsSidebarResizePointerUp}
          />
          <CanvasResultsSidebar
            outcome={canvasOutcome}
            onHide={() => setResultsSidebarVisible(false)}
            canvasBlockProduction={canvasBlockProductionForNet}
            blockResourceOrder={
              selectedBatchId != null ? selectedBlockResourceIdsOrdered ?? [] : undefined
            }
            selectedBlockLabel={selectedBatchId != null ? selectedBlockTitle : null}
            effectiveTargetResourceId={effectiveTargetResourceId}
          />
        </div>
      ) : (
        <button
          type="button"
          className="canvas-results-sidebar-reopen"
          aria-label="Show results panel"
          onClick={() => setResultsSidebarVisible(true)}
        >
          Results
        </button>
      )}

      {pendingPlacement && pendingRootDef ? (
        <CanvasPlacementPicker
          rootId={pendingPlacement.resourceId}
          rootLabel={pendingRootDef.label}
          dependents={pendingDependents}
          resources={resources}
          mergeIntoExistingBlock={pendingPlacement.mergeIntoBatchId != null}
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
