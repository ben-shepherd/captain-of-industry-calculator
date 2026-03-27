# Captain of Industry — Resource Calculator

This folder documents the **Captain of Industry — Resource Calculator**, a small single-page web app for planning production chains.

## Disclaimer

This is an **unofficial fan project**. It is not affiliated with or endorsed by the developers of *Captain of Industry*. Recipe and resource data are derived from community sources (for example the wiki) and may **drift** after game patches—always verify critical numbers in-game.

## What the app does

- Choose a **target resource** and a **target production rate** (per game minute).
- See **base resources required** to sustain that rate through the dependency chain.
- Optionally expand **Net flow** and **Dependency tree** to reason about surplus or deficit versus **your production** inputs.
- **Search** resources, **save production presets**, and keep settings in the browser via **localStorage**, with **Export** / **Import** (JSON) and **Reset**.

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

## Further reading

- [Technical documentation hub](technical.md) — architecture, calculator, state, UI, data, and deployment
