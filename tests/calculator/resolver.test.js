import { describe, it, expect } from "vitest";
import { resolve } from "../../assets/js/calculator/resolver.js";

describe("resolve", () => {
  describe("base resource (ore)", () => {
    it("returns the resource itself in totals", () => {
      const { totals } = resolve("ore", 50);
      expect(totals).toEqual({ ore: 50 });
    });

    it("returns a leaf node with no children", () => {
      const { tree } = resolve("ore", 50);
      expect(tree).toEqual({
        id: "ore",
        label: "Iron Ore",
        amount: 50,
        children: [],
      });
    });
  });

  describe("single-depth chain (iron → ore)", () => {
    it("returns ore in totals at the recipe ratio", () => {
      const { totals } = resolve("iron", 24);
      expect(totals).toEqual({ ore: 24 });
    });

    it("builds a tree with one child", () => {
      const { tree } = resolve("iron", 24);
      expect(tree.id).toBe("iron");
      expect(tree.amount).toBe(24);
      expect(tree.children).toHaveLength(1);
      expect(tree.children[0].id).toBe("ore");
      expect(tree.children[0].amount).toBe(24);
      expect(tree.children[0].children).toHaveLength(0);
    });
  });

  describe("multi-depth chain (steel → iron → ore)", () => {
    it("returns ore as the only base resource", () => {
      const { totals } = resolve("steel", 12);
      expect(totals).toEqual({ ore: 24 });
    });

    it("builds a nested tree", () => {
      const { tree } = resolve("steel", 12);

      expect(tree.id).toBe("steel");
      expect(tree.amount).toBe(12);

      const ironNode = tree.children[0];
      expect(ironNode.id).toBe("iron");
      expect(ironNode.amount).toBe(24);

      const oreNode = ironNode.children[0];
      expect(oreNode.id).toBe("ore");
      expect(oreNode.amount).toBe(24);
      expect(oreNode.children).toHaveLength(0);
    });
  });

  describe("scaling", () => {
    it("scales inputs proportionally for half output", () => {
      const { totals } = resolve("steel", 6);
      expect(totals).toEqual({ ore: 12 });
    });

    it("scales inputs proportionally for double output", () => {
      const { totals } = resolve("steel", 24);
      expect(totals).toEqual({ ore: 48 });
    });

    it("scales tree node amounts correctly", () => {
      const { tree } = resolve("steel", 6);
      expect(tree.amount).toBe(6);
      expect(tree.children[0].amount).toBe(12);
      expect(tree.children[0].children[0].amount).toBe(12);
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
