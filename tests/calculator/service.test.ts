import { describe, it, expect } from "vitest";
import { calculate } from "../../assets/js/calculator/service";

describe("calculate", () => {
  it("returns resourceId and targetRate in the result", () => {
    const result = calculate("steel", 12);
    expect(result.resourceId).toBe("steel");
    expect(result.targetRate).toBe(12);
  });

  it("returns totals from the resolver", () => {
    const { totals } = calculate("steel", 12);
    expect(totals).toEqual({ ore: 24 });
  });

  it("returns a dependency tree from the resolver", () => {
    const { tree } = calculate("steel", 12);
    expect(tree.id).toBe("steel");
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
