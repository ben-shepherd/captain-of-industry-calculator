import type { AppView } from '../appView';
import { notifyPersistedChromeChanged } from './persistedChromeNotify';

const STORAGE_KEY = 'coi-app-view';

/** True when the stored view is Canvas (non-default). */
export function hasPersistedCanvasAppViewPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'canvas';
  } catch {
    return false;
  }
}

export function loadAppView(): AppView {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'calculator' || raw === 'canvas') return raw;
  } catch {
    // ignore
  }
  return 'calculator';
}

export function saveAppView(view: AppView): void {
  try {
    localStorage.setItem(STORAGE_KEY, view);
    notifyPersistedChromeChanged();
  } catch {
    // ignore quota / private mode
  }
}

export function clearAppViewStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
