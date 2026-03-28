import { resources, getResourcePickerGroups } from "../data/resources";
import { resourceLabelWithIconHtml } from "./resourceIcon";
import {
  getProduction,
  getProductionExtraIds,
  getProductionDismissedIds,
  getResourceId,
} from "../app/state";

/** `null` forces the first sync to build rows so the add picker is populated even when the list is empty. */
let lastMembershipKey: string | null = null;

/** Keys from the last `refreshProductionFields` totals map (current chain required). */
let lastRequiredTotalsKeys = new Set<string>();

/**
 * Resource IDs to show: current dependency totals, saved production, and user-added extras.
 * Sorted by label (same as Net Flow / formatNetTotals).
 */
export function getRelevantProductionResourceIds(
  totals: Record<string, number>,
  production: Record<string, number>,
  extraIds: readonly string[],
  dismissedIds: readonly string[],
): string[] {
  const set = new Set<string>();
  for (const k of Object.keys(totals)) set.add(k);
  for (const k of Object.keys(production)) set.add(k);
  for (const id of extraIds) {
    if (resources[id]) set.add(id);
  }
  const dismissed = new Set(dismissedIds);
  return [...set]
    .filter((id) => {
      if (extraIds.includes(id)) return true;
      return !dismissed.has(id);
    })
    .sort((a, b) =>
      resources[a]!.label.localeCompare(resources[b]!.label, "en"),
    );
}

function membershipKey(ids: string[]): string {
  return ids.join("\0");
}

export function isIdRequiredByCurrentTarget(id: string): boolean {
  return lastRequiredTotalsKeys.has(id);
}

/**
 * Rebuild production rows when the set of resources changes; otherwise sync values only
 * so focused inputs are not destroyed while typing.
 * @returns true if the row list was rebuilt (add-resource dropdown should refresh).
 */
export function refreshProductionFields(
  container: HTMLElement,
  totals: Record<string, number>,
): boolean {
  const ids = getRelevantProductionResourceIds(
    totals,
    getProduction(),
    getProductionExtraIds(),
    getProductionDismissedIds(),
  );
  lastRequiredTotalsKeys = new Set(Object.keys(totals));
  const key = membershipKey(ids);
  if (lastMembershipKey === null || key !== lastMembershipKey) {
    lastMembershipKey = key;
    container.innerHTML = buildRowsHtml(ids);
    return true;
  }
  syncProductionRowUi(container);
  return false;
}

function syncProductionInputValues(container: HTMLElement): void {
  const production = getProduction();
  for (const input of container.querySelectorAll<HTMLInputElement>(
    "input[data-resource-id]",
  )) {
    const id = input.dataset.resourceId!;
    const val = production[id];
    const next = val !== undefined && val > 0 ? String(val) : "";
    if (input.value !== next) input.value = next;
  }
}

function syncProductionTargetButtons(container: HTMLElement): void {
  const current = getResourceId();
  for (const btn of container.querySelectorAll<HTMLButtonElement>(
    "button[data-production-target]",
  )) {
    const id = btn.dataset.productionTarget;
    if (id) btn.setAttribute("aria-pressed", id === current ? "true" : "false");
  }
}

function syncProductionRowUi(container: HTMLElement): void {
  syncProductionInputValues(container);
  syncProductionTargetButtons(container);
}

function buildRowsHtml(ids: string[]): string {
  const production = getProduction();
  const currentTarget = getResourceId();
  return ids
    .map((id) => {
      const label = resources[id]?.label ?? id;
      const val = production[id] ?? "";
      const strVal = val === "" ? "" : String(val);
      const pressed = id === currentTarget ? "true" : "false";
      const btnInner = resourceLabelWithIconHtml(id, label);
      return (
        `<div class="production-row">`
        + `<button type="button" class="production-row-target" `
        + `data-production-target="${id}" aria-pressed="${pressed}" `
        + `aria-label="Set ${label} as target resource">${btnInner}</button>`
        + `<input id="prod-${id}" type="number" min="0" step="any" `
        + `data-resource-id="${id}" value="${strVal}" `
        + `placeholder="0" `
        + `aria-label="Production rate (per min) for ${label}" />`
        + `<button type="button" class="production-row-remove" `
        + `data-remove-resource="${id}" aria-label="Remove ${label}">×</button>`
        + `</div>`
      );
    })
    .join("");
}

/** Shown on the add-production trigger when resources can still be added. */
export const PRODUCTION_ADD_PLACEHOLDER = "Add a resource…";

/**
 * Categorized picker (icons + labels) for resources not already in the production panel.
 * Disables the trigger when every resource is already listed.
 */
export function renderProductionAddPicker(
  panelEl: HTMLElement,
  triggerEl: HTMLButtonElement,
  currentIds: Set<string>,
): void {
  panelEl.replaceChildren();
  let anyOption = false;
  for (const group of getResourcePickerGroups()) {
    const entries = group.entries.filter((e) => !currentIds.has(e.id));
    if (entries.length === 0) continue;
    anyOption = true;
    const section = document.createElement("div");
    section.className = "resource-picker-group";
    const heading = document.createElement("div");
    heading.className = "resource-picker-group-label";
    heading.textContent = group.label;
    section.appendChild(heading);
    const ul = document.createElement("ul");
    ul.className = "resource-picker-group-list";
    ul.setAttribute("role", "presentation");
    for (const { id, label } of entries) {
      const li = document.createElement("li");
      li.className = "resource-picker-option";
      li.role = "option";
      li.dataset.resourceId = id;
      li.id = `production-add-option-${id}`;
      li.innerHTML = resourceLabelWithIconHtml(id, label);
      ul.appendChild(li);
    }
    section.appendChild(ul);
    panelEl.appendChild(section);
  }
  if (!anyOption) {
    const empty = document.createElement("div");
    empty.className = "resource-picker-empty";
    empty.setAttribute("role", "presentation");
    empty.textContent = "All resources are already listed.";
    panelEl.appendChild(empty);
  }
  triggerEl.disabled = !anyOption;
  triggerEl.textContent = anyOption
    ? PRODUCTION_ADD_PLACEHOLDER
    : "Nothing left to add";
}
