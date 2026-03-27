import { initState, getTargetRate } from './app/state';
import { renderResourceOptions, updateResults } from './ui/controller';
import { bindEvents } from './ui/events';

document.addEventListener("DOMContentLoaded", () => {
  initState();

  const els = {
    resourceSelect: document.getElementById("resource-select") as HTMLSelectElement,
    targetRateInput: document.getElementById("target-rate") as HTMLInputElement,
    productionFields: document.getElementById("production-fields")!,
    totalsBody: document.getElementById("totals-body")!,
    treeList: document.getElementById("tree-list")!,
    netBody: document.getElementById("net-body")!,
  };

  renderResourceOptions(els.resourceSelect);
  els.targetRateInput.value = String(getTargetRate());

  bindEvents(els);
  updateResults({
    totalsBody: els.totalsBody,
    treeList: els.treeList,
    netBody: els.netBody,
  });
});
