import { resources } from '../data/resources';
import {
  setResourceId,
  setTargetRate,
  setProduction,
  getProduction,
  getResourceId,
} from '../app/state';
import { updateResults } from './controller';
import type { ResultElements } from './controller';
import { debounce } from './utils';

export interface AppElements extends ResultElements {
  resourceSelect: HTMLSelectElement;
  targetRateInput: HTMLInputElement;
  productionFields: HTMLElement;
}

/**
 * Wire up all DOM event listeners.
 * Call once after DOMContentLoaded.
 */
export function bindEvents(els: AppElements): void {
  const { resourceSelect, targetRateInput, productionFields } = els;
  const resultEls: ResultElements = {
    totalsBody: els.totalsBody,
    treeList: els.treeList,
    netBody: els.netBody,
  };

  const debouncedUpdate = debounce(() => updateResults(resultEls), 120);

  resourceSelect.addEventListener("change", () => {
    setResourceId(resourceSelect.value);
    updateResults(resultEls);
  });

  targetRateInput.addEventListener("input", () => {
    const val = parseFloat(targetRateInput.value);
    const valid = val > 0 && isFinite(val);

    targetRateInput.classList.toggle("input-invalid", !valid && targetRateInput.value !== "");

    if (valid) {
      setTargetRate(val);
      debouncedUpdate();
    }
  });

  productionFields.addEventListener("input", (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.dataset.resourceId) return;

    const val = parseFloat(input.value);
    const invalid = input.value !== "" && (isNaN(val) || val < 0);

    input.classList.toggle("input-invalid", invalid);

    if (!invalid) {
      setProduction(input.dataset.resourceId, isNaN(val) ? 0 : val);
      debouncedUpdate();
    }
  });

  renderProductionFields(productionFields);
}

/**
 * Build one number input per known resource so the user can
 * specify current production rates.
 */
function renderProductionFields(container: HTMLElement): void {
  const production = getProduction();

  container.innerHTML = Object.entries(resources)
    .map(([id, res]) => {
      const val = production[id] ?? "";
      return (
        `<div class="production-row">`
        + `<label for="prod-${id}">${res.label}</label>`
        + `<input id="prod-${id}" type="number" min="0" step="any" `
        + `data-resource-id="${id}" value="${val}" `
        + `placeholder="0" />`
        + `</div>`
      );
    })
    .join("");
}
