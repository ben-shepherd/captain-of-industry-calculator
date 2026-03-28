import { describe, it, expect } from "vitest";
import { perMinute } from "../../assets/js/ui/recipeDiagram";

describe("perMinute", () => {
  it("computes throughput per minute for one machine", () => {
    expect(perMinute(3, 30)).toBe(6);
    expect(perMinute(4, 30)).toBe(8);
  });

  it("matches food pack egg line (3 eggs / 30s)", () => {
    expect(perMinute(3, 30)).toBe(6);
  });

  it("returns 0 for non-positive duration", () => {
    expect(perMinute(10, 0)).toBe(0);
    expect(perMinute(10, -5)).toBe(0);
  });

  it("returns 0 for non-finite duration", () => {
    expect(perMinute(10, NaN)).toBe(0);
    expect(perMinute(10, Infinity)).toBe(0);
  });
});
