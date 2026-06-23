# Changelog

## [Unreleased]

## [10.2.0] - 2026-06-23


## [10.1.9] - 2026-06-22

### Fixed

- **`js/export-flow.js`**: "Open in new tab" export option no longer triggers a
  `.txt` file download. Replaced `window.open(url, '_blank', 'noopener')` with
  an anchor element click to work within the Content-Security-Policy
  (`default-src 'self'`), which was blocking `blob:` navigation in
  null-origin popups and falling back to a plain-text download.

### Tests

- `npm test` (`461` passed).
- `npm run test:e2e` (`73` passed; 1 pre-existing flaky touch-menu timeout).

## [10.1.8] - 2026-06-05

### Changed

- **`scripts/deploy.js`**: run **`audit:check`** and **`copy:vendor`** before
  version bump; refresh vendor before sync to standalone repo; Windows
  **`npm.cmd`** invocation for npm preflight steps.
- **`.github/dependabot.yml`**: group dev tooling; **`chore(goja)`** prefix;
  **`security`** label.
- CI **`.github/workflows/test.yml`**: concurrency cancels outdated runs.
- CI **`.github/workflows/security-sweep.yml`**: weekly audit + full test matrix.
- Monorepo: track **`package-lock.json`** via **`.gitignore`** exception; CI
  prefers **`npm ci`** when lockfile is present.
- **`README.md`**, **`SECURITY.md`**: deploy preflight and security sweep notes.
- Updated service worker cache namespace to **`goja-v10.1.8-1`** in `sw.js`.

### Tests

- `npm test` (`461` passed).
- `tests/unit/deploy.test.js`: audit and vendor preflight ordering.
- `tests/unit/ci-workflows.test.js`: concurrency, security sweep, Dependabot.

## [10.1.7] - 2026-06-05

### Fixed

- GitHub Pages deploy now runs **`npm run copy:vendor`** so **`js/vendor/exifr.mjs`**
  is included in the published artifact (capture-date overlay).

### Changed

- **`README.md`**: document CI/deploy gate flow and local security checks.
- **`SECURITY.md`**: dependency maintenance, CI gates, and what ships to users.
- CI **`.github/workflows/deploy.yml`**: install deps, vendor **`exifr`**, verify
  file exists before collecting **`_site`**.
- **`package.json`**: add **`audit:check`** and **`security:verify`** scripts.
- Updated service worker cache namespace to **`goja-v10.1.7-1`** in `sw.js`.

### Tests

- `npm test` (`456` passed; deploy vendor contract in
  `tests/unit/ci-workflows.test.js`).

## [10.1.6] - 2026-06-05

### Changed

- CI **`.github/workflows/test.yml`**: add **`audit`** job; fail on
  **`npm audit --audit-level=moderate`** or higher.
- CI **`.github/workflows/deploy.yml`**: deploy only after a successful
  **Test** workflow on **`main`** (`workflow_run`); checkout tested
  **`head_sha`**. **`workflow_dispatch`** kept for manual deploys.
- Updated service worker cache namespace to **`goja-v10.1.6-1`** in `sw.js`.

### Tests

- `npm test` (`455` passed; added `tests/unit/ci-workflows.test.js`).

## [10.1.5] - 2026-06-05

### Security

- Dev dependency audit: pin transitive **`postcss`** (`^8.5.10`, GHSA-qx2v-qp2m-jg93)
  and **`qs`** (`^6.15.2`, GHSA-q8mj-m7cp-5q26) via npm `overrides`; bump
  **`vite`** `^8.0.16`, **`vitest`** `^4.1.8`, **`jsdom`** `^29.1.1`,
  **`@playwright/test`** `^1.60.0`.

### Changed

- Dev tooling: `vitest` **^4.1.4**. CI **`.github/workflows/test.yml`**: install
  with **`npm ci`** when `package-lock.json` exists, else **`npm install`**;
  npm cache key **`package.json`** (monorepo-friendly).
- Updated service worker cache namespace to **`goja-v10.1.5-2`** in `sw.js`.

### Tests

- `npm install` (0 npm audit vulnerabilities).
- `npm test` (`453` passed, Vitest `4.1.8`).
- `npm run test:e2e` (`74` passed).

## [10.1.4] - 2026-04-14

### Fixed

- `tests/unit/playwright-config.test.js`: stop asserting a monorepo-only path
  (`/project/goja`); compare the `http-server` root to `process.cwd()` so unit
  tests pass on the standalone GitHub clone (`/home/runner/work/goja/goja`).

### Changed

- Bumped dev tooling: `@playwright/test` to `^1.59.1`, `vitest` to `^4.1.2`,
  `jsdom` to `^29.0.1`; refreshed `package-lock.json`. Added npm `overrides` for
  `picomatch` (`^4.0.4`) alongside existing `undici`/`rollup` pins so transitive
  installs stay on patched releases.

### Tests

- `npm install` (0 npm audit vulnerabilities after refresh).
- `npm test` (`453` passed, Vitest `4.1.2`).
- `npm run test:unit` after playwright-config path fix (`453` passed).
- `npm run test:e2e` (`74` passed).

## [10.1.3] - 2026-04-03

### Changed

- Split preview global-frame rendering responsibilities by extracting
  `js/preview-frame-render.js` from `js/preview-renderer.js` so frame clip and
  frame stroke overlay logic live in a focused module.
- Separated preview frame-parity assertions into dedicated tests to keep
  `tests/unit/preview-renderer.test.js` smaller and responsibility-focused:
  - `tests/unit/preview-frame-render.test.js`
  - `tests/unit/preview-renderer-frame-parity.test.js`

### Tests

- Refactor verification completed with:
  - `npx vitest run tests/unit/preview-frame-render.test.js tests/unit/preview-renderer.test.js tests/unit/preview-renderer-frame-parity.test.js`
  - `npm run test:unit` (`453` passed)
  - `npm test` (`453` passed)
  - `npm run test:e2e` (`74` passed; rerun after one transient timeout)
  - `cloc --by-file --include-lang=JavaScript js/preview-renderer.js js/preview-frame-render.js tests/unit/preview-renderer.test.js tests/unit/preview-renderer-frame-parity.test.js tests/unit/preview-frame-render.test.js`

## [10.1.2] - 2026-03-09

### Fixed

- Fixed preview/export parity drift when global frame stroke is disabled by
  aligning preview frame clip generation to the same layout-sized canonical
  geometry authority used by export.
- Fixed preview global frame stroke contour mismatch (not hugging frame boundary)
  by replacing border+clip rendering with shared contour-path stroke rendering.
- Fixed non-square frame export parity drift for regular polygon shapes (for
  example `regular-octagon`) to prevent export-only 1:1-like distortion.

### Changed

- Unified frame stroke model/normalization between preview and export in shared
  shape utilities to reduce duplicate logic and prevent future authority split.
- Updated targeted unit/e2e regressions for frame-stroke continuity, stroke-off
  parity, and non-square polygon parity.
- Hardened Playwright script invocation for Windows stability and normalized
  path assertions in Playwright config tests.

### Tests

- Validation runs completed with:
  - `npx vitest run tests/unit/shape-clip-utils.test.js tests/unit/preview-renderer.test.js tests/unit/unified-canvas-pipeline.test.js`
  - `npx vitest run tests/unit/export-flow.test.js tests/unit/preview-updater.test.js`
  - `npx playwright test tests/e2e/goja.spec.js --grep "frame stroke|shape|preview stays in sync|parity|non-square"`
  - `npm run test:unit` (`450` passed)
  - `npm test` (`450` passed)
  - `npm run test:e2e` (`74` passed)
  - `cloc --by-file --include-lang=JavaScript js/preview-renderer.js js/unified-canvas-pipeline.js js/shape-clip-utils.js tests/unit/preview-renderer.test.js tests/unit/shape-clip-utils.test.js tests/unit/playwright-config.test.js`

## [10.1.0] - 2026-03-06

### Changed

- Executed Wave 13 heart recognizability upgrade with a single canonical
  heart contour source based on a parametric heart equation.
- Replaced heart anisotropic stretch behavior with inset-safe similarity
  fitting (uniform scale + translation), so heart proportions remain
  stable across portrait/square/landscape frames.
- Added Heart V3 recognizability and anti-distortion constraints in
  `tests/unit/frame-shape-geometry.test.js`.
- Added preview-side heart silhouette recognizability e2e coverage in
  `tests/e2e/goja.spec.js`.
- Refactored heart/shape geometry helpers to satisfy static complexity and
  readability gates for touched geometry modules.

### Tests

- Validation runs completed with:
  - `npx vitest run tests/unit/frame-shape-geometry.test.js tests/unit/shape-clip-utils.test.js`
  - `npx playwright test tests/e2e/goja.spec.js --grep "heart frame silhouette remains recognizable in preview|iPhone class preview stays in sync after repeated shape and edge toggles"`
  - `npm test` (`446` passed)
  - `npm run test:e2e` (`73` passed)
  - `cloc --by-file --include-lang=JavaScript 02product/01_coding/project/goja/js/shape-contour.js 02product/01_coding/project/goja/js/frame-shape-geometry.js 02product/01_coding/project/goja/js/shape-clip-utils.js`
  - `npx -y eslint@9.22.0 --no-config-lookup js/shape-contour.js js/frame-shape-geometry.js js/shape-clip-utils.js --max-warnings 0 --rule "max-lines-per-function: [\"error\", {\"max\": 40, \"skipBlankLines\": true, \"skipComments\": true}]" --rule "complexity: [\"error\", 10]" --rule "max-len: [\"error\", {\"code\": 78, \"ignoreUrls\": true}]" --rule "max-depth: [\"error\", 4]"`

## [10.0.0] - 2026-03-08

### Changed

- Applied the Goja source commenting rollout across JS, HTML, CSS, and
  service worker sources using the established rule set:
  - strict 78-column line width for added/edited lines
  - module-level `Purpose` + `Description` headers
  - function/class/method JSDoc on exported and non-trivial logic
- Added structured documentation coverage across core runtime modules,
  geometry/effects modules, UI interaction modules, utility/data
  modules, and entry/presentation files.
- Preserved runtime behavior while improving maintainability and
  onboarding clarity through consistent intent-first comments.

### Tests

- Validation runs completed with:
  - `npm test` (`445` passed)
  - `npm run test:e2e` (`72` passed)
  - `cloc --by-file` source inventory re-check
  - post-edit linter diagnostics check (`No linter errors found`)

## [9.5.0] - 2026-03-08

### Changed

- Synchronized Wave 12 background-label rollout status as fully completed (`rev49..rev52`) and marked it ready for next-wave planning in project planning artifacts, to keep execution status and release documentation aligned.

### Notes

- This update is documentation/governance synchronization only; no runtime behavior or UI logic changed in this step.

### Changed

- Clarified the two previously ambiguous background controls with explicit scope semantics across UI and locales:
  - `background` (`bgColor`) now maps to inner-grid meaning.
  - `outsideBackgroundColor` now maps to outside-grid-frame meaning.
- Applied finalized `zh-Hans` wording exactly:
  - `background`: `宫格内背景色`
  - `outsideBackgroundColor`: `整体边框外背景色`
- Updated all six locale dictionaries (`en`, `zh-Hans`, `zh-Hant`, `es`, `ja`, `eo`) to keep inner-grid vs outside-frame semantics distinct and consistent.
- Updated `index.html` fallback labels to match the same clarified semantics when i18n hydration is not yet applied.

### Tests

- Added/updated background-label clarity coverage in:
  - `tests/unit/i18n.test.js`
  - `tests/e2e/goja.spec.js`
- Validation runs completed with:
  - `npx vitest run tests/unit/i18n.test.js` (`17` passed)
  - `npx playwright test tests/e2e/goja.spec.js --grep "background labels are localized in zh-Hans|background labels remain semantically distinct in en"` (`2` passed)
  - `npm test` (`445` passed)
  - `npm run test:e2e` (`72` passed)
  - `cloc --by-file --include-lang=JavaScript 02product/01_coding/project/goja/js/locales/en.js 02product/01_coding/project/goja/js/locales/zh-Hans.js 02product/01_coding/project/goja/js/locales/zh-Hant.js 02product/01_coding/project/goja/js/locales/es.js 02product/01_coding/project/goja/js/locales/ja.js 02product/01_coding/project/goja/js/locales/eo.js 02product/01_coding/project/goja/tests/unit/i18n.test.js 02product/01_coding/project/goja/tests/e2e/goja.spec.js`

## [9.4.0] - 2026-03-06

### Changed

- Executed Wave 11 shape catalog update across frame and cell templates: removed `regular-triangle` and added `regular-36-gon`, `regular-64-gon`, `rounded-rect`, and `superellipse` for shared use.
- Added frame-only shape options `capsule` and `diamond`, while enforcing cell-template guardrails so non-UI/legacy values normalize to `rect`.
- Added deterministic legacy migration rule `regular-triangle -> rect` for both frame and cell normalization pathways.
- Added global `superellipseExponent` control (min `2.2`, max `8.0`, step `0.1`, default `4.0`) and wired one shared parameter path for preview/export rendering.
- Extended geometry/contour/clip implementations for the new Wave 11 shapes and kept `js/polygon-shape.js` under the `SLOC < 100` rule (`82` lines).
- Updated all six locale dictionaries (`en`, `zh-Hans`, `zh-Hant`, `es`, `ja`, `eo`) with new shape labels and superellipse parameter terminology.

### Tests

- Added/updated Wave 11 coverage in:
  - `tests/unit/frame-shape-geometry.test.js`
  - `tests/unit/grid-effects-settings.test.js`
  - `tests/unit/shape-clip-utils.test.js`
  - `tests/unit/edge-shape-engine.test.js`
  - `tests/unit/i18n.test.js`
  - `tests/e2e/goja.spec.js`
- Validation runs completed with:
  - `npx vitest run tests/unit/frame-shape-geometry.test.js tests/unit/grid-effects-settings.test.js tests/unit/shape-clip-utils.test.js tests/unit/edge-shape-engine.test.js tests/unit/i18n.test.js` (`75` passed)
  - `npx playwright test tests/e2e/goja.spec.js --grep "shape catalog applies wave11 scope and removes triangle|iPhone class preview stays in sync after repeated shape and edge toggles"` (`2` passed)
  - `npm test` (`444` passed)
  - `npm run test:e2e` (`70` passed)
  - `cloc --by-file --include-lang=JavaScript 02product/01_coding/project/goja/js/polygon-shape.js 02product/01_coding/project/goja/js/frame-shape-geometry.js 02product/01_coding/project/goja/js/shape-contour.js 02product/01_coding/project/goja/js/shape-clip-utils.js 02product/01_coding/project/goja/js/grid-effects-settings.js`
- Manual acceptance status:
  - User confirmed visual/manual validation with “all look good”.

## [9.3.1] - 2026-03-06

### Changed

- Clarified edge-control ownership in Settings by moving `#edgeTextureOverlayGroup` under `#cellShapeTemplateGroup`, so the UI visually indicates edge styles are per-cell behavior.
- Updated edge-control wording to explicit cell-edge terminology across all six locales (`en`, `zh-Hans`, `zh-Hant`, `es`, `ja`, `eo`), including labels and hints for style/amplitude/cycles/seed.
- Kept all existing control IDs and runtime behavior intact while changing only grouping and wording semantics.
- Resolved CSP runtime blocking in Live Server-style environments by allowing the reported inline script hash in `index.html` `script-src`, while preserving `'self'` policy.

### Tests

- Added/updated Wave 10B ownership wording/layout coverage in:
  - `tests/unit/i18n.test.js`
  - `tests/e2e/goja.spec.js`
- Added CSP regression coverage in:
  - `tests/unit/csp-meta.test.js`
- Validation runs completed with:
  - `npx vitest run tests/unit/csp-meta.test.js` (`1` passed)
  - `npx vitest run tests/unit/i18n.test.js tests/unit/edge-controls.test.js tests/unit/settings-panel.test.js` (`28` passed)
  - `npx playwright test tests/e2e/goja.spec.js --grep "edge controls are localized|shape controls and edge controls reflect cell ownership hierarchy|edge controls stay hidden when capability check fails"` (`3` passed)
  - `npm test` (`439` passed)
  - `npm run test:e2e` (`70` passed)
  - `npx cloc js/locales/en.js js/locales/es.js js/locales/eo.js js/locales/ja.js js/locales/zh-Hans.js js/locales/zh-Hant.js index.html tests/unit/i18n.test.js tests/e2e/goja.spec.js`

## [9.3.0] - 2026-03-07

### Changed

- Added four new regular polygon shape types for both global frame and cell template selectors: `regular-triangle`, `regular-decagon`, `regular-dodecagon`, and `regular-hexadecagon`.
- Extended canonical shape normalization/geometry to support the new polygon set while preserving legacy migration (`hexagon` / `regular-hexagon` / `regular-nonagon` -> `regular-octagon`).
- Reworked polygon contour generation to use deterministic shared geometry sampling and added arclength-based contour resampling before non-rect edge perturbation, ensuring continuous edge variation for low-vertex polygons (especially triangle).
- Added a dedicated polygon utility module to keep shape modules within SLOC guardrails (`js/polygon-shape.js`) and keep shared geometry logic centralized.
- Updated settings UI and locale dictionaries (`en`, `zh-Hans`, `zh-Hant`, `es`, `ja`, `eo`) with labels/options for the four new polygon shapes.

### Tests

- Added/updated Wave 10 coverage in:
  - `tests/unit/frame-shape-geometry.test.js`
  - `tests/unit/edge-shape-engine.test.js`
  - `tests/unit/shape-clip-utils.test.js`
  - `tests/unit/grid-effects-settings.test.js`
  - `tests/unit/i18n.test.js`
  - `tests/e2e/goja.spec.js`
- Validation runs completed with:
  - `npm test` (`438` passed)
  - `npm run test:e2e` (`70` passed)
  - `npx vitest run tests/unit/frame-shape-geometry.test.js tests/unit/edge-shape-engine.test.js tests/unit/shape-clip-utils.test.js tests/unit/grid-effects-settings.test.js tests/unit/i18n.test.js tests/unit/preview-renderer.test.js` (`79` passed)
  - `npx cloc --by-file --include-lang=JavaScript js/polygon-shape.js js/shape-contour.js js/frame-shape-geometry.js js/shape-clip-utils.js js/edge-shape-engine.js`

## [9.2.4] - 2026-03-07

### Changed

- Refined Heart V2 contour in `js/shape-contour.js` with mirrored cubic-Bezier tuning to increase lower-half side occupancy and preserve smooth tail curvature while keeping centered symmetry.
- Added dual-template shape-recognition gates in `tests/unit/frame-shape-geometry.test.js` using normalized distance checks against canonical parametric and implicit heart templates (Hausdorff + mean radial error), alongside strengthened lower-half width contracts.
- Fixed Playwright E2E baseline routing in `playwright.config.js` by serving from the Goja app directory on a dedicated local port and disabling accidental server reuse that could point tests at a directory index page.

### Tests

- Added/updated heart-recognition and lower-half geometry assertions in:
  - `tests/unit/frame-shape-geometry.test.js` (dual-template distance constraints, lower-half width at `0.75H` and `0.85H`)
- Added config regression coverage in:
  - `tests/unit/playwright-config.test.js` (base URL/command/reuse server behavior for local runs)
- Validation runs completed with:
  - `npm test` (`434` passed)
  - `npx vitest run tests/unit/frame-shape-geometry.test.js tests/unit/shape-clip-utils.test.js tests/unit/edge-shape-engine.test.js tests/unit/preview-renderer.test.js tests/unit/cell-draw.test.js tests/unit/unified-canvas-pipeline.test.js tests/unit/grid-effects-settings.test.js tests/unit/export-handler.test.js tests/unit/export-flow.test.js tests/unit/preview-updater.test.js` (`91` passed)
  - `npm run test:e2e` (`70` passed)
  - `npx vitest run tests/unit/playwright-config.test.js` (`3` passed)
  - `cloc` checks on touched modules/tests (including `js/shape-contour.js` at `99` SLOC)

## [9.2.3] - 2026-03-07

### Changed

- Reworked heart contour generation in `js/shape-contour.js` to a deterministic mirrored cubic-Bezier profile with rounded tip arc, replacing the previous trig-form heart profile while keeping one canonical sampler source for preview/export paths.
- Strengthened Heart V2 geometry contracts used by frame/cell shapes: wider mid-upper occupancy and less needle-like bottom tip while preserving inset-safe max-fit behavior.
- Corrected Heart V2 top-lobe/notch relationship so the center notch is visually lower than the left/right top lobes (fixes non-heart-like oval/teardrop appearance when selecting heart frame).
- Updated Playwright script invocation in `package.json` (`test:e2e`, `test:e2e:ui`) to resolve browser cache path automatically through `PLAYWRIGHT_BROWSERS_PATH` fallback logic for more stable local execution.

### Tests

- Added/expanded unit coverage for Heart V2 geometry and sampler behavior in:
  - `tests/unit/frame-shape-geometry.test.js` (balanced width, symmetry, and top-notch concavity assertions)
  - `tests/unit/shape-clip-utils.test.js` (heart sample clamp range `64..128`)
- Added rev34a non-rect contour perturbation coverage in:
  - `tests/unit/edge-shape-engine.test.js` (continuity/determinism assertions across `circle`/`ellipse`/`regular-octagon`/`heart`)
- Validation runs completed with:
  - `npm test` (`427` passed)
  - `npx vitest run tests/unit/frame-shape-geometry.test.js tests/unit/shape-clip-utils.test.js tests/unit/edge-shape-engine.test.js tests/unit/preview-renderer.test.js tests/unit/cell-draw.test.js tests/unit/unified-canvas-pipeline.test.js tests/unit/grid-effects-settings.test.js tests/unit/export-handler.test.js tests/unit/export-flow.test.js tests/unit/preview-updater.test.js` (`84` passed)
  - `npm run test:e2e` (`70` passed)
  - `cloc` checks on touched modules/tests

## [9.2.2] - 2026-03-06

### Changed

- Replaced user-facing polygon shape option labels/values from `regular-nonagon` to `regular-octagon` in settings UI and locale dictionaries (`en`, `zh-Hans`, `zh-Hant`, `es`, `ja`, `eo`).
- Finalized legacy shape migration normalization so persisted `hexagon`, `regular-hexagon`, and `regular-nonagon` values are all mapped to `regular-octagon` in both frame and cell template flows.
- Updated shape contour/path generation to render true octagon geometry (`8` sides) for frame paths, cell contours, and edge perturbation sampling paths.
- Adjusted heart preview clip default to high-sample same-source `polygon(...)` output while keeping explicit opt-in `path(...)` behavior for environments that request it.

### Tests

- Added/updated expectations for octagon migration and heart clip behavior in:
  - `tests/unit/frame-shape-geometry.test.js`
  - `tests/unit/grid-effects-settings.test.js`
  - `tests/unit/shape-clip-utils.test.js`
  - `tests/unit/i18n.test.js`
  - `tests/unit/preview-renderer.test.js`
  - `tests/e2e/goja.spec.js`
- Validation runs completed with:
  - `npm test` (`420` passed)
  - `npm run test:e2e` (`70` passed)
  - `npx vitest run tests/unit/shape-clip-utils.test.js tests/unit/frame-shape-geometry.test.js tests/unit/grid-effects-settings.test.js tests/unit/i18n.test.js` (`44` passed)
  - `npx cloc --by-file --include-lang=JavaScript js/shape-contour.js js/frame-shape-geometry.js js/shape-clip-utils.js js/edge-shape-engine.js`

## [9.2.1] - 2026-03-06

### Changed

- Enforced the Wave 9 max-area-within-inset geometry contract across non-rect shapes with normalized inset-safe fitting; heart geometry now uses a normalized contour equation mapped to the maximum inset-safe bounding box to reduce top-void artifacts.
- Unified heart geometry source for preview/export and switched preview heart CSS clip default to high-sample same-source `polygon(...)` (`64..128` points), with `path(...)` only when explicitly requested.
- Replaced user-facing `regular-nonagon` with `regular-octagon`, including legacy normalization migration chain (`hexagon` / `regular-hexagon` / `regular-nonagon` -> `regular-octagon`) for frame and cell templates.
- Hardened mixed-shape edge rendering so `edgeStyle != straight` with `cellShapeTemplate != rect` uses one boundary clip path and contour-parameterized edge perturbation instead of rectangle-side-only perturbation.

### Tests

- Added/updated unit coverage for Wave 9 geometry and contour behavior:
  - `tests/unit/frame-shape-geometry.test.js`
  - `tests/unit/shape-clip-utils.test.js`
  - `tests/unit/grid-effects-settings.test.js`
  - `tests/unit/i18n.test.js`
  - `tests/unit/edge-shape-engine.test.js`
  - `tests/unit/preview-renderer.test.js`
  - `tests/unit/edge-capability.test.js`
- Added iPhone/Safari E2E regression for repeated shape/edge toggles to detect stale preview clipping behavior:
  - `tests/e2e/goja.spec.js`
- Validation runs completed with:
  - `npm test`
  - `npm run test:e2e`
  - `cloc --by-file --include-lang=JavaScript ...` (SLOC checks, including new modules under `SLOC < 100`)

## [9.2.0] - 2026-03-06

## [9.1.1] - 2026-03-06

## [9.1.0] - 2026-03-06

## [9.0.5] - 2026-03-05

### Changed

- Removed `soft-wave` from user-facing edge style options and style registry; approved/candidate sets now exclude this template.
- Added strict fail-fast handling for legacy `soft-wave` config values in `js/grid-effects-settings.js` (explicit error instead of silent remap).
- Kept backward compatibility for older `wavy` alias by remapping it to `silk-wave`.
- Updated locale dictionaries and i18n bindings to remove `edgeStyleSoftWave`.
- Applied removal across concrete runtime surfaces:
  - `index.html` (`#edgeStyle` option set)
  - `js/edge-style-presets.js` (legacy map/profile/candidate registry)
  - `js/grid-effects-settings.js` (legacy fail-fast guard)
  - `js/locales/{en,zh-Hans,zh-Hant,es,ja,eo}.js` (i18n key cleanup)

### Tests

- Updated unit/E2E expectations for soft-wave removal and fail-fast behavior:
  - `tests/unit/edge-style-presets.test.js`
  - `tests/unit/grid-effects-settings.test.js`
  - `tests/unit/i18n.test.js`
  - `tests/unit/edge-shape-engine.test.js`
  - `tests/e2e/goja.spec.js`
- Validation runs completed with:
  - `npm test`
  - `npx vitest run tests/unit/preview-renderer.test.js tests/unit/cell-draw.test.js tests/unit/export-handler.test.js tests/unit/export-flow.test.js tests/unit/preview-updater.test.js`
  - `npm run test:e2e`
  - `npx --yes cloc --by-file --csv ...` (SLOC checks recorded for changed files)

## [9.0.4] - 2026-03-05

### Changed

- Expanded edge cycle range from `1..12` to `1..20` across settings UI, parsing/normalization, preview rendering, export rendering, and shape-engine safety clamps.
- Added additional curated edge template candidates using low-noise, continuity-first border design constraints:
  - `silk-wave`
  - `linen-deckle`
  - `postage-perf`
- Updated edge-style selector and locale dictionaries to expose the new template candidates and revised cycle-range hint text (`1-20`) across supported languages.

### Tests

- Extended unit coverage for frequency bound normalization at the new upper limit (`20`) and style-candidate/profile behavior:
  - `tests/unit/edge-controls.test.js`
  - `tests/unit/grid-effects-settings.test.js`
  - `tests/unit/edge-style-presets.test.js`
- Expanded i18n and E2E assertions for new style options and updated frequency range hints:
  - `tests/unit/i18n.test.js`
  - `tests/e2e/goja.spec.js`
- Validation runs completed with:
  - `npm test`
  - `npx vitest run tests/unit/preview-renderer.test.js tests/unit/cell-draw.test.js tests/unit/export-handler.test.js tests/unit/export-flow.test.js tests/unit/preview-updater.test.js`
  - `npm run test:e2e`
  - `npx --yes cloc --by-file --csv ...` (SLOC gates verified)

## [9.0.3] - 2026-03-05

### Changed

- Enforced a single canonical irregular-edge path pipeline for preview/export by introducing shared local/global path pairing in `js/edge-shape-engine.js` and updating both clip adapters (`js/edge-preview-clip.js`, `js/edge-export-clip.js`) to consume the same geometry chain.
- Redesigned advanced edge controls for usability and micro-tuning: edge amplitude now uses a synced slider + numeric input pattern, with improved responsive layout for edge controls in `index.html` and `css/style.css`.
- Added cross-platform numeric-input handling for edge frequency/seed through `js/edge-controls.js`, including iPhone-class fallback to text+numeric keyboard mode for better mobile reliability.
- Improved soft-wave aesthetic profile in `js/edge-style-presets.js` to reduce harshness (lower jitter/frequency envelope) and keep boundaries visually smoother.
- Added curated style-candidate metadata in `js/edge-style-presets.js` to support aesthetic shortlist selection workflow while preserving approved presets.
- Extended edge option schema compatibility in `js/grid-effects-settings.js` (`edgeAmplitude` with backward-compatible `edgeIntensity` fallback) and updated preview parsing in `js/preview-renderer.js`.
- Completed i18n updates for redesigned edge UX hints/labels in locale dictionaries (`en`, `zh-Hans`, `zh-Hant`, `es`, `ja`, `eo`).

### Tests

- Added unit tests for canonical path pairing and export clip parity (`tests/unit/edge-shape-engine.test.js`, `tests/unit/edge-export-clip.test.js`).
- Added unit tests for edge control normalization/platform behavior and curated preset constraints (`tests/unit/edge-controls.test.js`, `tests/unit/edge-style-presets.test.js`).
- Expanded unit coverage for migration fallback behavior (`tests/unit/grid-effects-settings.test.js`) and required i18n keys (`tests/unit/i18n.test.js`).
- Added E2E coverage for updated edge controls (including iPhone-class numeric input behavior) in `tests/e2e/goja.spec.js`.

## [9.0.2] - 2026-03-05

### Changed

- Enforced a single canonical irregular-edge path pipeline for preview/export by introducing shared local/global path pairing in `js/edge-shape-engine.js` and updating both clip adapters (`js/edge-preview-clip.js`, `js/edge-export-clip.js`) to consume the same geometry chain.
- Redesigned advanced edge controls for usability and micro-tuning: edge amplitude now uses a synced slider + numeric input pattern, with improved responsive layout for edge controls in `index.html` and `css/style.css`.
- Added cross-platform numeric-input handling for edge frequency/seed through `js/edge-controls.js`, including iPhone-class fallback to text+numeric keyboard mode for better mobile reliability.
- Improved soft-wave aesthetic profile in `js/edge-style-presets.js` to reduce harshness (lower jitter/frequency envelope) and keep boundaries visually smoother.
- Added curated style-candidate metadata in `js/edge-style-presets.js` to support aesthetic shortlist selection workflow while preserving approved presets.
- Extended edge option schema compatibility in `js/grid-effects-settings.js` (`edgeAmplitude` with backward-compatible `edgeIntensity` fallback) and updated preview parsing in `js/preview-renderer.js`.
- Completed i18n updates for redesigned edge UX hints/labels in locale dictionaries (`en`, `zh-Hans`, `zh-Hant`, `es`, `ja`, `eo`).

### Tests

- Added unit tests for canonical path pairing and export clip parity (`tests/unit/edge-shape-engine.test.js`, `tests/unit/edge-export-clip.test.js`).
- Added unit tests for edge control normalization/platform behavior and curated preset constraints (`tests/unit/edge-controls.test.js`, `tests/unit/edge-style-presets.test.js`).
- Expanded unit coverage for migration fallback behavior (`tests/unit/grid-effects-settings.test.js`) and required i18n keys (`tests/unit/i18n.test.js`).
- Added E2E coverage for updated edge controls (including iPhone-class numeric input behavior) in `tests/e2e/goja.spec.js`.

## [9.0.1] - 2026-03-05

### Changed

- Fixed irregular-edge preview clipping so multi-photo grids remain fully visible by using local per-cell clip-path coordinates instead of global cell offsets.
- Upgraded edge generation from raw random offsets to deterministic template-style wave/jagged profiles for smoother, less noisy exported boundaries.
- Added full i18n coverage for edge controls (`edge style`, style options, intensity, frequency, seed) across all supported locales.
- Hardened unsupported-capability fallback by forcing `edgeStyle=straight` when advanced edge support is unavailable.

### Tests

- Added unit coverage for preview clip local-coordinate behavior in `tests/unit/edge-preview-clip.test.js`.
- Expanded unit i18n assertions in `tests/unit/i18n.test.js` and fallback normalization in `tests/unit/grid-effects-settings.test.js`.
- Expanded E2E coverage in `tests/e2e/goja.spec.js` for zh-Hans edge-control localization and unsupported-capability rectangular preview safety.
- Verification runs completed with `npm test`, integration subset `npx vitest run tests/unit/preview-renderer.test.js tests/unit/cell-draw.test.js tests/unit/export-handler.test.js tests/unit/export-flow.test.js tests/unit/preview-updater.test.js`, `npm run test:e2e`, and `cloc --by-file --include-lang=JavaScript` checks (all passing).

## [9.0.0] - 2026-03-05

### Changed

- Added advanced irregular collage edge rendering for preview/export with new styles (`wavy`, `jagged`) and deterministic parameters (`style`, `intensity`, `frequency`, `seed`).
- Added runtime capability probing for advanced edge rendering and enforced minimal-surprise behavior: unsupported browsers/devices keep controls hidden and safely fall back to straight rectangular edges.
- Refactored edge rendering into small cooperating modules (`js/edge-capability.js`, `js/edge-shape-engine.js`, `js/edge-preview-clip.js`, `js/edge-export-clip.js`, `js/edge-rng.js`) to improve modularity and maintainability.

### Tests

- Added unit coverage for edge capability resolution and deterministic edge path generation (`tests/unit/edge-capability.test.js`, `tests/unit/edge-shape-engine.test.js`).
- Extended unit coverage for preview/export integration paths (`tests/unit/preview-renderer.test.js`, `tests/unit/cell-draw.test.js`, `tests/unit/grid-effects-settings.test.js`).
- Added E2E coverage for advanced edge settings visibility and fallback behavior on unsupported capabilities (`tests/e2e/goja.spec.js`).
- Validation runs completed with `npm test`, integration subset `npx vitest run tests/unit/preview-renderer.test.js tests/unit/cell-draw.test.js tests/unit/export-handler.test.js tests/unit/export-flow.test.js tests/unit/preview-updater.test.js`, `npm run test:e2e`, and `cloc --by-file --include-lang=JavaScript ...` (all passing).

## [8.5.3] - 2026-03-05

### Changed

- Hardened deploy remote selection in `scripts/deploy.js` for cross-platform defaults: Windows now defaults to HTTPS (`https://github.com/fingerfly/goja.git`) while macOS keeps SSH (`git@github.com:fingerfly/goja.git`); `GOJA_DEPLOY_REMOTE` remains highest-priority override.
- Added explicit deploy preflight (`git ls-remote <remote> HEAD`) before version bump side effects so auth/remote failures exit early without mutating version/changelog files.
- Strengthened deploy remote safety checks with normalized owner/repo matching (`fingerfly/goja`) across SSH/HTTPS URL shapes.
- Updated deploy documentation in `README.md` with OS-aware defaults, shell-specific override examples (PowerShell/CMD/bash-zsh), and non-destructive remote verification guidance.

### Tests

- Extended deploy unit coverage in `tests/unit/deploy.test.js` for OS-aware default remote resolution (`win32`, `darwin`, unknown fallback), override precedence, preflight ordering (no upgrade-version on preflight failure), and remote normalization edge cases.
- Regression verification completed with `npm run test:unit`, `npm test`, `npm run test:e2e`, and `cloc --by-file scripts/deploy.js tests/unit/deploy.test.js` (all passing).

## [8.5.2] - 2026-03-04

### Changed

- Hardened PWA upgrade behavior so new releases activate without manual cache/history clearing: service worker registration now uses `updateViaCache: 'none'`, startup checks call `registration.update()`, and waiting workers are auto-activated via `SKIP_WAITING` when possible.
- Added proactive foreground update checks (`focus` and `visibilitychange`) so returning users pick up newly deployed builds sooner during normal usage.
- Added OPPO-safe Background control fallback in Settings Export: `#bgColor` now switches to a normalized hex text mode on risky Android/OPPO-like browser profiles to avoid native color-picker crashes while preserving native color input on iPhone and known-safe environments.
- Added dedicated background color compatibility module (`js/bg-color-control.js`) with pure helpers for risk decision and hex normalization, preserving the existing `#bgColor` preview/export data contract.
- Bumped app release version to `8.5.2` / build `1` across runtime and packaging metadata (`js/version.js`, `manifest.json`, `package.json`) to keep displayed and distributed version identifiers in sync.
- Updated service worker cache namespace to `goja-v8.5.2-1` in `sw.js` so clients rotate to the new release cache on upgrade.

### Tests

- Extended `tests/unit/update-banner.test.js` with TDD coverage for waiting-worker auto-activation, install-to-activation flow, and startup update checks.
- Added TDD coverage in `tests/unit/bg-color-control.test.js` for OPPO risk detection hints, iPhone-safe native behavior, hex normalization, and fallback event compatibility (`input`/`change` behavior).
- Added E2E coverage in `tests/e2e/goja.spec.js` to emulate OPPO-like user-agent behavior and verify safe background fallback (`type="text"` + invalid input normalization to `#ffffff`).
- Regression verification completed with `npm run test:unit`, `npm run test:e2e`, `npm run test`, and `cloc --by-file --include-lang=JavaScript js tests/unit tests/e2e` (all passing).

## [8.5.1] - 2026-02-26

### Changed

- Fixed service worker precache coverage for module imports used at startup by adding `js/action-buttons.js`, `js/frame-validation.js`, and `js/bg-color-control.js` to `sw.js` `ASSETS`, preventing runtime `net::ERR_FAILED` module load errors under cache/offline paths.
- Removed stale locale asset paths from `sw.js` (`de`, `nl`, `it`, `tr`, `fi`) that were not present in the repository and could cause `cache.addAll()` install failure; this blocked reliable precache population and surfaced module load failures.
- Hardened `sw.js` non-navigation fetch handling to avoid uncaught promise rejections when network fetch fails without a cache hit.
- Bumped service worker cache key to `goja-v8.5.1-3` so clients can activate the corrected asset cache.

### Tests

- Regression verification completed with `npm run test:unit`, `npm run test:e2e`, and `npm run test` (all passing).

## [8.5.0] - 2026-02-25

## [8.4.6] - 2026-02-25

### Changed

- Hardened the desktop Settings visual hierarchy for `>=1024px` while keeping the right-side panel architecture: larger desktop-only section padding/radius/gaps, improved tab button spacing, and clearer section-card separation.
- Polished desktop information grouping in Watermark settings by pairing related controls (`type`+`position`, `opacity`+`font size`) for faster scanning without changing existing control ids/hooks.

### Tests

- Upgraded desktop E2E assertions in `tests/e2e/goja.spec.js` to validate desktop shell quality (section padding/gap/radius and tab spacing) in addition to width and multi-column layout.
- Regression verification completed with `npm run test:unit`, `CI= npx playwright test --reporter=list`, and `npm test` (all passing).

## [8.4.5] - 2026-02-25

### Changed

- Reworked desktop Settings information architecture at `1024px+` by widening the side panel and introducing section-level two-column grids for denser, desktop-first scanning while preserving existing section ids and accessibility wiring.
- Added explicit layout role classes in `index.html` (`settings-section--dense`, `control-group--full`) so settings groups can span full width only where needed (e.g., presets, long toggles, legal text) without breaking mobile behavior.

### Tests

- Tightened desktop E2E coverage in `tests/e2e/goja.spec.js` to require a wider settings panel plus multi-column desktop section layout for Grid/Export/Watermark sections.
- Regression verification completed with `npm run test:unit`, `CI= npx playwright test --reporter=list`, and `npm test` (all passing).

## [8.4.4] - 2026-02-25

### Changed

- Kept the Playwright CI workflow lean in `.github/workflows/test.yml`: push/PR triggers only, `unit` + `e2e` jobs, explicit E2E timeout, and failure artifact upload for Playwright diagnostics.
- Updated `playwright.config.js` reporter behavior so CI uses `list` plus `html` (`open: never`) while local runs continue to use the HTML reporter.

### Tests

- Extended unit coverage in `tests/unit/playwright-config.test.js` for CI reporter behavior and `PLAYWRIGHT_BASE_URL` web server bypass behavior.
- Regression verification completed with `npm run test:unit`, `npm run test:e2e`, and `npm test` (all passing).

## [8.4.3] - 2026-02-25

### Changed

- Initial Playwright workflow hardening draft (later streamlined in `8.4.4` to keep the final CI profile lean and non-duplicative).

### Tests

- Superseded by finalized verification notes in `8.4.4`.

## [8.4.2] - 2026-02-25

### Changed

- Hardened Playwright CI behavior in `playwright.config.js`: CI now uses `retries: 2`, `workers: 1`, and bundled Chromium (no forced Chrome channel), while local runs keep fast/no-retry defaults and local Chrome channel usage.
- Updated GitHub Actions test workflow (`.github/workflows/test.yml`) to include an explicit E2E timeout and automatic Playwright artifact upload (`playwright-report`, `test-results`) on failure for faster diagnosis.
- Reduced E2E timing flakiness in `tests/e2e/goja.spec.js` by replacing fixed sleeps with condition-based assertions/timeouts and aligning desktop settings layout assertions with current responsive UI behavior.

### Tests

- Added unit coverage in `tests/unit/playwright-config.test.js` to enforce CI-vs-local Playwright config behavior.
- Updated E2E coverage in `tests/e2e/goja.spec.js` for timeout-free async waits and stable desktop settings layout checks.
- Regression verification completed with `npm run test:unit` and `npm run test:e2e` (all passing).

## [8.4.1] - 2026-02-25

### Fixed

- Settings footer action bar now sits flush with the settings panel bottom edge on mobile sheet layout (no visual floating gap), while preserving section-tab navigation behavior.
- `Reset all` in Settings now applies immediately without a confirmation dialog.
- `Reset all` now correctly restores settings to default values (including frame size, gap, watermark/capture-date controls, and language).

### Tests

- Added E2E coverage in `tests/e2e/goja.spec.js` to assert the settings footer action bar is flush with the panel bottom edge.
- Added E2E coverage in `tests/e2e/goja.spec.js` to assert `Reset all` performs an immediate full reset without opening a confirmation dialog.
- Regression verification completed with `npm run test:unit`, `npm run test:e2e`, and `npm test` (all passing).

## [8.4.0] - 2026-02-25

### Changed

- Settings modal now separates `Language` into its own standalone section (`#settingsSectionLanguage`) instead of nesting it inside `Grid`, improving scanability and section-level reset behavior.
- Settings quick-navigation tabs now include a dedicated `Language` tab so users can jump directly to language controls.
- Section-reset fallback in `js/app-init.js` now defaults to `language` when no active section tab is detected, matching the new section order.

### Tests

- Added E2E coverage in `tests/e2e/goja.spec.js` to verify language is exposed as an independent section/tab and is no longer present inside the Grid section.
- Regression verification completed with `npm run test:unit`, `npm run test:e2e`, and `npm test` (all passing).

## [8.3.0] - 2026-02-25

### Added

- Settings section tab navigation in the modal (`Grid`, `Export`, `Effects`, `Watermark`, `Legal`) with active-tab state and section mapping via new `js/settings-tabs-nav.js`.
- Sticky settings action bar with `Reset section`, `Reset all`, and `Done` controls to reduce long-scroll friction in the modal.
- New settings layout design tokens in `css/variables.css` for tabs/footer heights, section/control spacing, card styling, and sticky shadows.

### Changed

- Settings modal content structure in `index.html` now uses explicit section anchors/ids and paired control rows for denser, clearer scanning.
- Settings styling in `css/style.css` upgraded to mobile-first sticky tabs/footer, responsive two-column paired controls on tablet/desktop, inset dependent-option cards, and selected-state styling for preset chips.
- Settings initialization in `js/app-init.js` and `js/app-bootstrap.js` now wires tab navigation, reset actions, visibility synchronization, and preset-button active state updates.

### Tests

- Added E2E coverage in `tests/e2e/goja.spec.js` for settings sticky tabs/footer visibility, tab activation/navigation behavior, no-horizontal-overflow validation on small phone viewport, and paired-row responsive layout checks (phone single-column vs tablet two-column).

## [8.2.0] - 2026-02-25

### Changed

- Relicensed Goja from `GPL-3.0-only` to `AGPL-3.0-only` and replaced the root `LICENSE` text with GNU AGPL v3.
- Added `TRADEMARK.md` and README trademark notice clarifying that Goja name/logo/branding are not licensed under AGPL.
- Added a Settings panel legal section with AGPL source-availability notice and links to source code and license.
- Reduced i18n language support from 11 to 6 locales: English, Simplified Chinese, Traditional Chinese, Spanish, Japanese, and Esperanto; removed German, Dutch, Italian, Turkish, and Finnish locale packs and selector options.

### Tests

- Added i18n unit coverage requiring legal notice translation keys across all shipped locale dictionaries.

## [8.1.3] - 2026-02-25

### Changed

- Deploy commit identity is now explicitly set in `scripts/deploy.js` to avoid accidental bot/session attribution: default author/committer uses `goja-release <10357401+fingerfly@users.noreply.github.com>`, with optional overrides via `GOJA_DEPLOY_GIT_NAME` and `GOJA_DEPLOY_GIT_EMAIL`

### Tests

- Added deploy identity unit coverage in `tests/unit/deploy.test.js` for default identity and environment override paths
- Replaced test override email with reserved non-routable domain `test@demo.invalid` to avoid personal data and real-address ambiguity

## [8.1.2] - 2026-02-25

### Changed

- Fine-tuned context menu transparency for stronger visual comfort: lower translucency in both light and dark mode so the underlying photo remains more visible with less visual obstruction

## [8.1.1] - 2026-02-24

### Changed

- Touch photo removal now uses tap-to-open context menu on grid photos instead of long-press timing, with tap gesture thresholds (`TAP_MAX_MOVE_PX`, `TAP_MAX_DURATION_MS`) to avoid drag conflicts
- Context menu UI styles moved from inline JS to CSS classes (`.cell-context-menu`, `.cell-context-menu__btn`) with 44px touch-target minimum for better mobile usability
- Context menu now auto-dismisses after idle timeout (`CONTEXT_MENU_AUTO_DISMISS_MS = 1500`) to reduce persistent on-screen menu clutter on touch devices
- Context menu visual comfort update: frosted transparent menu surface with blur (`backdrop-filter`/`-webkit-backdrop-filter`), dark/light aware style tokens, and readable no-blur fallback to reduce photo obstruction

### Fixed

- Oppo Find X8 built-in browser overlap issue: touch-originated native `contextmenu` is now guarded, preventing double-menu overlap during Goja photo removal flow
- Hybrid input handling: desktop mouse right-click context menu remains intact while touch-origin interactions follow the touch-first flow

### Tests

- Added unit tests: `tests/unit/cell-context-menu.test.js` (tap opens menu, repeated taps keep single menu instance)
- Added unit coverage for auto-dismiss timing and replacement-menu timer cleanup behavior
- Added E2E tests in `tests/e2e/goja.spec.js` for touch remove menu behavior, non-duplication regression, and idle auto-dismiss behavior
- Added E2E visual regression check for translucent menu style and blur support behavior when available

## [8.1.0] - 2026-02-24

## [8.0.1] - 2026-02-24

### Fixed

- Capture date/time overlay consistency between preview and export for rotated photos: preview now uses the same canvas drawing logic as export, improving on-screen positioning and visual alignment

### Changed

- Preview capture-date rendering now draws via `drawCaptureDateOverlay()` in a per-cell canvas overlay instead of DOM `<span>` placement, so size/margins/opacity follow the same code path as exported output
- PWA precache asset list in `sw.js` updated to include new rotation modules: `rotation-handler.js`, `rotation-math.js`, and `cell-draw.js`, ensuring offline cache completeness after feature rollout

### Tests

- Verified with unit coverage (`preview-renderer`, `capture-date-overlay`, `cell-draw`) and full regression suites (unit + E2E)

## [8.0.0] - 2026-02-24

### Added

- Per-photo rotation with draggable handle: each grid cell can now be rotated in 360 degrees, with whole-cell rotation (photo + overlays) and shrink-to-fit behavior to prevent overlap
- Rotation interaction module (`js/rotation-handler.js`) with mouse/touch drag, keyboard step rotation, and live per-cell transform updates during drag
- Rotation math module (`js/rotation-math.js`) with `computeAngleDeg`, `fitScaleFactor`, and `normalizeAngle`
- New config constants for rotation behavior and UI sizing: `ROTATION_HANDLE_SIZE`, `ROTATION_HANDLE_OFFSET`, `ROTATION_DEFAULT_ANGLE`, `ROTATION_KEYBOARD_STEP`
- Locale key `rotatePhoto` added across all 11 language files for rotation handle accessibility label

### Changed

- Preview rendering now applies per-cell rotation transforms using actual cell pixel dimensions (`layout.cells[i].width/height`) and stores `--cell-scale` for UI counter-scaling
- Export pipeline now carries per-photo angles through main thread and worker paths so exported images match rotated preview output
- App bootstrap/init wiring now rebinds rotation handles after preview re-renders and keeps undo/redo integration for rotation changes

### Refactored

- Extracted shared export cell draw logic into `js/cell-draw.js` to remove duplicated per-cell draw code between `export-handler.js` and `export-worker.js`
- Rotation transform wrapping in export is centralized in `cell-draw.js` for better reuse and maintainability

### Tests

- Added unit tests: `tests/unit/rotation-math.test.js`, `tests/unit/rotation-handler.test.js`, `tests/unit/cell-draw.test.js`
- Extended preview-renderer unit coverage for rotated cell transform behavior
- Full regression verification completed: unit suite and E2E suite both passing

## [7.5.0] - 2026-02-23

### Added

- User-facing FAQ (`docs/FAQ.md`) covering privacy, getting started, working with photos, settings/effects, and exporting
- Simplified Chinese FAQ (`docs/FAQ.zh-Hans.md`) for Chinese-speaking users
- Help section in README linking to FAQ, Changelog, and Security Policy

## [7.4.1] - 2026-02-23

### Security

- Exclude SVG files (`image/svg+xml`) from photo loading to prevent script injection via malicious SVGs
- Sanitize export filename: strip path separators and reserved characters (`/ \ ? % * : | " < >`) via new `sanitizeFilename()` in `utils.js`
- Simplify CSP `script-src` to `'self'` only; removed obsolete inline script hash

### Fixed

- Validate frame dimensions before layout: `updatePreview` now clamps `frameW`/`frameH` via `clampFrameValue` so `computeGridLayout` never receives `NaN`
- Handle `loadPhotos` promise rejections: `readImageDimensions`/`readDateTimeOriginal` failures are caught per file, reported via `onLoadError` toast, and do not break the load loop; successful photos are still added
- Bounds-check `photoOrder` indices in `preview-renderer.js` and `app-init.js` context menu callback to prevent out-of-bounds access

### Added

- Config constants: `EXPORT_FILENAME_DEFAULT`, `EXPORT_FILENAME_MAX_LENGTH`
- Locale key `loadFailed` added to all 11 languages

## [7.4.0] - 2026-02-23

### Added

- app.js modularization Phase 10: extracted `app-bootstrap.js`; app.js reduced to 2 lines (bootstrap entry point). sw.js: added `./js/app-bootstrap.js` to ASSETS.

### Added

- app.js modularization: extracted `update-banner.js`, `template-storage.js`, `preview-renderer.js`, `photo-loader.js`; `debounce` in utils, `setFrameInputInvalidState` in frame-validation; `buildFormFromRefs` in grid-effects-settings. Config: `FRAME_INPUT_DEBOUNCE_MS`, `TEMPLATE_STORAGE_KEY`. Unit tests for all new modules.

## [7.3.0] - 2026-02-23

### Added

- Grid effects code-sharing: `grid-effects-settings.js` module with `getWatermarkOptions`, `getCaptureDateOptions`, `getVignetteOptions`, `getGridEffectsOptions`; shared by preview (renderGrid) and export (handleExport). Config constants (WATERMARK_POSITION_DEFAULT, WATERMARK_FONT_SCALE_DEFAULT, etc.) used in export-handler and export-worker instead of inline literals.

## [7.2.3] - 2026-02-23

### Added

- TDD: Unit test for tiled watermark spacing (measureText-based); E2E for watermark overlay removed on clear.

## [7.2.2] - 2026-02-23

### Added

- Watermark live preview: when watermark is enabled in Settings, the on-screen grid now shows the watermark; previously it appeared only on export.

### Fixed

- Tiled watermark: spacing now based on text width (measureText) to prevent overlapping when text is long; previously used a fixed canvas-ratio spacing.
- Clear now removes watermark overlay from DOM; previously the overlay persisted when photos were cleared.

## [7.2.1] - 2026-02-23

### Fixed

- Capture date overlay in preview now respects Settings opacity and font size; previously only the exported grid applied these values.

## [7.2.0] - 2026-02-23

### Added

- Live preview for filter and vignette: effects now display in the grid before export (CSS filter on img; radial-gradient vignette overlay). Previously effects applied only on export.
- Six new filter presets: brightness, contrast, saturated, faded, vintage, blur. All use ctx.filter; config-driven values. i18n for filterBrightness, filterContrast, filterSaturated, filterFaded, filterVintage, filterBlur in all 11 locales.
- TDD coverage: unit test for filter option passed to drawPhotoOnCanvas in export-handler; E2E for filter preset preview, vignette overlay, vignette options visibility, effects section controls; i18n unit test for required effects keys in all locales.

## [7.1.0] - 2026-02-23

## [7.0.0] - 2026-02-23

### Added

- Filter and effect prototype: exportable photo filters (none, grayscale, sepia) via Canvas ctx.filter; vignette effect (radial gradient dark edges) per cell. Settings: Effects fieldset with filter preset dropdown, vignette checkbox, intensity slider. Live preview: filter and vignette shown in grid before export (CSS filter on img; radial-gradient overlay). Graceful Safari fallback (filter unsupported; vignette works). i18n (effectsSection, filterPreset, filterNone, filterGrayscale, filterSepia, vignetteEnabled, vignetteStrength) in all 11 locales. Unit tests for image-effects, image-processor filter option, export-handler vignette.

## [6.1.0] - 2026-02-23

### Added

- EXIF capture date & time overlay: optional per-photo capture date-time (DateTimeOriginal) on photos in grid, with Settings options (position, opacity, font size). Uses exifr for EXIF parsing; locale-aware date-time format (e.g. Feb 22, 2025, 2:30 PM). Preview and export both support the overlay when enabled. i18n for showCaptureDate, captureDatePos, captureDateOpacity, captureDateFontSize in all 11 locales. E2E for capture date options visibility.

## [5.6.0] - 2026-02-22

### Changed

- exportDownload label aligned across all locales with 保存到本机 (save to device): en, de, nl, es, it, tr, fi, ja, eo now use "Save to device" / equivalent instead of "Download"

### Fixed

- Share option no longer shown on OPPO Browser and similar browsers that lack `navigator.share`; prevents "Share not supported" error

### Changed

- `canShareFiles`: require `navigator.share` (removed viewport fallback)
- Export options: Download becomes primary (btn-primary) when Share unavailable
- zh-Hans/zh-Hant: `exportDownload` label updated to 保存到本机 / 保存到本機 for clearer save-to-device intent

### Added

- Unit test: `canShareFiles` returns false when `navigator.share` undefined (including narrow viewport); Download-primary when Share hidden

## [5.5.1] - 2026-02-22

### Added

- Width/Height input hardening: `inputmode="numeric"`, `pattern="[0-9]*"`, `aria-describedby="frameDimensionHint"`, `aria-invalid`; `.invalid` styles for out-of-range; debounced validation (~200 ms); `frameDimensionHint` i18n in all 11 locales; `js/frame-validation.js` with `clampFrameValue`, `isFrameValueValid`; unit + E2E tests for frame dimension clamp on blur and debounced input

## [5.5.0] - 2026-02-22

### Added

- Settings polish: config constants (GAP*\*, WATERMARK_OPACITY*\*); unit tests for config; E2E for filename i18n and settings panel dialog role
- TDD: unit test all locales have exportFilename/exportFilenamePlaceholder/exportUseDate; unit test preset34
- TDD: E2E watermark groups visibility (.hidden) per type; checkbox touch target ≥44px; aspect preset 3:4 sets 1080×1440; gap/watermark opacity init from config
- Filename i18n: `exportFilename`, `exportFilenamePlaceholder`, `exportUseDate` in all 11 locales (was missing in 10 non-English locales)
- Settings panel accessibility: `role="dialog"`, `aria-labelledby="settingsTitle"`, `aria-modal="true"`
- Checkbox touch target: `.control-group:has(input[type="checkbox"]) label` min-height 44px
- Aspect preset 3:4 (was mislabeled 4:3 for 1080×1440 portrait)
- Utility class `.hidden` in `css/style.css` for visibility toggling

### Changed

- Watermark conditional groups: replace inline `style="display:none"` with CSS class `.hidden`
- Gap and watermark opacity controls: init from `js/config.js` (GAP*MIN/MAX/DEFAULT, WATERMARK_OPACITY*\*)
- Media query: use 768px to align with `--bp-md` (was 769px)
- Preset 4:3 renamed to 3:4 (1080×1440 is 3:4 portrait)

### Fixed

- i18n unit test: renamed `it` locale import to `itLocale` to avoid shadowing vitest's `it`

## [5.4.1] - 2026-02-22

### Changed

- Export options: remove unused `t` parameter from `showExportOptions`; simplify options passed from `app.js`
- `shareBlob`: no longer checks `navigator.canShare` before calling; tries `navigator.share` directly (supports mobile viewport fallback)
- `canShareFiles`: simplified to return true when `navigator.share` exists or viewport width < 768px; removed `canShare`/`MINIMAL_PNG`-based detection

### Added

- Unit tests for `canShareFiles` viewport-based detection (narrow/wide) and `shareBlob` without `canShare`

### Fixed

- CI E2E tests: Playwright config used `channel: 'chrome'` but workflow installs Chromium only; now uses Chromium in CI, Chrome locally
- CI reproducibility: commit package-lock.json and use `npm ci`; removed from .gitignore and deploy EXCLUDE

## [5.4.0] - 2026-02-22

### Added

- TDD unit tests for action-buttons: edge cases (single photo, isExporting with 0 photos), i18n key verification, override of previous disabled state

### Changed

- Action buttons aligned with workflow: Add and Clear enabled at startup, Export disabled; Export enabled only when photos present; `updateActionButtons` + `js/action-buttons.js` (`syncActionButtons`) centralize state
- Export button has `disabled` in HTML for correct initial state before JS runs

## [5.3.1] - 2026-02-22

### Fixed

- Export options sheet visible on page load; now uses `visibility: hidden` and `pointer-events: none` when closed so it never appears until Export is clicked
- Share option missing on Oppo Find X8 and similar; now always shown on mobile (viewport < 768px) or when `navigator.share` exists

### Added

- Export options: when Export is pressed, users choose Share / Download / Copy to clipboard / Open in new tab
- Share uses Web Share API (Save to Photos, WeChat, etc. on mobile)
- Copy to clipboard for paste into chat/Notes
- `js/export-options.js` with `showExportOptions`, `canShareFiles`, `canCopyImage`
- `shareBlob` and `copyBlobToClipboard` in `js/export-handler.js`
- i18n keys: exportOptionsTitle, exportShare, exportDownload, exportCopy, exportOpenInNewTab, exportShareFailed, exportCopySuccess, exportCopyFailed

## [5.2.1] - 2026-02-22

### Fixed

- Suppress iOS/Android native image context menu on long-press so app Remove menu shows instead

## [5.2.0] - 2026-02-22

### Changed

- Relocate version display from footer to top bar (left of settings button)

## [5.1.0] - 2026-02-22

### Added

- China app aspect ratio presets: 抖音 Douyin (1080×1920), 小红书 Xiaohongshu (1080×1440), 快手 Kuaishou (1080×1920), 视频号 WeChat Channels (1080×1920)

## [5.0.0] - 2026-02-22

### Added (Goja Improvement Proposals)

- Toast notifications for export success/failure (`js/toast.js`)
- PWA update notification banner with Refresh to update
- Remove single photo via context menu (right-click / long-press) (`js/cell-context-menu.js`)
- Config constants (`js/config.js`): JPEG_QUALITY, FRAME_MIN, FRAME_MAX, MAX_PHOTOS
- Template picker in Settings; optional `templateId` in layout-engine
- Export filename customization and date option; aspect preset buttons (1:1, 4:3, 16:9, Instagram, Stories)
- Focus management in Settings; skip link for accessibility
- Undo/redo with state module (`js/state.js`); Ctrl/Cmd+Z shortcuts
- Keyboard navigation between grid cells; Alt+Arrow swap with previous/next (`js/cell-keyboard-nav.js`)
- Frame dimension validation (320–4096 px); toast on invalid
- Loading overlay during photo load ("Loading... 1/5")
- Watermark options: opacity slider, font size, positions (top-left, top-right, bottom-left); dark-mode watermark
- Web Worker export with main-thread fallback (`js/export-worker.js`)
- Lazy load layout templates
- Offline banner when disconnected
- E2E: drag-and-drop, watermark export, focus return; unit: trackBoundaryPos, dark/light watermark
- manifest.json version aligned with package.json; dark background export verified

## [4.0.0] - 2026-02-22

### Added

- Eight additional languages: German (Deutsch), Dutch (Nederlands), Spanish (Español), Italian (Italiano), Turkish (Türkçe), Finnish (Suomi), Japanese (日本語), Esperanto
- Locale files: `js/locales/de.js`, `nl.js`, `es.js`, `it.js`, `tr.js`, `fi.js`, `ja.js`, `eo.js`
- Browser language detection for new locales
- Language selector options for all 11 languages

### Changed

- Tagline redefined: 拼图成格 (Chinese), Grid your photos (English)
- Removed "One tap" / "一步到位" from tagline across all locales

### Added

- Multi-language support (i18n): English, Simplified Chinese (简体中文), Traditional Chinese (繁體中文)
- Lightweight vanilla i18n module: `js/i18n.js` with `t()`, `setLocale`, `init`, `applyToDOM`
- Locale files: `js/locales/en.js`, `zh-Hans.js`, `zh-Hant.js`
- Language selector in Settings (Grid section)
- Browser language detection on first load; preference persisted in localStorage
- Watermark datetime formatted per selected locale
- E2E tests for language switch and persistence

## [3.1.2] - 2026-02-21

### Fixed

- Full display mode: preview now matches export; added `min-width: 0` and `min-height: 0` on `.preview__grid img` so images constrain to grid cells instead of overflowing (CSS Grid `min-height: auto` was causing overflow and `overflow: hidden` on `.preview` clipped content, making preview look cropped like Fill)
- Set `objectFit` inline on each img when rendering grid for robustness

## [3.1.1] - 2026-02-21

### Fixed

- Full display mode: preview not updating when switching Image fit in Settings; added `change` listener for select (some browsers only fire `change` not `input`)

## [3.1.0] - 2026-02-21

### Added

- Layout algorithm design doc (`docs/contain-mode-layout-algorithm.md`) defining best grid layout for Cover and Contain
- Unit tests for contain-mode layout: 3 landscape/portrait, 4 and 6 photos; cover-mode 2 landscape

### Changed

- Full display (contain) mode: layout now picks template by aspect-ratio match to minimize letterboxing (e.g. 2 landscape photos → vertical stack 2×1 instead of horizontal 1×2; 2 portrait photos → horizontal 1×2)
- Fill (cover) mode: unified with same aspect-ratio-matching algorithm to minimize cropping; both modes now share optimal layout selection
- E2E resize test: use 2 portrait photos (1×2 layout) so column resize handle exists after layout change

## [3.0.0] - 2026-02-21

### Added

- Image fit setting (Fill / Full display) in Grid settings; preview and export respect the choice (cover vs contain)
- TDD unit tests for image fit: cover/contain modes, landscape letterboxing, default fitMode/backgroundColor in export

## [2.2.3] - 2026-02-21

### Added

- `scripts/generate-fixtures.js` to create E2E test images (landscape, portrait, square) with correct dimensions
- `jpeg-js` devDependency for fixture generation
- `pretest:e2e` hook runs `generate-fixtures` before E2E tests
- `.github/workflows/test.yml` for unit and E2E tests on push/PR

### Changed

- E2E fixture images no longer committed: `tests/fixtures/*.jpg` in `.gitignore`
- Deploy excludes fixture images from copy and runs `git rm --cached` to remove them from remote on next push
- Deploy uses `execFileSync` for upgrade-version call (no shell string) to prevent command injection

## [2.2.2] - 2026-02-21

### Fixed

- Resize handles not working: `showUI(true)` now runs before `enableGridResize` so handles get correct dimensions (preview was hidden when `getBoundingClientRect()` ran, returning zeros)

### Added

- E2E tests for resize: handles exist with usable dimensions; drag changes grid proportions (TDD coverage for resize fix)

## [2.2.1] - 2026-02-21

### Changed

- `publish.js` → `deploy.js`, `publish.test.js` → `deploy.test.js`, `npm run publish` → `npm run deploy` (aligned with LangBuilderJS)
- Deploy now accepts bump type (`build`|`patch`|`minor`|`major`) and runs `upgrade-version` before pushing
- Commit message auto-generated as `Release vX.Y.Z (build)` for non-interactive flow

### Fixed

- E2E tests: updated selectors to match current DOM (`h1`/`.tagline` → `.top-bar__brand`/`.top-bar__tagline`, `#controls`/`#actions` → `#bottomBar`)
- Content Security Policy: moved service worker registration from inline script to `app.js` (inline script was blocked by `default-src 'self'`)

## [2.2.0] - 2026-02-21

### Added

- GPL-3.0 license (`LICENSE` file) and author metadata in `package.json`
- Content Security Policy meta tag restricting resources to `'self'` and `blob:` for images
- Image load error handling in export pipeline (rejects instead of hanging)
- Photo count cap at 9 (maximum supported by layout templates)
- `publish.test.js` with 5 unit tests for shell-safe git argument passing
- `export-handler.test.js` with 2 unit tests for image load error handling

### Fixed

- **[CRITICAL]** Command injection in `publish.js`: commit messages with shell metacharacters (`$()`, backticks, `&&`, `;`) were interpolated via `execSync`; now uses `execFileSync` with argument arrays
- Export hanging indefinitely when an image fails to load (missing `onerror` handler)

### Changed

- Service worker uses network-first strategy for navigation requests, cache-first for assets
- Publish script derives remote URL from `git remote get-url origin` with hardcoded fallback
- Publish script guarded for safe module import (testable without side effects)

### Removed

- Dead EXIF orientation functions (`needsExifRotation`, `correctedDimensions`) and their tests
- Test artifacts (`playwright-report/`, `test-results/`) untracked from git

## [2.1.1] - 2026-02-21

## [2.1.0] - 2026-02-21

### Added

- Configurable frame size (Width × Height) in Grid settings, default 1080×1350 (4:5 portrait)
- Independent height control in layout engine (`outputHeight` parameter)
- Number input styling in CSS for frame size controls
- New unit tests for `outputHeight` and non-square frame layouts

### Fixed

- Row resize handles unusable due to swapped arguments in `makeHandle` call
- `resize-engine.js` and `resize-handler.js` missing from service worker asset cache
- `recomputePixelCells` now uses `canvasHeight` directly instead of deriving from column width

## [2.0.0] - 2026-02-21

### Added

- Grid cell resizing with draggable handles at column and row boundaries
- `resize-engine.js` module: pure functions for ratio adjustment and pixel recomputation
- `resize-handler.js` module: DOM overlay with touch-friendly 44px resize handles
- CSS resize handle styles with hover/active visual feedback
- Layout engine returns `colRatios` and `rowRatios` for non-uniform grid tracks
- 19 unit tests for resize engine

## [1.0.0] - 2026-02-21

### Added

- Complete UI redesign with mobile-first architecture
- Top bar with compact branding and settings gear icon
- Sticky bottom action bar with Add / Export / Clear buttons (always thumb-reachable)
- Settings bottom sheet on phone (slides up, 60vh) with drag handle
- Settings side panel on tablet/desktop (slides in from right, 320px)
- Backdrop overlay with tap-to-close and Escape key support
- Settings grouped into three fieldsets: Grid, Export, Watermark
- New `settings-panel.js` module with open/close/init logic
- SVG gear icon in top bar for settings access
- Drop zone hides when photos are loaded, Add button in bottom bar for adding more
- 9 new unit tests for settings panel (82 total)

### Changed

- All configuration controls moved from inline sidebar to dedicated Settings panel
- Bottom bar replaces old action buttons layout for better mobile ergonomics
- CSS completely rewritten for new layout structure with responsive breakpoints

## [0.2.1] - 2026-02-21

### Added

- Service worker `skipWaiting` and `clients.claim` for immediate cache updates on new versions
- `validate-version.js` now checks `sw.js` CACHE_NAME consistency

### Fixed

- Stale service worker cache serving outdated files after version upgrades

## [0.2.0] - 2026-02-21

### Added

- Drag-and-drop photo rearrangement within the grid (desktop HTML5 drag + mobile touch)
- Watermark feature with content types: Free text, Date/time, Copyright
- Watermark position control: Bottom-right, Center, Tiled
- Version upgrade tooling: bump, sync, validate, and changelog scripts

### Fixed

- Drag-and-drop crash caused by duplicate event listeners stacking on each render
- Service worker path resolution when served from a subdirectory

## [0.1.0] - 2026-02-20

Initial prototype release.

### Added

- Smart Grid Layout Engine: template-based spanning layouts with orientation-aware photo assignment
- Layout Templates: 15 templates for 1-9 photos with landscape/portrait preference slots
- Image Processor: Canvas API compositing with cover-mode crop
- Utils: EXIF orientation detection, image dimension reading
- Export Handler: download composed grid as JPEG or PNG
- UI: drag-and-drop / tap-to-select photo upload, CSS Grid live preview with cell spanning
- Controls: gap slider, background color picker, format selector
- Responsive design: mobile-first with 4 breakpoints (phone, tablet, desktop, landscape)
- Dark mode support via prefers-color-scheme
- PWA: manifest.json, service worker with offline caching
- Branding: Goja logo (SVG, 2x2 teal grid), favicon, tagline
- Version display in footer
- 36 unit tests (Vitest) + 6 E2E tests (Playwright)
