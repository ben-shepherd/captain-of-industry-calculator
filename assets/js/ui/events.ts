import {
  setResourceId,
  setTargetRate,
  setProduction,
  addProductionExtraId,
  removeProductionExtraId,
  getProductionExtraIds,
  dismissProductionRow,
  applyProductionPresetMerge,
  applyProductionPresetReplace,
  saveProductionPreset,
  deleteProductionPreset,
  getResultsSections,
  setResultsSectionExpanded,
  getInputsSections,
  setInputsSectionExpanded,
  type InputsSectionKey,
  clearAllProductionRates,
  getResourceId,
  getTargetRate,
  getSnapshot,
  applyLoadedState,
  wipeAllPersistedDataAndResetToDefaults,
  type ResultsSectionKey,
} from "../app/state";
import {
  buildExportJson,
  hasPersistedStorage,
  parsePersistedEnvelope,
} from "../app/persistence";
import { calculate } from "../calculator/service";
import {
  matchResourcesForSearch,
  refreshResourceSearchResults,
  renderResourceOptions,
  updateResults,
} from "./controller";
import { setResourceIconSlot, setResourceWikiLink } from "./resourceIcon";
import type { ResultElements } from "./controller";
import { isIdRequiredByCurrentTarget } from "./productionView";

function setSearchListExpanded(input: HTMLInputElement, expanded: boolean): void {
  input.setAttribute("aria-expanded", expanded ? "true" : "false");
}

export interface AppElements extends ResultElements {
  resourceSelect: HTMLSelectElement;
  resourceSearchInput: HTMLInputElement;
  resourceSearchResults: HTMLUListElement;
  resourceSelectIconSlot: HTMLElement | null;
  resourceWikiLinkWrap: HTMLElement | null;
  targetRateInput: HTMLInputElement;
  productionFields: HTMLElement;
  productionAddSelect: HTMLSelectElement;
  productionPresetSelect: HTMLSelectElement;
  productionPresetLoadMerge: HTMLButtonElement;
  productionPresetLoadReplace: HTMLButtonElement;
  productionPresetDelete: HTMLButtonElement;
  productionPresetName: HTMLInputElement;
  productionPresetSave: HTMLButtonElement;
  exportSavedDataButton: HTMLButtonElement;
  importSavedDataButton: HTMLButtonElement;
  importSavedDataInput: HTMLInputElement;
  resetSavedDataButton: HTMLButtonElement;
}

const RESULTS_SECTION_IDS: Record<string, ResultsSectionKey> = {
  "results-section-base": "base",
  "results-section-net": "net",
  "results-section-tree": "tree",
};

const INPUTS_SECTION_IDS: Record<string, InputsSectionKey> = {
  "config-section-target": "target",
  "config-section-production": "production",
  "config-section-presets": "presets",
};

/**
 * Sync `<details open>` for results panels from persisted state.
 */
export function applyResultsSectionOpenStateFromStore(): void {
  const rs = getResultsSections();
  for (const [id, key] of Object.entries(RESULTS_SECTION_IDS)) {
    const el = document.getElementById(id) as HTMLDetailsElement | null;
    if (!el) continue;
    el.open = rs[key];
  }
}

/**
 * Sync `<details open>` for configuration panels from persisted state.
 */
export function applyInputsSectionOpenStateFromStore(): void {
  const ins = getInputsSections();
  for (const [id, key] of Object.entries(INPUTS_SECTION_IDS)) {
    const el = document.getElementById(id) as HTMLDetailsElement | null;
    if (!el) continue;
    el.open = ins[key];
  }
}

/**
 * Keep the Reset control in sync with whether localStorage holds app state.
 * (Must match `window.dispatchEvent` in `persist()` — listen on `window`, not `document`.)
 */
export function syncResetSavedDataButtonDisabled(button: HTMLButtonElement): void {
  button.disabled = !hasPersistedStorage();
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
    resourceSelectIconSlot,
    resourceWikiLinkWrap,
    targetRateInput,
    productionFields,
    productionAddSelect,
    productionPresetSelect,
    productionPresetLoadMerge,
    productionPresetLoadReplace,
    productionPresetDelete,
    productionPresetName,
    productionPresetSave,
    exportSavedDataButton,
    importSavedDataButton,
    importSavedDataInput,
    resetSavedDataButton,
    totalsBody,
    treeList,
    netBody,
  } = els;
  const resultEls: ResultElements = {
    totalsBody: els.totalsBody,
    treeList: els.treeList,
    netBody: els.netBody,
    productionFields: els.productionFields,
    productionAddSelect: els.productionAddSelect,
    productionPresetSelect: els.productionPresetSelect,
    targetRecipeSection: els.targetRecipeSection,
  };

  const resourceSearchWrap = resourceSearchInput.closest(
    ".resource-search-wrap",
  ) as HTMLElement;

  function refreshAfterStateRestore(): void {
    renderResourceOptions(
      resourceSelect,
      resourceSearchInput,
      resourceSearchResults,
      resourceSelectIconSlot,
      resourceWikiLinkWrap,
    );
    targetRateInput.value = String(getTargetRate());
    targetRateInput.classList.remove("input-invalid");
    productionPresetName.value = "";
    productionPresetSelect.value = "";
    applyResultsSectionOpenStateFromStore();
    applyInputsSectionOpenStateFromStore();
    updateResults(resultEls);
    syncResetSavedDataButtonDisabled(resetSavedDataButton);
  }

  function applyTargetResource(id: string): void {
    resourceSelect.value = id;
    resourceSearchInput.value = "";
    refreshResourceSearchResults(resourceSearchResults, "");
    setSearchListExpanded(resourceSearchInput, false);
    setResourceId(id);
    setResourceIconSlot(resourceSelectIconSlot, id);
    setResourceWikiLink(resourceWikiLinkWrap, id);
    updateResults(resultEls);
  }

  function handleResultPanelTargetClick(e: Event): void {
    const targetBtn = (e.target as HTMLElement).closest(
      "button[data-production-target]",
    ) as HTMLButtonElement | null;
    if (!targetBtn?.dataset.productionTarget) return;
    applyTargetResource(targetBtn.dataset.productionTarget);
  }

  totalsBody.addEventListener("click", handleResultPanelTargetClick);
  treeList.addEventListener("click", handleResultPanelTargetClick);
  netBody.addEventListener("click", handleResultPanelTargetClick);

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
    applyTargetResource(first.id);
  });

  resourceSearchResults.addEventListener("mousedown", (e: MouseEvent) => {
    const li = (e.target as HTMLElement).closest(
      "li[data-resource-id]",
    ) as HTMLLIElement | null;
    if (!li?.dataset.resourceId) return;
    e.preventDefault();
    applyTargetResource(li.dataset.resourceId);
  });

  document.addEventListener("click", (e: MouseEvent) => {
    if (resourceSearchWrap.contains(e.target as Node)) return;
    if (resourceSearchResults.hidden) return;
    resourceSearchResults.hidden = true;
    setSearchListExpanded(resourceSearchInput, false);
  });

  resourceSelect.addEventListener("change", () => {
    applyTargetResource(resourceSelect.value);
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
      updateResults(resultEls);
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
      updateResults(resultEls);
    }
  });

  productionFields.addEventListener("click", (e: Event) => {
    const targetBtn = (e.target as HTMLElement).closest(
      "button[data-production-target]",
    ) as HTMLButtonElement | null;
    if (targetBtn?.dataset.productionTarget) {
      applyTargetResource(targetBtn.dataset.productionTarget);
      return;
    }
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

  productionPresetLoadMerge.addEventListener("click", () => {
    const id = productionPresetSelect.value;
    if (!id) return;
    applyProductionPresetMerge(id);
    updateResults(resultEls);
  });

  productionPresetLoadReplace.addEventListener("click", () => {
    const id = productionPresetSelect.value;
    if (!id) return;
    applyProductionPresetReplace(id);
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

  window.addEventListener("coi-state-persisted", () => {
    syncResetSavedDataButtonDisabled(resetSavedDataButton);
  });

  exportSavedDataButton.addEventListener("click", () => {
    const json = buildExportJson(getSnapshot());
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const filename = `coi-calculator-export-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  importSavedDataButton.addEventListener("click", () => {
    importSavedDataInput.click();
  });

  importSavedDataInput.addEventListener("change", () => {
    const file = importSavedDataInput.files?.[0];
    importSavedDataInput.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const parsed = parsePersistedEnvelope(text);
      if (!parsed) {
        window.alert(
          "Could not read that file. Make sure it is valid JSON exported from this app.",
        );
        return;
      }
      if (
        !window.confirm(
          "Replace all current saved data with the contents of this file? Your current configuration, production rates, presets, and panel settings will be overwritten.",
        )
      ) {
        return;
      }
      applyLoadedState(parsed);
      refreshAfterStateRestore();
    };
    reader.onerror = () => {
      window.alert("Could not read the selected file.");
    };
    reader.readAsText(file);
  });

  resetSavedDataButton.addEventListener("click", () => {
    if (
      !window.confirm(
        "This will remove all saved data from this browser, including your configuration, production rates, presets, and panel settings. This cannot be undone. Continue?",
      )
    ) {
      return;
    }
    wipeAllPersistedDataAndResetToDefaults();
    refreshAfterStateRestore();
  });

  const productionClearAll = document.getElementById("production-clear-all");
  if (productionClearAll) {
    productionClearAll.addEventListener("click", (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (
        !window.confirm(
          "Clear all entered production rates?",
        )
      ) {
        return;
      }
      const rid = getResourceId();
      let totals: Record<string, number>;
      if (!rid) {
        totals = {};
      } else {
        try {
          totals = calculate(rid, getTargetRate()).totals;
        } catch {
          return;
        }
      }
      clearAllProductionRates(totals);
      updateResults(resultEls);
    });
  }

  const panelResults = document.querySelector(
    ".panel-results",
  ) as HTMLElement | null;
  if (panelResults) {
    bindResultsSectionPersistence(panelResults);
  }

  const panelInputs = document.querySelector(
    ".panel-inputs",
  ) as HTMLElement | null;
  if (panelInputs) {
    bindInputsSectionPersistence(panelInputs);
  }
}

/**
 * Apply saved expansion to `<details>` and persist toggles.
 */
function bindResultsSectionPersistence(panelResults: HTMLElement): void {
  applyResultsSectionOpenStateFromStore();

  panelResults.addEventListener("toggle", (e: Event) => {
    const t = e.target;
    if (!(t instanceof HTMLDetailsElement)) return;
    const key = RESULTS_SECTION_IDS[t.id];
    if (!key) return;
    setResultsSectionExpanded(key, t.open);
  });
}

/**
 * Apply saved expansion to configuration `<details>` and persist toggles.
 */
function bindInputsSectionPersistence(panelInputs: HTMLElement): void {
  applyInputsSectionOpenStateFromStore();

  panelInputs.addEventListener("toggle", (e: Event) => {
    const t = e.target;
    if (!(t instanceof HTMLDetailsElement)) return;
    const key = INPUTS_SECTION_IDS[t.id];
    if (!key) return;
    setInputsSectionExpanded(key, t.open);
  });
}
