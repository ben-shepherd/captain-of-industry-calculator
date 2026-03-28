import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  buildExportJson,
  parsePersistedEnvelope,
  saveState,
  loadState,
  clearState,
  hasPersistedStorage,
  migrateEnvelopeToAppState,
} from "../../assets/js/app/persistence";
import type { AppState, PersistedEnvelope } from "../../assets/js/contracts";

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

const defaultInputsSections: AppState["inputsSections"] = {
  production: true,
  presets: true,
};

const emptyV4 = {
  targetRecipeIdx: 0,
  productionDismissedIds: [] as string[],
  productionPresets: [] as AppState["productionPresets"],
  resultsSections: { ...defaultResultsSections },
  inputsSections: { ...defaultInputsSections },
  baseRequirementsMode: "direct" as AppState["baseRequirementsMode"],
  netFlowChartStyle: "line" as AppState["netFlowChartStyle"],
  userGuideExpanded: true,
};

describe("saveState + loadState round-trip", () => {
  it("returns the saved data", () => {
    const state: AppState = {
      resourceId: "steel",
      targetRate: 12,
      targetRecipeIdx: 0,
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
      targetRecipeIdx: 0,
      production: {},
      productionExtraIds: [],
      ...emptyV4,
    };
    const second: AppState = {
      resourceId: "b",
      targetRate: 2,
      targetRecipeIdx: 0,
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
      targetRecipeIdx: 0,
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
      targetRecipeIdx: 0,
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
      targetRecipeIdx: 0,
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
  it("migrates v1 envelope to current version with new fields", () => {
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
      targetRecipeIdx: 0,
      baseRequirementsMode: "direct",
      production: { iron: 5 },
      productionExtraIds: [],
      productionDismissedIds: [],
      productionPresets: [],
      resultsSections: { ...defaultResultsSections },
      inputsSections: { ...defaultInputsSections },
      netFlowChartStyle: "line",
      userGuideExpanded: true,
    });
  });

  it("migrates v2 envelope to current version", () => {
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
      targetRecipeIdx: 0,
      baseRequirementsMode: "direct",
      production: {},
      productionExtraIds: ["iron"],
      productionDismissedIds: [],
      productionPresets: [],
      resultsSections: { ...defaultResultsSections },
      inputsSections: { ...defaultInputsSections },
      netFlowChartStyle: "line",
      userGuideExpanded: true,
    });
  });

  it("migrates v3 envelope without resultsSections", () => {
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
      targetRecipeIdx: 0,
      baseRequirementsMode: "direct",
      production: {},
      productionExtraIds: [],
      productionDismissedIds: [],
      productionPresets: [],
      resultsSections: { ...defaultResultsSections },
      inputsSections: { ...defaultInputsSections },
      netFlowChartStyle: "line",
      userGuideExpanded: true,
    });
  });

  it("migrates v4 envelope without inputsSections to v5", () => {
    localStorage.setItem(
      "coi-calculator-state",
      JSON.stringify({
        version: 4,
        savedAt: Date.now(),
        data: {
          resourceId: "steel",
          targetRate: 12,
          production: {},
          productionExtraIds: [],
          productionDismissedIds: [],
          productionPresets: [],
          resultsSections: { ...defaultResultsSections },
        },
      }),
    );
    expect(loadState()).toEqual({
      resourceId: "steel",
      targetRate: 12,
      targetRecipeIdx: 0,
      baseRequirementsMode: "direct",
      production: {},
      productionExtraIds: [],
      productionDismissedIds: [],
      productionPresets: [],
      resultsSections: { ...defaultResultsSections },
      inputsSections: { ...defaultInputsSections },
      netFlowChartStyle: "line",
      userGuideExpanded: true,
    });
  });

  it("migrates v5 envelope without targetRecipeIdx to v6", () => {
    localStorage.setItem(
      "coi-calculator-state",
      JSON.stringify({
        version: 5,
        savedAt: Date.now(),
        data: {
          resourceId: "steel",
          targetRate: 12,
          production: {},
          productionExtraIds: [],
          productionDismissedIds: [],
          productionPresets: [],
          resultsSections: { ...defaultResultsSections },
          inputsSections: { ...defaultInputsSections },
        },
      }),
    );
    expect(loadState()).toEqual({
      resourceId: "steel",
      targetRate: 12,
      targetRecipeIdx: 0,
      baseRequirementsMode: "direct",
      production: {},
      productionExtraIds: [],
      productionDismissedIds: [],
      productionPresets: [],
      resultsSections: { ...defaultResultsSections },
      inputsSections: { ...defaultInputsSections },
      netFlowChartStyle: "line",
      userGuideExpanded: true,
    });
  });

  it("migrates v6 envelope without baseRequirementsMode to v7", () => {
    localStorage.setItem(
      "coi-calculator-state",
      JSON.stringify({
        version: 6,
        savedAt: Date.now(),
        data: {
          resourceId: "steel",
          targetRate: 12,
          targetRecipeIdx: 0,
          production: {},
          productionExtraIds: [],
          productionDismissedIds: [],
          productionPresets: [],
          resultsSections: { ...defaultResultsSections },
          inputsSections: { ...defaultInputsSections },
        },
      }),
    );
    expect(loadState()).toEqual({
      resourceId: "steel",
      targetRate: 12,
      targetRecipeIdx: 0,
      baseRequirementsMode: "direct",
      production: {},
      productionExtraIds: [],
      productionDismissedIds: [],
      productionPresets: [],
      resultsSections: { ...defaultResultsSections },
      inputsSections: { ...defaultInputsSections },
      netFlowChartStyle: "line",
      userGuideExpanded: true,
    });
  });

  it("preserves targetRecipeIdx when migrating v5 to v6", () => {
    const envelope: PersistedEnvelope = {
      version: 5,
      savedAt: Date.now(),
      data: {
        resourceId: "steel",
        targetRate: 12,
        targetRecipeIdx: 1,
        baseRequirementsMode: "direct",
        production: {},
        productionExtraIds: [],
        productionDismissedIds: [],
        productionPresets: [],
        resultsSections: { ...defaultResultsSections },
        inputsSections: { ...defaultInputsSections },
      },
    };
    expect(migrateEnvelopeToAppState(envelope)).toEqual({
      ...envelope.data,
      targetRecipeIdx: 1,
      baseRequirementsMode: "direct",
      netFlowChartStyle: "line",
      userGuideExpanded: true,
    });
  });

  it("migrates v9 envelope without userGuideExpanded to v10", () => {
    localStorage.setItem(
      "coi-calculator-state",
      JSON.stringify({
        version: 9,
        savedAt: Date.now(),
        data: {
          resourceId: "steel",
          targetRate: 12,
          production: {},
          productionExtraIds: [],
          productionDismissedIds: [],
          productionPresets: [],
          resultsSections: { ...defaultResultsSections },
          inputsSections: { ...defaultInputsSections },
          netFlowChartStyle: "line",
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
      inputsSections: { ...defaultInputsSections },
      netFlowChartStyle: "line",
      userGuideExpanded: true,
      targetRecipeIdx: 0,
    });
  });
});

describe("buildExportJson + parsePersistedEnvelope", () => {
  it("round-trips AppState data", () => {
    const state: AppState = {
      resourceId: "steel",
      targetRate: 12,
      targetRecipeIdx: 1,
      production: { iron: 3 },
      productionExtraIds: [],
      ...emptyV4,
    };
    const json = buildExportJson(state);
    expect(parsePersistedEnvelope(json)).toEqual(state);
  });

  it("migrates v1 JSON string to current AppState", () => {
    const raw = JSON.stringify({
      version: 1,
      savedAt: Date.now(),
      data: {
        resourceId: "steel",
        targetRate: 12,
        production: { iron: 5 },
      },
    });
    expect(parsePersistedEnvelope(raw)).toEqual({
      resourceId: "steel",
      targetRate: 12,
      targetRecipeIdx: 0,
      baseRequirementsMode: "direct",
      production: { iron: 5 },
      productionExtraIds: [],
      productionDismissedIds: [],
      productionPresets: [],
      resultsSections: { ...defaultResultsSections },
      inputsSections: { ...defaultInputsSections },
      netFlowChartStyle: "line",
      userGuideExpanded: true,
    });
  });

  it("returns null for invalid JSON without clearing localStorage", () => {
    const state: AppState = {
      resourceId: "steel",
      targetRate: 12,
      targetRecipeIdx: 0,
      production: {},
      productionExtraIds: [],
      ...emptyV4,
    };
    saveState(state);
    expect(parsePersistedEnvelope("not-json{{{")).toBeNull();
    expect(loadState()).toEqual(state);
    expect(hasPersistedStorage()).toBe(true);
  });
});
