import { describe, it, expect } from "vitest";
import { formatTotals, formatNetTotals } from "../../assets/js/formatters/flatFormatter.js";

describe("formatTotals", () => {
  it("converts a totals map into a sorted array of entries", () => {
    const result = formatTotals({ ore: 24, iron: 12 });

    expect(result).toEqual([
      { id: "iron", label: "Iron", amount: 12, unit: "t/m" },
      { id: "ore", label: "Iron Ore", amount: 24, unit: "t/m" },
    ]);
  });

  it("sorts alphabetically by label", () => {
    const result = formatTotals({ steel: 6, ore: 24, iron: 12 });
    const labels = result.map((r) => r.label);
    expect(labels).toEqual(["Iron", "Iron Ore", "Steel"]);
  });

  it("returns an empty array for empty totals", () => {
    expect(formatTotals({})).toEqual([]);
  });

  it("falls back to id as label for unknown resources", () => {
    const result = formatTotals({ unknown: 5 });
    expect(result[0].label).toBe("unknown");
    expect(result[0].unit).toBe("");
  });
});

describe("formatNetTotals", () => {
  it("converts net entries into a sorted array with all fields", () => {
    const net = {
      ore: { required: 30, production: 10, net: -20, status: "deficit" },
      iron: { required: 0, production: 10, net: 10, status: "surplus" },
    };

    const result = formatNetTotals(net);

    expect(result).toEqual([
      { id: "iron", label: "Iron", unit: "t/m", required: 0, production: 10, net: 10, status: "surplus" },
      { id: "ore", label: "Iron Ore", unit: "t/m", required: 30, production: 10, net: -20, status: "deficit" },
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(formatNetTotals({})).toEqual([]);
  });

  it("sorts alphabetically by label", () => {
    const net = {
      steel: { required: 5, production: 5, net: 0, status: "balanced" },
      ore: { required: 10, production: 10, net: 0, status: "balanced" },
    };

    const labels = formatNetTotals(net).map((r) => r.label);
    expect(labels).toEqual(["Iron Ore", "Steel"]);
  });
});
