---
name: goja-polygon-shapes-wave10
overview: Add four new regular polygon shape types (decagon, dodecagon, hexadecagon, triangle) to Goja with TDD-first implementation, full UI/i18n wiring, and parity-safe preview/export behavior.
todos:
  - id: rev36-tdd-new-shape-tests
    content: Add failing tests for decagon/dodecagon/hexadecagon/triangle across geometry, settings, i18n, and e2e shape catalog/selection.
    status: pending
  - id: rev37-shared-geometry-shape-expansion
    content: Extend canonical shape normalization and polygon side mapping in frame-shape-geometry + shape-contour + shape-clip-utils, including arclength contour resampling before perturbation for low-vertex polygons, without introducing dual geometry logic.
    status: pending
  - id: rev38-ui-i18n-shape-options
    content: Add new shape options in index.html and locale keys across all language files; align i18n required-key tests.
    status: pending
  - id: rev39-wave10-validation-gate
    content: Run full unit/e2e plus targeted suites and cloc checks; update CHANGELOG with validated outcomes and execution evidence.
    status: pending
isProject: false
---

# Wave 10: Add 10/12/16/Triangle Shapes

## Scope

- Add new user-facing shape types to both frame-shape and cell-template selectors:
  - `regular-decagon` (正十边形)
  - `regular-dodecagon` (正十二边形)
  - `regular-hexadecagon` (正十六边形)
  - `regular-triangle` (正三角形)
- Keep existing `regular-octagon`, `heart`, `circle`, `ellipse`, `rect` behavior unchanged.
- Maintain preview/export parity through the existing shared geometry and contour pipeline.

## Files to Change

- Geometry + normalization:
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/frame-shape-geometry.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/frame-shape-geometry.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/shape-contour.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/shape-contour.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/shape-clip-utils.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/shape-clip-utils.js)
- UI + i18n:
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/index.html](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/index.html)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/en.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/en.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/zh-Hans.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/zh-Hans.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/zh-Hant.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/zh-Hant.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/es.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/es.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/ja.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/ja.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/eo.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/eo.js)
- Tests (TDD first):
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/frame-shape-geometry.test.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/frame-shape-geometry.test.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/edge-shape-engine.test.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/edge-shape-engine.test.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/shape-clip-utils.test.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/shape-clip-utils.test.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/grid-effects-settings.test.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/grid-effects-settings.test.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/i18n.test.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/i18n.test.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/preview-renderer.test.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/preview-renderer.test.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/e2e/goja.spec.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/e2e/goja.spec.js)
- Documentation:
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/CHANGELOG.md](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/CHANGELOG.md)

## Implementation Steps

1. Add failing tests first for all 4 shapes:
  - normalization accepts new values;
  - path/contour builders produce closed polygons with expected vertex counts;
  - settings normalization passes new shapes through when edge capability is available;
  - i18n requires new locale keys;
  - e2e confirms new options are visible and selectable in both selectors.
2. Implement geometry support in shared core (no dual math):
  - add new shape tokens to `SHAPES` in geometry/contour modules;
  - map each token to side count (`3`, `10`, `12`, `16`) in one canonical place;
  - ensure orientation semantics reuse current `auto/horizontal/vertical` contract.
  - for polygon templates, resample contour by arclength before irregular-edge perturbation so low-vertex shapes (especially triangle) still get continuous boundary variation.
3. Implement CSS clip output for new polygons:
  - use deterministic point generation from shared contour math (avoid hand-written low-point polygons);
  - keep heart behavior unchanged from current policy.
4. Wire UI and locales:
  - add options in both frame/cell `<select>` blocks;
  - add new i18n keys in all locale dictionaries;
  - update required-key assertions in i18n tests.
5. Run validation gates:
  - `npm test`
  - `npm run test:e2e`
  - `npx vitest run tests/unit/frame-shape-geometry.test.js tests/unit/edge-shape-engine.test.js tests/unit/shape-clip-utils.test.js tests/unit/grid-effects-settings.test.js tests/unit/i18n.test.js tests/unit/preview-renderer.test.js`
  - `cloc` per touched JS modules to verify SLOC constraints and report deltas.
6. Update changelog with date `2026-03-06` and tested command set/results.

## Acceptance Criteria

- New shape options are present in UI and localized across all supported locales.
- Selecting each new shape works for both global frame and cell template.
- Preview/export continue to match with no regressions in edge-style + non-rect combinations, validated with the active Wave parity threshold and repeated-toggle iPhone scenario checks.
- For `edgeStyle != straight` with polygon templates (including triangle), edge variation remains visually continuous around the full contour rather than only at sparse vertices.
- No test failures in full unit + e2e suites.
- SLOC checks are recorded with `cloc` and reviewed against the `<100` module rule for new/split modules.

