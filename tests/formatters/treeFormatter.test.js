import { describe, it, expect } from "vitest";
import { formatTree, flattenTree } from "../../assets/js/formatters/treeFormatter.js";
import { resolve } from "../../assets/js/calculator/resolver.js";

const steelTree = resolve("steel", 12).tree;

describe("formatTree", () => {
  it("annotates the root node with depth 0 and unit", () => {
    const formatted = formatTree(steelTree);
    expect(formatted.id).toBe("steel");
    expect(formatted.depth).toBe(0);
    expect(formatted.unit).toBe("t/m");
    expect(formatted.label).toBe("Steel");
    expect(formatted.amount).toBe(12);
  });

  it("increments depth for each level of nesting", () => {
    const formatted = formatTree(steelTree);
    const ironNode = formatted.children[0];
    const oreNode = ironNode.children[0];

    expect(ironNode.depth).toBe(1);
    expect(oreNode.depth).toBe(2);
  });

  it("preserves children structure", () => {
    const formatted = formatTree(steelTree);
    expect(formatted.children).toHaveLength(1);
    expect(formatted.children[0].children).toHaveLength(1);
    expect(formatted.children[0].children[0].children).toHaveLength(0);
  });

  it("adds unit to every node", () => {
    const formatted = formatTree(steelTree);
    expect(formatted.unit).toBe("t/m");
    expect(formatted.children[0].unit).toBe("t/m");
    expect(formatted.children[0].children[0].unit).toBe("t/m");
  });
});

describe("flattenTree", () => {
  it("returns nodes in depth-first order", () => {
    const flat = flattenTree(steelTree);
    const ids = flat.map((n) => n.id);
    expect(ids).toEqual(["steel", "iron", "ore"]);
  });

  it("assigns correct depth values", () => {
    const flat = flattenTree(steelTree);
    const depths = flat.map((n) => n.depth);
    expect(depths).toEqual([0, 1, 2]);
  });

  it("includes label, amount, and unit on every entry", () => {
    const flat = flattenTree(steelTree);
    for (const node of flat) {
      expect(typeof node.label).toBe("string");
      expect(typeof node.amount).toBe("number");
      expect(typeof node.unit).toBe("string");
    }
  });

  it("returns a single entry for a base resource", () => {
    const oreTree = resolve("ore", 50).tree;
    const flat = flattenTree(oreTree);
    expect(flat).toHaveLength(1);
    expect(flat[0]).toEqual({
      id: "ore",
      label: "Iron Ore",
      amount: 50,
      unit: "t/m",
      depth: 0,
    });
  });
});
