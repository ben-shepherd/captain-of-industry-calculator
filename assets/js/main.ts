import { initGoogleAnalytics } from './analytics';
import { initState, getTargetRate, getNetFlowChartStyle } from './app/state';
import { renderResourceOptions, renderRecentTargets, updateResults } from './ui/controller';
import { bindEvents, syncResetSavedDataButtonDisabled } from './ui/events';

initGoogleAnalytics();

document.addEventListener("DOMContentLoaded", () => {
  initState();

  const els = {
    resourceSelect: document.getElementById("resource-select") as HTMLSelectElement,
    resourceSearchInput: document.getElementById(
      "resource-search",
    ) as HTMLInputElement,
    resourceSearchResults: document.getElementById(
      "resource-search-results",
    ) as HTMLUListElement,
    resourcePickerTrigger: document.getElementById(
      "resource-picker-trigger",
    ) as HTMLButtonElement,
    resourcePickerPanel: document.getElementById(
      "resource-picker-panel",
    ) as HTMLElement,
    resourceWikiLinkWrap: document.getElementById("resource-wiki-link-wrap"),
    targetRateInput: document.getElementById("target-rate") as HTMLInputElement,
    productionFields: document.getElementById("production-fields")!,
    productionAddTrigger: document.getElementById(
      "production-add-trigger",
    ) as HTMLButtonElement,
    productionAddPanel: document.getElementById(
      "production-add-panel",
    ) as HTMLElement,
    productionPresetSelect: document.getElementById(
      "production-preset-select",
    ) as HTMLSelectElement,
    productionPresetLoadMerge: document.getElementById(
      "production-preset-load-merge",
    ) as HTMLButtonElement,
    productionPresetLoadReplace: document.getElementById(
      "production-preset-load-replace",
    ) as HTMLButtonElement,
    productionPresetDelete: document.getElementById(
      "production-preset-delete",
    ) as HTMLButtonElement,
    productionPresetName: document.getElementById(
      "production-preset-name",
    ) as HTMLInputElement,
    productionPresetSave: document.getElementById(
      "production-preset-save",
    ) as HTMLButtonElement,
    exportSavedDataButton: document.getElementById(
      "export-saved-data",
    ) as HTMLButtonElement,
    importSavedDataButton: document.getElementById(
      "import-saved-data",
    ) as HTMLButtonElement,
    importSavedDataInput: document.getElementById(
      "import-saved-data-input",
    ) as HTMLInputElement,
    resetSavedDataButton: document.getElementById(
      "reset-saved-data",
    ) as HTMLButtonElement,
    baseRequirementsDirect: document.getElementById(
      "base-requirements-direct",
    ) as HTMLButtonElement,
    baseRequirementsFull: document.getElementById(
      "base-requirements-full",
    ) as HTMLButtonElement,
    totalsBody: document.getElementById("totals-body")!,
    treeList: document.getElementById("tree-list")!,
    treeExpandAll: document.getElementById("tree-expand-all") as HTMLButtonElement,
    treeCollapseAll: document.getElementById(
      "tree-collapse-all",
    ) as HTMLButtonElement,
    netBody: document.getElementById("net-body")!,
    netFlowChart: document.getElementById("net-flow-chart"),
    netFlowChartStyleSelect: document.getElementById(
      "net-flow-chart-style",
    ) as HTMLSelectElement,
    targetRecipeSection: document.getElementById(
      "target-recipe-section",
    ) as HTMLDetailsElement | null,
    recentTargetResourcesWrap: document.getElementById("recent-resources"),
  };

  renderResourceOptions(
    els.resourceSelect,
    els.resourceSearchInput,
    els.resourceSearchResults,
    els.resourceWikiLinkWrap,
    els.resourcePickerTrigger,
    els.resourcePickerPanel,
  );
  els.targetRateInput.value = String(getTargetRate());

  bindEvents(els);

  els.netFlowChartStyleSelect.value = getNetFlowChartStyle();

  syncResetSavedDataButtonDisabled(els.resetSavedDataButton);

  updateResults({
    totalsBody: els.totalsBody,
    treeList: els.treeList,
    netBody: els.netBody,
    netFlowChart: els.netFlowChart,
    productionFields: els.productionFields,
    productionAddTrigger: els.productionAddTrigger,
    productionAddPanel: els.productionAddPanel,
    productionPresetSelect: els.productionPresetSelect,
    targetRecipeSection: els.targetRecipeSection,
  });
  renderRecentTargets(els.recentTargetResourcesWrap);
});
