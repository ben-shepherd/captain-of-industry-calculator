import { getResourcePickerGroups } from '../data/resources';
import { calculate } from '../calculator/service';
import { calculateNet } from '../calculator/net';
import { formatTotals, formatNetTotals } from '../formatters/flatFormatter';
import { flattenTree } from '../formatters/treeFormatter';
import {
  getResourceId,
  getTargetRate,
  getProduction,
  getProductionExtraIds,
  getProductionDismissedIds,
  getProductionPresets,
} from '../app/state';
import {
  getRelevantProductionResourceIds,
  refreshProductionFields,
  updateProductionAddSelect,
} from './productionView';

export interface ResultElements {
  totalsBody: HTMLElement;
  treeList: HTMLElement;
  netBody: HTMLElement;
  productionFields?: HTMLElement;
  productionAddSelect?: HTMLSelectElement;
  productionPresetSelect?: HTMLSelectElement;
}

/**
 * Populate the resource <select> dropdown with all known resources
 * (grouped by level, sorted A–Z within each group).
 */
export function renderResourceOptions(selectEl: HTMLSelectElement): void {
  selectEl.innerHTML = "";
  for (const group of getResourcePickerGroups()) {
    const og = document.createElement("optgroup");
    og.label = group.label;
    for (const { id, label } of group.entries) {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = label;
      og.appendChild(opt);
    }
    selectEl.appendChild(og);
  }
  selectEl.value = getResourceId();
}

/**
 * Run the full calculation pipeline using current state and render
 * results into the provided DOM containers.
 */
export function updateResults(els: ResultElements): void {
  const { totalsBody, treeList, netBody } = els;
  const resourceId = getResourceId();
  const targetRate = getTargetRate();
  const production = getProduction();

  let result;
  try {
    result = calculate(resourceId, targetRate);
  } catch {
    totalsBody.innerHTML = row(["Error running calculation"], 1);
    treeList.innerHTML = "";
    netBody.innerHTML = "";
    syncProductionPanel(els, {});
    return;
  }

  renderTotals(totalsBody, result.totals);
  renderTree(treeList, result.tree);
  renderNet(netBody, result.totals, production);
  syncProductionPanel(els, result.totals);
}

/**
 * Refresh preset dropdown; keeps the selected preset id when options are unchanged.
 */
export function renderProductionPresetSelect(selectEl: HTMLSelectElement): void {
  const current = selectEl.value;
  selectEl.replaceChildren();
  const first = document.createElement("option");
  first.value = "";
  first.textContent = "— Select preset —";
  selectEl.appendChild(first);
  for (const p of getProductionPresets()) {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    selectEl.appendChild(opt);
  }
  if (current && [...selectEl.options].some((o) => o.value === current)) {
    selectEl.value = current;
  }
}

function syncProductionPanel(
  els: ResultElements,
  totals: Record<string, number>,
): void {
  if (els.productionFields) {
    const rebuilt = refreshProductionFields(els.productionFields, totals);
    if (rebuilt && els.productionAddSelect) {
      const ids = new Set(
        getRelevantProductionResourceIds(
          totals,
          getProduction(),
          getProductionExtraIds(),
          getProductionDismissedIds(),
        ),
      );
      updateProductionAddSelect(els.productionAddSelect, ids);
    }
  }
  if (els.productionPresetSelect) {
    renderProductionPresetSelect(els.productionPresetSelect);
  }
}

function renderTotals(tbody: HTMLElement, totals: Record<string, number>): void {
  const rows = formatTotals(totals);
  if (rows.length === 0) {
    tbody.innerHTML = row(["No base resources required"], 3);
    return;
  }
  tbody.innerHTML = rows
    .map((r) => row([r.label, r.amount.toFixed(2), r.unit]))
    .join("");
}

function renderTree(
  container: HTMLElement,
  tree: import('../contracts').DependencyNode,
): void {
  const nodes = flattenTree(tree);
  container.innerHTML = nodes
    .map(
      (n) =>
        `<div class="tree-node tree-depth-${n.depth}" style="margin-left:${n.depth * 1.25}rem">`
        + (n.depth > 0 ? `<span class="tree-arrow">&#x2514;</span>` : "")
        + `<span class="tree-label">${n.label}</span> `
        + `<span class="tree-amount">${n.amount.toFixed(2)} ${n.unit}</span>`
        + `</div>`,
    )
    .join("");
}

function renderNet(
  tbody: HTMLElement,
  totals: Record<string, number>,
  production: Record<string, number>,
): void {
  const net = calculateNet(totals, production);
  const rows = formatNetTotals(net);

  if (rows.length === 0) {
    tbody.innerHTML = row(["No net data"], 5);
    return;
  }

  tbody.innerHTML = rows
    .map(
      (r) =>
        `<tr class="net-${r.status}">`
        + `<td>${r.label}</td>`
        + `<td>${r.required.toFixed(2)}</td>`
        + `<td>${r.production.toFixed(2)}</td>`
        + `<td>${r.net > 0 ? "+" : ""}${r.net.toFixed(2)}</td>`
        + `<td><span class="net-status-badge">${r.status}</span></td>`
        + `</tr>`,
    )
    .join("");
}

/**
 * Helper: build a single <tr> with the given cell values.
 */
function row(cells: string[], colspan?: number): string {
  if (colspan) {
    return `<tr><td colspan="${colspan}">${cells[0]}</td></tr>`;
  }
  return `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
}
