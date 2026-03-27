import { resources } from '../data/resources';
import { loadState, saveState } from './persistence';
import type { AppState } from '../contracts';

/**
 * Central application state.
 *
 * Holds user selections and provides getters/setters that
 * auto-persist to localStorage on every mutation.
 */

const DEFAULT_STATE: AppState = {
  resourceId: Object.keys(resources)[0]!,
  targetRate: 12,
  production: {},
};

let state: AppState = { ...DEFAULT_STATE };

/**
 * Initialise state from localStorage (if available) or use defaults.
 * Call once at app startup.
 */
export function initState(): void {
  const saved = loadState();
  if (saved) {
    state = { ...DEFAULT_STATE, ...saved };
  }
}

export function getResourceId(): string {
  return state.resourceId;
}

export function setResourceId(id: string): void {
  if (!resources[id]) return;
  state.resourceId = id;
  persist();
}

export function getTargetRate(): number {
  return state.targetRate;
}

export function setTargetRate(rate: number): void {
  if (typeof rate !== "number" || rate <= 0 || !isFinite(rate)) return;
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
 * Return a plain snapshot of the full state (useful for debugging / tests).
 */
export function getSnapshot(): AppState {
  return {
    resourceId: state.resourceId,
    targetRate: state.targetRate,
    production: { ...state.production },
  };
}

export function resetState(): void {
  state = { ...DEFAULT_STATE, production: {} };
  persist();
}

function persist(): void {
  saveState(getSnapshot());
}
