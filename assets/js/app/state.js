import { resources } from "../data/resources.js";
import { loadState, saveState } from "./persistence.js";

/**
 * Central application state.
 *
 * Holds user selections and provides getters/setters that
 * auto-persist to localStorage on every mutation.
 */

const DEFAULT_STATE = {
  resourceId: Object.keys(resources)[0],
  targetRate: 12,
  production: {},
};

let state = { ...DEFAULT_STATE };

/**
 * Initialise state from localStorage (if available) or use defaults.
 * Call once at app startup.
 */
export function initState() {
  const saved = loadState();
  if (saved) {
    state = { ...DEFAULT_STATE, ...saved };
  }
}

/** @returns {string} */
export function getResourceId() {
  return state.resourceId;
}

/** @param {string} id */
export function setResourceId(id) {
  if (!resources[id]) return;
  state.resourceId = id;
  persist();
}

/** @returns {number} */
export function getTargetRate() {
  return state.targetRate;
}

/** @param {number} rate */
export function setTargetRate(rate) {
  if (typeof rate !== "number" || rate <= 0 || !isFinite(rate)) return;
  state.targetRate = rate;
  persist();
}

/** @returns {Record<string, number>} */
export function getProduction() {
  return { ...state.production };
}

/**
 * Set the user's production rate for a single resource.
 * @param {string} id
 * @param {number} amount
 */
export function setProduction(id, amount) {
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
 * @returns {{ resourceId: string, targetRate: number, production: Record<string, number> }}
 */
export function getSnapshot() {
  return {
    resourceId: state.resourceId,
    targetRate: state.targetRate,
    production: { ...state.production },
  };
}

/** @returns void */
export function resetState() {
  state = { ...DEFAULT_STATE, production: {} };
  persist();
}

function persist() {
  saveState(getSnapshot());
}
