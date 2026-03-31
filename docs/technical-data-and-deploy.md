# Data and deployment

[← Technical hub](technical.md)

## Resource data

Game data is compiled into TypeScript modules under [`assets/js/data/resources/`](../assets/js/data/resources/):

- Segments (natural, semi-processed, crafted, food & medical, petrochemical, power & nuclear, waste & pollution) are merged in [`index.ts`](../assets/js/data/resources/index.ts) into a single **`resources`** map.
- Each resource has **`label`**, **`unit`**, **`wikiUrl`**, **`imageUrl`** (wiki icon URL or empty), and **`recipes[]`** with **`inputs`**, **`outputs`**, **`durationSec`**, **`building`**, **`name`** ([**`ResourceDef`** / **`Recipe`**](../assets/js/contracts/index.ts)).

The UI picker uses **`getResourcePickerGroups()`** from [`index.ts`](../assets/js/data/resources/index.ts) — level-labeled optgroups, alphabetical within each group.

**Layout:** shared static resource definitions stay under **`assets/js/data/`**; the React app under **`src/`** imports from there and from **`assets/js/contracts`**.

## Wiki tooling (maintainers)

[`package.json`](../package.json) scripts:

- **`pnpm run scrape:wiki`** — runs [`scripts/scrape-recipes.mjs`](../scripts/scrape-recipes.mjs); writes [`scripts/wiki-recipes.json`](../scripts/wiki-recipes.json) from the wiki Cargo **RecipesImport** table.
- **`pnpm run build:resources`** — runs [`scripts/build-resources-from-wiki.mjs`](../scripts/build-resources-from-wiki.mjs); reads `wiki-recipes.json` and emits TypeScript under [`assets/js/data/resources/`](../assets/js/data/resources/).

Run these when updating the game; then review diffs and run **`pnpm test`**.

## Tests

[`tests/`](../tests/) uses **Vitest**: calculator (`resolver`, `net`, `service`), persistence, formatters, production presets, resource data integrity, React utilities, etc.

## CI

The [Deploy to GitHub Pages](.github/workflows/deploy-pages.yml) workflow runs **`pnpm run typecheck`** and **`pnpm run test`** before **`pnpm run build`**. Still run tests locally when changing behavior.

## Build and base URL

[`vite.config.ts`](../vite.config.ts) sets **`base`** from the environment variable **`VITE_BASE`**:

- Unset, empty, or **`/`** → site served at domain root.
- Otherwise normalized to **`/segment/`** for project GitHub Pages URLs.

## GitHub Actions

[`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) runs on **`master`** (and manual dispatch): **`pnpm install`**, **`pnpm run build`** with:

```text
VITE_BASE = '/'  if the repo is '<owner>/<owner>.github.io'
          else '/<repo-name>/'
```

Artifacts in **`dist/`** deploy to **GitHub Pages**. Enable **Pages → Source: GitHub Actions** in the repository settings.

## Related

- [Calculator](technical-calculator.md) — how recipes are consumed at runtime
- [Architecture](technical-architecture.md) — app module map
