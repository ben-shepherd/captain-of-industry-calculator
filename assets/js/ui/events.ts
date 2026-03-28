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
  getTargetRecipeIdx,
  setTargetRecipeIdx,
  getBaseRequirementsMode,
  setBaseRequirementsMode,
  getNetFlowChartStyle,
  setNetFlowChartStyle,
  getUserGuideExpanded,
  setUserGuideExpanded,
  getSnapshot,
  applyLoadedState,
  wipeAllPersistedDataAndResetToDefaults,
  type ResultsSectionKey,
} from "../app/state";
import type { NetFlowChartStyle } from "../contracts";
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
  setDependencyTreeBranchesExpanded,
  TARGET_RESOURCE_PLACEHOLDER,
  updateResults,
} from "./controller";
import { setResourcePickerTrigger, setResourceWikiLink } from "./resourceIcon";
import type { ResultElements } from "./controller";
import { isIdRequiredByCurrentTarget } from "./productionView";

function setSearchListExpanded(input: HTMLInputElement, expanded: boolean): void {
  input.setAttribute("aria-expanded", expanded ? "true" : "false");
}

export interface AppElements extends ResultElements {
  resourceSelect: HTMLSelectElement;
  resourceSearchInput: HTMLInputElement;
  resourceSearchResults: HTMLUListElement;
  resourcePickerTrigger: HTMLButtonElement;
  resourcePickerPanel: HTMLElement;
  resourceWikiLinkWrap: HTMLElement | null;
  targetRateInput: HTMLInputElement;
  productionFields: HTMLElement;
  productionAddTrigger: HTMLButtonElement;
  productionAddPanel: HTMLElement;
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
  baseRequirementsDirect: HTMLButtonElement;
  baseRequirementsFull: HTMLButtonElement;
  treeExpandAll: HTMLButtonElement;
  treeCollapseAll: HTMLButtonElement;
  netFlowChartStyleSelect: HTMLSelectElement;
}

const RESULTS_SECTION_IDS: Record<string, ResultsSectionKey> = {
  "results-section-base": "base",
  "results-section-net": "net",
  "results-section-tree": "tree",
};

const INPUTS_SECTION_IDS: Record<string, InputsSectionKey> = {
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
 * Sync top user guide `<details open>` from persisted state.
 */
export function applyUserGuideOpenStateFromStore(): void {
  const el = document.getElementById("user-guide") as HTMLDetailsElement | null;
  if (!el) return;
  el.open = getUserGuideExpanded();
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
    resourcePickerTrigger,
    resourcePickerPanel,
    resourceWikiLinkWrap,
    targetRateInput,
    productionFields,
    productionAddTrigger,
    productionAddPanel,
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
    baseRequirementsDirect,
    baseRequirementsFull,
    totalsBody,
    treeList,
    treeExpandAll,
    treeCollapseAll,
    netBody,
    targetRecipeSection,
    netFlowChartStyleSelect,
  } = els;
  const resultEls: ResultElements = {
    totalsBody: els.totalsBody,
    treeList: els.treeList,
    netBody: els.netBody,
    netFlowChart: els.netFlowChart,
    productionFields: els.productionFields,
    productionAddTrigger: els.productionAddTrigger,
    productionAddPanel: els.productionAddPanel,
    productionPresetSelect: els.productionPresetSelect,
    targetRecipeSection: els.targetRecipeSection,
  };

  function syncBaseRequirementsModeButtons(): void {
    const mode = getBaseRequirementsMode();
    baseRequirementsDirect.setAttribute(
      "aria-pressed",
      mode === "direct" ? "true" : "false",
    );
    baseRequirementsFull.setAttribute(
      "aria-pressed",
      mode === "full" ? "true" : "false",
    );
  }

  baseRequirementsDirect.addEventListener("click", () => {
    setBaseRequirementsMode("direct");
    syncBaseRequirementsModeButtons();
    updateResults(resultEls);
  });
  baseRequirementsFull.addEventListener("click", () => {
    setBaseRequirementsMode("full");
    syncBaseRequirementsModeButtons();
    updateResults(resultEls);
  });

  syncBaseRequirementsModeButtons();

  const resourceSearchWrap = resourceSearchInput.closest(
    ".resource-search-wrap",
  ) as HTMLElement;

  const resourcePickerWrap = resourcePickerTrigger.closest(
    ".resource-picker-wrap",
  ) as HTMLElement;

  const productionAddWrap = productionAddTrigger.closest(
    ".production-add-picker-wrap",
  ) as HTMLElement;

  function closeResourcePicker(): void {
    resourcePickerPanel.hidden = true;
    resourcePickerTrigger.setAttribute("aria-expanded", "false");
  }

  function openResourcePicker(): void {
    resourcePickerPanel.hidden = false;
    resourcePickerTrigger.setAttribute("aria-expanded", "true");
  }

  function closeProductionAddPicker(): void {
    productionAddPanel.hidden = true;
    productionAddTrigger.setAttribute("aria-expanded", "false");
  }

  function openProductionAddPicker(): void {
    productionAddPanel.hidden = false;
    productionAddTrigger.setAttribute("aria-expanded", "true");
  }

  const RESOURCE_SEARCH_HIT_ACTIVE = "resource-search-hit-active";

  let resourceSearchHighlightIndex = -1;

  function getResourceSearchHitElements(): HTMLLIElement[] {
    return Array.from(
      resourceSearchResults.querySelectorAll<HTMLLIElement>(
        "li[data-resource-id]",
      ),
    );
  }

  function syncResourceSearchHighlight(): void {
    const hits = getResourceSearchHitElements();
    for (const li of hits) {
      li.classList.remove(RESOURCE_SEARCH_HIT_ACTIVE);
      li.removeAttribute("aria-selected");
    }
    resourceSearchInput.removeAttribute("aria-activedescendant");
    if (
      resourceSearchHighlightIndex < 0 ||
      resourceSearchHighlightIndex >= hits.length
    ) {
      return;
    }
    const li = hits[resourceSearchHighlightIndex];
    if (!li) return;
    li.classList.add(RESOURCE_SEARCH_HIT_ACTIVE);
    li.setAttribute("aria-selected", "true");
    resourceSearchInput.setAttribute("aria-activedescendant", li.id);
    li.scrollIntoView({ block: "nearest" });
  }

  function resetResourceSearchHighlight(): void {
    resourceSearchHighlightIndex = -1;
    syncResourceSearchHighlight();
  }

  function refreshAfterStateRestore(): void {
    renderResourceOptions(
      resourceSelect,
      resourceSearchInput,
      resourceSearchResults,
      resourceWikiLinkWrap,
      resourcePickerTrigger,
      resourcePickerPanel,
    );
    targetRateInput.value = String(getTargetRate());
    targetRateInput.classList.remove("input-invalid");
    productionPresetName.value = "";
    productionPresetSelect.value = "";
    netFlowChartStyleSelect.value = getNetFlowChartStyle();
    applyResultsSectionOpenStateFromStore();
    applyInputsSectionOpenStateFromStore();
    applyUserGuideOpenStateFromStore();
    syncBaseRequirementsModeButtons();
    updateResults(resultEls);
    syncResetSavedDataButtonDisabled(resetSavedDataButton);
    resetResourceSearchHighlight();
  }

  function applyTargetResource(id: string): void {
    resourceSearchHighlightIndex = -1;
    resourceSelect.value = id;
    resourceSearchInput.value = "";
    refreshResourceSearchResults(resourceSearchResults, "");
    syncResourceSearchHighlight();
    setSearchListExpanded(resourceSearchInput, false);
    closeResourcePicker();
    setResourceId(id);
    setResourcePickerTrigger(
      resourcePickerTrigger,
      id,
      TARGET_RESOURCE_PLACEHOLDER,
    );
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

  if (targetRecipeSection) {
    targetRecipeSection.addEventListener("mousedown", (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest(
        "button[data-recipe-idx]",
      ) as HTMLButtonElement | null;
      if (!btn?.dataset.recipeIdx) return;
      e.preventDefault();
      const idx = Number.parseInt(btn.dataset.recipeIdx, 10);
      if (!Number.isInteger(idx) || idx < 0) return;
      setTargetRecipeIdx(idx);
      updateResults(resultEls);
    });
  }

  totalsBody.addEventListener("click", handleResultPanelTargetClick);
  treeList.addEventListener("click", (e: MouseEvent) => {
    const toggle = (e.target as HTMLElement).closest("button.tree-toggle");
    if (toggle) {
      e.stopPropagation();
      const branch = toggle.closest(".tree-branch");
      const children = branch?.querySelector(
        ":scope > .tree-children",
      ) as HTMLElement | null;
      if (!branch || !children) return;
      const isExpanded = toggle.getAttribute("aria-expanded") === "true";
      const nextExpanded = !isExpanded;
      toggle.setAttribute("aria-expanded", String(nextExpanded));
      children.hidden = !nextExpanded;
      branch.classList.toggle("tree-collapsed", !nextExpanded);
      return;
    }
    handleResultPanelTargetClick(e);
  });
  treeExpandAll.addEventListener("click", () => {
    setDependencyTreeBranchesExpanded(treeList, true);
  });
  treeCollapseAll.addEventListener("click", () => {
    setDependencyTreeBranchesExpanded(treeList, false);
  });
  netBody.addEventListener("click", handleResultPanelTargetClick);

  netFlowChartStyleSelect.addEventListener("change", () => {
    setNetFlowChartStyle(netFlowChartStyleSelect.value as NetFlowChartStyle);
    updateResults(resultEls);
  });

  resourceSearchInput.addEventListener("input", () => {
    refreshResourceSearchResults(resourceSearchResults, resourceSearchInput.value);
    const q = resourceSearchInput.value.trim();
    setSearchListExpanded(resourceSearchInput, q !== "");
    resetResourceSearchHighlight();
    if (q !== "") {
      closeResourcePicker();
      closeProductionAddPicker();
    }
  });

  resourceSearchInput.addEventListener("focus", () => {
    const q = resourceSearchInput.value.trim();
    if (!q) return;
    refreshResourceSearchResults(resourceSearchResults, resourceSearchInput.value);
    setSearchListExpanded(resourceSearchInput, true);
    resetResourceSearchHighlight();
  });

  resourceSearchInput.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      resourceSearchInput.value = "";
      refreshResourceSearchResults(resourceSearchResults, "");
      setSearchListExpanded(resourceSearchInput, false);
      resetResourceSearchHighlight();
      return;
    }

    const hits = getResourceSearchHitElements();
    const listOpen = !resourceSearchResults.hidden && hits.length > 0;

    if (listOpen && e.key === "ArrowDown") {
      e.preventDefault();
      resourceSearchHighlightIndex = Math.min(
        resourceSearchHighlightIndex + 1,
        hits.length - 1,
      );
      if (resourceSearchHighlightIndex < 0) {
        resourceSearchHighlightIndex = 0;
      }
      syncResourceSearchHighlight();
      return;
    }

    if (listOpen && e.key === "ArrowUp") {
      e.preventDefault();
      resourceSearchHighlightIndex = Math.max(
        resourceSearchHighlightIndex - 1,
        -1,
      );
      syncResourceSearchHighlight();
      return;
    }

    if (e.key === "Enter") {
      const q = resourceSearchInput.value.trim();
      if (!q) return;
      if (
        resourceSearchHighlightIndex >= 0 &&
        resourceSearchHighlightIndex < hits.length
      ) {
        const hitLi = hits[resourceSearchHighlightIndex];
        const id = hitLi?.dataset.resourceId;
        if (id) {
          e.preventDefault();
          applyTargetResource(id);
        }
        return;
      }
      const first = matchResourcesForSearch(q)[0];
      if (!first) return;
      e.preventDefault();
      applyTargetResource(first.id);
      return;
    }
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
    resetResourceSearchHighlight();
  });

  document.addEventListener("click", (e: MouseEvent) => {
    if (resourcePickerWrap.contains(e.target as Node)) return;
    if (resourcePickerPanel.hidden) return;
    closeResourcePicker();
  });

  document.addEventListener("click", (e: MouseEvent) => {
    if (productionAddWrap.contains(e.target as Node)) return;
    if (productionAddPanel.hidden) return;
    closeProductionAddPicker();
  });

  resourcePickerTrigger.addEventListener("click", (e: MouseEvent) => {
    e.stopPropagation();
    if (!resourcePickerPanel.hidden) {
      closeResourcePicker();
      return;
    }
    if (!resourceSearchResults.hidden) {
      resourceSearchResults.hidden = true;
      setSearchListExpanded(resourceSearchInput, false);
      resetResourceSearchHighlight();
    }
    closeProductionAddPicker();
    openResourcePicker();
  });

  resourcePickerPanel.addEventListener("mousedown", (e: MouseEvent) => {
    const li = (e.target as HTMLElement).closest(
      "li.resource-picker-option",
    ) as HTMLLIElement | null;
    if (!li?.dataset.resourceId) return;
    e.preventDefault();
    applyTargetResource(li.dataset.resourceId);
  });

  productionAddTrigger.addEventListener("click", (e: MouseEvent) => {
    e.stopPropagation();
    if (productionAddTrigger.disabled) return;
    if (!productionAddPanel.hidden) {
      closeProductionAddPicker();
      return;
    }
    if (!resourceSearchResults.hidden) {
      resourceSearchResults.hidden = true;
      setSearchListExpanded(resourceSearchInput, false);
      resetResourceSearchHighlight();
    }
    closeResourcePicker();
    openProductionAddPicker();
  });

  productionAddPanel.addEventListener("mousedown", (e: MouseEvent) => {
    const li = (e.target as HTMLElement).closest(
      "li.resource-picker-option",
    ) as HTMLLIElement | null;
    if (!li?.dataset.resourceId) return;
    e.preventDefault();
    addProductionExtraId(li.dataset.resourceId);
    closeProductionAddPicker();
    updateResults(resultEls);
  });

  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    if (!resourcePickerPanel.hidden) {
      e.preventDefault();
      closeResourcePicker();
      resourcePickerTrigger.focus();
      return;
    }
    if (!productionAddPanel.hidden) {
      e.preventDefault();
      closeProductionAddPicker();
      productionAddTrigger.focus();
    }
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
          totals = calculate(
            rid,
            getTargetRate(),
            getTargetRecipeIdx(),
            getBaseRequirementsMode(),
          ).totals;
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

  const userGuide = document.getElementById(
    "user-guide",
  ) as HTMLDetailsElement | null;
  if (userGuide) {
    applyUserGuideOpenStateFromStore();
    userGuide.addEventListener("toggle", () => {
      setUserGuideExpanded(userGuide.open);
    });
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
