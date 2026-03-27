# Technical documentation

This project is a **static SPA**: **Vite** bundles **TypeScript**, the UI is **vanilla DOM** (no React/Vue), and **Vitest** covers calculators, persistence, and formatters. Source lives under `assets/js/` with HTML at the repo root (`index.html`).

Read the codebase top-down: [`main.ts`](../assets/js/main.ts) wires DOM elements, initializes state, binds events, and triggers the first render.

## End-to-end flow

```mermaid
flowchart LR
  subgraph user [User]
    UI[DOM]
  end
  subgraph app [App]
    Events[events.ts]
    State[state.ts]
    Persist[persistence.ts]
    Controller[controller.ts]
    Calc[calculator]
    Net[net.ts]
    Fmt[formatters]
  end
  UI -->|"input"| Events
  Events --> State
  State --> Persist
  State --> Controller
  Controller --> Calc
  Controller --> Net
  Calc --> Fmt
  Net --> Fmt
  Fmt -->|"update"| UI
```

## Topic guides

- **[Architecture](technical-architecture.md)** — modules, startup, event → persist → `updateResults`
- **[Calculator](technical-calculator.md)** — `resolve`, recipe expansion, cycles, caching
- **[State and persistence](technical-state-and-persistence.md)** — `AppState`, `PersistedEnvelope`, migrations, export/import
- **[UI and net flow](technical-ui-and-net.md)** — results rendering, production panel, net math
- **[Data and deployment](technical-data-and-deploy.md)** — resource data layout, wiki scripts, `VITE_BASE`, GitHub Pages

Shared TypeScript types: [`assets/js/contracts/index.ts`](../assets/js/contracts/index.ts).

Back to [documentation overview](README.md).
