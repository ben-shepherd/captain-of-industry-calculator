import { describe, it, expect, beforeEach } from 'vitest';
import {
  CANVAS_RESULTS_SIDEBAR_WIDTH_DEFAULT_PX,
  clearCanvasResultsSidebarWidthStorage,
  loadCanvasResultsSidebarWidthPx,
  saveCanvasResultsSidebarWidthPx,
} from '../../src/utils/canvasResultsSidebarWidthStorage';
import {
  clearCanvasResultsSidebarStorage,
  loadCanvasResultsSidebarVisible,
  saveCanvasResultsSidebarVisible,
} from '../../src/utils/canvasResultsSidebarStorage';
import {
  clearCanvasPlacementStyleStorage,
  loadCanvasPlacementStyle,
  saveCanvasPlacementStyle,
} from '../../src/utils/canvasPlacementStyleStorage';
import {
  clearCanvasSidebarExpandedStorage,
  loadCanvasSidebarExpanded,
  saveCanvasSidebarExpanded,
} from '../../src/utils/canvasSidebarStorage';

describe('canvas chrome clear helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('clearCanvasResultsSidebarWidthStorage removes persisted width', () => {
    saveCanvasResultsSidebarWidthPx(500);
    expect(loadCanvasResultsSidebarWidthPx()).toBe(500);
    clearCanvasResultsSidebarWidthStorage();
    expect(loadCanvasResultsSidebarWidthPx()).toBe(CANVAS_RESULTS_SIDEBAR_WIDTH_DEFAULT_PX);
  });

  it('clearCanvasResultsSidebarStorage removes persisted visibility', () => {
    saveCanvasResultsSidebarVisible(false);
    expect(loadCanvasResultsSidebarVisible()).toBe(false);
    clearCanvasResultsSidebarStorage();
    expect(loadCanvasResultsSidebarVisible()).toBe(true);
  });

  it('clearCanvasPlacementStyleStorage removes persisted placement style', () => {
    saveCanvasPlacementStyle('vertical');
    expect(loadCanvasPlacementStyle()).toBe('vertical');
    clearCanvasPlacementStyleStorage();
    expect(loadCanvasPlacementStyle()).toBe('auto');
  });

  it('clearCanvasSidebarExpandedStorage removes persisted expand map', () => {
    const base = loadCanvasSidebarExpanded();
    saveCanvasSidebarExpanded({ ...base, 2: false });
    expect(loadCanvasSidebarExpanded()[2]).toBe(false);
    clearCanvasSidebarExpandedStorage();
    expect(loadCanvasSidebarExpanded()[2]).toBe(true);
  });
});
