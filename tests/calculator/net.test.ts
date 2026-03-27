import { describe, it, expect } from "vitest";
import { calculateNet } from "../../assets/js/calculator/net";

describe("calculateNet", () => {
  it("reports a deficit when production < required", () => {
    const result = calculateNet({ ore: 30 }, { ore: 10 });
    expect(result.ore).toEqual({
      required: 30,
      production: 10,
      net: -20,
      status: "deficit",
    });
  });

  it("reports a surplus when production > required", () => {
    const result = calculateNet({ ore: 10 }, { ore: 30 });
    expect(result.ore).toEqual({
      required: 10,
      production: 30,
      net: 20,
      status: "surplus",
    });
  });

  it("reports balanced when production === required", () => {
    const result = calculateNet({ ore: 20 }, { ore: 20 });
    expect(result.ore).toEqual({
      required: 20,
      production: 20,
      net: 0,
      status: "balanced",
    });
  });

  it("includes resources only in required (deficit)", () => {
    const result = calculateNet({ ore: 15 }, {});
    expect(result.ore).toEqual({
      required: 15,
      production: 0,
      net: -15,
      status: "deficit",
    });
  });

  it("includes resources only in production (surplus)", () => {
    const result = calculateNet({}, { iron: 10 });
    expect(result.iron).toEqual({
      required: 0,
      production: 10,
      net: 10,
      status: "surplus",
    });
  });

  it("merges keys from both maps", () => {
    const result = calculateNet({ ore: 20 }, { iron: 5 });
    expect(Object.keys(result).sort()).toEqual(["iron", "ore"]);
  });

  it("returns an empty object when both inputs are empty", () => {
    const result = calculateNet({}, {});
    expect(result).toEqual({});
  });

  it("handles multiple resources at once", () => {
    const result = calculateNet(
      { ore: 30, iron: 10 },
      { ore: 40, iron: 5, steel: 2 },
    );

    expect(result.ore?.status).toBe("surplus");
    expect(result.iron?.status).toBe("deficit");
    expect(result.steel?.status).toBe("surplus");
  });
});
