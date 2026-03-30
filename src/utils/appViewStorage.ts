import type { AppView } from '../appView';

const STORAGE_KEY = 'coi-app-view';

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
