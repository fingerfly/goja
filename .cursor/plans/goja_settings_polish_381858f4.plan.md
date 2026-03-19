---
name: Goja Settings Polish
overview: "Polish the Settings panel to align with the strategy, coding rules, and mobile/CSS UI rules from the Goja plans: accessibility improvements, config constants for magic values, touch-target compliance, CSS class-based visibility, and minor consistency fixes."
todos: []
isProject: false
---

# Goja Settings Polish Plan

---

## 1. Guiding Principles (Explicit)

Apply these throughout implementation. Source: [goja_export_options_enhancement_53bc6353.plan.md]() and [goja_improvement_proposals_9895157a.plan.md]().

### 1.1 Development Strategy

- **Build-fast, fail-fast:** One change at a time; run tests after each.
- **TDD first:** Write failing tests before implementation where possible.
- **99-line rule:** Split a source file exceeding 99 real-code lines into smaller files for modularity.
- **No hardcoding:** ALWAYS use config/constants for all magic values.
- **Bottom-up modules:** Small cooperating units, testable in isolation.
- **Non-breaking changes:** New code must not break existing behavior without explicit approval.
- **Reuse code:** Always consider reusing code at the beginning time or in the design phase.

### 1.2 Coding Rules

- Prefer the functional programming paradigm: pure functions, immutable data, higher-order functions.
- Tests in `tests/` (unit: `tests/unit/`, E2E: `tests/e2e/`).
- ES modules, named exports.
- Run full test suite after every phase.

### 1.3 Responsive / Mobile UI Rules

- **Touch targets:** ≥ 44×44px (`--touch-min`).
- **Mobile-first:** Base styles for phone; `@media (min-width: 768px)` for tablet/desktop.
- **Settings pattern:** Bottom sheet (60vh) on phone; side panel (320px) on tablet.
- **Variables:** Use CSS custom properties from [css/variables.css](02product/01_coding/project/goja/css/variables.css) for all layout/spacing values.

---

## 2. Current State Summary

**Settings structure:**

- [index.html](02product/01_coding/project/goja/index.html): Backdrop + aside panel, 3 fieldsets (Grid, Export, Watermark)
- [js/settings-panel.js](02product/01_coding/project/goja/js/settings-panel.js): open/close, focus return, Escape key (36 lines)
- [css/style.css](02product/01_coding/project/goja/css/style.css): Bottom sheet (60vh) on mobile, side panel (320px) on tablet+

**Findings:**

- Settings panel lacks `role="dialog"`, `aria-labelledby`, `aria-modal`
- Magic numbers in HTML: gap slider min/max (0, 20), watermark opacity (0.3–0.9, default 0.8), frame min/max (320, 4096) — only frame uses config
- Watermark groups use inline `style="display:none"` instead of CSS classes
- Checkbox + label control group has no explicit min-height; touch target may be under 44px
- Preset "4:3" uses 1080×1440, which is 3:4 (portrait), not 4:3 (landscape)
- Media query uses 769px; variables define `--bp-md: 768px` — slight inconsistency
- **Bug:** Filename fields missing in i18n — `exportFilename`, `exportFilenamePlaceholder`, `exportUseDate` exist only in `en.js`; all 10 other locales fall back to English

---

## 3. Proposed Changes

### 3.1 Bug-fix: Filename i18n

**Problem:** The Settings Export section label "Filename", placeholder "goja-grid", and checkbox "Add date to filename" use `data-i18n="exportFilename"`, `data-i18n-placeholder="exportFilenamePlaceholder"`, and `data-i18n="exportUseDate"`. Only [js/locales/en.js](02product/01_coding/project/goja/js/locales/en.js) defines these keys. All other locales (zh-Hans, zh-Hant, de, nl, es, it, tr, fi, ja, eo) are missing them, so non-English users see English text.

**Fix:** Add `exportFilename`, `exportFilenamePlaceholder`, and `exportUseDate` to all 10 locale files with appropriate translations.

### 3.2 Accessibility

**Settings panel (index.html + settings-panel.js):**

- Add `id="settingsTitle"` to the h2
- Add `role="dialog"`, `aria-labelledby="settingsTitle"`, `aria-modal="true"` to the panel
- Ensures screen readers announce it as a modal dialog

**Optional (GATE 7 from improvement proposals):**

- Focus trap inside panel while open: cycle Tab to first/last focusable instead of escaping

### 3.3 Config Constants (No Hardcoding)

**Extend [js/config.js](02product/01_coding/project/goja/js/config.js):**

```javascript
export const GAP_MIN = 0;
export const GAP_MAX = 20;
export const GAP_DEFAULT = 4;
export const WATERMARK_OPACITY_MIN = 0.3;
export const WATERMARK_OPACITY_MAX = 0.9;
export const WATERMARK_OPACITY_DEFAULT = 0.8;
```

**index.html:** Use data attributes or JS to set `min`, `max`, `value` from config, or keep static but document that values must match config. Preferred: set via JS on init so single source of truth.

**app.js:** Import constants; ensure `parseInt(gapSlider.value)` is validated against GAP_MIN/GAP_MAX if needed.

### 3.4 Touch Targets (Mobile UI Rule)

**Checkbox control group ([css/style.css](02product/01_coding/project/goja/css/style.css)):**

- Add rule: `.control-group:has(input[type="checkbox"]) label` with `min-height: var(--touch-min)`, `display: flex`, `align-items: center`, `gap`
- Ensures the whole label (checkbox + text) forms a ≥ 44px touch target

### 3.5 Replace Inline Styles with CSS Classes

**Watermark conditional groups:**

- Add utility class `.hidden { display: none !important; }` or reuse existing pattern
- Remove `style="display:none"` from `#watermarkPosGroup`, `#watermarkOpacityGroup`, `#watermarkFontSizeGroup`, `#watermarkTextGroup`
- Add class `hidden` by default to groups that start hidden
- In [js/app.js](02product/01_coding/project/goja/js/app.js) `wmType.addEventListener('change', ...)`: use `classList.add/remove('hidden')` instead of `el.style.display`

### 3.6 Aspect Preset Label Fix

**Current:** "4:3" preset uses `data-w="1080" data-h="1440"` → 1080/1440 = 3:4 (portrait).

**Options:**

- A) Change label to "3:4" — matches actual ratio
- B) Change data to 1440×1080 for true 4:3 landscape — matches label

Recommend **A** (relabel to 3:4): 1080×1440 is a common portrait format; changing to landscape would alter behavior for users who rely on portrait.

**Files:** [index.html](02product/01_coding/project/goja/index.html) (data-i18n), all [js/locales/*.js](02product/01_coding/project/goja/js/locales/) (`preset43` → `preset34` or new key).

### 3.7 Media Query Consistency

**css/style.css:** Use `@media (min-width: 768px)` to align with `--bp-md: 768px`. Current `769px` may be intentional to avoid boundary; if so, add comment. Otherwise use `var(--bp-md)` or 768.

### 3.8 Optional Polish

- **Loading overlay:** Replace `rgba(255,255,255,0.85)` with a CSS variable (e.g. `--overlay-bg`) that adapts in dark mode.
- **Export options visibility:** Use `classList.toggle('hidden')` instead of `style.display` for Share/Copy buttons in [js/export-options.js](02product/01_coding/project/goja/js/export-options.js) — aligns with watermark approach.

---

## 4. Implementation Order (TDD)

1. **Bug-fix: Filename i18n** — add `exportFilename`, `exportFilenamePlaceholder`, `exportUseDate` to all 10 locale files; E2E: verify label/placeholder in zh-Hans.
2. **Config constants** — add to config.js; unit test that constants exist and have expected values.
3. **HTML/CSS hidden class** — add `.hidden`; refactor watermark groups to use it; update app.js.
4. **Touch target for checkbox** — add CSS; verify with E2E or manual check.
5. **Accessibility attributes** — update index.html and ensure focus/aria behavior in tests.
6. **Preset 3:4 relabel** — update i18n and HTML.
7. **Media query** — adjust if desired.
8. Run full test suite after each step.

---

## 5. Files to Modify


| File                                                                                                    | Changes                                                                                                           |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [js/locales/zh-Hans.js](02product/01_coding/project/goja/js/locales/zh-Hans.js) + 9 others              | Add `exportFilename`, `exportFilenamePlaceholder`, `exportUseDate` translations (bug-fix)                         |
| [js/config.js](02product/01_coding/project/goja/js/config.js)                                           | Add GAP_*, WATERMARK_OPACITY_*                                                                                    |
| [index.html](02product/01_coding/project/goja/index.html)                                               | Settings panel role/aria; watermark groups use class; gap/watermark values from config (or JS init); preset label |
| [css/style.css](02product/01_coding/project/goja/css/style.css)                                         | `.hidden`, checkbox touch target, optional media query                                                            |
| [js/app.js](02product/01_coding/project/goja/js/app.js)                                                 | Import config; init gap/watermark from config; use classList for watermark visibility                             |
| [js/locales/*.js](02product/01_coding/project/goja/js/locales/)                                         | preset43 → preset34 (or new key) for "3:4"                                                                        |
| [tests/unit/config.test.js](02product/01_coding/project/goja/tests/)                                    | New: assert config constants                                                                                      |
| [tests/unit/settings-panel.test.js](02product/01_coding/project/goja/tests/unit/settings-panel.test.js) | Extend for aria attributes when open                                                                              |
| [tests/e2e/goja.spec.js](02product/01_coding/project/goja/tests/e2e/goja.spec.js)                       | Filename i18n verification; optional: settings panel role, checkbox touch area                                    |


---

## 6. GATE Checkpoint

- **GATE:** All unit and E2E tests pass; filename i18n works in all locales; Settings panel has role/aria; no inline `display` on watermark groups; checkbox meets touch min; config has no magic numbers for gap/watermark; preset 3:4 labeled correctly.

---

## 7. Out of Scope (Not in This Polish)

- Focus trap (optional future enhancement)
- Reorganizing Language into separate "General" section
- Loading overlay dark mode (can be separate change)

