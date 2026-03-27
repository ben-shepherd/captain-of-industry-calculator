import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  findProductionPresetById,
  applyProductionPreset,
  deleteProductionPreset,
  getProductionPresets,
  resetState,
  saveProductionPreset,
  getProduction,
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

describe("built-in production presets", () => {
  it("exposes built-in presets via findProductionPresetById", () => {
    const p = findProductionPresetById("builtin-mining-starter");
    expect(p?.isBuiltin).toBe(true);
    expect(p?.production.ironOre).toBe(120);
  });

  it("applies a built-in preset to production state", () => {
    applyProductionPreset("builtin-smelting-basic");
    const prod = getProduction();
    expect(prod.iron).toBe(48);
    expect(prod.steel).toBe(12);
  });

  it("ignores delete for built-in preset ids", () => {
    const before = getProductionPresets().length;
    deleteProductionPreset("builtin-petro-mid");
    expect(getProductionPresets().length).toBe(before);
  });

  it("lists built-ins before user presets", () => {
    saveProductionPreset("My line");
    const list = getProductionPresets();
    const builtinCount = list.filter((x) => x.isBuiltin).length;
    const userCount = list.filter((x) => !x.isBuiltin).length;
    expect(builtinCount).toBeGreaterThan(0);
    expect(userCount).toBe(1);
    const firstUser = list.findIndex((x) => x.name === "My line");
    const lastBuiltin = list.map((x, i) => (x.isBuiltin ? i : -1)).filter((i) => i >= 0).pop();
    expect(lastBuiltin).toBeDefined();
    expect(firstUser).toBeGreaterThan(lastBuiltin!);
  });
});
