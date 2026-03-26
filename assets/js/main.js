import { initState, getTargetRate } from "./app/state.js";
import { renderResourceOptions, updateResults } from "./ui/controller.js";
import { bindEvents } from "./ui/events.js";

document.addEventListener("DOMContentLoaded", () => {
  initState();

  const els = {
    resourceSelect: document.getElementById("resource-select"),
    targetRateInput: document.getElementById("target-rate"),
    productionFields: document.getElementById("production-fields"),
    totalsBody: document.getElementById("totals-body"),
    treeList: document.getElementById("tree-list"),
    netBody: document.getElementById("net-body"),
  };

  renderResourceOptions(els.resourceSelect);
  els.targetRateInput.value = getTargetRate();

  bindEvents(els);
  updateResults({
    totalsBody: els.totalsBody,
    treeList: els.treeList,
    netBody: els.netBody,
  });
});
