import { useEffect, useRef, useState } from 'react';
import { useCoiStore } from '../../../assets/js/app/coiExternalStore';
import { setInputsSectionExpanded, setTargetRate } from '../../../assets/js/app/state';
import { resources } from '../../../assets/js/data/resources';

export function TargetRateField() {
  const state = useCoiStore();
  const targetRate = state.targetRate;
  const resourceId = state.resourceId;
  const resource = resourceId ? resources[resourceId] : undefined;
  const imageUrl = resource?.imageUrl;
  const resourceLabel = resource?.label;
  const sectionOpen = state.inputsSections.targetRate;

  const [targetRateText, setTargetRateText] = useState(() => String(targetRate));
  const targetRateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = targetRateInputRef.current;
    const isFocused = input != null && document.activeElement === input;
    if (!isFocused) setTargetRateText(String(targetRate));
  }, [targetRate]);

  return (
    <details
      className="results-section"
      id="config-section-target-rate"
      open={sectionOpen}
      onToggle={(e) => setInputsSectionExpanded('targetRate', e.currentTarget.open)}
    >
      <summary className="results-section-summary">
        Target rate{resourceLabel ? ` — ${resourceLabel}` : ''}
      </summary>
      <div className="results-section-body">
        <div className="field field-target-rate">
          <div className="field-target-rate-row">
            <div className="field-target-rate-icon">
              {imageUrl ? (
                <img
                  className="resource-icon field-target-rate-resource-icon"
                  src={imageUrl}
                  alt=""
                  width={28}
                  height={28}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span
                  className="field-target-rate-icon-placeholder"
                  title="No target resource selected"
                />
              )}
            </div>
            <div className="field-target-rate-fields">
              <label htmlFor="target-rate">Target output rate (items per minute)</label>
              {resourceLabel ? (
                <p className="field-target-rate-resource-name" id="target-rate-resource-context">
                  For: {resourceLabel}
                </p>
              ) : (
                <p className="field-target-rate-hint" id="target-rate-resource-context">
                  Applies to the resource selected in Target resource above.
                </p>
              )}
              <input
                ref={targetRateInputRef}
                id="target-rate"
                type="number"
                min={0.01}
                step="any"
                inputMode="decimal"
                aria-describedby="target-rate-resource-context"
                value={targetRateText}
                onChange={(e) => {
                  const input = e.currentTarget;
                  const text = input.value;
                  setTargetRateText(text);

                  const val = parseFloat(text);
                  const valid = val > 0 && isFinite(val);
                  input.classList.toggle('input-invalid', !valid && text !== '');
                  if (valid) setTargetRate(val);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}

