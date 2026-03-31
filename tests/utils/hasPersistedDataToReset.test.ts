import { describe, it, expect, beforeEach } from 'vitest';
import { hasPersistedDataToReset } from '../../src/utils/hasPersistedDataToReset';
import { CANVAS_WORKSPACE_STORAGE_KEY } from '../../src/utils/canvasWorkspaceStorage';

describe('hasPersistedDataToReset', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('is false when nothing is stored', () => {
    expect(hasPersistedDataToReset()).toBe(false);
  });

  it('is true when main calculator envelope exists', () => {
    localStorage.setItem(
      'coi-calculator-state',
      JSON.stringify({ version: 13, savedAt: 0, data: {} }),
    );
    expect(hasPersistedDataToReset()).toBe(true);
  });

  it('is true when canvas workspace exists without main state', () => {
    localStorage.setItem(CANVAS_WORKSPACE_STORAGE_KEY, '{"v":1}');
    expect(hasPersistedDataToReset()).toBe(true);
  });

  it('is true when only app view is canvas', () => {
    localStorage.setItem('coi-app-view', 'canvas');
    expect(hasPersistedDataToReset()).toBe(true);
  });

  it('is false when only app view is calculator', () => {
    localStorage.setItem('coi-app-view', 'calculator');
    expect(hasPersistedDataToReset()).toBe(false);
  });
});
