import { resources } from "../data/resources.js";
import { resolve } from "./resolver.js";

/**
 * Public entry point for the calculator.
 *
 * Validates inputs, delegates to the resolver, and returns
 * a result object ready for formatting or rendering.
 *
 * @param {string} resourceId – Key in the resources map (e.g. "steel")
 * @param {number} targetRate – Desired production rate per minute
 * @returns {{ resourceId: string, targetRate: number, totals: Record<string, number>, tree: import("./resolver.js").DependencyNode }}
 */
export function calculate(resourceId, targetRate) {
  validate(resourceId, targetRate);

  const { totals, tree } = resolve(resourceId, targetRate);

  return { resourceId, targetRate, totals, tree };
}

/**
 * Guard against bad inputs so downstream code can stay assumption-free.
 *
 * @param {string} resourceId
 * @param {number} targetRate
 */
function validate(resourceId, targetRate) {
  if (!resources[resourceId]) {
    throw new Error(`Unknown resource: "${resourceId}"`);
  }

  if (typeof targetRate !== "number" || targetRate <= 0 || !isFinite(targetRate)) {
    throw new Error(`targetRate must be a positive finite number, got: ${targetRate}`);
  }
}
