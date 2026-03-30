import { useSyncExternalStore } from 'react';
import type { AppState } from '../contracts';
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
  return () => window.removeEventListener('coi-state-persisted', handler);
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
