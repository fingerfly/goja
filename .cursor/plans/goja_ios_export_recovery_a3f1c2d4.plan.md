---
name: iOS Export Recovery
overview: >-
  Close the remaining iPhone/Safari export orphan-state bug after
  open-in-new-tab and in-app-browser return. PC export is fixed (10.2.6–10.2.8);
  10.2.9 and 10.2.11 reduced but did not eliminate real-device failure.
  TDD-first hardening of export UI teardown, bfcache/DOM resync, and iOS
  lifecycle coverage with mandatory manual iPhone acceptance.
todos:
  - id: rev69-tdd-ios-export-recovery-red
    content: >-
      TDD red — unit tests for bfcache persisted pageshow restoring orphan
      backdrop, pagehide-before-open-tab teardown, DOM/guard desync, and
      idempotent hard reset; extend export-options open-in-new-tab ordering
      tests for iOS navigation deferral.
    status: completed
  - id: rev70-export-ui-hard-reset
    content: >-
      Add forceExportUiReset() in export-flow.js (or thin export-ui-reset.js)
      that always clears sheet/backdrop DOM, exportInProgress, exportPhase,
      and syncs action buttons; make ensureExportUiIdle and lifecycle hooks
      call it idempotently.
    status: completed
  - id: rev71-pagehide-proactive-teardown
    content: >-
      On pagehide/visibility hidden during options phase, proactively dismiss
      sheet and run onDismiss before Safari freezes or bfcache snapshots stale
      DOM; avoid leaving .open classes in frozen page state.
    status: completed
  - id: rev72-bfcache-dom-resync
    content: >-
      On pageshow persisted, schedule rAF + microtask double-pass hard reset
      so restored DOM from bfcache cannot re-win over JS teardown; export
      guard must be idle even when sheet looks open from snapshot.
    status: completed
  - id: rev73-ios-lifecycle-belt
    content: >-
      Add freeze/resume listeners when supported; debounced focus/visibility
      recovery for in-app-browser overlay return without pagehide; gate iOS-only
      paths behind isIosLikeDevice from export-handler.js (reuse, do not
      duplicate UA logic).
    status: completed
  - id: rev74-playwright-bfcache-e2e
    content: >-
      E2E with iPhone UA — simulate PageTransitionEvent persisted pageshow
      after open-in-new-tab; assert Export enabled and backdrop closed; second
      export opens sheet.
    status: completed
  - id: rev75-manual-iphone-checklist
    content: >-
      Document and execute manual iPhone matrix (open-in-new-tab + in-app
      back, Share sheet return, second export, PWA vs Safari tab); record pass
      evidence before closeout.
    status: pending
  - id: rev76-validation-gate-changelog
    content: >-
      Full npm test + test:e2e; cloc on touched JS; CHANGELOG [Unreleased];
      version bump only after user confirms iPhone pass.
    status: in_progress
isProject: false
---

# iOS Export Recovery (Wave 17)

## Coding Rules (from [Goja Improvement Proposals](goja_improvement_proposals_9895157a.plan.md))

- **TDD first:** failing tests before production changes.
- **Build-fast, fail-fast:** one rev at a time; run targeted tests after each.
- **SLOC < 100** per touched JS file; split helpers if export-flow grows.
- **Non-breaking on PC:** recovery paths must be idempotent; desktop behavior
  must not regress (Playwright desktop + existing export e2e).
- Tests live under `tests/unit/` and `tests/e2e/`.
- Run full suite before rev76 closeout.

## Problem Statement (canonical)

Goja **10.2.11** on **iPhone / Safari** can enter an **unrecoverable orphan
export UI state** after **Open in new tab** and returning via the **in-app
browser back control (`<`)**. Windows PC export is **fixed** (10.2.6–10.2.8
Worker/SW/concurrency issues). Commits **10.2.9** and **10.2.11** targeted
iOS lifecycle recovery; **527 unit + 81 e2e pass** but **real iPhone still
fails**.

### Symptoms (iPhone)

- Gray **export options backdrop** remains visible.
- Top **Export** stuck **disabled** and/or label **「导出中…」**.
- Repeat Export ineffective; user cannot start a normal export flow.

### Export state machine (reference)

| Phase | `exportPhase` | Export button (correct) |
|-------|---------------|-------------------------|
| idle | `idle` | enabled, 「导出」 |
| rendering | `rendering` | disabled, 「导出中…」 |
| options sheet | `options` | enabled, 「导出」 (10.2.11+) |

**Failure:** `exportInProgress`, `exportPhase`, and sheet/backdrop DOM **desync**
after Safari freeze, bfcache restore, or in-app-browser return.

### Primary repro path

```
Add photos → Export → render completes → options sheet
→ Open in new tab → in-app browser « back to Goja
→ orphan backdrop and/or stuck Export
```

### Variants to cover

- Safari suspends page **before** sheet dismiss completes (10.2.9).
- bfcache **`pageshow` persisted** restores pre-dismiss DOM (10.2.10).
- Overlay return **without `pagehide`** (10.2.11 `focus` — still insufficient).
- Second export hang after tab switch (mitigated by main-thread export on iOS;
  verify not regressed).

### Out of scope

- PC Worker/SW export hang (closed 10.2.6–10.2.8).
- Watermark color, long-press menu, tile controls (other waves).

## Root-Cause Hypotheses (to falsify in rev69)

1. **bfcache DOM resurrection:** `pagehide` clears JS state but bfcache
   restores **frozen DOM** with `.open` on backdrop/sheet **after** recovery
   runs on `pageshow`.
2. **Recovery too early:** `syncOnShow` runs once on `pageshow`; restored
   snapshot re-applies visible sheet **after** `ensureExportUiIdle`.
3. **Incomplete teardown before navigation:** `openTabBtn` dismisses sheet
   synchronously, but Safari navigates away before `onDismiss` / DOM paint
   completes; frozen page retains `.open`.
4. **In-app browser lifecycle gap:** WeChat/embedded WebView back may not
   emit `pagehide`; `focus` alone is insufficient or races with visibility.
5. **Guard/sheet mismatch:** `exportInProgress=true`, `exportPhase=options`,
   sheet DOM closed — recovery skips because logic assumes consistency.

## Solution Strategy

### A. Idempotent hard reset (rev70)

Introduce **`forceExportUiReset(state, updateActionButtons)`**:

- Remove `.open` from `#exportOptionsSheet` and `#exportOptionsBackdrop`.
- Set `aria-hidden="true"` on both.
- Run `dismissExportOptions(false, { notify: false })` if listeners active.
- Set `exportInProgress = false`, `exportPhase = 'idle'`.
- Call `updateActionButtons(state.photos.length, false)`.
- Safe to call multiple times; no throw.

Wire into `ensureExportUiIdle`, lifecycle hooks, and **start of `runExport`**.

### B. Proactive teardown on hide (rev71)

When `exportPhase === 'options'` and document becomes hidden (`pagehide` or
`visibilitychange` → hidden):

- Dismiss sheet with **`notify: true`** so `onDismiss` runs **before** freeze.
- Ensures bfcache snapshot does not contain open sheet.

**Open in new tab handler** ([export-options.js](js/export-options.js)):

- Keep order: dismiss → `onDismiss` → `window.open` (10.2.11).
- Optionally defer `window.open` to **`requestAnimationFrame`** (not
  `setTimeout(0)`) so dismiss paints once; add unit test for order.

### C. bfcache DOM resync (rev72)

On `pageshow` with **`event.persisted === true`**:

```javascript
forceExportUiReset(...);
requestAnimationFrame(() => forceExportUiReset(...));
```

Second pass catches DOM restored from bfcache after first JS reset.

### D. iOS lifecycle belt (rev73)

- Listen for **`freeze`** / **`resume`** when `document.onfreeze` exists.
- On **`resume`** or debounced **`focus`** (iOS only via `isIosLikeDevice`):
  if backdrop/sheet open OR `exportInProgress`, hard reset.
- Debounce 50–100 ms to avoid fighting legitimate sheet open.

Extract lifecycle wiring to **`export-page-lifecycle.js`** if
`export-flow.js` exceeds SLOC budget.

### E. Automated coverage gap (rev74)

Playwright cannot fully emulate iOS in-app browser, but can simulate:

- iPhone UA + open-in-new-tab + close tab + **`PageTransitionEvent('pageshow',
  { persisted: true })`** + assert Export enabled, no `.open` backdrop.
- Existing test
  `export works again after open in new tab and closing tab` — extend with
  persisted pageshow injection.

## Files to Modify

| File | Change |
|------|--------|
| [js/export-flow.js](js/export-flow.js) | hard reset, lifecycle rev71–73 |
| [js/export-options.js](js/export-options.js) | optional rAF before open; hide teardown hook |
| [js/export-handler.js](js/export-handler.js) | export `isIosLikeDevice` if needed by lifecycle module |
| [js/app-bootstrap.js](js/app-bootstrap.js) | wire lifecycle if moved to new module |
| [tests/unit/export-flow.test.js](tests/unit/export-flow.test.js) | bfcache, hard reset, desync cases |
| [tests/unit/export-options.test.js](tests/unit/export-options.test.js) | dismiss-before-open ordering, rAF deferral |
| [tests/e2e/goja.spec.js](tests/e2e/goja.spec.js) | persisted pageshow after open-in-new-tab |
| [CHANGELOG.md](CHANGELOG.md) | fix entry under `[Unreleased]` after user sign-off |

Optional new file (only if SLOC requires):

- `js/export-page-lifecycle.js` — lifecycle listeners + hard reset orchestration.

## Manual iPhone Acceptance Matrix (rev75 — mandatory gate)

Execute on **real iPhone in PWA standalone mode** (primary repro environment;
Safari tab optional cross-check):

| # | Steps | Pass criteria |
|---|--------|---------------|
| 1 | Export → Open in new tab → in-app `<` back | No backdrop; Export enabled 「导出」 |
| 2 | Repeat #1 three times consecutively | Each cycle succeeds |
| 3 | Export → Share → cancel or complete → return | No orphan UI |
| 4 | Export → Download → return | No orphan UI |
| 5 | Mid-render: switch app, return | Either completes or resets cleanly |
| 6 | Desktop Chrome regression (sanity) | Export + open-in-new-tab still works |

**Do not bump release version or mark wave closed until row 1–2 pass on device.**

## Validation Gates

### Targeted (after each rev)

```bash
npx vitest run tests/unit/export-flow.test.js tests/unit/export-options.test.js tests/unit/preview-updater.test.js
npx playwright test tests/e2e/goja.spec.js --grep "export"
```

### Full (rev76)

```bash
npm test
npm run test:e2e
cloc --by-file --include-lang=JavaScript js/export-flow.js js/export-options.js
```

### Acceptance

- All automated gates pass.
- Manual matrix rows 1–2 pass on iPhone (user confirmation).
- PC export paths unchanged (grep e2e export tests pass).
- No function > 60 lines; touched files ≤ 100 SLOC where practical.

## Execution Order

1. `rev69-tdd-ios-export-recovery-red`
2. `rev70-export-ui-hard-reset`
3. `rev71-pagehide-proactive-teardown`
4. `rev72-bfcache-dom-resync`
5. `rev73-ios-lifecycle-belt`
6. `rev74-playwright-bfcache-e2e`
7. `rev75-manual-iphone-checklist`
8. `rev76-validation-gate-changelog`

## Risk / Compatibility

- Double `forceExportUiReset` on desktop must not break normal sheet UX.
- Proactive `pagehide` dismiss must not revoke blob before open-in-new-tab
  handler creates object URL (open runs after dismiss in same turn — verify).
- Debounced focus recovery must not close sheet while user is actively
  choosing an export option on iOS (only run when document was hidden).

## Related Plans

- [goja_export_options_enhancement_53bc6353.plan.md](goja_export_options_enhancement_53bc6353.plan.md) — original options sheet design.
- [goja_watermark_tile_controls_ux_b4e8a1f2.plan.md](goja_watermark_tile_controls_ux_b4e8a1f2.plan.md) — Wave 15 (export hang fixes 10.2.6–10.2.7).

## Prior Fix Commits (context)

| Version | Commit | Focus |
|---------|--------|-------|
| 10.2.9 | `178ff226` | dismiss before open; lifecycle install; setTimeout(0) defer |
| 10.2.11 | `f3acc4b0` | isExportRendering split; sync open; focus recovery; iOS main thread |
