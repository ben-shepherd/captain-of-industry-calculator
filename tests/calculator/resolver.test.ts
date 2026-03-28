import { describe, it, expect } from "vitest";
import { resolve } from "../../assets/js/calculator/resolver";

describe("resolve", () => {
  describe("base resource (ironOre)", () => {
    it("returns the resource itself in totals", () => {
      const { totals } = resolve("ironOre", 50);
      expect(totals).toEqual({ ironOre: 50 });
    });

    it("returns a leaf node with no children", () => {
      const { tree } = resolve("ironOre", 50);
      expect(tree).toEqual({
        id: "ironOre",
        label: "Iron Ore",
        amount: 50,
        children: [],
      });
    });
  });

  describe("single-depth chain (ironOreCrushed → ironOre)", () => {
    it("returns ironOre in totals at the recipe ratio", () => {
      const { totals } = resolve("ironOreCrushed", 16);
      expect(totals).toEqual({ ironOre: 16 });
    });

    it("builds a tree with one child", () => {
      const { tree } = resolve("ironOreCrushed", 16);
      expect(tree.id).toBe("ironOreCrushed");
      expect(tree.amount).toBe(16);
      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]!.id).toBe("ironOre");
      expect(tree.children[0]!.amount).toBe(16);
      expect(tree.children[0]!.children).toHaveLength(0);
    });
  });

  describe("multi-depth chain (iron)", () => {
    it("resolves iron through moltenIron to base materials", () => {
      const { totals } = resolve("iron", 8);
      /** First molten iron recipe uses iron scrap (wiki order). */
      expect(totals.ironScrap).toBeDefined();
      expect(totals.ironScrap).toBeGreaterThan(0);
    });

    it("builds a nested tree", () => {
      const { tree } = resolve("iron", 8);
      expect(tree.id).toBe("iron");
      expect(tree.children.length).toBeGreaterThan(0);
    });
  });

  describe("scaling (ironOreCrushed)", () => {
    it("scales inputs proportionally for half output", () => {
      const { totals } = resolve("ironOreCrushed", 8);
      expect(totals).toEqual({ ironOre: 8 });
    });

    it("scales inputs proportionally for double output", () => {
      const { totals } = resolve("ironOreCrushed", 32);
      expect(totals).toEqual({ ironOre: 32 });
    });

    it("scales tree node amounts correctly", () => {
      const { tree } = resolve("ironOreCrushed", 8);
      expect(tree.amount).toBe(8);
      expect(tree.children[0]!.amount).toBe(8);
      expect(tree.children[0]!.children).toHaveLength(0);
    });
  });

  describe("recipe with no inputs (extractors)", () => {
    it("counts crude oil as a base total when the only recipe has empty inputs", () => {
      const { totals } = resolve("crudeOil", 10);
      expect(totals).toEqual({ crudeOil: 10 });
    });
  });

  describe("error handling", () => {
    it("throws for an unknown resource", () => {
      expect(() => resolve("unobtainium", 10)).toThrow(
        'Unknown resource: "unobtainium"',
      );
    });
  });
});
