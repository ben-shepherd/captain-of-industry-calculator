import { resources } from "../data/resources.js";
import {
  setResourceId,
  setTargetRate,
  setProduction,
  getProduction,
  getResourceId,
} from "../app/state.js";
import { updateResults } from "./controller.js";
import { debounce } from "./utils.js";

/**
 * Wire up all DOM event listeners.
 * Call once after DOMContentLoaded.
 *
 * @param {Object} els – DOM element references
 * @param {HTMLSelectElement} els.resourceSelect
 * @param {HTMLInputElement}  els.targetRateInput
 * @param {HTMLElement}       els.productionFields
 * @param {HTMLElement}       els.totalsBody
 * @param {HTMLElement}       els.treeList
 * @param {HTMLElement}       els.netBody
 */
export function bindEvents(els) {
  const { resourceSelect, targetRateInput, productionFields } = els;
  const resultEls = {
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

  productionFields.addEventListener("input", (e) => {
    const input = e.target;
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
 *
 * @param {HTMLElement} container
 */
function renderProductionFields(container) {
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
