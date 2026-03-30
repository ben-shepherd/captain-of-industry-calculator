import { useSyncExternalStore } from 'react';
import type { AppState } from '../contracts';
import { COI_PERSISTED_CHROME_EVENT } from './persistedChromeEvent';
import { getSnapshot, initState } from './state';

let snapshot!: AppState;

export function initCoiApp(): void {
  initState();
  snapshot = getSnapshot();
}

function subscribe(callback: () => void): () => void {
  const handler = () => {
    snapshot = getSnapshot();
    callback();
  };
  window.addEventListener('coi-state-persisted', handler);
  window.addEventListener(COI_PERSISTED_CHROME_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('coi-state-persisted', handler);
    window.removeEventListener(COI_PERSISTED_CHROME_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

function getSnapshotForStore(): AppState {
  return snapshot;
}

function getServerSnapshot(): AppState {
  return snapshot;
}

export function useCoiStore(): AppState {
  return useSyncExternalStore(subscribe, getSnapshotForStore, getServerSnapshot);
}
