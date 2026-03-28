import {
  NET_FLOW_CHART_STYLE_DEFAULT,
  type AppState,
  type PersistedEnvelope,
} from '../contracts';

/**
 * Persist and restore user state via localStorage.
 *
 * A `version` field is stamped on every write so future code
 * can detect stale data and migrate it.
 */

const STORAGE_KEY = "coi-calculator-state";
const STATE_VERSION = 9;

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
      production: d.production ?? {},
      productionExtraIds: Array.isArray(d.productionExtraIds)
        ? d.productionExtraIds
        : [],
      productionDismissedIds: [],
      productionPresets: [],
      resultsSections: { base: true, net: true, tree: false },
      inputsSections: { production: true, presets: true },
    };
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
    };
    version = 6;
  }

  if (version === 6) {
    const d = data as AppState & { baseRequirementsMode?: string };
    data = {
      ...d,
      baseRequirementsMode:
        d.baseRequirementsMode === "full" ? "full" : "direct",
    };
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

  if (version !== STATE_VERSION) {
    console.warn(
      `Unable to migrate state from v${originalVersion} to v${STATE_VERSION}. Discarding.`,
    );
    return null;
  }

  return data;
}
