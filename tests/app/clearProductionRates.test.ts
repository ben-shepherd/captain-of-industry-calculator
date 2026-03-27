import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  resetState,
  setProduction,
  clearAllProductionRates,
  getProduction,
  getProductionExtraIds,
  addProductionExtraId,
} from "../../assets/js/app/state";

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
  vi.stubGlobal("localStorage", createStorageStub());
  resetState();
});

describe("clearAllProductionRates", () => {
  it("clears production and pins resources not in dependency totals", () => {
    setProduction("steel", 42);
    clearAllProductionRates({ ironOre: 10 });
    expect(getProduction()).toEqual({});
    expect(getProductionExtraIds()).toContain("steel");
  });

  it("does not add extras when the resource appears in totals", () => {
    setProduction("ironOre", 5);
    clearAllProductionRates({ ironOre: 100, coal: 2 });
    expect(getProduction()).toEqual({});
    expect(getProductionExtraIds()).not.toContain("ironOre");
  });

  it("does not duplicate ids already in productionExtraIds", () => {
    addProductionExtraId("steel");
    setProduction("steel", 99);
    clearAllProductionRates({});
    expect(getProduction()).toEqual({});
    expect(getProductionExtraIds().filter((id) => id === "steel")).toEqual([
      "steel",
    ]);
  });
});
