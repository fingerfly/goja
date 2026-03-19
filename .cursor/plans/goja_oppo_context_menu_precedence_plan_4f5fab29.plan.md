---
name: goja_oppo_context_menu_precedence_plan
overview: Implement a touch-first context action flow so Goja’s remove-photo action reliably takes precedence over Oppo Find X8 browser long-press behavior, while preserving desktop right-click behavior. Add timed auto-dismiss to the touch context menu. Follow strict TDD and incremental delivery with regression protection.
todos:
  - id: prepend-mandatory-rules
    content: Prepend and enforce mandatory rules from goja_photo_rotation_feature_eb7d8c5d.plan.md Rules section 1.1-1.3 (currently lines 39-84) at top of execution context.
    status: completed
  - id: tdd-add-touch-e2e-tests
    content: Add failing unit tests first, then failing E2E tests for touch tap-to-remove, long-press non-duplication, and desktop contextmenu regression.
    status: completed
  - id: refactor-contextmenu-touch-path
    content: Implement per-event origin routing (touch/pointer vs mouse) in cell-context-menu.js with explicit tap-vs-drag thresholds and preserved desktop behavior.
    status: completed
  - id: harden-native-menu-prevention
    content: Add defensive event suppression for native menus on touch targets without breaking drag-and-drop.
    status: completed
  - id: hybrid-device-safety
    content: Verify hybrid devices keep right-click desktop menu while touch-origin events use touch remove UI.
    status: completed
  - id: ui-touch-action-polish
    content: Style touch action UI and selection affordance with thumb-friendly sizing and consistent layering.
    status: completed
  - id: run-full-verification
    content: Run unit/e2e/integration tests incrementally and final full pass; resolve any lint or regression issues.
    status: completed
  - id: context-menu-auto-dismiss
    content: Add timed auto-dismiss behavior for the context menu with safe timer cleanup on remove click, outside close, and menu replacement.
    status: completed
  - id: context-menu-auto-dismiss-verification
    content: Verify auto-dismiss timing tolerance and regression safety, then run full verification suites.
    status: completed
isProject: false
---

# Goja Oppo Context Menu Precedence Plan

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

## Scope

Deliver a user-friendly and robust interaction model so touch users (especially Oppo Find X8 built-in browser) do not see overlapping native + Goja context menus when removing a photo from the grid, and ensure the menu auto-dismisses after a short idle period.

## Current Relevant Code

- Context menu and long-press logic: [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/cell-context-menu.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/cell-context-menu.js)
- App wiring for context menu: [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/app-bootstrap.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/app-bootstrap.js)
- Touch/callout CSS behavior on images: [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/css/style.css](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/css/style.css)
- Existing regression baseline tests: [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/e2e/goja.spec.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/e2e/goja.spec.js)

## Interaction Design Decision

Use **tap-to-select + explicit remove action sheet/dialog on touch devices** as the primary path, while keeping right-click context menu behavior for desktop.

Input-mode policy (hybrid-device safe):

- Do not switch behavior globally by device capability alone.
- Determine interaction path per event:
  - Pointer/touch-originated interaction => touch remove UI path.
  - Mouse-originated `contextmenu` => desktop context menu path.
- This preserves desktop right-click behavior on hybrid laptops/tablets while still fixing mobile browsers.

Why:

- Avoids OEM/browser-native long-press context menu collisions.
- More discoverable than hidden long-press gestures.
- Improves consistency across Android vendor browsers.

## Implementation Plan (TDD Sequence)

### 1) Add Failing Unit Tests First (TDD Guardrail)

- Add/extend unit tests in [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit):
  - event-origin routing: mouse vs touch/pointer behavior selection.
  - tap-vs-drag classifier behavior.
  - no-duplicate-menu guard logic.
  - cleanup logic for listeners/timers/menu instances.

### 2) Add Failing E2E and Integration-Style Regression Coverage

- Extend [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/e2e/goja.spec.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/e2e/goja.spec.js):
  - mobile profile tap shows Goja touch action UI.
  - selecting “Remove” removes exactly one photo.
  - repeated interactions do not create duplicate Goja menus/sheets.
  - long-press does not trigger a second Goja UI when touch-primary flow is active.
  - menu auto-dismisses after idle timeout when user takes no action.
  - existing desktop `contextmenu` remove test remains unchanged and passing.
- Run relevant integration-style tests from existing project scripts after each feature slice.

### 3) Refactor Context Menu Module into Device-Aware Paths

- In [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/cell-context-menu.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/cell-context-menu.js):
  - Keep desktop `contextmenu` flow.
  - Add touch flow entrypoint based on per-event origin (pointer/touch vs mouse), not coarse capability checks.
  - For touch path, open a dedicated, explicit action UI (sheet/popover style) on tap.
  - Ensure any long-press listeners are either removed from touch-primary flow or made defensive (non-passive where cancellation is required).
  - Enforce deterministic gesture thresholds via constants (no magic numbers):
    - `TAP_MAX_MOVE_PX = 8`
    - `TAP_MAX_DURATION_MS = 250`
    - if movement/duration exceeds threshold, treat as drag/gesture and do not open remove UI.
  - Add auto-dismiss constant with default timeout:
    - `CONTEXT_MENU_AUTO_DISMISS_MS = 1500`
    - timeout starts when menu opens and is cleared on explicit close paths.
    - expected observed dismiss timing tolerance for QA: `1200-1800ms`.

### 4) Prevent Native Menu Leakage on Target Surface

- Apply defensive event handling on grid images/container:
  - Capture-phase `contextmenu` prevention on actionable photo elements.
  - If long-press fallback remains, cancel early touch events where required (`passive: false` only where necessary).
- Maintain drag/reorder compatibility with existing touch drag logic in [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/drag-handler.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/drag-handler.js).

### 5) Build User-Friendly Touch Action UI

- Add/adjust UI styles in [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/css/style.css](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/css/style.css):
  - 44px+ touch targets.
  - Clear selected-state affordance on tapped photo.
  - High z-index and viewport-safe placement to avoid overlap issues.
- Reuse i18n key `removePhoto` for action labels; add keys only if strictly needed.

### 6) Add Timed Auto-Dismiss Behavior

- In [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/cell-context-menu.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/cell-context-menu.js):
  - auto-dismiss context menu after timeout when idle.
  - clear dismissal timer on:
    - Remove button click
    - outside click close
    - menu replacement by a new open
- Add/extend unit tests in [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/tests/unit):
  - menu is visible immediately after open
  - menu disappears after timeout via fake timers
  - cleanup prevents duplicate close side effects

### 7) Wire Through Bootstrap Without Broad Side Effects

- Keep invocation through [/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/app-bootstrap.js](/Users/luke/Documents/00_Mundo/02product/01_coding/project/goja/js/app-bootstrap.js) stable.
- Ensure state updates and preview rerender path remain identical after remove.

### 8) Regression & Full Test Verification

- Run targeted tests after each small change, then full suite at end:
  - Unit tests.
  - E2E tests including existing context-menu and new touch tests.
  - Integration-style tests defined by repository scripts.
- Confirm no lint regressions in touched files.

### Verification Command Sequence (Repository Commands)

- Unit tests (targeted during each atom): `npm run test:unit`
- E2E tests (targeted during each atom): `npm run test:e2e -- tests/e2e/goja.spec.js`
- Integration-style regression (targeted): `npm run test:e2e`
- Final full test pass before completion:
  - `npm run test`
  - `npm run test:e2e`
- Lint/diagnostics pass for touched files: no `lint` script exists in `package.json`; use IDE diagnostics (`ReadLints`) for all touched files and resolve newly introduced issues.

## Risk Controls

- **Drag-vs-tap conflict:** gate tap-action opening so drag gestures still reorder correctly.
- **Browser variance:** keep fallback `contextmenu` suppression and avoid relying on a single vendor-specific CSS flag.
- **UX discoverability:** explicit action UI over hidden long-press behavior.
- **Hybrid devices:** route by actual event origin so touch hardware presence alone does not alter mouse right-click behavior.
- **Timer race conditions:** always clear auto-dismiss timer before removing/replacing menu.

## Acceptance Criteria

- On Oppo Find X8 browser, Goja remove flow is tap-based and does not produce overlapping Goja + native menus during primary remove interaction.
- Touch flow is simple: tap photo → clear remove action.
- Desktop right-click remove flow still works.
- Long-press on touch path does not create duplicate Goja remove UIs.
- Context menu auto-dismisses after configured timeout when user does not act.
- All relevant tests pass (new + existing), with no regressions in photo reorder/export core flows.

## OPPO Find X8 Manual Verification Checklist

1. Open Goja in OPPO Find X8 built-in browser, load at least 3 photos, and confirm grid renders normally.
2. Tap one photo once and verify Goja’s touch remove-action UI appears immediately and clearly.
3. Trigger remove from Goja UI and verify exactly one selected photo is removed from the grid.
4. Repeat tap/remove on different photos 3-5 times and verify no duplicate Goja menus/sheets appear.
5. Long-press a photo and verify OPPO native browser context menu does not overlap or block Goja remove flow.
6. Tap a photo and wait without selecting Remove; verify the menu auto-dismisses at roughly 1500ms (acceptable tolerance: 1200-1800ms).
7. Start a drag/reorder gesture and verify reorder still works and does not accidentally open remove UI.
8. Verify no layout issues on phone viewport (no horizontal overflow, controls remain reachable).
9. Record result as PASS only if steps 2-8 all succeed; otherwise collect failure evidence (screen recording + exact step + browser version).

### OPPO QA Report Template (Expected vs Actual)

- Device/OS: OPPO Find X8 / Android ___
- Browser app + version: ___
- Goja build/version: ___
- Test date/time: ___
- Step tested: ___
- Expected: ___
- Actual: ___
- Result: PASS / FAIL
- If FAIL:
  - Repro frequency: Always / Intermittent (***/***)
  - Evidence: screen recording/screenshot file name ___
  - Notes: ___

