import {
  setResourceId,
  setTargetRate,
  setProduction,
  addProductionExtraId,
  removeProductionExtraId,
  getProductionExtraIds,
  dismissProductionRow,
  applyProductionPreset,
  saveProductionPreset,
  deleteProductionPreset,
} from "../app/state";
import {
  matchResourcesForSearch,
  refreshResourceSearchResults,
  updateResults,
} from "./controller";
import type { ResultElements } from "./controller";
import { debounce } from "./utils";
import { isIdRequiredByCurrentTarget } from "./productionView";

function setSearchListExpanded(input: HTMLInputElement, expanded: boolean): void {
  input.setAttribute("aria-expanded", expanded ? "true" : "false");
}

export interface AppElements extends ResultElements {
  resourceSelect: HTMLSelectElement;
  resourceSearchInput: HTMLInputElement;
  resourceSearchResults: HTMLUListElement;
  targetRateInput: HTMLInputElement;
  productionFields: HTMLElement;
  productionAddSelect: HTMLSelectElement;
  productionPresetSelect: HTMLSelectElement;
  productionPresetLoad: HTMLButtonElement;
  productionPresetDelete: HTMLButtonElement;
  productionPresetName: HTMLInputElement;
  productionPresetSave: HTMLButtonElement;
}

/**
 * Wire up all DOM event listeners.
 * Call once after DOMContentLoaded.
 */
export function bindEvents(els: AppElements): void {
  const {
    resourceSelect,
    resourceSearchInput,
    resourceSearchResults,
    targetRateInput,
    productionFields,
    productionAddSelect,
    productionPresetSelect,
    productionPresetLoad,
    productionPresetDelete,
    productionPresetName,
    productionPresetSave,
  } = els;
  const resultEls: ResultElements = {
    totalsBody: els.totalsBody,
    treeList: els.treeList,
    netBody: els.netBody,
    productionFields: els.productionFields,
    productionAddSelect: els.productionAddSelect,
    productionPresetSelect: els.productionPresetSelect,
  };

  const debouncedUpdate = debounce(() => updateResults(resultEls), 120);

  const resourceSearchWrap = resourceSearchInput.closest(
    ".resource-search-wrap",
  ) as HTMLElement;

  function selectTargetResourceFromSearch(id: string): void {
    resourceSelect.value = id;
    resourceSearchInput.value = "";
    refreshResourceSearchResults(resourceSearchResults, "");
    setSearchListExpanded(resourceSearchInput, false);
    setResourceId(id);
    updateResults(resultEls);
  }

  resourceSearchInput.addEventListener("input", () => {
    refreshResourceSearchResults(resourceSearchResults, resourceSearchInput.value);
    const q = resourceSearchInput.value.trim();
    setSearchListExpanded(resourceSearchInput, q !== "");
  });

  resourceSearchInput.addEventListener("focus", () => {
    const q = resourceSearchInput.value.trim();
    if (!q) return;
    refreshResourceSearchResults(resourceSearchResults, resourceSearchInput.value);
    setSearchListExpanded(resourceSearchInput, true);
  });

  resourceSearchInput.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      resourceSearchInput.value = "";
      refreshResourceSearchResults(resourceSearchResults, "");
      setSearchListExpanded(resourceSearchInput, false);
      return;
    }
    if (e.key !== "Enter") return;
    const q = resourceSearchInput.value.trim();
    if (!q) return;
    const first = matchResourcesForSearch(q)[0];
    if (!first) return;
    e.preventDefault();
    selectTargetResourceFromSearch(first.id);
  });

  resourceSearchResults.addEventListener("mousedown", (e: MouseEvent) => {
    const li = (e.target as HTMLElement).closest(
      "li[data-resource-id]",
    ) as HTMLLIElement | null;
    if (!li?.dataset.resourceId) return;
    e.preventDefault();
    selectTargetResourceFromSearch(li.dataset.resourceId);
  });

  document.addEventListener("click", (e: MouseEvent) => {
    if (resourceSearchWrap.contains(e.target as Node)) return;
    if (resourceSearchResults.hidden) return;
    resourceSearchResults.hidden = true;
    setSearchListExpanded(resourceSearchInput, false);
  });

  resourceSelect.addEventListener("change", () => {
    resourceSearchInput.value = "";
    refreshResourceSearchResults(resourceSearchResults, "");
    setSearchListExpanded(resourceSearchInput, false);
    setResourceId(resourceSelect.value);
    updateResults(resultEls);
  });

  targetRateInput.addEventListener("input", () => {
    const val = parseFloat(targetRateInput.value);
    const valid = val > 0 && isFinite(val);

    targetRateInput.classList.toggle(
      "input-invalid",
      !valid && targetRateInput.value !== "",
    );

    if (valid) {
      setTargetRate(val);
      debouncedUpdate();
    }
  });

  productionFields.addEventListener("input", (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.dataset.resourceId) return;

    const val = parseFloat(input.value);
    const invalid =
      input.value !== "" && (isNaN(val) || val < 0);

    input.classList.toggle("input-invalid", invalid);

    if (!invalid) {
      const id = input.dataset.resourceId;
      const num = isNaN(val) ? 0 : val;
      setProduction(id, num);
      if (
        num <= 0
        && getProductionExtraIds().includes(id)
        && !isIdRequiredByCurrentTarget(id)
      ) {
        removeProductionExtraId(id);
        updateResults(resultEls);
        return;
      }
      debouncedUpdate();
    }
  });

  productionFields.addEventListener("click", (e: Event) => {
    const t = (e.target as HTMLElement).closest(
      "button[data-remove-resource]",
    ) as HTMLButtonElement | null;
    if (!t?.dataset.removeResource) return;
    const id = t.dataset.removeResource;
    setProduction(id, 0);
    if (getProductionExtraIds().includes(id)) {
      removeProductionExtraId(id);
    }
    if (isIdRequiredByCurrentTarget(id)) {
      dismissProductionRow(id);
    }
    updateResults(resultEls);
  });

  productionAddSelect.addEventListener("change", () => {
    const v = productionAddSelect.value;
    if (!v) return;
    addProductionExtraId(v);
    productionAddSelect.value = "";
    updateResults(resultEls);
  });

  productionPresetLoad.addEventListener("click", () => {
    const id = productionPresetSelect.value;
    if (!id) return;
    applyProductionPreset(id);
    updateResults(resultEls);
  });

  productionPresetDelete.addEventListener("click", () => {
    const id = productionPresetSelect.value;
    if (!id) return;
    deleteProductionPreset(id);
    productionPresetSelect.value = "";
    updateResults(resultEls);
  });

  productionPresetSave.addEventListener("click", () => {
    saveProductionPreset(productionPresetName.value);
    productionPresetName.value = "";
    updateResults(resultEls);
  });
}
