import { initState, getTargetRate } from './app/state';
import { renderResourceOptions, updateResults } from './ui/controller';
import { bindEvents, syncResetSavedDataButtonDisabled } from './ui/events';

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
    resourceSelectIconSlot: document.getElementById("resource-select-icon"),
    resourceWikiLinkWrap: document.getElementById("resource-wiki-link-wrap"),
    targetRateInput: document.getElementById("target-rate") as HTMLInputElement,
    productionFields: document.getElementById("production-fields")!,
    productionAddSelect: document.getElementById(
      "production-add-select",
    ) as HTMLSelectElement,
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
    totalsBody: document.getElementById("totals-body")!,
    treeList: document.getElementById("tree-list")!,
    netBody: document.getElementById("net-body")!,
  };

  renderResourceOptions(
    els.resourceSelect,
    els.resourceSearchInput,
    els.resourceSearchResults,
    els.resourceSelectIconSlot,
    els.resourceWikiLinkWrap,
  );
  els.targetRateInput.value = String(getTargetRate());

  bindEvents(els);

  syncResetSavedDataButtonDisabled(els.resetSavedDataButton);

  updateResults({
    totalsBody: els.totalsBody,
    treeList: els.treeList,
    netBody: els.netBody,
    productionFields: els.productionFields,
    productionAddSelect: els.productionAddSelect,
    productionPresetSelect: els.productionPresetSelect,
  });
});
