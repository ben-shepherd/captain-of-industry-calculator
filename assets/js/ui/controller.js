import { resources } from "../data/resources.js";
import { calculate } from "../calculator/service.js";
import { calculateNet } from "../calculator/net.js";
import { formatTotals, formatNetTotals } from "../formatters/flatFormatter.js";
import { flattenTree } from "../formatters/treeFormatter.js";
import {
  getResourceId,
  getTargetRate,
  getProduction,
} from "../app/state.js";

/**
 * Populate the resource <select> dropdown with all known resources.
 * @param {HTMLSelectElement} selectEl
 */
export function renderResourceOptions(selectEl) {
  selectEl.innerHTML = "";
  for (const [id, res] of Object.entries(resources)) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = res.label;
    selectEl.appendChild(opt);
  }
  selectEl.value = getResourceId();
}

/**
 * Run the full calculation pipeline using current state and render
 * results into the provided DOM containers.
 *
 * @param {Object} els – DOM element references
 * @param {HTMLElement} els.totalsBody   – <tbody> for flat totals table
 * @param {HTMLElement} els.treeList     – <ul> or container for the dependency tree
 * @param {HTMLElement} els.netBody      – <tbody> for net flow table
 */
export function updateResults({ totalsBody, treeList, netBody }) {
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
    return;
  }

  renderTotals(totalsBody, result.totals);
  renderTree(treeList, result.tree);
  renderNet(netBody, result.totals, production);
}

/**
 * Render the flat base-resource totals into a <tbody>.
 * @param {HTMLElement} tbody
 * @param {Record<string, number>} totals
 */
function renderTotals(tbody, totals) {
  const rows = formatTotals(totals);
  if (rows.length === 0) {
    tbody.innerHTML = row(["No base resources required"], 3);
    return;
  }
  tbody.innerHTML = rows
    .map((r) => row([r.label, r.amount.toFixed(2), r.unit]))
    .join("");
}

/**
 * Render the dependency tree as a flat indented list.
 * @param {HTMLElement} container
 * @param {import("../calculator/resolver.js").DependencyNode} tree
 */
function renderTree(container, tree) {
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

/**
 * Render the net surplus / deficit table.
 * @param {HTMLElement} tbody
 * @param {Record<string, number>} totals
 * @param {Record<string, number>} production
 */
function renderNet(tbody, totals, production) {
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
 * @param {string[]} cells
 * @param {number} [colspan] – if provided, renders a single cell spanning columns
 */
function row(cells, colspan) {
  if (colspan) {
    return `<tr><td colspan="${colspan}">${cells[0]}</td></tr>`;
  }
  return `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
}
