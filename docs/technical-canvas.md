# Canvas

[← Technical hub](technical.md)

## Purpose

The **canvas** view ([`CanvasView.tsx`](../src/components/canvas/CanvasView.tsx)) is an alternative to the calculator’s stacked panels: users place **resource blocks** on a large scrollable workspace, see **dependency links** between cards, and inspect aggregated **results** in a resizable sidebar. It reuses the same **`resources`** map and **`resolve`** from [`resolver.ts`](../assets/js/calculator/resolver.ts) to build chains when placing a resource; per-block rates and result strings are handled with helpers such as [`canvasBlockResults.ts`](../src/utils/canvasBlockResults.ts).

## Key modules

- **[`canvasPlacement.ts`](../src/utils/canvasPlacement.ts)** — Layout constants (card size, gaps, surface padding), **placement style** (`auto` | `horizontal` | `vertical`), dependency **edges**, tree flattening, batch positioning, scroll-to-fit behavior, and related geometry.
- **[`canvasWorkspaceStorage.ts`](../src/utils/canvasWorkspaceStorage.ts)** — Serializes **placed nodes**, **edges**, **block labels**, search string, scroll position, and a versioned workspace blob under **`coi-canvas-workspace`** (see **`PersistedCanvasWorkspace`** in that file).
- **Sidebar / chrome** — [`canvasSidebarStorage.ts`](../src/utils/canvasSidebarStorage.ts), [`canvasResultsSidebarStorage.ts`](../src/utils/canvasResultsSidebarStorage.ts), [`canvasResultsSidebarWidthStorage.ts`](../src/utils/canvasResultsSidebarWidthStorage.ts), [`canvasPlacementStyleStorage.ts`](../src/utils/canvasPlacementStyleStorage.ts) — each writes a dedicated `localStorage` key and participates in **`notifyPersistedChromeChanged`** ([`persistedChromeNotify.ts`](../src/utils/persistedChromeNotify.ts)) so **`coiExternalStore`** updates when chrome changes outside **`AppState`**.

Subcomponents under **`src/components/canvas/`** (for example **`CanvasWorkspaceLayer`**, **`CanvasPlacedCard`**, **`CanvasResultsSidebar`**) compose the main view.

## Full export and chrome

Values mirrored in **`PersistedChromeEnvelope`** ([`contracts/index.ts`](../assets/js/contracts/index.ts)) are read in **`buildFullExportJson`** ([`persistence.ts`](../assets/js/app/persistence.ts)) so a header **Export** includes canvas layout and UI preferences alongside calculator state. **`parseFullExportEnvelope`** restores them on **Import**. See [State and persistence](technical-state-and-persistence.md).

## Related

- [Architecture](technical-architecture.md) — **`CanvasView`** in the app shell
- [Calculator](technical-calculator.md) — **`resolve`** and recipe behavior shared with the calculator
