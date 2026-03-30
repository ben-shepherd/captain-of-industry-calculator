import { useRef } from 'react';
import { useCoiStore } from '../../../assets/js/app/coiExternalStore';
import {
  applyLoadedState,
  getSnapshot,
  setUserGuideVisible,
  wipeAllPersistedDataAndResetToDefaults,
} from '../../../assets/js/app/state';
import {
  buildExportJson,
  hasPersistedStorage,
  parsePersistedEnvelope,
} from '../../../assets/js/app/persistence';

export function AppHeader() {
  const state = useCoiStore();
  const importInputRef = useRef<HTMLInputElement>(null);
  const showGuide = !state.userGuideVisible;

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-brand">
          <img
            src="/assets/img/logo.png"
            alt="Captain of Industry"
            className="app-logo"
            width={200}
          />
          <div className="app-brand-text">
            <div className="app-heading-row">
              <h1>Resource Calculator</h1>
              <button
                type="button"
                id="show-user-guide"
                className="btn btn-secondary app-show-user-guide"
                hidden={!showGuide}
                aria-label="Show how to use this calculator"
                onClick={() => setUserGuideVisible(true)}
              >
                Show guide
              </button>
            </div>
            <p className="subtitle">Production chains, base resources, and net flow</p>
          </div>
        </div>
        <nav className="app-toolbar" aria-label="App actions">
          <button
            type="button"
            id="export-saved-data"
            className="btn btn-secondary"
            aria-label="Export saved data as a JSON file"
            onClick={() => {
              const json = buildExportJson(getSnapshot());
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              const d = new Date();
              const pad = (n: number) => String(n).padStart(2, '0');
              const filename = `coi-calculator-export-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
              a.href = url;
              a.download = filename;
              a.rel = 'noopener';
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            }}
          >
            Export
          </button>
          <button
            type="button"
            id="import-saved-data"
            className="btn btn-secondary"
            aria-label="Import saved data from a JSON file"
            onClick={() => importInputRef.current?.click()}
          >
            Import
          </button>
          <input
            ref={importInputRef}
            type="file"
            id="import-saved-data-input"
            accept="application/json,.json"
            hidden
            aria-hidden="true"
            onChange={() => {
              const file = importInputRef.current?.files?.[0];
              if (importInputRef.current) importInputRef.current.value = '';
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const text = typeof reader.result === 'string' ? reader.result : '';
                const parsed = parsePersistedEnvelope(text);
                if (!parsed) {
                  window.alert(
                    'Could not read that file. Make sure it is valid JSON exported from this app.',
                  );
                  return;
                }
                if (
                  !window.confirm(
                    'Replace all current saved data with the contents of this file? Your current configuration, production rates, presets, and panel settings will be overwritten.',
                  )
                ) {
                  return;
                }
                applyLoadedState(parsed);
              };
              reader.onerror = () => {
                window.alert('Could not read the selected file.');
              };
              reader.readAsText(file);
            }}
          />
          <button
            type="button"
            id="reset-saved-data"
            className="btn btn-secondary"
            disabled={!hasPersistedStorage()}
            aria-label="Reset all saved data for this app"
            onClick={() => {
              if (
                !window.confirm(
                  'This will remove all saved data from this browser, including your configuration, production rates, presets, and panel settings. This cannot be undone. Continue?',
                )
              ) {
                return;
              }
              wipeAllPersistedDataAndResetToDefaults();
            }}
          >
            Reset
          </button>
        </nav>
      </div>
    </header>
  );
}
