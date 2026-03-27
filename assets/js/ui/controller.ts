import { resources } from '../data/resources';
import { calculate } from '../calculator/service';
import { calculateNet } from '../calculator/net';
import { formatTotals, formatNetTotals } from '../formatters/flatFormatter';
import { flattenTree } from '../formatters/treeFormatter';
import {
  getResourceId,
  getTargetRate,
  getProduction,
} from '../app/state';

export interface ResultElements {
  totalsBody: HTMLElement;
  treeList: HTMLElement;
  netBody: HTMLElement;
}

/**
 * Populate the resource <select> dropdown with all known resources.
 */
export function renderResourceOptions(selectEl: HTMLSelectElement): void {
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
 */
export function updateResults({ totalsBody, treeList, netBody }: ResultElements): void {
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
