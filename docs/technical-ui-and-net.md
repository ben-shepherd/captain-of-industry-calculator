# UI and net flow

[← Technical hub](technical.md)

## Calculation and results

The calculator view uses **`useCoiStore`** ([`coiExternalStore.ts`](../assets/js/app/coiExternalStore.ts)) and **`useCalculation`** ([`useCalculation.ts`](../src/hooks/useCalculation.ts)). The hook calls **`calculate(resourceId, targetRate, targetRecipeIdx, baseRequirementsMode)`** ([`service.ts`](../assets/js/calculator/service.ts)).

[`ResultsSection.tsx`](../src/components/results/ResultsSection.tsx) branches on the outcome:

1. If **no target resource** is selected, show placeholders and clear the tree; production totals still sync via **`ProductionSection`**.
2. On **calculation error**, show an error state.
3. Otherwise [`BaseResourcesTable`](../src/components/results/BaseResourcesTable.tsx), [`NetFlowTable`](../src/components/results/NetFlowTable.tsx), and [`DependencyTree`](../src/components/results/DependencyTree.tsx) use [`formatTotals`](../assets/js/formatters/flatFormatter.ts), [`flattenTree`](../assets/js/formatters/treeFormatter.ts), and [`calculateNet`](../assets/js/calculator/net.ts) + **`formatNetTotals`** for **Net flow**.

**`resultsSections`** in **`AppState`** controls which of base / net / tree **`<details>`** panels are open ([`ResultsSection.tsx`](../src/components/results/ResultsSection.tsx)).

## Configuration panel `<details>`

**`inputsSections`** records whether the **production** and **presets** **`<details>`** blocks are open. [`ProductionSection.tsx`](../src/components/configuration/ProductionSection.tsx) and [`PresetsSection.tsx`](../src/components/configuration/PresetsSection.tsx) read `open` from state and call **`setInputsSectionExpanded`** on toggle.

## Net flow math

[`calculateNet`](../assets/js/calculator/net.ts) builds the union of keys from **required** (from **`calculate`**’s totals for the current base-requirements mode) and **user production**. For each id:

- `required` — from the calculator totals (0 if absent).
- `production` — user-entered rate (0 if absent).
- `net = production - required`.
- **Status:** `surplus` if net > 0, `deficit` if net < 0, else `balanced`.

## Production panel membership

[`getRelevantProductionResourceIds`](../assets/js/ui/productionView.ts) collects:

- All resources in the **current chain totals**,
- All resources with **saved production rates**,
- **`productionExtraIds`** (explicitly added),
- then **filters out** rows that are only in the chain and listed in **`productionDismissedIds`** (unless the id is in **`productionExtraIds`** — extras always show).

Rows are sorted by **label**. Changing the target clears dismissed ids for the new chain (see [`state.ts`](../assets/js/app/state.ts) **`setResourceId`**). [`ProductionSection.tsx`](../src/components/configuration/ProductionSection.tsx) uses this to decide which rows to show.

## Presets

[`getProductionPresets`](../assets/js/app/state.ts) returns **built-in presets first** (from [`defaultProductionPresets.ts`](../assets/js/data/defaultProductionPresets.ts), `isBuiltin: true`), then **user presets** stored in `AppState.productionPresets`. [`PresetsSection.tsx`](../src/components/configuration/PresetsSection.tsx) groups the combined list with **`groupProductionPresets`** from [`presetGroups.ts`](../src/utils/presetGroups.ts) for **`<optgroup>`** labels. Built-ins cannot be deleted (`deleteProductionPreset` ignores their ids).

## Related

- [Calculator](technical-calculator.md) — where `totals` come from
- [State and persistence](technical-state-and-persistence.md) — `AppState` fields for production and presets
