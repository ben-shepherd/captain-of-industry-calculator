import { useState } from 'react';
import { useCoiStore } from '../../assets/js/app/coiExternalStore';
import {
  applyProductionPresetMerge,
  applyProductionPresetReplace,
  deleteProductionPreset,
  getProductionPresets,
  saveProductionPreset,
  setInputsSectionExpanded,
} from '../../assets/js/app/state';
import { groupProductionPresets } from '../utils/presetGroups';

export function PresetsSection() {
  const state = useCoiStore();
  const presetsOpen = state.inputsSections.presets;
  const presets = getProductionPresets();
  const groups = groupProductionPresets(presets);
  const [selectedId, setSelectedId] = useState('');
  const [saveName, setSaveName] = useState('');

  return (
    <details
      className="results-section"
      id="config-section-presets"
      open={presetsOpen}
      onToggle={(e) => {
        setInputsSectionExpanded('presets', e.currentTarget.open);
      }}
    >
      <summary className="results-section-summary">Presets</summary>
      <div className="results-section-body">
        <div className="production-presets">
          <div className="production-presets-grid">
            <label htmlFor="production-preset-select">Saved preset</label>
            <select
              id="production-preset-select"
              aria-label="Choose a saved production preset"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">— Select preset —</option>
              {groups.map(({ category, presets: ps }) => (
                <optgroup key={category} label={category}>
                  {ps.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div className="production-presets-actions-buttons">
              <button
                type="button"
                id="production-preset-load-merge"
                className="btn btn-secondary"
                title="Add preset rates to your current production; overlapping resources use the preset’s values."
                onClick={() => {
                  if (!selectedId) return;
                  applyProductionPresetMerge(selectedId);
                }}
              >
                Load (keep rows)
              </button>
              <button
                type="button"
                id="production-preset-load-replace"
                className="btn btn-secondary"
                title="Replace your production with this preset only."
                onClick={() => {
                  if (!selectedId) return;
                  applyProductionPresetReplace(selectedId);
                }}
              >
                Load (replace)
              </button>
              <button
                type="button"
                id="production-preset-delete"
                className="btn btn-secondary"
                onClick={() => {
                  if (!selectedId) return;
                  deleteProductionPreset(selectedId);
                  setSelectedId('');
                }}
              >
                Delete
              </button>
            </div>
          </div>
          <div className="production-presets-row production-presets-save">
            <label htmlFor="production-preset-name">Save as</label>
            <input
              id="production-preset-name"
              type="text"
              placeholder="e.g. Main bus"
              autoComplete="off"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
            />
            <button
              type="button"
              id="production-preset-save"
              className="btn"
              onClick={() => {
                saveProductionPreset(saveName);
                setSaveName('');
              }}
            >
              Save preset
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}
