const STORAGE_KEY = 'coi-canvas-results-sidebar-visible';

export function loadCanvasResultsSidebarVisible(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return raw === 'true';
  } catch {
    return true;
  }
}

export function saveCanvasResultsSidebarVisible(visible: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(visible));
  } catch {
    // ignore quota / private mode
  }
}
