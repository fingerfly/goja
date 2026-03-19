---
name: goja desktop settings overhaul
overview: Implement a full desktop-oriented redesign of the Settings panel at 1024px+ while preserving mobile behavior, using TDD-first and full regression verification.
todos:
  - id: tdd-desktop-baseline
    content: Add failing desktop E2E assertions at 1024px+ for panel width, multi-column IA, sticky behavior, and navigation accuracy.
    status: completed
  - id: refactor-desktop-ia
    content: Refactor settings HTML sections/groups for desktop information architecture while preserving stable ids and accessibility.
    status: completed
  - id: desktop-css-grid
    content: Implement desktop media-query layout system (panel width, section grids, spacing hierarchy, sticky-safe scroll behavior).
    status: completed
  - id: compatibility-pass
    content: Validate and adjust JS hooks (tabs navigation/reset targeting) only where structural changes require it.
    status: completed
  - id: full-regression
    content: Run targeted E2E then full unit+E2E+suite regression; fix regressions before completion.
    status: completed
  - id: changelog-update
    content: Document desktop layout overhaul and testing coverage in CHANGELOG version block with current date.
    status: completed
isProject: false
---

# Goja Desktop Settings Overhaul Plan

## Goal

Improve the Settings panel into a true desktop-oriented experience at `>=1024px` while preserving mobile behavior, accessibility, and existing functionality.

## Scope (Confirmed)

- Full desktop information architecture refactor (highest-impact option selected).
- Acceptance baseline starts at `1024px` viewport width.
- Mobile/tablet behavior remains mobile-first and backward-compatible.

## Source of Truth

- Authoritative project path: `.../project/goja` (lowercase only).

## Target Files

- [index.html](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/index.html)
- [css/style.css](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/css/style.css)
- [css/variables.css](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/css/variables.css)
- [js/settings-tabs-nav.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/settings-tabs-nav.js)
- [js/app-init.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/app-init.js)
- [tests/e2e/goja.spec.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/e2e/goja.spec.js)
- [CHANGELOG.md](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/CHANGELOG.md)

## Rules

All rules below are mandatory during implementation.

### 1.1 Strategy: Build-Fast-and-Fail-Fast

- TDD first for new behavior: failing test -> minimal implementation -> pass -> continue.
- One atomic change at a time, then run relevant tests immediately.
- If regression appears, fix it before any next change.
- Debug with concrete evidence; remove temporary debug logs after verification.

### 1.2 Coding Rules

- Keep JS modules within the 99-real-code-line rule (split when needed).
- Enforce single responsibility per module.
- Avoid hardcoded magic numbers; use CSS variables and JS constants.
- Use bottom-up modular design with named ES exports.
- Keep tests in dedicated folders (`tests/unit`, `tests/e2e`).
- Keep repository clean: no unnecessary or temporary artifacts.

### 1.3 Design and Responsive Rules

- Maintain mobile-first baseline; desktop rules layer via media queries.
- Desktop at `>=1024px` must look clearly desktop-oriented, not phone-like.
- Preserve breakpoints: `<=480`, `<=768`, `<=1024`, `>1024`, plus `max-height<=600` landscape mode.
- Ensure touch targets remain at least `44x44`.
- No horizontal overflow at any breakpoint.
- Keep Safari compatibility (`-webkit-` where relevant), `prefers-color-scheme`, and `viewport-fit=cover`.

### 1.4 Desktop UX Rules

- Strengthen visual hierarchy (titles, spacing rhythm, grouped controls).
- Increase information density via structured columns, not by shrinking typography.
- Keep tab-to-section mapping 1:1 and navigation precise.
- Keep sticky top tabs and sticky bottom actions stable and non-overlapping.
- Preserve accessibility semantics and keyboard/focus order.

## Execution Plan (Phased, Atomic)

### Phase 1: TDD Baseline (Expected Red)

- Add desktop-focused E2E assertions at `1024x900`:
  - panel width and desktop readability target
  - section-level multi-column layout beyond only `.control-row--pair`
  - accurate tab navigation and active-state behavior
  - sticky footer flush-to-edge and non-clipping behavior
- Run targeted E2E and confirm failure baseline first.

### Phase 2: Desktop Information Architecture Refactor

- Refactor section internals in `index.html` for desktop grouping and scanability.
- Preserve existing IDs and stable hooks used by JS/tests.
- Keep section order and tab mapping stable.

### Phase 3: Desktop Layout System

- Implement desktop-only grid/layout architecture in `css/style.css` for `>=1024px`.
- Tune desktop tokens in `css/variables.css` (panel width, spacing, section rhythm).
- Keep phone/tablet behavior unchanged.

### Phase 4: Behavior Compatibility

- Verify reset section/all still targets correct controls after refactor.
- Adjust `settings-tabs-nav` only if offset/active logic regresses.

### Phase 5: Regression, Hardening, and Cleanup

- Run targeted E2E for new desktop behaviors and existing settings critical flows.
- Run full regression matrix:
  - `npm run test:unit`
  - `npm run test:e2e`
  - `npm test`
- Resolve regressions before finalizing.
- Remove temporary debugging artifacts.

### Phase 6: Changelog

- Record desktop IA/layout overhaul and testing coverage in `8.4.1` (or next active version block) with today’s date.

## Test Cadence

- After each atomic UI/CSS or JS change:
  - run targeted E2E for touched behavior.
- After each phase:
  - run `npm run test:unit`
  - run targeted E2E slice.
- Final gate:
  - `npm run test:unit`
  - `npm run test:e2e`
  - `npm test`

## Risks and Mitigations

- **Tab-position drift risk**: preserve scroll offsets and validate tab-to-section accuracy with E2E.
- **Desktop overflow risk**: add explicit overflow assertions at `1024px+`.
- **Reset behavior regression risk**: keep dedicated reset-all/reset-section E2E checks post-refactor.
- **Mobile regression risk**: avoid touching mobile base rules; verify phone viewport tests.

## Acceptance Criteria

- At `1024px+`, settings are visibly desktop-oriented with stronger hierarchy and multi-column structure.
- Desktop panel no longer appears as a mobile sheet transplanted to desktop.
- Quick-nav tabs navigate accurately and active states are stable.
- Sticky footer actions remain flush, visible, and non-overlapping.
- Existing functionality remains correct (localization, reset actions, preview-update flow).
- All tests pass (targeted E2E, full E2E, unit, full suite).
