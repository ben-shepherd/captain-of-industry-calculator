import { describe, it, expect } from "vitest";
import { resources } from "../../assets/js/data/resources";
import {
  buildCanvasResourceTooltipModel,
  canvasResourceAriaSummary,
} from "../../src/utils/canvasResourceTooltip";

describe("canvasResourceTooltip", () => {
  it("builds a rich summary for diesel", () => {
    const def = resources.diesel!;
    const m = buildCanvasResourceTooltipModel("diesel", def, {
      level: 5,
      groupLabel: "Petrochemical",
    });
    expect(m.label).toBe("Diesel");
    expect(m.resourceId).toBe("diesel");
    expect(m.recipeLine).toMatch(/^\d+ recipes available$/);
    expect(m.unitLine).toBe("Unit: t/m");
    expect(m.categoryLine).toBe("Level 5 — Petrochemical");
    expect(m.buildingsLine).toBeTruthy();
    expect(m.buildingsLine!.length).toBeGreaterThan(0);
  });

  it("uses singular recipe for a single-recipe resource", () => {
    const id = Object.keys(resources).find(
      (k) => resources[k]!.recipes.length === 1,
    )!;
    const def = resources[id]!;
    const m = buildCanvasResourceTooltipModel(id, def, { level: 1, groupLabel: "Natural" });
    expect(m.recipeLine).toBe("1 recipe available");
  });

  it("canvasResourceAriaSummary joins fields", () => {
    const m = buildCanvasResourceTooltipModel("diesel", resources.diesel!, {
      level: 5,
      groupLabel: "Petrochemical",
    });
    const s = canvasResourceAriaSummary(m);
    expect(s).toContain("Diesel");
    expect(s).toContain("recipes available");
  });
});
