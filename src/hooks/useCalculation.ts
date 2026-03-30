import { useMemo } from 'react';
import { calculate } from '../../assets/js/calculator/service';
import type { AppState, CalculationResult } from '../../assets/js/contracts';

export type CalculationOutcome =
  | { ok: true; result: CalculationResult }
  | { ok: false; result: null }
  | { ok: true; result: null };

export function useCalculation(state: AppState): CalculationOutcome {
  return useMemo(() => {
    if (!state.resourceId) {
      return { ok: true, result: null };
    }
    try {
      const result = calculate(
        state.resourceId,
        state.targetRate,
        state.targetRecipeIdx,
        state.baseRequirementsMode,
      );
      return { ok: true, result };
    } catch {
      return { ok: false, result: null };
    }
  }, [
    state.resourceId,
    state.targetRate,
    state.targetRecipeIdx,
    state.baseRequirementsMode,
  ]);
}
