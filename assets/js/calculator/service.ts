import { resources } from '../data/resources';
import { resolve } from './resolver';
import type { CalculationResult } from '../contracts';

/**
 * Public entry point for the calculator.
 *
 * Validates inputs, delegates to the resolver, and returns
 * a result object ready for formatting or rendering.
 */
export function calculate(
  resourceId: string,
  targetRate: number,
): CalculationResult {
  validate(resourceId, targetRate);

  const { totals, tree } = resolve(resourceId, targetRate);

  return { resourceId, targetRate, totals, tree };
}

function validate(resourceId: string, targetRate: number): void {
  if (!resources[resourceId]) {
    throw new Error(`Unknown resource: "${resourceId}"`);
  }

  if (typeof targetRate !== "number" || targetRate <= 0 || !isFinite(targetRate)) {
    throw new Error(`targetRate must be a positive finite number, got: ${targetRate}`);
  }
}
