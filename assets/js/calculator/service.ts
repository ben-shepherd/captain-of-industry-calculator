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
  recipeIdx = 0,
): CalculationResult {
  validate(resourceId, targetRate, recipeIdx);

  const { totals, tree } = resolve(resourceId, targetRate, recipeIdx);

  return { resourceId, targetRate, totals, tree };
}

function validate(
  resourceId: string,
  targetRate: number,
  recipeIdx: number,
): void {
  if (!resources[resourceId]) {
    throw new Error(`Unknown resource: "${resourceId}"`);
  }

  if (typeof targetRate !== "number" || targetRate <= 0 || !isFinite(targetRate)) {
    throw new Error(`targetRate must be a positive finite number, got: ${targetRate}`);
  }

  if (
    typeof recipeIdx !== "number"
    || !Number.isInteger(recipeIdx)
    || recipeIdx < 0
  ) {
    throw new Error(`recipeIdx must be a non-negative integer, got: ${recipeIdx}`);
  }

  const recipe = resources[resourceId].recipes[recipeIdx];
  if (!recipe || (recipe.outputs[resourceId] ?? 0) <= 0) {
    throw new Error(
      `Invalid recipe index ${recipeIdx} for resource "${resourceId}"`,
    );
  }
}
