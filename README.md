# Captain of Industry — Resource Calculator

A static single-page app that helps you plan **production chains** for [*Captain of Industry*](https://www.captain-of-industry.com/): pick a **target resource** and **rate per minute**, see **base resources required**, optional **dependency tree** and **net flow** versus **your production**, with **presets** and **local persistence** (including JSON export/import).

*Captain of Industry* is a trademark or registered trademark of its respective owners. This project is an independent fan tool and is not affiliated with or endorsed by them.

**Live site (GitHub Pages):** [https://ben-shepherd.github.io/captain-of-industry-calculator/](https://ben-shepherd.github.io/captain-of-industry-calculator/)

## Documentation

- **[docs/README.md](docs/README.md)** — what the app does, how to run it, disclaimer
- **[docs/technical.md](docs/technical.md)** — developer hub (architecture, calculator, state, UI, data, deployment)

## Prerequisites

- **Node.js** 20 (matches [GitHub Actions](.github/workflows/deploy-pages.yml))
- **pnpm** 9

## Setup and scripts

```bash
pnpm install
pnpm dev          # development server
pnpm build        # tsc + vite build → dist/
pnpm preview      # serve production build
pnpm test         # vitest
pnpm typecheck    # tsc --noEmit
```

Wiki maintenance (regenerate game data from the community wiki):

```bash
pnpm run scrape:wiki       # scripts/wiki-recipes.json
pnpm run build:resources   # assets/js/data/resources/*.ts
```

## Deployment (GitHub Pages)

The [Deploy to GitHub Pages](.github/workflows/deploy-pages.yml) workflow builds with **`VITE_BASE`** set so **project** sites work under `https://<user>.github.io/<repo>/` and **user** sites (`<user>.github.io`) use `/`. [`vite.config.ts`](vite.config.ts) reads `VITE_BASE` to set Vite’s `base`. After enabling Pages (source: GitHub Actions), pushes to **`master`** publish **`dist/`**.
