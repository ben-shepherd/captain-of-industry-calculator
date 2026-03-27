import { resources, getResourceEntriesInPickerOrder } from "../data/resources";
import {
  getProduction,
  getProductionExtraIds,
  getProductionDismissedIds,
} from "../app/state";

let lastMembershipKey = "";

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
  if (key !== lastMembershipKey) {
    lastMembershipKey = key;
    container.innerHTML = buildRowsHtml(ids);
    return true;
  }
  syncProductionInputValues(container);
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

function buildRowsHtml(ids: string[]): string {
  const production = getProduction();
  return ids
    .map((id) => {
      const label = resources[id]?.label ?? id;
      const val = production[id] ?? "";
      const strVal = val === "" ? "" : String(val);
      return (
        `<div class="production-row">`
        + `<label for="prod-${id}">${label}</label>`
        + `<input id="prod-${id}" type="number" min="0" step="any" `
        + `data-resource-id="${id}" value="${strVal}" `
        + `placeholder="0" />`
        + `<button type="button" class="production-row-remove" `
        + `data-remove-resource="${id}" aria-label="Remove ${label}">×</button>`
        + `</div>`
      );
    })
    .join("");
}

/**
 * Options for resources not already listed in the production panel.
 */
export function updateProductionAddSelect(
  selectEl: HTMLSelectElement,
  currentIds: Set<string>,
): void {
  selectEl.replaceChildren();
  const first = document.createElement("option");
  first.value = "";
  first.textContent = "— Add production for… —";
  selectEl.appendChild(first);
  for (const { id, label } of getResourceEntriesInPickerOrder()) {
    if (currentIds.has(id)) continue;
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = label;
    selectEl.appendChild(opt);
  }
}
