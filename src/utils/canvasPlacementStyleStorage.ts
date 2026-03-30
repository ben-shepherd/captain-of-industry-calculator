import type { CanvasPlacementStyle } from './canvasPlacement';

const STORAGE_KEY = 'coi-canvas-placement-style';

export function loadCanvasPlacementStyle(): CanvasPlacementStyle {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'horizontal' || raw === 'vertical') return raw;
  } catch {
    // ignore
  }
  return 'horizontal';
}

export function saveCanvasPlacementStyle(style: CanvasPlacementStyle): void {
  try {
    localStorage.setItem(STORAGE_KEY, style);
  } catch {
    // ignore quota / private mode
  }
}
