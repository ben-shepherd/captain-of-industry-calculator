# UI and net flow

[← Technical hub](technical.md)

## `updateResults`

[`updateResults` in `controller.ts`](../assets/js/ui/controller.ts) is the main render pipeline:

1. If **no target resource** is selected, show placeholder rows and clear tree; sync production panel with empty totals.
2. Otherwise call **`calculate(resourceId, targetRate)`** ([`service.ts`](../assets/js/calculator/service.ts)). On error, show an error row.
3. **`renderTotals`** — [`formatTotals`](../assets/js/formatters/flatFormatter.ts) over `result.totals` for **Base resources required**.
4. **`renderTree`** — [`flattenTree`](../assets/js/formatters/treeFormatter.ts) for **Dependency tree** (indented lines with amounts).
5. **`renderNet`** — [`calculateNet(result.totals, production)`](../assets/js/calculator/net.ts) then **`formatNetTotals`** for **Net flow** (required vs your production vs net vs status).
6. **`syncProductionPanel`** — refreshes **Your production** rows and the preset `<select>`.

## Net flow math

[`calculateNet`](../assets/js/calculator/net.ts) builds the union of keys from **required** (chain totals) and **user production**. For each id:

- `required` — from chain totals (0 if absent).
- `production` — user-entered rate (0 if absent).
- `net = production - required`.
- **Status:** `surplus` if net > 0, `deficit` if net < 0, else `balanced`.

## Production panel membership

[`getRelevantProductionResourceIds`](../assets/js/ui/productionView.ts) collects:

- All resources in the **current chain totals**,
- All resources with **saved production rates**,
- **`productionExtraIds`** (explicitly added),
- then **filters out** rows that are only in the chain and listed in **`productionDismissedIds`** (unless the id is in `productionExtraIds`—extras always show).

Rows are sorted by **label**. Changing the target clears dismissed ids for the new chain (see [`state.ts`](../assets/js/app/state.ts) `setResourceId`).

## Presets

[`getProductionPresets`](../assets/js/app/state.ts) returns **built-in presets first** (from [`defaultProductionPresets.ts`](../assets/js/data/defaultProductionPresets.ts), `isBuiltin: true`), then **user presets** stored in `AppState.productionPresets`. The UI groups the combined list by **`category`** in [`renderProductionPresetSelect`](../assets/js/ui/controller.ts). Built-ins cannot be deleted (`deleteProductionPreset` ignores their ids).

## Related

- [Calculator](technical-calculator.md) — where `totals` come from
- [State and persistence](technical-state-and-persistence.md) — `AppState` fields for production and presets
