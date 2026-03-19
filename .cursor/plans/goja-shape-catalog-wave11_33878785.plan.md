---
name: goja-shape-catalog-wave11
overview: Define and harden Wave 11 shape-catalog changes (triangle removal, new frame/cell shapes, scoped shape availability, and global superellipse parameter) using a review-fix-repeat planning loop until execution-ready.
todos:
  - id: rev44-wave11-master-plan-draft
    content: Draft Wave 11 plan section in master plan with shape matrix, migration rules, and superellipse global parameter spec.
    status: completed
  - id: rev45-wave11-review-pass-a-consistency
    content: Run plan consistency review for naming, scope boundaries, migration behavior, and acceptance criteria completeness.
    status: completed
  - id: rev46-wave11-fix-pass-a-findings
    content: Apply fixes from consistency review findings and re-check internal coherence.
    status: completed
  - id: rev47-wave11-review-pass-b-executability
    content: Run executability review for commands, file paths, and validation gates in current repo context.
    status: completed
  - id: rev48-wave11-fix-and-ready-gate
    content: Apply executability fixes and repeat review loop until no findings remain, then mark plan ready-to-go.
    status: completed
isProject: false
---

# Goja Wave 11 Shape Catalog Plan

## Goal

Prepare an execution-ready Wave 11 plan that reflects your confirmed decisions:

- Remove `regular-triangle` completely (UI + core support), with legacy value migration to `rect`.
- Add `regular-36-gon`, `regular-64-gon`, `rounded-rect`, `superellipse`, `capsule`, `diamond`.
- Keep `capsule` and `diamond` for `globalFrameShape` only (not `cellShapeTemplate`).
- Do not add `squircle`.
- Add one global `superellipseExponent` setting used by both frame and cell when shape is `superellipse`.

## Scope and Primary Files

- Shape normalization and geometry core:
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/polygon-shape.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/polygon-shape.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/frame-shape-geometry.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/frame-shape-geometry.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/shape-contour.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/shape-contour.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/shape-clip-utils.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/shape-clip-utils.js)
- Options flow and settings wiring:
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/grid-effects-settings.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/grid-effects-settings.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/app-init.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/app-init.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/index.html](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/index.html)
- i18n:
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/en.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/en.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/zh-Hans.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/zh-Hans.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/zh-Hant.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/zh-Hant.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/es.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/es.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/ja.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/ja.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/eo.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/locales/eo.js)
- Test coverage to be updated first (TDD):
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/frame-shape-geometry.test.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/frame-shape-geometry.test.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/grid-effects-settings.test.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/grid-effects-settings.test.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/shape-clip-utils.test.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/shape-clip-utils.test.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/edge-shape-engine.test.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/edge-shape-engine.test.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/i18n.test.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/i18n.test.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/e2e/goja.spec.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/e2e/goja.spec.js)
- Governance artifacts:
  - []()
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/CHANGELOG.md](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/CHANGELOG.md)

## Proposed Wave 11 Spec Decisions (Ready for Implementation)

- Canonical new shape IDs:
  - `regular-36-gon`, `regular-64-gon`, `rounded-rect`, `superellipse`, `capsule`, `diamond`.
- Removed IDs:
  - `regular-triangle`, `squircle`.
- Migration rule:
  - `regular-triangle` must normalize to `rect` for both frame and cell pathways.
- Shape scope rule:
  - `capsule` and `diamond` allowed in frame selector only; must normalize to `rect` if passed as cell template.
- Superellipse control:
  - Global parameter `superellipseExponent` shared by frame+cell when shape is `superellipse`.
  - Defaults: min `2.2`, max `8.0`, step `0.1`, default `4.0`.
- Rounded rectangle default:
  - Corner radius ratio default `0.22 * min(width,height)` with safe clamp.

## Review-Fix-Repeat Process (Plan Hardening Loop)

1. Add Wave 11 section to master plan with new todos (`rev44+`) and explicit shape matrix (frame-only vs frame+cell).
2. Review pass A (consistency): detect naming drift, scope conflicts, migration omissions, and acceptance-criteria gaps.
3. Fix all findings in plan text.
4. Review pass B (executability): verify every referenced file path, command, and test gate is runnable in current repo.
5. Fix all findings in plan text.
6. Repeat A/B until no findings remain.
7. Mark plan “ready-to-go” only when all checks pass and execution order is unambiguous.

## Planned Validation Gates for Execution Phase

- TDD targeted red/green loops for Wave 11 test files listed above.
- Full validation after implementation:
  - `npm test`
  - `npm run test:e2e`
  - `npx vitest run tests/unit/frame-shape-geometry.test.js tests/unit/grid-effects-settings.test.js tests/unit/shape-clip-utils.test.js tests/unit/edge-shape-engine.test.js tests/unit/i18n.test.js tests/unit/preview-renderer.test.js`
  - `npx playwright test tests/e2e/goja.spec.js --grep "shape catalog|triangle|capsule|diamond|superellipse|iPhone class preview stays in sync"`
  - `cloc --by-file --include-lang=JavaScript 02product/01_coding/project/goja/js/polygon-shape.js 02product/01_coding/project/goja/js/frame-shape-geometry.js 02product/01_coding/project/goja/js/shape-contour.js 02product/01_coding/project/goja/js/shape-clip-utils.js 02product/01_coding/project/goja/js/grid-effects-settings.js`
- Changelog update with today date and validated counts.

## Risks and Mitigations (to include in final reviewed plan)

- Risk: scope mismatch between frame and cell shape catalogs.
  - Mitigation: split normalization policy by usage context and test both selectors in unit/e2e.
- Risk: removing triangle breaks persisted settings.
  - Mitigation: explicit migration test (`regular-triangle -> rect`) in options normalization tests.
- Risk: superellipse parameter causes preview/export drift.
  - Mitigation: route exponent through shared options normalization and shared geometry source only.

## Explicit Acceptance Criteria (Plan Ready-To-Go)

- Master plan is updated to include Wave 11 as active execution window (`rev44..rev48`) and no active-window conflicts remain.
- Shape scope matrix is explicit and consistent across all Wave 11 sections:
  - Frame + cell: `circle`, `ellipse`, `regular-octagon`, `regular-decagon`, `regular-dodecagon`, `regular-hexadecagon`, `regular-36-gon`, `regular-64-gon`, `rounded-rect`, `superellipse`, `heart`.
  - Frame only: `capsule`, `diamond`.
  - Removed: `regular-triangle`, `squircle`.
- Legacy migration is explicit and test-bound:
  - `regular-triangle -> rect` for frame and cell normalization paths.
- Cell-template guardrail is explicit and test-bound:
  - `capsule`/`diamond` normalize to `rect` when provided as cell template from non-UI/legacy paths.
- Superellipse parameter contract is explicit and bounded:
  - `superellipseExponent` min `2.2`, max `8.0`, step `0.1`, default `4.0`, shared by preview and export.
- Validation command set is concrete (no placeholders), path-correct, and aligned with TDD + full-gate policy.

