import { notifyPersistedChromeChanged } from './persistedChromeNotify';

const STORAGE_KEY = 'coi-canvas-results-sidebar-visible';

export function hasCanvasResultsSidebarVisibilityPersisted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

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
    notifyPersistedChromeChanged();
  } catch {
    // ignore quota / private mode
  }
}

export function clearCanvasResultsSidebarStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
