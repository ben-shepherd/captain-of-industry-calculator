import {
  NET_FLOW_CHART_STYLE_DEFAULT,
  type AppState,
  type PersistedChromeEnvelope,
  type PersistedEnvelope,
  type PersistedFullExportEnvelope,
} from '../contracts';

/**
 * Persist and restore user state via localStorage.
 *
 * A `version` field is stamped on every write so future code
 * can detect stale data and migrate it.
 */

const STORAGE_KEY = "coi-calculator-state";
const STATE_VERSION = 13;

const CHROME_KEY_APP_VIEW = 'coi-app-view';
const CHROME_KEY_CANVAS_WORKSPACE = 'coi-canvas-workspace';
const CHROME_KEY_CANVAS_SIDEBAR_EXPANDED = 'coi-canvas-sidebar-expanded';
const CHROME_KEY_CANVAS_RESULTS_SIDEBAR_VISIBLE = 'coi-canvas-results-sidebar-visible';
const CHROME_KEY_CANVAS_RESULTS_SIDEBAR_WIDTH_PX = 'coi-canvas-results-sidebar-width-px';
const CHROME_KEY_CANVAS_PLACEMENT_STYLE = 'coi-canvas-placement-style';

/**
 * Write the current application state to localStorage.
 */
export function saveState(state: AppState): void {
  const envelope: PersistedEnvelope = {
    version: STATE_VERSION,
    savedAt: Date.now(),
    data: state,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    console.warn("Could not save state to localStorage.");
  }
}

/**
 * JSON for an external backup file (same envelope shape as localStorage).
 */
export function buildExportJson(data: AppState): string {
  const envelope: PersistedEnvelope = {
    version: STATE_VERSION,
    savedAt: Date.now(),
    data,
  };
  return JSON.stringify(envelope, null, 2);
}

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * JSON for a full external backup file (calculator state + canvas/view chrome).
 *
 * Backward compatible: older code can still import the `app` portion by extracting it.
 */
export function buildFullExportJson(appState: AppState): string {
  const app: PersistedEnvelope = {
    version: STATE_VERSION,
    savedAt: Date.now(),
    data: appState,
  };

  const chrome: PersistedChromeEnvelope = {
    appView: safeGetItem(CHROME_KEY_APP_VIEW),
    canvasWorkspace: safeGetItem(CHROME_KEY_CANVAS_WORKSPACE),
    canvasSidebarExpanded: safeGetItem(CHROME_KEY_CANVAS_SIDEBAR_EXPANDED),
    canvasResultsSidebarVisible: safeGetItem(CHROME_KEY_CANVAS_RESULTS_SIDEBAR_VISIBLE),
    canvasResultsSidebarWidthPx: safeGetItem(CHROME_KEY_CANVAS_RESULTS_SIDEBAR_WIDTH_PX),
    canvasPlacementStyle: safeGetItem(CHROME_KEY_CANVAS_PLACEMENT_STYLE),
  };

  const envelope: PersistedFullExportEnvelope = {
    kind: 'coi-export',
    formatVersion: 1,
    savedAt: Date.now(),
    app,
    chrome,
  };

  return JSON.stringify(envelope, null, 2);
}

function parseAppStateFromEnvelope(
  envelope: Partial<PersistedEnvelope> | null,
): AppState | null {
  if (!envelope || typeof envelope.version !== 'number') return null;
  if (envelope.version < STATE_VERSION) {
    return migrateEnvelopeToAppState(envelope as PersistedEnvelope);
  }
  return (envelope.data ?? null) as AppState | null;
}

/**
 * Parse a JSON string into a full export (AppState + chrome), or fallback to the older
 * AppState-only export format. Returns null on failure without side effects.
 */
export function parseFullExportEnvelope(
  raw: string,
): { appState: AppState; chrome: PersistedChromeEnvelope } | { appState: AppState; chrome: null } | null {
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedFullExportEnvelope> | Partial<PersistedEnvelope> | null;
    if (!parsed || typeof parsed !== 'object') return null;

    // New full export format.
    if ((parsed as Partial<PersistedFullExportEnvelope>).kind === 'coi-export') {
      const full = parsed as Partial<PersistedFullExportEnvelope>;
      const appState = parseAppStateFromEnvelope(full.app ?? null);
      if (!appState) return null;
      const chromeRaw = full.chrome ?? ({} as Partial<PersistedChromeEnvelope>);
      const chrome: PersistedChromeEnvelope = {
        appView: typeof chromeRaw.appView === 'string' ? chromeRaw.appView : null,
        canvasWorkspace: typeof chromeRaw.canvasWorkspace === 'string' ? chromeRaw.canvasWorkspace : null,
        canvasSidebarExpanded: typeof chromeRaw.canvasSidebarExpanded === 'string'
          ? chromeRaw.canvasSidebarExpanded
          : null,
        canvasResultsSidebarVisible: typeof chromeRaw.canvasResultsSidebarVisible === 'string'
          ? chromeRaw.canvasResultsSidebarVisible
          : null,
        canvasResultsSidebarWidthPx: typeof chromeRaw.canvasResultsSidebarWidthPx === 'string'
          ? chromeRaw.canvasResultsSidebarWidthPx
          : null,
        canvasPlacementStyle: typeof chromeRaw.canvasPlacementStyle === 'string'
          ? chromeRaw.canvasPlacementStyle
          : null,
      };
      return { appState, chrome };
    }

    // Old AppState-only export format.
    const appState = parseAppStateFromEnvelope(parsed as Partial<PersistedEnvelope>);
    if (!appState) return null;
    return { appState, chrome: null };
  } catch {
    return null;
  }
}

/**
 * Parse a JSON string (from a file or elsewhere) into {@link AppState}.
 * Does not read or write localStorage. On failure, returns null without side effects.
 */
export function parsePersistedEnvelope(raw: string): AppState | null {
  try {
    const envelope = JSON.parse(raw) as Partial<PersistedEnvelope> | null;
    if (!envelope || typeof envelope.version !== "number") return null;

    if (envelope.version < STATE_VERSION) {
      return migrateEnvelopeToAppState(envelope as PersistedEnvelope);
    }

    return envelope.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Read and return the persisted state, or null if nothing usable exists.
 */
export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const envelope = JSON.parse(raw) as Partial<PersistedEnvelope> | null;

    if (!envelope || typeof envelope.version !== "number") return null;

    if (envelope.version < STATE_VERSION) {
      const data = migrateEnvelopeToAppState(envelope as PersistedEnvelope);
      if (!data) {
        clearState();
        return null;
      }
      saveState(data);
      return data;
    }

    return envelope.data ?? null;
  } catch {
    console.warn("Could not load state from localStorage.");
    return null;
  }
}

/**
 * Remove persisted state entirely.
 */
export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.warn("Could not clear state from localStorage.");
  }
}

/**
 * True when our storage key is present (user has saved state at least once).
 */
export function hasPersistedStorage(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * Migrate an older envelope to the current {@link AppState} in memory only.
 * Does not read or write localStorage.
 */
export function migrateEnvelopeToAppState(
  envelope: PersistedEnvelope,
): AppState | null {
  const originalVersion = envelope.version;
  let { version, data } = envelope;
  if (!data) return null;

  if (version === 1) {
    const d = data as Omit<AppState, "productionExtraIds"> & {
      productionExtraIds?: string[];
    };
    data = {
      resourceId: d.resourceId,
      targetRate: d.targetRate,
      targetRecipeIdx: 0,
      baseRequirementsMode: "direct",
      production: d.production ?? {},
      productionExtraIds: Array.isArray(d.productionExtraIds)
        ? d.productionExtraIds
        : [],
      productionDismissedIds: [],
      productionPresets: [],
      resultsSections: { base: true, net: true, tree: false },
      inputsSections: { targetRate: true, production: true, presets: true },
      netFlowChartStyle: NET_FLOW_CHART_STYLE_DEFAULT,
      userGuideExpanded: true,
      userGuideVisible: false,
      recentTargetResourceIds: [],
    } as unknown as AppState;
    version = 2;
  }

  if (version === 2) {
    const d = data as Omit<AppState, "productionDismissedIds" | "productionPresets"> & {
      productionDismissedIds?: string[];
      productionPresets?: AppState["productionPresets"];
    };
    data = {
      ...d,
      productionDismissedIds: Array.isArray(d.productionDismissedIds)
        ? d.productionDismissedIds
        : [],
      productionPresets: Array.isArray(d.productionPresets)
        ? d.productionPresets
        : [],
    };
    version = 3;
  }

  if (version === 3) {
    const d = data as AppState & { resultsSections?: AppState["resultsSections"] };
    const rs = d.resultsSections;
    data = {
      ...d,
      resultsSections: {
        base: rs?.base ?? true,
        net: rs?.net ?? true,
        tree: rs?.tree ?? false,
      },
    };
    version = 4;
  }

  if (version === 4) {
    const d = data as AppState & { inputsSections?: AppState["inputsSections"] };
    const ins = d.inputsSections;
    data = {
      ...d,
      inputsSections: {
        targetRate: ins?.targetRate ?? true,
        production: ins?.production ?? true,
        presets: ins?.presets ?? true,
      },
    };
    version = 5;
  }

  if (version === 5) {
    const d = data as AppState & { targetRecipeIdx?: number };
    data = {
      ...d,
      targetRecipeIdx:
        typeof d.targetRecipeIdx === "number" && Number.isInteger(d.targetRecipeIdx)
          ? d.targetRecipeIdx
          : 0,
    } as AppState;
    version = 6;
  }

  if (version === 6) {
    const d = data as AppState & { baseRequirementsMode?: string };
    data = {
      ...d,
      baseRequirementsMode:
        d.baseRequirementsMode === "full" ? "full" : "direct",
    } as AppState;
    version = 7;
  }

  if (version === 7) {
    const d = data as AppState & {
      inputsSections?: AppState["inputsSections"] & { target?: boolean };
    };
    const ins = d.inputsSections;
    data = {
      ...d,
      inputsSections: {
        targetRate: (ins as AppState["inputsSections"] | undefined)?.targetRate ?? true,
        production: ins?.production ?? true,
        presets: ins?.presets ?? true,
      },
    };
    version = 8;
  }

  if (version === 8) {
    const d = data as AppState & { netFlowChartStyle?: AppState["netFlowChartStyle"] };
    data = {
      ...d,
      netFlowChartStyle: d.netFlowChartStyle ?? NET_FLOW_CHART_STYLE_DEFAULT,
    };
    version = 9;
  }

  if (version === 9) {
    const d = data as AppState & { userGuideExpanded?: boolean };
    data = {
      ...d,
      userGuideExpanded: d.userGuideExpanded ?? true,
      targetRecipeIdx:
        typeof d.targetRecipeIdx === "number" && Number.isInteger(d.targetRecipeIdx)
          ? d.targetRecipeIdx
          : 0,
    };
    version = 10;
  }

  if (version === 10) {
    const d = data as AppState & { recentTargetResourceIds?: string[] };
    data = {
      ...d,
      recentTargetResourceIds: Array.isArray(d.recentTargetResourceIds)
        ? d.recentTargetResourceIds
        : [],
    };
    version = 11;
  }

  if (version === 11) {
    const d = data as AppState & { userGuideVisible?: boolean };
    data = {
      ...d,
      userGuideVisible: d.userGuideVisible ?? false,
    };
    version = 12;
  }

  if (version === 12) {
    const d = data as AppState & {
      userGuideDismissedCalculator?: boolean;
      userGuideDismissedCanvas?: boolean;
    };
    const wasDismissed = d.userGuideVisible === false;
    data = {
      ...d,
      userGuideDismissedCalculator:
        typeof d.userGuideDismissedCalculator === "boolean"
          ? d.userGuideDismissedCalculator
          : wasDismissed,
      userGuideDismissedCanvas:
        typeof d.userGuideDismissedCanvas === "boolean"
          ? d.userGuideDismissedCanvas
          : wasDismissed,
      userGuideVisible: false,
    };
    version = 13;
  }

  if (version !== STATE_VERSION) {
    console.warn(
      `Unable to migrate state from v${originalVersion} to v${STATE_VERSION}. Discarding.`,
    );
    return null;
  }

  return data;
}
