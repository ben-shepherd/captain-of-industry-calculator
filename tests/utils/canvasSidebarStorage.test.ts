import { describe, it, expect, beforeEach } from "vitest";
import {
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

  it("persists collapsed state across load", () => {
    const base = loadCanvasSidebarExpanded();
    saveCanvasSidebarExpanded({ ...base, 2: false, 5: false });
    const again = loadCanvasSidebarExpanded();
    expect(again[2]).toBe(false);
    expect(again[5]).toBe(false);
    expect(again[1]).toBe(true);
  });
});
