import { indexOfFirstProducingRecipe } from '../calculator/recipePick';
import { resources } from '../data/resources';
import { BUILTIN_PRODUCTION_PRESETS } from '../data/defaultProductionPresets';
import { clearState, loadState, saveState } from './persistence';
import {
  NET_FLOW_CHART_STYLE_DEFAULT,
  type AppState,
  type BaseRequirementsMode,
  type InputsSectionsState,
  type NetFlowChartStyle,
  type ProductionPreset,
  type ResultsSectionsState,
} from '../contracts';

/**
 * Central application state.
 *
 * Holds user selections and provides getters/setters that
 * auto-persist to localStorage on every mutation.
 */

const DEFAULT_RESULTS_SECTIONS: ResultsSectionsState = {
  base: true,
  net: true,
  tree: false,
};

const DEFAULT_INPUTS_SECTIONS: InputsSectionsState = {
  targetRate: true,
  production: true,
  presets: true,
};

const MAX_RECENT_TARGET_RESOURCES = 12;

const DEFAULT_STATE: AppState = {
  resourceId: "",
  targetRate: 12,
  targetRecipeIdx: 0,
  baseRequirementsMode: "direct",
  recentTargetResourceIds: [],
  production: {},
  productionExtraIds: [],
  productionDismissedIds: [],
  productionPresets: [],
  resultsSections: { ...DEFAULT_RESULTS_SECTIONS },
  inputsSections: { ...DEFAULT_INPUTS_SECTIONS },
  netFlowChartStyle: NET_FLOW_CHART_STYLE_DEFAULT,
  userGuideExpanded: true,
  userGuideVisible: false,
  userGuideDismissedCalculator: false,
  userGuideDismissedCanvas: false,
};

let state: AppState = { ...DEFAULT_STATE };

function isValidTargetRate(rate: unknown): rate is number {
  return typeof rate === "number" && rate > 0 && isFinite(rate);
}

/** Smallest index of a recipe that outputs `resourceId`, or 0 if none. */
export function firstProducingRecipeIndex(resourceId: string): number {
  if (!resourceId) return 0;
  return indexOfFirstProducingRecipe(resourceId) ?? 0;
}

function normalizeTargetRecipeIdx(resourceId: string, idx: unknown): number {
  if (
    typeof idx !== "number"
    || !Number.isInteger(idx)
    || idx < 0
  ) {
    return firstProducingRecipeIndex(resourceId);
  }
  const def = resources[resourceId];
  if (!def || idx >= def.recipes.length) {
    return firstProducingRecipeIndex(resourceId);
  }
  const recipeAt = def.recipes[idx];
  if (!recipeAt || (recipeAt.outputs[resourceId] ?? 0) <= 0) {
    return firstProducingRecipeIndex(resourceId);
  }
  return idx;
}

/**
 * Replace in-memory state from a persisted snapshot, validate against current
 * resource definitions, and persist to localStorage.
 */
function clampTargetRecipeIdx(resourceId: string, idx: number): number {
  const def = resources[resourceId];
  if (!def) return 0;
  const valid: number[] = [];
  for (let i = 0; i < def.recipes.length; i++) {
    const recipe = def.recipes[i];
    if (recipe && (recipe.outputs[resourceId] ?? 0) > 0) valid.push(i);
  }
  if (valid.length === 0) return 0;
  if (valid.includes(idx)) return idx;
  return valid[0] ?? 0;
}

export function applyLoadedState(saved: AppState): void {
  state = { ...DEFAULT_STATE, ...saved };
  if (!resources[state.resourceId]) {
    state.resourceId = DEFAULT_STATE.resourceId;
  }
  if (!isValidTargetRate(state.targetRate)) {
    state.targetRate = DEFAULT_STATE.targetRate;
  }
  const rawIdx = state.targetRecipeIdx;
  state.targetRecipeIdx = clampTargetRecipeIdx(
    state.resourceId,
    typeof rawIdx === "number" && Number.isInteger(rawIdx) && rawIdx >= 0
      ? rawIdx
      : 0,
  );
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
  state.inputsSections = normalizeInputsSections(state.inputsSections);
  state.targetRecipeIdx = normalizeTargetRecipeIdx(
    state.resourceId,
    state.targetRecipeIdx,
  );
  state.baseRequirementsMode = normalizeBaseRequirementsMode(
    state.baseRequirementsMode,
  );
  state.netFlowChartStyle = normalizeNetFlowChartStyle(state.netFlowChartStyle);
  state.userGuideExpanded = normalizeUserGuideExpanded(state.userGuideExpanded);
  state.userGuideVisible = normalizeUserGuideVisible(state.userGuideVisible);
  state.userGuideDismissedCalculator = normalizeUserGuideDismissed(
    state.userGuideDismissedCalculator,
  );
  state.userGuideDismissedCanvas = normalizeUserGuideDismissed(
    state.userGuideDismissedCanvas,
  );
  state.recentTargetResourceIds = normalizeRecentTargetResourceIds(
    state.recentTargetResourceIds,
  );
  persist();
}

/**
 * Initialise state from localStorage (if available) or use defaults.
 * Call once at app startup.
 */
export function initState(): void {
  const saved = loadState();
  if (saved) {
    applyLoadedState(saved);
  }
}

function normalizeResultsSections(
  rs: AppState["resultsSections"] | undefined,
): ResultsSectionsState {
  return {
    base: rs?.base ?? true,
    net: rs?.net ?? true,
    tree: rs?.tree ?? false,
  };
}

function normalizeInputsSections(
  is: AppState["inputsSections"] | undefined,
): InputsSectionsState {
  return {
    targetRate: is?.targetRate ?? true,
    production: is?.production ?? true,
    presets: is?.presets ?? true,
  };
}

function normalizeBaseRequirementsMode(
  m: BaseRequirementsMode | undefined,
): BaseRequirementsMode {
  return m === "full" ? "full" : "direct";
}

export function getBaseRequirementsMode(): BaseRequirementsMode {
  return state.baseRequirementsMode;
}

export function setBaseRequirementsMode(mode: BaseRequirementsMode): void {
  if (mode !== "direct" && mode !== "full") return;
  if (state.baseRequirementsMode === mode) return;
  state.baseRequirementsMode = mode;
  persist();
}

const NET_FLOW_CHART_STYLES: readonly NetFlowChartStyle[] = [
  "horizontal-grouped",
  "vertical-grouped",
  "line",
];

function normalizeNetFlowChartStyle(v: unknown): NetFlowChartStyle {
  return NET_FLOW_CHART_STYLES.includes(v as NetFlowChartStyle)
    ? (v as NetFlowChartStyle)
    : NET_FLOW_CHART_STYLE_DEFAULT;
}

function normalizeUserGuideExpanded(v: unknown): boolean {
  return typeof v === "boolean" ? v : true;
}

function normalizeUserGuideVisible(v: unknown): boolean {
  return typeof v === "boolean" ? v : false;
}

function normalizeUserGuideDismissed(v: unknown): boolean {
  return typeof v === "boolean" ? v : false;
}

function normalizeRecentTargetResourceIds(
  raw: unknown,
): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string" || !resources[item]) continue;
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
    if (out.length >= MAX_RECENT_TARGET_RESOURCES) break;
  }
  return out;
}

export function getResourceId(): string {
  return state.resourceId;
}

export function setResourceId(id: string): void {
  if (id !== "" && !resources[id]) return;
  state.resourceId = id;
  state.productionDismissedIds = [];
  state.targetRecipeIdx = firstProducingRecipeIndex(id);
  if (id) {
    state.recentTargetResourceIds = [
      id,
      ...state.recentTargetResourceIds.filter((x) => x !== id),
    ].slice(0, MAX_RECENT_TARGET_RESOURCES);
  }
  persist();
}

export function getTargetRecipeIdx(): number {
  return state.targetRecipeIdx;
}

export function setTargetRecipeIdx(idx: number): void {
  if (!state.resourceId) return;
  if (typeof idx !== "number" || !Number.isInteger(idx) || idx < 0) return;
  const def = resources[state.resourceId];
  if (!def || idx >= def.recipes.length) return;
  const recipeAt = def.recipes[idx];
  if (!recipeAt || (recipeAt.outputs[state.resourceId] ?? 0) <= 0) return;
  if (state.targetRecipeIdx === idx) return;
  state.targetRecipeIdx = idx;
  persist();
}

export function getRecentTargetResourceIds(): readonly string[] {
  return state.recentTargetResourceIds;
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

/**
 * Clear every saved production rate. Rows that were only visible because of a
 * non-zero production entry are pinned via `productionExtraIds` so they stay listed.
 */
export function clearAllProductionRates(totals: Record<string, number>): void {
  const extra = [...state.productionExtraIds];
  const extraSet = new Set(extra);
  for (const id of Object.keys(state.production)) {
    if (!(id in totals) && !extraSet.has(id)) {
      extra.push(id);
      extraSet.add(id);
    }
  }
  state.productionExtraIds = extra;
  state.production = {};
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

function sanitizePresetProductionFields(p: ProductionPreset): {
  production: Record<string, number>;
  productionExtraIds: string[];
} {
  const production = Object.fromEntries(
    Object.entries(p.production).filter(([id]) => resources[id]),
  );
  const productionExtraIds = [...p.productionExtraIds].filter((id) =>
    resources[id],
  );
  return { production, productionExtraIds };
}

/** Replace production and extras with the preset only. */
export function applyProductionPresetReplace(presetId: string): void {
  const p = findProductionPresetById(presetId);
  if (!p) return;
  const { production, productionExtraIds } = sanitizePresetProductionFields(p);
  state.production = production;
  state.productionExtraIds = productionExtraIds;
  state.productionDismissedIds = [];
  persist();
}

/** Merge preset rates and extras into current production (preset wins on overlap). */
export function applyProductionPresetMerge(presetId: string): void {
  const p = findProductionPresetById(presetId);
  if (!p) return;
  const { production: presetProd, productionExtraIds: presetExtras } =
    sanitizePresetProductionFields(p);
  state.production = { ...state.production, ...presetProd };
  const idSet = new Set<string>();
  for (const id of state.productionExtraIds) {
    if (resources[id]) idSet.add(id);
  }
  for (const id of presetExtras) {
    if (resources[id]) idSet.add(id);
  }
  state.productionExtraIds = [...idSet];
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

export type InputsSectionKey = keyof InputsSectionsState;

export function getInputsSections(): InputsSectionsState {
  return { ...state.inputsSections };
}

export function setInputsSectionExpanded(
  key: InputsSectionKey,
  expanded: boolean,
): void {
  if (state.inputsSections[key] === expanded) return;
  state.inputsSections = {
    ...state.inputsSections,
    [key]: expanded,
  };
  persist();
}

export function getNetFlowChartStyle(): NetFlowChartStyle {
  return state.netFlowChartStyle;
}

export function setNetFlowChartStyle(style: NetFlowChartStyle): void {
  const next = normalizeNetFlowChartStyle(style);
  if (state.netFlowChartStyle === next) return;
  state.netFlowChartStyle = next;
  persist();
}

export function getUserGuideExpanded(): boolean {
  return state.userGuideExpanded;
}

export function setUserGuideExpanded(expanded: boolean): void {
  if (state.userGuideExpanded === expanded) return;
  state.userGuideExpanded = expanded;
  persist();
}

export function getUserGuideVisible(): boolean {
  return state.userGuideVisible;
}

export function setUserGuideVisible(visible: boolean): void {
  if (state.userGuideVisible === visible) return;
  state.userGuideVisible = visible;
  persist();
}

/** Mark the current view’s help as seen and hide the modal (Close / Escape). */
export function dismissUserGuideForView(view: "calculator" | "canvas"): void {
  if (view === "calculator") {
    state.userGuideDismissedCalculator = true;
  } else {
    state.userGuideDismissedCanvas = true;
  }
  state.userGuideVisible = false;
  persist();
}

/**
 * Return a plain snapshot of the full state (useful for debugging / tests).
 */
export function getSnapshot(): AppState {
  return {
    resourceId: state.resourceId,
    targetRate: state.targetRate,
    targetRecipeIdx: state.targetRecipeIdx,
    baseRequirementsMode: state.baseRequirementsMode,
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
    inputsSections: { ...state.inputsSections },
    netFlowChartStyle: state.netFlowChartStyle,
    userGuideExpanded: state.userGuideExpanded,
    userGuideVisible: state.userGuideVisible,
    userGuideDismissedCalculator: state.userGuideDismissedCalculator,
    userGuideDismissedCanvas: state.userGuideDismissedCanvas,
    recentTargetResourceIds: [...state.recentTargetResourceIds],
  };
}

export function resetState(): void {
  state = {
    ...DEFAULT_STATE,
    targetRecipeIdx: 0,
    recentTargetResourceIds: [],
    production: {},
    productionExtraIds: [],
    productionDismissedIds: [],
    productionPresets: [],
    resultsSections: { ...DEFAULT_RESULTS_SECTIONS },
    inputsSections: { ...DEFAULT_INPUTS_SECTIONS },
  };
  persist();
}

/**
 * Remove localStorage and reset in-memory state to defaults without saving.
 * Use for a full "reset app" action so nothing is written until the user changes state again.
 */
export function wipeAllPersistedDataAndResetToDefaults(): void {
  clearState();
  state = {
    ...DEFAULT_STATE,
    targetRecipeIdx: 0,
    recentTargetResourceIds: [],
    production: {},
    productionExtraIds: [],
    productionDismissedIds: [],
    productionPresets: [],
    resultsSections: { ...DEFAULT_RESULTS_SECTIONS },
    inputsSections: { ...DEFAULT_INPUTS_SECTIONS },
  };
  queueMicrotask(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("coi-state-persisted"));
    }
  });
}

function persist(): void {
  saveState(getSnapshot());
  queueMicrotask(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("coi-state-persisted"));
    }
  });
}
