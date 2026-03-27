import { describe, it, expect } from "vitest";
import { formatTree, flattenTree } from "../../assets/js/formatters/treeFormatter";
import { resolve } from "../../assets/js/calculator/resolver";

const crushedTree = resolve("ironOreCrushed", 16).tree;

describe("formatTree", () => {
  it("annotates the root node with depth 0 and unit", () => {
    const formatted = formatTree(crushedTree);
    expect(formatted.id).toBe("ironOreCrushed");
    expect(formatted.depth).toBe(0);
    expect(formatted.unit).toBe("t/m");
    expect(formatted.label).toBe("Iron Ore Crushed");
    expect(formatted.amount).toBe(16);
  });

  it("increments depth for each level of nesting", () => {
    const formatted = formatTree(crushedTree);
    const oreNode = formatted.children[0]!;

    expect(oreNode.depth).toBe(1);
    expect(oreNode.children).toHaveLength(0);
  });

  it("preserves children structure", () => {
    const formatted = formatTree(crushedTree);
    expect(formatted.children).toHaveLength(1);
    expect(formatted.children[0]!.children).toHaveLength(0);
  });

  it("adds unit to every node", () => {
    const formatted = formatTree(crushedTree);
    expect(formatted.unit).toBe("t/m");
    expect(formatted.children[0]!.unit).toBe("t/m");
  });
});

describe("flattenTree", () => {
  it("returns nodes in depth-first order", () => {
    const flat = flattenTree(crushedTree);
    const ids = flat.map((n) => n.id);
    expect(ids).toEqual(["ironOreCrushed", "ironOre"]);
  });

  it("assigns correct depth values", () => {
    const flat = flattenTree(crushedTree);
    const depths = flat.map((n) => n.depth);
    expect(depths).toEqual([0, 1]);
  });

  it("includes label, amount, and unit on every entry", () => {
    const flat = flattenTree(crushedTree);
    for (const node of flat) {
      expect(typeof node.label).toBe("string");
      expect(typeof node.amount).toBe("number");
      expect(typeof node.unit).toBe("string");
    }
  });

  it("returns a single entry for a base resource", () => {
    const oreTree = resolve("ironOre", 50).tree;
    const flat = flattenTree(oreTree);
    expect(flat).toHaveLength(1);
    expect(flat[0]).toEqual({
      id: "ironOre",
      label: "Iron Ore",
      amount: 50,
      unit: "t/m",
      depth: 0,
    });
  });
});
