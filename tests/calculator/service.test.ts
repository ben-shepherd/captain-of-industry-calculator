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

  it("includes extractor bases (e.g. crude oil) in totals for Electricity", () => {
    const { totals } = calculate("electricity", 100);
    expect(totals.crudeOil).toBeDefined();
    expect(totals.crudeOil).toBeGreaterThan(0);
    expect(totals.wood).toBeDefined();
    expect(totals.wood).toBeGreaterThan(0);
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
  });
});
