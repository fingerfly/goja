---
name: goja_context_menu_visual_comfort_plan
overview: Enhance the existing Oppo context-menu plan by adding a transparent, photo-friendly menu design that stays readable, auto-dismisses, and avoids frustrating visual obstruction on touch devices.
todos:
  - id: tdd-visual-regression-guards
    content: Add failing tests that preserve current menu behavior and auto-dismiss while enabling style changes.
    status: completed
  - id: implement-transparent-menu-style
    content: Apply frosted transparent menu CSS with -webkit/backdrop-filter fallback and maintain 44px touch targets.
    status: completed
  - id: validate-oppo-safe-behavior
    content: Run targeted and full tests to ensure no regressions in Oppo-safe context menu logic, touch flow, and desktop context menu.
    status: completed
  - id: document-visual-improvement
    content: Update changelog Unreleased section with transparent context-menu UX enhancement and test coverage.
    status: completed
isProject: false
---

# Goja Context Menu Visual Comfort Plan

## Mandatory Rules (Must Be Applied First)

Source to prepend and follow: []() (Rules section `1.1` to `1.3`, currently lines `39-84`).

- Build-fast/fail-fast: smallest change first; run relevant tests immediately after each atomic step.
- TDD first for new behavior: write failing test, implement minimal fix, re-run tests, then full suite.
- One change, one test cycle; do not batch broken changes.
- Keep modules small and single-purpose; split if file growth risks violating project modularity constraints.
- Use constants/CSS vars for magic numbers; avoid hardcoding.
- Keep test files in [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit) and [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/e2e](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/e2e).
- Preserve mobile usability: thumb-friendly controls, no overflow regressions, Safari compatibility (`-webkit-*` where needed).

### Mandatory Compliance Checklist

- Apply Build-Fast-and-Fail-Fast exactly: smallest change first, immediate relevant test run, fix breakages before next step.
- New behavior follows strict TDD: failing test first, minimal implementation, re-test, then continue.
- One atomic change at a time; do not batch unresolved work.
- Keep JS modules under the **99-line rule**; split modules before exceeding limit.
- Enforce single responsibility and bottom-up modular design.
- Prefer functional style (pure functions, immutable data, composition over mutation) where practical.
- Use named exports in ES modules; avoid monolithic structures.
- No hardcoded magic numbers; use JS constants and CSS custom properties.
- Use `tests/unit` for unit tests and `tests/e2e` for E2E tests.
- Keep codebase clean: no temporary artifacts after work completes.
- Responsive requirements must be validated for breakpoints: `<=480`, `<=768`, `<=1024`, `>1024`, and `max-height<=600`.
- Cross-platform UI requirements: minimum `44x44` touch targets, no horizontal overflow, thumb-reachable controls.
- CSS variables should live in `variables.css` when introducing new reusable values.
- Preserve Safari compatibility with required `-webkit-` prefixed behavior.
- Respect `prefers-color-scheme` behavior (no regressions to light/dark handling).
- Keep `viewport-fit=cover` support unchanged.
- During investigation/debugging, fail visibly (`console.warn` or catch logging), then remove temporary debug logs after fix is proven.

### Execution Protocol (Atomic)

1. Select exactly one small code change (single module/function scope).
2. Add/adjust one failing test for that change.
3. Implement the minimal code to pass.
4. Run the relevant targeted test suite immediately.
5. If failing, fix before any new edits.
6. Once passing, proceed to the next atomic change.
7. After all atoms pass, run full verification suites.

## Goal

Add a more transparent and visually comfortable context menu style so users can still see the photo underneath while keeping the Remove action clear, tappable, and reliable on Oppo/mobile browsers.

## Plan Alignment (Single Source of Truth)

- This plan is an extension of the Oppo context-menu implementation and should be executed as a single track with:
  - []()
- Before execution, sync overlapping todo statuses so there is no dual-plan drift.
- Use this plan for visual comfort requirements; keep behavior/timer/Oppo regression gates from the Oppo plan.

## Design Direction

- Use a frosted-glass menu surface: semi-transparent background + blur.
- Keep text/button contrast strong so readability is not lost.
- Keep touch ergonomics (44px+ target) and existing auto-dismiss behavior.
- Provide graceful fallback for browsers that do not support `backdrop-filter`.

## Target Files

- Menu behavior: [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/cell-context-menu.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/cell-context-menu.js)
- Menu styles: [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/css/style.css](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/css/style.css)
- Shared style tokens: [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/css/variables.css](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/css/variables.css)
- Unit tests: [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/cell-context-menu.test.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit/cell-context-menu.test.js)
- E2E tests: [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/e2e/goja.spec.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/e2e/goja.spec.js)
- Changelog: [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/CHANGELOG.md](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/CHANGELOG.md)

## Visual Spec (Proposed)

- `.cell-context-menu`
  - Background: translucent surface using CSS variables (no hardcoded magic values in rule bodies)
  - Light mode target opacity: `0.74` (current implementation)
  - Dark mode target opacity: `0.70` (current implementation)
  - Blur: `backdrop-filter: blur(8px)` with `-webkit-backdrop-filter`
  - Border: softer alpha border to reduce harsh blocking
  - Shadow: lighter, more diffused shadow
- `.cell-context-menu__btn`
  - Keep `min-height >= 44px`
  - Maintain clear focus/hover/active feedback with subtle tint and readable text on bright/dark photos
- Fallback
  - If `backdrop-filter` unsupported, use a slightly more opaque background for readability
  - Preserve visual consistency for `prefers-color-scheme` light/dark without reducing readability

## TDD Execution Sequence

1. Add failing unit tests for behavior contracts (unchanged menu open/close behavior, timer cleanup, auto-dismiss timing not regressed).
2. Add failing E2E checks that menu remains visible on tap, action still works, and idle auto-dismiss still works after style update.
3. Implement CSS transparency and blur with fallback in `style.css`.
4. Keep JS behavior stable; only adjust JS if needed for class/state hooks.
5. Run targeted unit and E2E tests after each atomic change.
6. Run full suites (`test`, `test:e2e`) and confirm diagnostics are clean.

### Verification Command Sequence

- Targeted unit checks during each atomic step: `npm run test:unit`
- Targeted E2E checks for context menu flows: `npm run test:e2e -- tests/e2e/goja.spec.js`
- Full verification before completion:
  - `npm run test`
  - `npm run test:e2e`
- Lint/diagnostics gate for touched files: use IDE diagnostics (`ReadLints`) and resolve newly introduced issues.

## Potential Issues And Mitigations

- **Readability regression on bright photos**: enforce stronger text contrast and validate over both bright and dark image fixtures.
- **No blur support on some browsers**: add explicit fallback path with higher-opacity background.
- **Performance/jank risk on low-end mobile GPUs**: keep blur radius modest; validate repeated open/close does not visibly stutter.
- **Visual-only change not captured by unit tests**: add E2E assertions for menu visibility and behavior continuity, plus manual visual checklist to confirm comfort/readability goals.
- **Fallback path under-tested**: add explicit fallback acceptance check and manual run scenario for browsers lacking `backdrop-filter`.

## Acceptance Criteria

- Context menu appears less visually intrusive and allows seeing photo content underneath.
- Remove action remains clearly readable and easy to tap.
- Existing Oppo overlap fix remains effective.
- Auto-dismiss timing behavior remains unchanged (1500ms baseline, 1200-1800ms observed tolerance).
- Desktop right-click behavior and touch tap behavior remain correct.
- Fallback rendering is readable on browsers without `backdrop-filter`.
- No noticeable interaction jank when opening/closing menu repeatedly on mobile.
- Menu text/button contrast target is at least WCAG AA-level readability in practical QA checks on bright and dark photos.
- Transparency uses configured variables with light/dark targets validated in tests:
  - Light mode alpha in practical check: `0.68` to `0.90`
  - Dark mode alpha target range: `0.65` to `0.78`
- Unit + E2E suites pass with no regressions.

## Implementation Status

- Visual-comfort plan todos are completed.
- Implemented in:
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/css/variables.css](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/css/variables.css)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/css/style.css](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/css/style.css)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/e2e/goja.spec.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/e2e/goja.spec.js)
  - [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/CHANGELOG.md](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/CHANGELOG.md)
- Verification completed with passing suites:
  - `npm run test`
  - `npm run test:e2e`

## Manual Review Checklist

- On phone viewport, open menu over bright and dark photos; verify readability in both cases.
- Confirm photo under menu remains partially visible.
- Confirm Remove action can be triggered quickly and reliably.
- Confirm menu still auto-dismisses when idle.
- Disable/ignore blur support scenario and verify fallback remains readable.
- Confirm no layout overflow or flicker when repeatedly opening menu.
- Confirm visual settings in CSS come from variables (not hardcoded values in component rules).

