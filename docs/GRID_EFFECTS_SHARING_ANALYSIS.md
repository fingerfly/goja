# Grid Effects Code-Sharing Analysis

Preview (screen) and export (canvas) share watermark, capture date, vignette, filter, and other effects. This document identifies opportunities to abstract and share code.

---

## 1. Rules (Mandatory)

These rules MUST be followed during implementation. Violation means the implementation is incomplete. Source: goja_settings_polish_381858f4.plan.md, goja_export_options_enhancement_53bc6353.plan.md, goja_improvement_proposals_9895157a.plan.md.

### 1.1 Development Strategy

| Rule | Requirement |
|------|-------------|
| **Build-fast, fail-fast** | Make exactly one logical change at a time. Run the full test suite after each change. If tests fail, fix before proceeding. Do not batch unrelated changes. |
| **TDD first** | For any new behavior, write failing tests first. Implement only enough to make them pass. Do not skip this step where tests are feasible. |
| **99-line rule** | Any source file exceeding 99 real-code lines (excluding comments and blank lines) MUST be split into smaller modules. Do this proactively before adding more logic. |
| **No hardcoding** | All magic values (numeric constants, config strings) MUST live in [js/config.js](02product/01_coding/project/goja/js/config.js). Import from config; never inline literals for configuration. |
| **Bottom-up modules** | Build from small, cooperable units. Each module does one thing. Higher-level code composes these units. No monolithic blocks. |
| **Non-breaking changes** | New code MUST NOT break existing behavior. All existing tests MUST remain green. Breaking changes require explicit user approval first. |
| **Reuse code** | Before adding new logic, check for existing similar behavior. Reuse or extend existing modules rather than duplicating. |

### 1.2 Coding Rules

| Rule | Requirement |
|------|-------------|
| **Functional style** | Prefer pure functions, immutable data, higher-order functions. Avoid side effects in pure logic; isolate mutations. |
| **Test location** | Unit tests in `tests/unit/`. E2E tests in `tests/e2e/`. No tests elsewhere. |
| **Module system** | Use ES modules only. Use named exports. No default exports except for locales or legacy compatibility. |
| **Full test suite** | After every implementation phase, run the full test suite (`npm run test` and `npm run test:e2e`). All tests MUST pass before proceeding. |

### 1.3 Responsive / Mobile UI Rules

| Rule | Requirement |
|------|-------------|
| **Touch targets** | Interactive elements (buttons, checkboxes, labels, etc.) MUST have minimum 44×44px touch target. Use `min-height: var(--touch-min)` or equivalent. |
| **Mobile-first** | Base styles for phone; use `@media (min-width: 768px)` (or `var(--bp-md)`) for tablet/desktop enhancements. |
| **Settings pattern** | Settings panel: bottom sheet (60vh) on mobile; side panel (320px) on tablet/desktop. Use `--settings-sheet-height` and `--settings-panel-width`. |
| **CSS variables** | All layout, spacing, colors, and breakpoints MUST use CSS custom properties from [css/variables.css](02product/01_coding/project/goja/css/variables.css). Do not introduce new magic values in styles. |

### 1.4 Verification

Before considering a phase complete:

- All unit and E2E tests pass.
- No new magic numbers introduced; constants used from config.
- File length respects the 99-line rule where applicable.
- Touch targets and mobile layout rules are satisfied.

---

## 2. Current Sharing Status

| Module | Used By | Notes |
|--------|---------|-------|
| `watermark.js` → `drawWatermark` | app.js (preview canvas), export-handler, export-worker | Single source for canvas drawing |
| `capture-date-overlay.js` → `drawCaptureDateOverlay` | export-handler, export-worker | Shared for export |
| `image-effects.js` → `getFilterCss` | app.js (preview img style), image-processor (export) | Single source for filter CSS |
| `image-effects.js` → `drawVignetteOverlay` | export-handler, export-worker | Shared for export canvas |

---

## 3. Duplication & Opportunities

### 3.1 Options Building

**Problem:** Same options object is built in multiple places with duplicated defaults and value extraction.

| Location | Purpose | Options Built |
|----------|---------|---------------|
| `app.js` renderGrid (L221–251) | Watermark preview canvas | type, text, position, locale, opacity, fontScale, backgroundColor |
| `app.js` onExport (L271–287) | Full export options | All of the above + capture date, vignette, filter, format, etc. |
| `export-handler.js` (L8–13) | Default fallbacks | watermarkOpacity: 0.8, captureDateOpacity: 0.7, etc. |
| `export-worker.js` (L18–23) | Same defaults | Duplicated |

**Recommendation:** Create `getGridEffectsOptions(form)`. `app.js` calls it with current form refs in both `renderGrid` and `onExport`. Export-handler and export-worker use config constants for defaults instead of inline literals.

### 3.2 Default Values

**Problem:** Magic numbers `0.8`, `0.7`, `'bottom-right'`, `'bottom-left'` appear inline.

| Value | In app.js | In export-handler | In export-worker | Config |
|-------|-----------|-------------------|------------------|--------|
| watermark opacity | `?? '0.8'` | `= 0.8` | `= 0.8` | WATERMARK_OPACITY_DEFAULT |
| capture date opacity | `?? '0.7'` | `= 0.7` | `= 0.7` | CAPTURE_DATE_OPACITY_DEFAULT |
| watermark position | `?? 'bottom-right'` | `= 'bottom-right'` | `= 'bottom-right'` | — |
| capture date position | `?? 'bottom-left'` | `= 'bottom-left'` | `= 'bottom-left'` | CAPTURE_DATE_POSITION_DEFAULT |
| font scale | `?? '1'` | `= 1` | `= 1` | CAPTURE_DATE_FONT_SCALE_DEFAULT |

**Recommendation:** Add to config if missing, and import in export-handler/export-worker instead of inline defaults.

### 3.3 Capture Date: Preview vs Export

**Current:**
- **Preview:** DOM span with `formatDateTimeOriginal`, inline opacity/fontSize from form.
- **Export:** Canvas `drawCaptureDateOverlay` with pre-formatted `dateOriginals` array.

Shared parts: `formatDateTimeOriginal`, position class name, opacity, fontScale. Different: DOM vs canvas.

**Recommendation:** Extract `getCaptureDateDisplayOptions(form)` returning `{ position, opacity, fontScale }` so both preview and export use the same normalized values.

### 3.4 Watermark: Preview vs Export

**Current:** Both use `drawWatermark` on canvas. Preview creates a temp canvas overlay; export uses main canvas. Options are built inline in each place.

**Recommendation:** Use shared `getWatermarkOptions(form)` and pass its result to both preview overlay and export handler.

### 3.5 Vignette: Preview vs Export

**Current:**
- **Preview:** `vignetteStr` used in `radial-gradient(circle..., rgba(0,0,0,${vignetteStr}))`.
- **Export:** `drawVignetteOverlay(ctx, cell, { strength: vignetteStrength })`.

Same strength value, different rendering (CSS vs canvas).

**Recommendation:** Add `getVignetteStrength(form)` or include in `getGridEffectsOptions`. No need for a shared renderer.

---

## 4. Proposed Module: `js/grid-effects-settings.js`

```javascript
/**
 * Builds normalized grid effect options from form state.
 * Shared by preview (app.js renderGrid) and export (handleExport).
 */
import {
  WATERMARK_OPACITY_DEFAULT,
  CAPTURE_DATE_OPACITY_DEFAULT,
  CAPTURE_DATE_POSITION_DEFAULT,
  CAPTURE_DATE_FONT_SCALE_DEFAULT,
  VIGNETTE_STRENGTH_DEFAULT,
} from './config.js';

export function getWatermarkOptions(form) { ... }
export function getCaptureDateOptions(form) { ... }
export function getVignetteOptions(form) { ... }
export function getGridEffectsOptions(form, photos, formatDateTimeOriginal, getLocale) { ... }
```

**form** is a plain object `{ wmType, wmText, wmPos, wmOpacity, wmFontSize, showCaptureDate, ... }` built by app.js from DOM elements once per render/export.

**Export handler/worker:** Use config constants instead of inline defaults:

```javascript
// Before
watermarkOpacity = 0.8, watermarkFontScale = 1
captureDateOpacity = 0.7, captureDateFontScale = 1

// After
import { WATERMARK_OPACITY_DEFAULT, CAPTURE_DATE_OPACITY_DEFAULT, CAPTURE_DATE_FONT_SCALE_DEFAULT, CAPTURE_DATE_POSITION_DEFAULT } from './config.js';
```

Add to config if needed: `WATERMARK_POSITION_DEFAULT = 'bottom-right'`, `WATERMARK_FONT_SCALE_DEFAULT = 1`.

---

## 5. Implementation Order

1. Add any missing defaults to `config.js`.
2. Create `grid-effects-settings.js` with `getGridEffectsOptions` (and helpers).
3. Refactor `app.js` to call `getGridEffectsOptions` in renderGrid and onExport.
4. Refactor export-handler and export-worker to use config constants for defaults.
5. Add unit tests for `grid-effects-settings.js`.

---

## 6. Summary Table

| Opportunity | Effort | Impact |
|-------------|--------|--------|
| getGridEffectsOptions(form) | Medium | High – single source of truth |
| Config defaults in export-handler/worker | Low | Medium – consistency |
| getWatermarkOptions / getCaptureDateOptions | Low | Medium – used inside getGridEffectsOptions |
| Vignette strength helper | Low | Low – already simple |
