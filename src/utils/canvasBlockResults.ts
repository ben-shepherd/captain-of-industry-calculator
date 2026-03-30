import { calculateNet } from '../../assets/js/calculator/net';
import type {
  CalculationResult,
  FormattedNetTotal,
  FormattedTotal,
  NetStatus,
} from '../../assets/js/contracts';
import { resources } from '../../assets/js/data/resources';
import { formatNetTotals, formatTotals } from '../../assets/js/formatters/flatFormatter';

/** Parse canvas card rate text (production/consumption per minute). */
export function parseCanvasRateString(s: string | undefined): number {
  const t = String(s ?? '')
    .trim()
    .replace(',', '.');
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Normalize a stored rate string: never negative; empty stays empty.
 * Used when loading persisted workspace and after edits.
 */
export function clampCanvasRateString(s: string): string {
  const trimmed = String(s).trim().replace(',', '.');
  if (trimmed === '') return '';
  const n = parseFloat(trimmed);
  if (!Number.isFinite(n)) return '';
  const clamped = Math.max(0, n);
  if (Number.isInteger(clamped)) return String(clamped);
  return String(Math.round(clamped * 1000) / 1000);
}

/**
 * Net-flow rows for a canvas block: one row per unique resource the user placed,
 * in placement order. Fills in chain data when present; otherwise uses totals/production only.
 */
export function netRowsForBlockResourceOrder(
  result: CalculationResult,
  production: Record<string, number>,
  blockResourceOrder: string[],
): FormattedNetTotal[] {
  const net = calculateNet(result.totals, production);
  const formatted = formatNetTotals(net);
  const byId = new Map(formatted.map((r) => [r.id, r]));
  const out: FormattedNetTotal[] = [];
  for (const id of blockResourceOrder) {
    const existing = byId.get(id);
    if (existing) {
      out.push(existing);
      continue;
    }
    const def = resources[id];
    const req = result.totals[id] ?? 0;
    const prod = production[id] ?? 0;
    const netV = prod - req;
    const status: NetStatus =
      netV > 0 ? 'surplus' : netV < 0 ? 'deficit' : 'balanced';
    out.push({
      id,
      label: def?.label ?? id,
      unit: def?.unit ?? '',
      required: req,
      production: prod,
      net: netV,
      status,
      amount: req,
    });
  }
  return out;
}

/**
 * Base-requirement rows for a canvas block: one row per placed resource type, in placement order.
 */
export function baseTotalsRowsForBlockResourceOrder(
  result: CalculationResult,
  blockResourceOrder: string[],
): FormattedTotal[] {
  const rows = formatTotals(result.totals);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const out: FormattedTotal[] = [];
  for (const id of blockResourceOrder) {
    const existing = byId.get(id);
    if (existing) {
      out.push(existing);
      continue;
    }
    const def = resources[id];
    out.push({
      id,
      label: def?.label ?? id,
      amount: result.totals[id] ?? 0,
      unit: def?.unit ?? '',
    });
  }
  return out;
}
