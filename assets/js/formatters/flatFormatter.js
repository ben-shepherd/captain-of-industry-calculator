import { resources } from "../data/resources.js";

/**
 * Transform the raw totals map from the resolver into a sorted,
 * UI-ready array of resource entries.
 *
 * @param {Record<string, number>} totals – resource id → amount
 * @returns {Array<{ id: string, label: string, amount: number, unit: string }>}
 */
export function formatTotals(totals) {
  return Object.entries(totals)
    .map(([id, amount]) => {
      const res = resources[id];
      return {
        id,
        label: res?.label ?? id,
        amount,
        unit: res?.unit ?? "",
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Transform the net-calculation result into a sorted, UI-ready array.
 *
 * @param {Record<string, import("../calculator/net.js").NetEntry>} netTotals
 * @returns {Array<{ id: string, label: string, unit: string, required: number, production: number, net: number, status: string }>}
 */
export function formatNetTotals(netTotals) {
  return Object.entries(netTotals)
    .map(([id, entry]) => {
      const res = resources[id];
      return {
        id,
        label: res?.label ?? id,
        unit: res?.unit ?? "",
        required: entry.required,
        production: entry.production,
        net: entry.net,
        status: entry.status,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}
