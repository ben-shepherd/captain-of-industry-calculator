import type { CanvasPlacementStyle } from './canvasPlacement';
import { notifyPersistedChromeChanged } from './persistedChromeNotify';

const STORAGE_KEY = 'coi-canvas-placement-style';

export function hasCanvasPlacementStylePersisted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function loadCanvasPlacementStyle(): CanvasPlacementStyle {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'horizontal' || raw === 'vertical' || raw === 'auto') return raw;
  } catch {
    // ignore
  }
  return 'auto';
}

export function saveCanvasPlacementStyle(style: CanvasPlacementStyle): void {
  try {
    localStorage.setItem(STORAGE_KEY, style);
    notifyPersistedChromeChanged();
  } catch {
    // ignore quota / private mode
  }
}

export function clearCanvasPlacementStyleStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
