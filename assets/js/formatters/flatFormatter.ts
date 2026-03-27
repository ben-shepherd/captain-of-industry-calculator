import { resources } from '../data/resources';
import type { FormattedTotal, FormattedNetTotal, NetEntry } from '../contracts';

/**
 * Transform the raw totals map from the resolver into a sorted,
 * UI-ready array of resource entries.
 */
export function formatTotals(totals: Record<string, number>): FormattedTotal[] {
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
 */
export function formatNetTotals(
  netTotals: Record<string, NetEntry>,
): FormattedNetTotal[] {
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
        amount: entry.required,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}
