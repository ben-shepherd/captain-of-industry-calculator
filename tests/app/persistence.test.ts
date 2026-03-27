import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveState,
  loadState,
  clearState,
  hasPersistedStorage,
} from "../../assets/js/app/persistence";
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

const defaultResultsSections: AppState["resultsSections"] = {
  base: true,
  net: true,
  tree: false,
};

const emptyV4 = {
  productionDismissedIds: [] as string[],
  productionPresets: [] as AppState["productionPresets"],
  resultsSections: { ...defaultResultsSections },
};

describe("saveState + loadState round-trip", () => {
  it("returns the saved data", () => {
    const state: AppState = {
      resourceId: "steel",
      targetRate: 12,
      production: {},
      productionExtraIds: [],
      ...emptyV4,
    };
    saveState(state);
    expect(loadState()).toEqual(state);
  });

  it("overwrites previous data on re-save", () => {
    const first: AppState = {
      resourceId: "a",
      targetRate: 1,
      production: {},
      productionExtraIds: [],
      ...emptyV4,
    };
    const second: AppState = {
      resourceId: "b",
      targetRate: 2,
      production: {},
      productionExtraIds: [],
      ...emptyV4,
    };
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

describe("hasPersistedStorage", () => {
  it("is false when nothing is stored", () => {
    expect(hasPersistedStorage()).toBe(false);
  });

  it("is true after saveState", () => {
    const state: AppState = {
      resourceId: "steel",
      targetRate: 12,
      production: {},
      productionExtraIds: [],
      ...emptyV4,
    };
    saveState(state);
    expect(hasPersistedStorage()).toBe(true);
  });

  it("is false after clearState", () => {
    const state: AppState = {
      resourceId: "x",
      targetRate: 1,
      production: {},
      productionExtraIds: [],
      ...emptyV4,
    };
    saveState(state);
    clearState();
    expect(hasPersistedStorage()).toBe(false);
  });
});

describe("clearState", () => {
  it("removes stored data so loadState returns null", () => {
    const state: AppState = {
      resourceId: "x",
      targetRate: 1,
      production: {},
      productionExtraIds: [],
      ...emptyV4,
    };
    saveState(state);
    clearState();
    expect(loadState()).toBeNull();
  });
});

describe("migration", () => {
  it("migrates v1 envelope to v4 with new fields", () => {
    localStorage.setItem(
      "coi-calculator-state",
      JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        data: {
          resourceId: "steel",
          targetRate: 12,
          production: { iron: 5 },
        },
      }),
    );
    expect(loadState()).toEqual({
      resourceId: "steel",
      targetRate: 12,
      production: { iron: 5 },
      productionExtraIds: [],
      productionDismissedIds: [],
      productionPresets: [],
      resultsSections: { ...defaultResultsSections },
    });
  });

  it("migrates v2 envelope to v4", () => {
    localStorage.setItem(
      "coi-calculator-state",
      JSON.stringify({
        version: 2,
        savedAt: Date.now(),
        data: {
          resourceId: "steel",
          targetRate: 12,
          production: {},
          productionExtraIds: ["iron"],
        },
      }),
    );
    expect(loadState()).toEqual({
      resourceId: "steel",
      targetRate: 12,
      production: {},
      productionExtraIds: ["iron"],
      productionDismissedIds: [],
      productionPresets: [],
      resultsSections: { ...defaultResultsSections },
    });
  });

  it("migrates v3 envelope without resultsSections to v4", () => {
    localStorage.setItem(
      "coi-calculator-state",
      JSON.stringify({
        version: 3,
        savedAt: Date.now(),
        data: {
          resourceId: "steel",
          targetRate: 12,
          production: {},
          productionExtraIds: [],
          productionDismissedIds: [],
          productionPresets: [],
        },
      }),
    );
    expect(loadState()).toEqual({
      resourceId: "steel",
      targetRate: 12,
      production: {},
      productionExtraIds: [],
      productionDismissedIds: [],
      productionPresets: [],
      resultsSections: { ...defaultResultsSections },
    });
  });
});
