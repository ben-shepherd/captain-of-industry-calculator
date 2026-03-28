import { resources } from '../data/resources';
import type { BaseRequirementsMode, CalculationResult } from '../contracts';
import { resolve } from './resolver';

/**
 * Public entry point for the calculator.
 *
 * Validates inputs, delegates to the resolver, and returns a result object
 * ready for formatting or rendering.
 */
export function calculate(
  resourceId: string,
  targetRate: number,
  targetRecipeIdx = 0,
  baseRequirementsMode: BaseRequirementsMode = 'direct',
): CalculationResult {
  validate(resourceId, targetRate, targetRecipeIdx);

  const resolveMode = baseRequirementsMode === 'full' ? 'full' : 'direct';
  const { totals, tree } = resolve(
    resourceId,
    targetRate,
    targetRecipeIdx,
    resolveMode,
  );

  return { resourceId, targetRate, totals, tree };
}

function validate(
  resourceId: string,
  targetRate: number,
  targetRecipeIdx: number,
): void {
  if (!resources[resourceId]) {
    throw new Error(`Unknown resource: "${resourceId}"`);
  }

  if (typeof targetRate !== "number" || targetRate <= 0 || !isFinite(targetRate)) {
    throw new Error(`targetRate must be a positive finite number, got: ${targetRate}`);
  }

  if (
    typeof targetRecipeIdx !== "number"
    || !Number.isInteger(targetRecipeIdx)
    || targetRecipeIdx < 0
  ) {
    throw new Error(
      `targetRecipeIdx must be a non-negative integer, got: ${targetRecipeIdx}`,
    );
  }

  const def = resources[resourceId];
  const { recipes } = def;
  if (recipes.length > 0) {
    if (targetRecipeIdx >= recipes.length) {
      throw new Error(
        `targetRecipeIdx ${targetRecipeIdx} out of range for "${resourceId}" (${recipes.length} recipes)`,
      );
    }
    const recipeAt = recipes[targetRecipeIdx];
    if (!recipeAt) {
      throw new Error(
        `targetRecipeIdx ${targetRecipeIdx} out of range for "${resourceId}" (${recipes.length} recipes)`,
      );
    }
    const produced = recipeAt.outputs[resourceId] ?? 0;
    if (produced <= 0) {
      throw new Error(
        `Recipe at index ${targetRecipeIdx} does not list a positive output for "${resourceId}"`,
      );
    }
  } else if (targetRecipeIdx !== 0) {
    throw new Error(
      `targetRecipeIdx must be 0 for "${resourceId}" (no recipes defined)`,
    );
  }
}
