import {
  getResourcePickerGroups,
  getResourceEntriesInPickerOrder,
  resources,
} from '../data/resources';
import { calculate } from '../calculator/service';
import { calculateNet } from '../calculator/net';
import { formatTotals, formatNetTotals } from '../formatters/flatFormatter';
import type { DependencyNode, ProductionPreset } from '../contracts';
import {
  getBaseRequirementsMode,
  getResourceId,
  getTargetRate,
  getTargetRecipeIdx,
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
import {
  resourceLabelWithIconHtml,
  setResourcePickerTrigger,
  setResourceWikiLink,
} from './resourceIcon';
import { renderTargetRecipeDiagram } from './recipeDiagram';

export interface ResultElements {
  totalsBody: HTMLElement;
  treeList: HTMLElement;
  netBody: HTMLElement;
  productionFields?: HTMLElement;
  productionAddSelect?: HTMLSelectElement;
  productionPresetSelect?: HTMLSelectElement;
  targetRecipeSection?: HTMLDetailsElement | null;
}

/**
 * Resources whose label contains the query (case-insensitive), in picker order.
 */
export function matchResourcesForSearch(query: string): { id: string; label: string }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getResourceEntriesInPickerOrder().filter((e) =>
    e.label.toLowerCase().includes(q),
  );
}

/**
 * Fill the search hits list; hides when query is empty.
 * Shows a message when there are no matches.
 */
export function refreshResourceSearchResults(
  listEl: HTMLUListElement,
  query: string,
): void {
  listEl.replaceChildren();
  const q = query.trim();
  if (!q) {
    listEl.hidden = true;
    return;
  }
  const matches = matchResourcesForSearch(query);
  if (matches.length === 0) {
    const li = document.createElement("li");
    li.className = "resource-search-empty";
    li.setAttribute("role", "presentation");
    li.textContent = "No matching resources";
    listEl.appendChild(li);
    listEl.hidden = false;
    return;
  }
  listEl.hidden = false;
  for (const { id, label } of matches) {
    const li = document.createElement("li");
    li.role = "option";
    li.dataset.resourceId = id;
    li.id = `resource-search-hit-${id}`;
    li.className = "resource-search-hit";
    const url = resources[id]?.imageUrl;
    if (url) {
      const img = document.createElement("img");
      img.className = "resource-icon";
      img.src = url;
      img.alt = "";
      img.width = 20;
      img.height = 20;
      img.loading = "lazy";
      img.decoding = "async";
      li.appendChild(img);
    }
    const span = document.createElement("span");
    span.className = "resource-search-hit-label";
    span.textContent = label;
    li.appendChild(span);
    listEl.appendChild(li);
  }
}

/**
 * Populate the resource <select> dropdown with all known resources
 * (grouped by level, sorted A–Z within each group).
 */
export const TARGET_RESOURCE_PLACEHOLDER = "Choose a resource";

/**
 * Fills the custom grouped picker panel (icons + labels).
 */
export function renderTargetResourcePickerPanel(panelEl: HTMLElement | null): void {
  if (!panelEl) return;
  panelEl.replaceChildren();
  for (const group of getResourcePickerGroups()) {
    const section = document.createElement("div");
    section.className = "resource-picker-group";
    const heading = document.createElement("div");
    heading.className = "resource-picker-group-label";
    heading.textContent = group.label;
    section.appendChild(heading);
    const ul = document.createElement("ul");
    ul.className = "resource-picker-group-list";
    ul.setAttribute("role", "presentation");
    for (const { id, label } of group.entries) {
      const li = document.createElement("li");
      li.className = "resource-picker-option";
      li.role = "option";
      li.dataset.resourceId = id;
      li.id = `resource-picker-option-${id}`;
      li.innerHTML = resourceLabelWithIconHtml(id, label);
      ul.appendChild(li);
    }
    section.appendChild(ul);
    panelEl.appendChild(section);
  }
}

export function renderResourceOptions(
  selectEl: HTMLSelectElement,
  searchInput?: HTMLInputElement,
  searchResultsList?: HTMLUListElement,
  targetWikiWrap?: HTMLElement | null,
  pickerTrigger?: HTMLButtonElement | null,
  pickerPanel?: HTMLElement | null,
): void {
  selectEl.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = TARGET_RESOURCE_PLACEHOLDER;
  selectEl.appendChild(placeholder);
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
  renderTargetResourcePickerPanel(pickerPanel ?? null);
  setResourcePickerTrigger(
    pickerTrigger ?? null,
    getResourceId(),
    TARGET_RESOURCE_PLACEHOLDER,
  );
  setResourceWikiLink(targetWikiWrap ?? null, getResourceId());
  if (searchInput) {
    searchInput.value = "";
    searchInput.setAttribute("aria-expanded", "false");
  }
  if (searchResultsList) {
    refreshResourceSearchResults(searchResultsList, "");
  }
}

/**
 * Run the full calculation pipeline using current state and render
 * results into the provided DOM containers.
 */
export function updateResults(els: ResultElements): void {
  const { totalsBody, treeList, netBody } = els;
  const resourceId = getResourceId();
  const targetRate = getTargetRate();
  const targetRecipeIdx = getTargetRecipeIdx();
  const production = getProduction();

  if (!resourceId) {
    totalsBody.innerHTML = row(
      ["Choose a target resource above to see base requirements"],
      3,
    );
    treeList.innerHTML = "";
    netBody.innerHTML = row(
      ["Choose a target resource above to see net flow"],
      5,
    );
    renderTargetRecipeDiagram(els.targetRecipeSection ?? null, "", 0);
    syncProductionPanel(els, {});
    return;
  }

  let result;
  try {
    result = calculate(
      resourceId,
      targetRate,
      targetRecipeIdx,
      getBaseRequirementsMode(),
    );
  } catch {
    totalsBody.innerHTML = row(["Error running calculation"], 1);
    treeList.innerHTML = "";
    netBody.innerHTML = "";
    renderTargetRecipeDiagram(
      els.targetRecipeSection ?? null,
      resourceId,
      targetRecipeIdx,
    );
    syncProductionPanel(els, {});
    return;
  }

  renderTotals(totalsBody, result.totals);
  renderTree(treeList, result.tree);
  renderNet(netBody, result.totals, production);
  renderTargetRecipeDiagram(
    els.targetRecipeSection ?? null,
    resourceId,
    targetRecipeIdx,
  );
  syncProductionPanel(els, result.totals);
}

const PRESET_CATEGORY_ORDER = [
  "Mining",
  "Smelting",
  "Construction",
  "Petrochemical",
  "Electronics",
  "Mid — Chemicals",
  "Mid — Metals & alloys",
  "Mid — Construction & maintenance",
  "Mid — Electronics",
  "Mid — Petrochemical",
  "Late — Nuclear & power",
  "Late — Microchips & computing",
  "Late — High-tier construction",
  "Late — Vehicles & space",
  "Saved",
];

const PRESET_CATEGORY_RANK = new Map(
  PRESET_CATEGORY_ORDER.map((c, i) => [c, i]),
);

function presetCategoryLabel(p: ProductionPreset): string {
  return p.category ?? "Saved";
}

function sortCategoryLabels(categories: string[]): string[] {
  const fallback = PRESET_CATEGORY_ORDER.length;
  return [...categories].sort((a, b) => {
    const ra = PRESET_CATEGORY_RANK.get(a) ?? fallback;
    const rb = PRESET_CATEGORY_RANK.get(b) ?? fallback;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b, "en");
  });
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

  const presets = getProductionPresets();
  const categories = sortCategoryLabels([
    ...new Set(presets.map(presetCategoryLabel)),
  ]);

  for (const cat of categories) {
    const inGroup = presets
      .filter((p) => presetCategoryLabel(p) === cat)
      .sort((a, b) => a.name.localeCompare(b.name, "en"));
    if (inGroup.length === 0) continue;
    const og = document.createElement("optgroup");
    og.label = cat;
    for (const p of inGroup) {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      og.appendChild(opt);
    }
    selectEl.appendChild(og);
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

/**
 * Same semantics as production panel: click sets target resource.
 * Optional `extraClass` (e.g. `tree-label`) for section-specific typography.
 */
function resourceTargetButton(
  id: string,
  label: string,
  extraClass?: string,
): string {
  const pressed = id === getResourceId() ? "true" : "false";
  const cls = extraClass
    ? `production-row-target ${extraClass}`
    : "production-row-target";
  const inner = resourceLabelWithIconHtml(id, label);
  return (
    `<button type="button" class="${cls}" `
    + `data-production-target="${id}" aria-pressed="${pressed}" `
    + `aria-label="Set ${label} as target resource">${inner}</button>`
  );
}

function renderTotals(tbody: HTMLElement, totals: Record<string, number>): void {
  const rows = formatTotals(totals);
  if (rows.length === 0) {
    tbody.innerHTML = row(["No base resources required"], 3);
    return;
  }
  tbody.innerHTML = rows
    .map((r) =>
      row([
        resourceTargetButton(r.id, r.label),
        r.amount.toFixed(2),
        r.unit,
      ]),
    )
    .join("");
}

function renderTreeBranch(node: DependencyNode, depth: number): string {
  const hasChildren = node.children.length > 0;
  const unit = resources[node.id]?.unit ?? "";
  const toggleOrSpacer = hasChildren
    ? (
      `<button type="button" class="tree-toggle" aria-expanded="true" `
      + `aria-label="Toggle child dependencies">`
      + `<span class="tree-toggle-chevron" aria-hidden="true"></span></button>`
    )
    : `<span class="tree-toggle-spacer" aria-hidden="true"></span>`;
  const arrow =
    depth > 0 ? `<span class="tree-arrow">&#x2514;</span>` : "";
  const row =
    `<div class="tree-node tree-depth-${depth}" style="margin-left:${depth * 1.25}rem">`
    + toggleOrSpacer
    + arrow
    + `${resourceTargetButton(node.id, node.label, "tree-label")} `
    + `<span class="tree-amount">${node.amount.toFixed(2)} ${unit}</span>`
    + `</div>`;
  const childrenHtml = hasChildren
    ? `<div class="tree-children">${node.children
      .map((c) => renderTreeBranch(c, depth + 1))
      .join("")}</div>`
    : "";
  return `<div class="tree-branch">${row}${childrenHtml}</div>`;
}

function renderTree(container: HTMLElement, tree: DependencyNode): void {
  container.innerHTML = renderTreeBranch(tree, 0);
}

/** Set every collapsible branch in the dependency tree to expanded or collapsed. */
export function setDependencyTreeBranchesExpanded(
  treeList: HTMLElement,
  expanded: boolean,
): void {
  for (const toggle of treeList.querySelectorAll<HTMLButtonElement>(
    "button.tree-toggle",
  )) {
    const branch = toggle.closest(".tree-branch");
    const children = branch?.querySelector(
      ":scope > .tree-children",
    ) as HTMLElement | null;
    if (!branch || !children) continue;
    toggle.setAttribute("aria-expanded", String(expanded));
    children.hidden = !expanded;
    branch.classList.toggle("tree-collapsed", !expanded);
  }
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
        + `<td>${resourceTargetButton(r.id, r.label)}</td>`
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
