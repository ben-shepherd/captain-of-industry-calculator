import { resources } from '../data/resources';
import { BUILTIN_PRODUCTION_PRESETS } from '../data/defaultProductionPresets';
import { loadState, saveState } from './persistence';
import type { AppState, ProductionPreset, ResultsSectionsState } from '../contracts';

/**
 * Central application state.
 *
 * Holds user selections and provides getters/setters that
 * auto-persist to localStorage on every mutation.
 */

const DEFAULT_RESULTS_SECTIONS: ResultsSectionsState = {
  base: true,
  net: true,
  tree: true,
};

const DEFAULT_STATE: AppState = {
  resourceId: Object.keys(resources)[0]!,
  targetRate: 12,
  production: {},
  productionExtraIds: [],
  productionDismissedIds: [],
  productionPresets: [],
  resultsSections: { ...DEFAULT_RESULTS_SECTIONS },
};

let state: AppState = { ...DEFAULT_STATE };

function isValidTargetRate(rate: unknown): rate is number {
  return typeof rate === "number" && rate > 0 && isFinite(rate);
}

/**
 * Initialise state from localStorage (if available) or use defaults.
 * Call once at app startup.
 */
export function initState(): void {
  const saved = loadState();
  if (saved) {
    state = { ...DEFAULT_STATE, ...saved };
    if (!resources[state.resourceId]) {
      state.resourceId = DEFAULT_STATE.resourceId;
    }
    if (!isValidTargetRate(state.targetRate)) {
      state.targetRate = DEFAULT_STATE.targetRate;
    }
    const prod: Record<string, number> = {};
    for (const [id, amt] of Object.entries(state.production)) {
      if (resources[id]) prod[id] = amt;
    }
    state.production = prod;
    state.productionExtraIds = (state.productionExtraIds ?? []).filter(
      (id) => resources[id],
    );
    state.productionDismissedIds = (state.productionDismissedIds ?? []).filter(
      (id) => resources[id],
    );
    state.productionPresets = sanitizePresets(state.productionPresets ?? []);
    state.resultsSections = normalizeResultsSections(state.resultsSections);
    persist();
  }
}

function normalizeResultsSections(
  rs: AppState["resultsSections"] | undefined,
): ResultsSectionsState {
  return {
    base: rs?.base ?? true,
    net: rs?.net ?? true,
    tree: rs?.tree ?? true,
  };
}

export function getResourceId(): string {
  return state.resourceId;
}

export function setResourceId(id: string): void {
  if (!resources[id]) return;
  state.resourceId = id;
  state.productionDismissedIds = [];
  persist();
}

export function getTargetRate(): number {
  return state.targetRate;
}

export function setTargetRate(rate: number): void {
  if (!isValidTargetRate(rate)) return;
  state.targetRate = rate;
  persist();
}

export function getProduction(): Record<string, number> {
  return { ...state.production };
}

/**
 * Set the user's production rate for a single resource.
 */
export function setProduction(id: string, amount: number): void {
  if (typeof amount !== "number" || !isFinite(amount)) return;
  if (amount <= 0) {
    delete state.production[id];
  } else {
    state.production[id] = amount;
  }
  persist();
}

export function getProductionExtraIds(): readonly string[] {
  return state.productionExtraIds;
}

export function addProductionExtraId(id: string): void {
  if (!resources[id]) return;
  if (state.productionExtraIds.includes(id)) return;
  state.productionExtraIds = [...state.productionExtraIds, id];
  persist();
}

export function removeProductionExtraId(id: string): void {
  state.productionExtraIds = state.productionExtraIds.filter((x) => x !== id);
  persist();
}

export function dismissProductionRow(id: string): void {
  if (!resources[id]) return;
  if (state.productionDismissedIds.includes(id)) return;
  state.productionDismissedIds = [...state.productionDismissedIds, id];
  persist();
}

export function getProductionDismissedIds(): readonly string[] {
  return state.productionDismissedIds;
}

/**
 * Built-in presets (code) first, then user-saved presets (localStorage).
 */
export function getProductionPresets(): readonly ProductionPreset[] {
  return [...BUILTIN_PRODUCTION_PRESETS, ...state.productionPresets];
}

export function findProductionPresetById(
  presetId: string,
): ProductionPreset | undefined {
  return (
    BUILTIN_PRODUCTION_PRESETS.find((p) => p.id === presetId)
    ?? state.productionPresets.find((p) => p.id === presetId)
  );
}

function newPresetId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `preset-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function sanitizePresets(presets: ProductionPreset[]): ProductionPreset[] {
  return presets
    .filter((p) => p.id && typeof p.name === "string")
    .map((p) => ({
      id: p.id,
      name: p.name,
      production: Object.fromEntries(
        Object.entries(p.production ?? {}).filter(([id]) => resources[id]),
      ),
      productionExtraIds: (p.productionExtraIds ?? []).filter((id) => resources[id]),
    }));
}

export function saveProductionPreset(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const preset: ProductionPreset = {
    id: newPresetId(),
    name: trimmed,
    production: { ...state.production },
    productionExtraIds: [...state.productionExtraIds],
  };
  state.productionPresets = [...state.productionPresets, preset];
  persist();
}

export function applyProductionPreset(presetId: string): void {
  const p = findProductionPresetById(presetId);
  if (!p) return;
  state.production = Object.fromEntries(
    Object.entries(p.production).filter(([id]) => resources[id]),
  );
  state.productionExtraIds = [...p.productionExtraIds].filter((id) =>
    resources[id],
  );
  state.productionDismissedIds = [];
  persist();
}

export function deleteProductionPreset(presetId: string): void {
  if (BUILTIN_PRODUCTION_PRESETS.some((p) => p.id === presetId)) return;
  state.productionPresets = state.productionPresets.filter((x) => x.id !== presetId);
  persist();
}

export type ResultsSectionKey = keyof ResultsSectionsState;

export function getResultsSections(): ResultsSectionsState {
  return { ...state.resultsSections };
}

export function setResultsSectionExpanded(
  key: ResultsSectionKey,
  expanded: boolean,
): void {
  if (state.resultsSections[key] === expanded) return;
  state.resultsSections = {
    ...state.resultsSections,
    [key]: expanded,
  };
  persist();
}

/**
 * Return a plain snapshot of the full state (useful for debugging / tests).
 */
export function getSnapshot(): AppState {
  return {
    resourceId: state.resourceId,
    targetRate: state.targetRate,
    production: { ...state.production },
    productionExtraIds: [...state.productionExtraIds],
    productionDismissedIds: [...state.productionDismissedIds],
    productionPresets: state.productionPresets.map((p) => ({
      id: p.id,
      name: p.name,
      production: { ...p.production },
      productionExtraIds: [...p.productionExtraIds],
    })),
    resultsSections: { ...state.resultsSections },
  };
}

export function resetState(): void {
  state = {
    ...DEFAULT_STATE,
    production: {},
    productionExtraIds: [],
    productionDismissedIds: [],
    productionPresets: [],
    resultsSections: { ...DEFAULT_RESULTS_SECTIONS },
  };
  persist();
}

function persist(): void {
  saveState(getSnapshot());
}
