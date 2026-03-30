import { describe, it, expect, beforeEach } from "vitest";
import {
  createExpandedMapAll,
  loadCanvasSidebarExpanded,
  saveCanvasSidebarExpanded,
} from "../../src/utils/canvasSidebarStorage";

describe("canvasSidebarStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults all category levels to expanded", () => {
    const m = loadCanvasSidebarExpanded();
    for (let level = 1; level <= 7; level++) {
      expect(m[level]).toBe(true);
    }
  });

  it("createExpandedMapAll sets every level to the same value", () => {
    const collapsed = createExpandedMapAll(false);
    for (let level = 1; level <= 7; level++) {
      expect(collapsed[level]).toBe(false);
    }
    const expanded = createExpandedMapAll(true);
    for (let level = 1; level <= 7; level++) {
      expect(expanded[level]).toBe(true);
    }
  });

  it("persists collapsed state across load", () => {
    const base = loadCanvasSidebarExpanded();
    saveCanvasSidebarExpanded({ ...base, 2: false, 5: false });
    const again = loadCanvasSidebarExpanded();
    expect(again[2]).toBe(false);
    expect(again[5]).toBe(false);
    expect(again[1]).toBe(true);
  });
});
