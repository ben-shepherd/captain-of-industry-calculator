import { describe, expect, it } from "vitest";
import { machinesNeededExact } from "../../assets/js/calculator/machines";

describe("machinesNeededExact", () => {
  it("computes exact machines needed from per-machine throughput", () => {
    // 3 output per 30s => 6/min per machine; target 60/min => 10 machines.
    expect(machinesNeededExact(60, 3, 30)).toBe(10);
  });

  it("returns null for invalid/unsupported inputs", () => {
    expect(machinesNeededExact(0, 3, 30)).toBeNull();
    expect(machinesNeededExact(-5, 3, 30)).toBeNull();
    expect(machinesNeededExact(NaN, 3, 30)).toBeNull();
    expect(machinesNeededExact(60, 0, 30)).toBeNull();
    expect(machinesNeededExact(60, -2, 30)).toBeNull();
  });

  it("returns null when duration is non-positive or non-finite", () => {
    expect(machinesNeededExact(60, 3, 0)).toBeNull();
    expect(machinesNeededExact(60, 3, -10)).toBeNull();
    expect(machinesNeededExact(60, 3, NaN)).toBeNull();
    expect(machinesNeededExact(60, 3, Infinity)).toBeNull();
  });
});
