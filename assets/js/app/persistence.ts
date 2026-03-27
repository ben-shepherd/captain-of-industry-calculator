import type { AppState, PersistedEnvelope } from '../contracts';

/**
 * Persist and restore user state via localStorage.
 *
 * A `version` field is stamped on every write so future code
 * can detect stale data and migrate it.
 */

const STORAGE_KEY = "coi-calculator-state";
const STATE_VERSION = 1;

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
 * Read and return the persisted state, or null if nothing usable exists.
 */
export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const envelope = JSON.parse(raw) as Partial<PersistedEnvelope> | null;

    if (!envelope || typeof envelope.version !== "number") return null;

    if (envelope.version < STATE_VERSION) {
      return migrate(envelope as PersistedEnvelope);
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
 * Migrate an older envelope to the current version.
 * Add migration cases as STATE_VERSION increments.
 */
function migrate(envelope: PersistedEnvelope): AppState | null {
  const { version, data } = envelope;

  // Example: when STATE_VERSION becomes 2, add a case here:
  // if (version === 1) { data = migrateV1toV2(data); version = 2; }

  if (version !== STATE_VERSION) {
    console.warn(
      `Unable to migrate state from v${envelope.version} to v${STATE_VERSION}. Discarding.`,
    );
    clearState();
    return null;
  }

  saveState(data);
  return data;
}
