import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  applyLoadedState,
  getRecentTargetResourceIds,
  getSnapshot,
  setResourceId,
} from "../../assets/js/app/state";
import type { AppState } from "../../assets/js/contracts";

const minimalState: AppState = {
  resourceId: "",
  targetRate: 12,
  targetRecipeIdx: 0,
  baseRequirementsMode: "direct",
  recentTargetResourceIds: [],
  production: {},
  productionExtraIds: [],
  productionDismissedIds: [],
  productionPresets: [],
  resultsSections: { base: true, net: true, tree: false },
  inputsSections: { targetRate: true, production: true, presets: true },
  netFlowChartStyle: "line",
  userGuideExpanded: true,
  userGuideVisible: false,
  userGuideDismissedCalculator: false,
  userGuideDismissedCanvas: false,
};

function createStorageStub() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

describe("recentTargetResourceIds MRU", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorageStub());
    applyLoadedState({ ...minimalState });
  });

  it("records the target resource when set", () => {
    setResourceId("steel");
    expect(getRecentTargetResourceIds()).toEqual(["steel"]);
    expect(getSnapshot().recentTargetResourceIds).toEqual(["steel"]);
  });

  it("moves the most recently selected id to the front", () => {
    setResourceId("steel");
    setResourceId("ironOre");
    expect(getRecentTargetResourceIds()).toEqual(["ironOre", "steel"]);
  });

  it("dedupes when selecting an id already in the list", () => {
    setResourceId("steel");
    setResourceId("ironOre");
    setResourceId("steel");
    expect(getRecentTargetResourceIds()).toEqual(["steel", "ironOre"]);
  });

  it("caps at 12 entries", () => {
    const ids = [
      "ironOre",
      "copperOre",
      "coal",
      "sulfur",
      "rock",
      "wood",
      "quartz",
      "iron",
      "copper",
      "steel",
      "cement",
      "glass",
      "rubber",
    ];
    for (const id of ids) {
      setResourceId(id);
    }
    expect(getRecentTargetResourceIds().length).toBe(12);
    expect(getRecentTargetResourceIds()[0]).toBe("rubber");
  });
});
