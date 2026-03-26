import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveState, loadState, clearState } from "../../assets/js/app/persistence.js";

/**
 * Provide a minimal in-memory localStorage stub so tests
 * run in Node without a browser environment.
 */
function createStorageStub() {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
}

beforeEach(() => {
  const stub = createStorageStub();
  vi.stubGlobal("localStorage", stub);
});

describe("saveState + loadState round-trip", () => {
  it("returns the saved data", () => {
    const state = { resourceId: "steel", targetRate: 12 };
    saveState(state);
    expect(loadState()).toEqual(state);
  });

  it("overwrites previous data on re-save", () => {
    saveState({ a: 1 });
    saveState({ b: 2 });
    expect(loadState()).toEqual({ b: 2 });
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
    saveState({ x: 1 });
    clearState();
    expect(loadState()).toBeNull();
  });
});
