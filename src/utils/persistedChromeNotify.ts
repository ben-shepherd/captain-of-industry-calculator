import { COI_PERSISTED_CHROME_EVENT } from '../../assets/js/app/persistedChromeEvent';

export { COI_PERSISTED_CHROME_EVENT };

/** Dispatched after any canvas / app-view localStorage write so UI (e.g. Reset) can re-check storage. */
export function notifyPersistedChromeChanged(): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(COI_PERSISTED_CHROME_EVENT));
    }
  } catch {
    // ignore
  }
}
