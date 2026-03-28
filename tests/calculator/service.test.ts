import { describe, it, expect } from "vitest";
import { calculate } from "../../assets/js/calculator/service";

describe("calculate", () => {
  it("returns resourceId and targetRate in the result", () => {
    const result = calculate("steel", 12);
    expect(result.resourceId).toBe("steel");
    expect(result.targetRate).toBe(12);
  });

  it("returns totals from the resolver", () => {
    const { totals } = calculate("ironOreCrushed", 16);
    expect(totals).toEqual({ ironOre: 16 });
  });

  it("does not inflate aluminum scrap for Food Pack (exhaust default recipe)", () => {
    const { totals } = calculate("foodPack", 100);
    const scrap = totals.aluminumScrap;
    expect(scrap === undefined || scrap === 0).toBe(true);
  });

  it("uses target recipe index for Food Pack (eggs vs tofu chain)", () => {
    const eggsTree = calculate("foodPack", 100, 0).tree;
    const tofuTree = calculate("foodPack", 100, 2).tree;
    const eggsInputs = new Set(eggsTree.children.map((c) => c.id));
    const tofuInputs = new Set(tofuTree.children.map((c) => c.id));
    expect(eggsInputs.has("eggs")).toBe(true);
    expect(eggsInputs.has("bread")).toBe(true);
    expect(tofuInputs.has("tofu")).toBe(true);
    expect(tofuInputs.has("vegetables")).toBe(true);
    expect(tofuInputs.has("eggs")).toBe(false);
  });

  it("uses direct recipe inputs for Electricity (diesel generator recipe 0)", () => {
    const { totals } = calculate("electricity", 100);
    /** Diesel generator: 1 diesel → 800 electricity per cycle; no nested expansion. */
    expect(totals).toEqual({ diesel: 100 / 800 });
  });

  it("Construction Parts Assembly I lists only iron, wood, and concrete slab", () => {
    const { totals } = calculate("constructionParts", 6, 0);
    expect(totals).toEqual({
      iron: 4.5,
      wood: 4.5,
      concreteSlab: 6,
    });
  });

  it("returns a dependency tree from the resolver", () => {
    const { tree } = calculate("ironOreCrushed", 16);
    expect(tree.id).toBe("ironOreCrushed");
    expect(tree.children.length).toBeGreaterThan(0);
  });

  describe("validation", () => {
    it("throws for an unknown resource", () => {
      expect(() => calculate("unobtainium", 10)).toThrow(
        'Unknown resource: "unobtainium"',
      );
    });

    it("throws when targetRate is 0", () => {
      expect(() => calculate("steel", 0)).toThrow("targetRate must be a positive finite number");
    });

    it("throws when targetRate is negative", () => {
      expect(() => calculate("steel", -5)).toThrow("targetRate must be a positive finite number");
    });

    it("throws when targetRate is NaN", () => {
      expect(() => calculate("steel", NaN)).toThrow("targetRate must be a positive finite number");
    });

    it("throws when targetRate is Infinity", () => {
      expect(() => calculate("steel", Infinity)).toThrow("targetRate must be a positive finite number");
    });

    it("throws when targetRate is not a number", () => {
      // @ts-expect-error testing invalid input
      expect(() => calculate("steel", "12")).toThrow("targetRate must be a positive finite number");
    });

    it("throws when targetRecipeIdx is not an integer", () => {
      expect(() => calculate("steel", 12, 0.5)).toThrow(
        "targetRecipeIdx must be a non-negative integer",
      );
    });

    it("throws when targetRecipeIdx is out of range", () => {
      expect(() => calculate("steel", 12, 99)).toThrow("out of range");
    });

    it("throws for targetRecipeIdx > 0 when resource has no recipes", () => {
      expect(() => calculate("ironOre", 50, 1)).toThrow(
        "targetRecipeIdx must be 0 for \"ironOre\" (no recipes defined)",
      );
    });
  });
});
