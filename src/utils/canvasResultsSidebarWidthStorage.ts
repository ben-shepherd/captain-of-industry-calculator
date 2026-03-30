import { notifyPersistedChromeChanged } from './persistedChromeNotify';

const STORAGE_KEY = 'coi-canvas-results-sidebar-width-px';

export function hasCanvasResultsSidebarWidthPersisted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export const CANVAS_RESULTS_SIDEBAR_WIDTH_DEFAULT_PX = 384;
export const CANVAS_RESULTS_SIDEBAR_WIDTH_MIN_PX = 280;
export const CANVAS_RESULTS_SIDEBAR_WIDTH_MAX_PX = 900;

export function clampCanvasResultsSidebarWidthPx(n: number): number {
  if (!Number.isFinite(n)) return CANVAS_RESULTS_SIDEBAR_WIDTH_DEFAULT_PX;
  return Math.round(
    Math.min(
      CANVAS_RESULTS_SIDEBAR_WIDTH_MAX_PX,
      Math.max(CANVAS_RESULTS_SIDEBAR_WIDTH_MIN_PX, n),
    ),
  );
}

/** Upper bound also limited to half the viewport width (for narrow windows). */
export function clampCanvasResultsSidebarWidthPxForViewport(
  n: number,
  innerWidth: number,
): number {
  const cap = Math.min(
    CANVAS_RESULTS_SIDEBAR_WIDTH_MAX_PX,
    Math.max(0, Math.floor(innerWidth * 0.5)),
  );
  const hi = Math.max(CANVAS_RESULTS_SIDEBAR_WIDTH_MIN_PX, cap);
  if (!Number.isFinite(n)) return CANVAS_RESULTS_SIDEBAR_WIDTH_DEFAULT_PX;
  return Math.round(Math.min(hi, Math.max(CANVAS_RESULTS_SIDEBAR_WIDTH_MIN_PX, n)));
}

export function loadCanvasResultsSidebarWidthPx(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return CANVAS_RESULTS_SIDEBAR_WIDTH_DEFAULT_PX;
    const n = Number(raw);
    if (!Number.isFinite(n)) return CANVAS_RESULTS_SIDEBAR_WIDTH_DEFAULT_PX;
    return clampCanvasResultsSidebarWidthPx(n);
  } catch {
    return CANVAS_RESULTS_SIDEBAR_WIDTH_DEFAULT_PX;
  }
}

export function saveCanvasResultsSidebarWidthPx(widthPx: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(clampCanvasResultsSidebarWidthPx(widthPx)));
    notifyPersistedChromeChanged();
  } catch {
    // ignore quota / private mode
  }
}

export function clearCanvasResultsSidebarWidthStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
