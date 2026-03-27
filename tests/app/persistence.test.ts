import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveState, loadState, clearState } from "../../assets/js/app/persistence";
import type { AppState } from "../../assets/js/contracts";

/**
 * Provide a minimal in-memory localStorage stub so tests
 * run in Node without a browser environment.
 */
function createStorageStub() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

beforeEach(() => {
  const stub = createStorageStub();
  vi.stubGlobal("localStorage", stub);
});

describe("saveState + loadState round-trip", () => {
  it("returns the saved data", () => {
    const state: AppState = { resourceId: "steel", targetRate: 12, production: {} };
    saveState(state);
    expect(loadState()).toEqual(state);
  });

  it("overwrites previous data on re-save", () => {
    const first: AppState = { resourceId: "a", targetRate: 1, production: {} };
    const second: AppState = { resourceId: "b", targetRate: 2, production: {} };
    saveState(first);
    saveState(second);
    expect(loadState()).toEqual(second);
  });
});

describe("loadState edge cases", () => {
  it("returns null when nothing is stored", () => {
    expect(loadState()).toBeNull();
  });

  it("returns null for corrupt JSON", () => {
    localStorage.setItem("coi-calculator-state", "not-json{{{");
    expect(loadState()).toBeNull();
  });

  it("returns null when version field is missing", () => {
    localStorage.setItem(
      "coi-calculator-state",
      JSON.stringify({ data: { x: 1 } }),
    );
    expect(loadState()).toBeNull();
  });
});

describe("clearState", () => {
  it("removes stored data so loadState returns null", () => {
    const state: AppState = { resourceId: "x", targetRate: 1, production: {} };
    saveState(state);
    clearState();
    expect(loadState()).toBeNull();
  });
});
