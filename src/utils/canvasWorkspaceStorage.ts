import { resources } from '../../assets/js/data/resources';
import type { CanvasDependencyEdge } from './canvasPlacement';
import { clampCanvasRateString } from './canvasBlockResults';

export const CANVAS_WORKSPACE_STORAGE_KEY = 'coi-canvas-workspace';
const VERSION = 1;

/** Serializable mirror of a placed node in {@link CanvasView}. */
export type PersistedPlacedNode = {
  key: string;
  batchId: number;
  resourceId: string;
  label: string;
  x: number;
  y: number;
  productionPerMin: string;
  consumptionPerMin: string;
};

export type WorkspaceScroll = { scrollLeft: number; scrollTop: number };

export type PersistedCanvasWorkspace = {
  v: number;
  placementSeq: number;
  placedNodes: PersistedPlacedNode[];
  placedEdges: CanvasDependencyEdge[];
  placedBlockLabels: Record<string, string>;
  search: string;
  workspaceScroll?: WorkspaceScroll;
};

function isFiniteNum(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

function parseBlockLabels(raw: unknown): Record<number, string> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<number, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(k);
    if (Number.isFinite(n) && typeof v === 'string') out[n] = v;
  }
  return out;
}

function validateNodes(raw: unknown): PersistedPlacedNode[] {
  if (!Array.isArray(raw)) return [];
  const out: PersistedPlacedNode[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const key = typeof o.key === 'string' ? o.key : '';
    const resourceId = typeof o.resourceId === 'string' ? o.resourceId : '';
    if (!key || !resourceId || !resources[resourceId]) continue;
    const batchId = typeof o.batchId === 'number' && Number.isFinite(o.batchId) ? o.batchId : 0;
    const label = typeof o.label === 'string' ? o.label : resources[resourceId]?.label ?? resourceId;
    const x = isFiniteNum(o.x) ? o.x : 0;
    const y = isFiniteNum(o.y) ? o.y : 0;
    const productionPerMin = clampCanvasRateString(
      typeof o.productionPerMin === 'string' ? o.productionPerMin : '',
    );
    const consumptionPerMin = clampCanvasRateString(
      typeof o.consumptionPerMin === 'string' ? o.consumptionPerMin : '',
    );
    out.push({
      key,
      batchId,
      resourceId,
      label,
      x,
      y,
      productionPerMin,
      consumptionPerMin,
    });
  }
  return out;
}

function validateEdges(raw: unknown, validKeys: Set<string>): CanvasDependencyEdge[] {
  if (!Array.isArray(raw)) return [];
  const out: CanvasDependencyEdge[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const fromKey = typeof o.fromKey === 'string' ? o.fromKey : '';
    const toKey = typeof o.toKey === 'string' ? o.toKey : '';
    if (!fromKey || !toKey || !validKeys.has(fromKey) || !validKeys.has(toKey)) continue;
    out.push({ fromKey, toKey });
  }
  return out;
}

function parseScroll(raw: unknown): WorkspaceScroll | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const scrollLeft = isFiniteNum(o.scrollLeft) ? o.scrollLeft : 0;
  const scrollTop = isFiniteNum(o.scrollTop) ? o.scrollTop : 0;
  return { scrollLeft, scrollTop };
}

/** Load and validate workspace data from localStorage. */
export function loadCanvasWorkspace(): {
  placementSeq: number;
  placedNodes: PersistedPlacedNode[];
  placedEdges: CanvasDependencyEdge[];
  placedBlockLabels: Record<number, string>;
  search: string;
  workspaceScroll: WorkspaceScroll | null;
} {
  try {
    const raw = localStorage.getItem(CANVAS_WORKSPACE_STORAGE_KEY);
    if (!raw) {
      return {
        placementSeq: 0,
        placedNodes: [],
        placedEdges: [],
        placedBlockLabels: {},
        search: '',
        workspaceScroll: null,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedCanvasWorkspace>;
    if (!parsed || typeof parsed !== 'object' || parsed.v !== VERSION) {
      return {
        placementSeq: 0,
        placedNodes: [],
        placedEdges: [],
        placedBlockLabels: {},
        search: '',
        workspaceScroll: null,
      };
    }

    const placedNodes = validateNodes(parsed.placedNodes);
    const keySet = new Set(placedNodes.map((n) => n.key));
    const placedEdges = validateEdges(parsed.placedEdges, keySet);
    const placedBlockLabels = parseBlockLabels(parsed.placedBlockLabels);
    const search = typeof parsed.search === 'string' ? parsed.search : '';

    const maxBatch = placedNodes.length
      ? Math.max(...placedNodes.map((n) => n.batchId))
      : -1;
    const seqRaw =
      typeof parsed.placementSeq === 'number' && Number.isFinite(parsed.placementSeq)
        ? parsed.placementSeq
        : 0;
    const placementSeq = Math.max(seqRaw, maxBatch + 1);

    const workspaceScroll = parseScroll(parsed.workspaceScroll) ?? null;

    return {
      placementSeq,
      placedNodes,
      placedEdges,
      placedBlockLabels,
      search,
      workspaceScroll,
    };
  } catch {
    return {
      placementSeq: 0,
      placedNodes: [],
      placedEdges: [],
      placedBlockLabels: {},
      search: '',
      workspaceScroll: null,
    };
  }
}

export function saveCanvasWorkspace(data: {
  placementSeq: number;
  placedNodes: PersistedPlacedNode[];
  placedEdges: CanvasDependencyEdge[];
  placedBlockLabels: Record<number, string>;
  search: string;
  workspaceScroll?: WorkspaceScroll;
}): void {
  const blockLabels: Record<string, string> = {};
  for (const [k, v] of Object.entries(data.placedBlockLabels)) {
    blockLabels[String(k)] = v;
  }
  const payload: PersistedCanvasWorkspace = {
    v: VERSION,
    placementSeq: data.placementSeq,
    placedNodes: data.placedNodes,
    placedEdges: data.placedEdges,
    placedBlockLabels: blockLabels,
    search: data.search,
    workspaceScroll: data.workspaceScroll,
  };
  try {
    localStorage.setItem(CANVAS_WORKSPACE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function clearCanvasWorkspaceStorage(): void {
  try {
    localStorage.removeItem(CANVAS_WORKSPACE_STORAGE_KEY);
  } catch {
    // ignore
  }
}
