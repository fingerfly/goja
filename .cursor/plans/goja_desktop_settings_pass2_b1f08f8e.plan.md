---
name: goja desktop settings pass2
overview: "Revise the desktop settings overhaul plan to address your Mac Studio feedback: keep the right-side shell, but make the desktop experience unmistakably desktop at >=1024px with balanced 2-column density and full regression safety."
todos:
  - id: pass2-tdd-baseline
    content: Add failing desktop E2E assertions for visual desktop-ness at >=1024px (width band + hierarchy spacing + stable 2-column sections).
    status: completed
  - id: pass2-desktop-shell
    content: Upgrade desktop-only shell tokens and section hierarchy styling in css variables/style without affecting mobile/tablet.
    status: completed
  - id: pass2-ia-polish
    content: Refine section grouping classes in index.html for balanced 2-column scanability while preserving stable ids/hooks.
    status: completed
  - id: pass2-compat-targeted
    content: Run targeted settings E2E for tabs, sticky/footer flush, reset and localization; fix regressions minimally.
    status: completed
  - id: pass2-full-regression
    content: Run full test gate (unit + full e2e list reporter + npm test) and resolve failures.
    status: completed
  - id: pass2-changelog
    content: Document pass-2 desktop UX hardening and test verification in CHANGELOG with today's date.
    status: completed
isProject: false
---

# Goja Desktop Settings Overhaul (Pass 2)

## Objective

Ship a second desktop pass so Settings no longer looks mobile-like on Mac Studio, while preserving the current right-side panel architecture and all existing behavior.

## Confirmed Direction

- Keep **right-side desktop panel** (no centered modal rewrite).
- Use **balanced 2-column density** for desktop sections.
- Desktop acceptance baseline remains `>=1024px`.

## Target Files

- [index.html](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/index.html)
- [css/style.css](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/css/style.css)
- [css/variables.css](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/css/variables.css)
- [tests/e2e/goja.spec.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/e2e/goja.spec.js)
- [CHANGELOG.md](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/CHANGELOG.md)

## Execution Plan

### 1) TDD Baseline for “Desktop-ness” (red first)

- Add/adjust desktop E2E assertions at `1024x900` for:
  - stronger desktop visual shell (panel width band + section spacing expectations)
  - section-level 2-column structure consistency for key sections
  - desktop tabs readability and non-cramped interaction area
- Keep existing behavior checks for sticky tabs/footer and accurate tab navigation.

### 2) Desktop Shell and Hierarchy Upgrade

- Tune desktop design tokens in `css/variables.css` (panel width band, spacing rhythm, section padding).
- In `css/style.css`, increase desktop-only hierarchy signals:
  - clearer section card separation
  - stronger spacing cadence between section title, controls, and grouped rows
  - preserve mobile/tablet rules unchanged.

### 3) Section IA Polish (without hook breakage)

- Refine `index.html` grouping classes so desktop layout feels intentional (balanced 2-column + selective full-width controls).
- Preserve all existing IDs (`settingsSection`*, control IDs) to avoid JS/reset/i18n regressions.

### 4) Compatibility Guard

- Re-run targeted settings behavior tests covering:
  - reset section/reset all
  - localization labels
  - quick-nav active state and section alignment
  - sticky footer flush behavior
- If any drift appears, patch minimally in CSS first; avoid JS changes unless strictly required.

### 5) Full Regression Gate

- Run full verification sequence:
  - `npm run test:unit`
  - `CI= npx playwright test --reporter=list`
  - `npm test`
- Fix regressions before plan completion.

### 6) Changelog

- Add a new version block dated today (`2026-02-25`) documenting desktop pass-2 UX hardening and test coverage.

## Risks and Mitigation

- Desktop still appears cramped: enforce spacing/width assertions in E2E, not just column count.
- Backdrop interaction regressions from width changes: keep existing close/backdrop tests in targeted run.
- Mobile regression: limit all layout upgrades to desktop media-query scope.

## Acceptance Criteria

- On Mac Studio-class desktop (`>=1024px`), Settings is visibly desktop-oriented (not phone-like).
- Desktop keeps balanced 2-column IA with readable spacing and clear section hierarchy.
- Tabs/footer/reset/localization behavior remains correct.
- Unit + full E2E + full suite all pass.

