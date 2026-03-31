# Captain of Industry — Resource Calculator

This folder documents the **Captain of Industry — Resource Calculator**, a single-page web app (React, TypeScript, Vite) for planning production chains.

## Disclaimer

This is an **unofficial fan project**. It is not affiliated with or endorsed by the developers of *Captain of Industry*. Recipe and resource data are derived from community sources (for example the wiki) and may **drift** after game patches—always verify critical numbers in-game.

## What the app does

- Switch between a **home** screen, the **calculator**, and a **canvas** planning view from the header.
- In the calculator, choose a **target resource** and **production rate** (per game minute), pick which **recipe** applies when several exist, and set **base requirements** to either one recipe step (**direct**) or a **full** expansion to leaf resources.
- See **base resources required**, and optionally **Net flow** (surplus/deficit versus **your production**), **Dependency tree**, and a **net flow chart** with selectable chart styles.
- On the **canvas**, place resource blocks on a large workspace, pan and organize chains, and use an optional **results** sidebar; layout and UI preferences persist per browser like the calculator.
- **Search** resources, **save production presets** (grouped in the UI), and keep settings in the browser via **localStorage**. The header **Export** downloads JSON that includes calculator state and, when you use calculator and canvas, stored **canvas and view chrome**; **Import** restores from that file or from older app-only backups; **Reset** clears stored data.

For how the implementation is structured, see the [technical documentation hub](technical.md).

## Run locally

Prerequisites: **Node.js** (project CI uses 20) and **pnpm** (see root `README.md`).

```bash
pnpm install
pnpm dev
```

Other useful commands:

- `pnpm build` — typecheck and production build to `dist/`
- `pnpm preview` — serve the production build locally
- `pnpm test` — run the Vitest suite
- `pnpm test:watch` — Vitest in watch mode
- `pnpm typecheck` — `tsc --noEmit`

## Further reading

- [Technical documentation hub](technical.md) — architecture, calculator, state, UI, data, deployment, and canvas
