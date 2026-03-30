import { describe, it, expect, beforeEach } from 'vitest';
import { resources } from '../../assets/js/data/resources';
import {
  CANVAS_WORKSPACE_STORAGE_KEY,
  clearCanvasWorkspaceStorage,
  loadCanvasWorkspace,
  saveCanvasWorkspace,
} from '../../src/utils/canvasWorkspaceStorage';

describe('canvasWorkspaceStorage', () => {
  const sampleResourceId = Object.keys(resources)[0]!;

  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty defaults when nothing stored', () => {
    const s = loadCanvasWorkspace();
    expect(s.placedNodes).toEqual([]);
    expect(s.placedEdges).toEqual([]);
    expect(s.placementSeq).toBe(0);
    expect(s.search).toBe('');
    expect(s.workspaceScroll).toBeNull();
  });

  it('round-trips nodes, edges, labels, search, scroll, and bumps placementSeq', () => {
    saveCanvasWorkspace({
      placementSeq: 2,
      placedNodes: [
        {
          key: 'p0-0-x',
          batchId: 0,
          resourceId: sampleResourceId,
          label: 'Test',
          x: 10,
          y: 20,
          productionPerMin: '12',
          consumptionPerMin: '0',
        },
      ],
      placedEdges: [],
      placedBlockLabels: { 0: 'Block A' },
      search: 'iron',
      workspaceScroll: { scrollLeft: 100, scrollTop: 200 },
    });

    const s = loadCanvasWorkspace();
    expect(s.placementSeq).toBe(2);
    expect(s.placedNodes).toHaveLength(1);
    expect(s.placedNodes[0]!.resourceId).toBe(sampleResourceId);
    expect(s.placedBlockLabels[0]).toBe('Block A');
    expect(s.search).toBe('iron');
    expect(s.workspaceScroll).toEqual({ scrollLeft: 100, scrollTop: 200 });
  });

  it('filters edges that reference unknown node keys', () => {
    saveCanvasWorkspace({
      placementSeq: 1,
      placedNodes: [
        {
          key: 'a',
          batchId: 0,
          resourceId: sampleResourceId,
          label: 'A',
          x: 0,
          y: 0,
          productionPerMin: '',
          consumptionPerMin: '',
        },
        {
          key: 'b',
          batchId: 0,
          resourceId: sampleResourceId,
          label: 'B',
          x: 10,
          y: 10,
          productionPerMin: '',
          consumptionPerMin: '',
        },
      ],
      placedEdges: [
        { fromKey: 'a', toKey: 'missing' },
        { fromKey: 'a', toKey: 'b' },
      ],
      placedBlockLabels: {},
      search: '',
    });

    const s = loadCanvasWorkspace();
    expect(s.placedEdges).toEqual([{ fromKey: 'a', toKey: 'b' }]);
  });

  it('raises placementSeq when stored value is below max batch id', () => {
    saveCanvasWorkspace({
      placementSeq: 0,
      placedNodes: [
        {
          key: 'k',
          batchId: 3,
          resourceId: sampleResourceId,
          label: 'X',
          x: 0,
          y: 0,
          productionPerMin: '',
          consumptionPerMin: '',
        },
      ],
      placedEdges: [],
      placedBlockLabels: {},
      search: '',
    });

    expect(loadCanvasWorkspace().placementSeq).toBe(4);
  });

  it('clearCanvasWorkspaceStorage removes the key', () => {
    localStorage.setItem(CANVAS_WORKSPACE_STORAGE_KEY, '{"v":1}');
    clearCanvasWorkspaceStorage();
    expect(localStorage.getItem(CANVAS_WORKSPACE_STORAGE_KEY)).toBeNull();
  });
});
