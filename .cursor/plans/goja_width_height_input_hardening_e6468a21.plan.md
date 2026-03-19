---
name: Width Height Input Hardening
overview: "Option 4: Harden the Width and Height number inputs with inputmode, range hint, real-time validation with inline error state, and optional computed aspect-ratio display. Adds to the Goja Settings Polish plan."
todos: []
isProject: false
---

# Width / Height Input Hardening (Option 4)

**Parent plan:** [goja_settings_polish_381858f4.plan.md](goja_settings_polish_381858f4.plan.md)

This section is to be merged into the Settings Polish plan as **3.9 Width/Height Input Hardening**. It keeps the existing number inputs but makes them more user-friendly and error-proof.  
  
1. Guiding Principles (Explicit)

Apply these throughout implementation. Source: [goja_export_options_enhancement_53bc6353.plan.md](goja_export_options_enhancement_53bc6353.plan.md) and [goja_improvement_proposals_9895157a.plan.md](goja_improvement_proposals_9895157a.plan.md).

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

## Current State

- [index.html](02product/01_coding/project/goja/index.html) lines 82-89: Two `<input type="number">` for `#frameWidth` and `#frameHeight` with `min="320" max="4096" step="1"`
- [js/app.js](02product/01_coding/project/goja/js/app.js): `validateFrameInput(el)` on blur; clamps invalid values, shows toast; `onExport` also clamps before export
- [js/config.js](02product/01_coding/project/goja/js/config.js): `FRAME_MIN=320`, `FRAME_MAX=4096`
- No `inputmode`, no range hint, no inline error state, no aspect-ratio feedback

---

## Proposed Changes (Detailed)

### 1. Input Hardening Attributes

**index.html** — add to both `#frameWidth` and `#frameHeight`:

```html
<input type="number" id="frameWidth" value="1080" min="320" max="4096" step="1"
  inputmode="numeric" pattern="[0-9]*"
  aria-describedby="frameDimensionHint" aria-invalid="false">
```

- `**inputmode="numeric"**` — Promotes numeric keypad on mobile; reduces accidental decimals/symbols
- `**pattern="[0-9]*"**` — Hints to browser for validation; some mobile browsers use it for keyboard
- `**aria-describedby="frameDimensionHint"**` — Links to the hint element (range text)
- `**aria-invalid**` — Set by JS when value is invalid; supports screen readers and can drive CSS

### 2. Range Hint

**index.html** — add a hint below the Width/Height group (or below each input):

```html
<div class="control-group">
  <label for="frameWidth" data-i18n="width">Width</label>
  <input type="number" id="frameWidth" ...>
</div>
<div class="control-group">
  <label for="frameHeight" data-i18n="height">Height</label>
  <input type="number" id="frameHeight" ...>
</div>
<p class="control-hint" id="frameDimensionHint" data-i18n="frameDimensionHint">320–4096 px</p>
```

**i18n:** New key `frameDimensionHint` in all locales (e.g. "320–4096 px" / "320–4096 像素").

### 3. Real-Time Validation

**app.js** — extend validation logic:

- Add `input` listener (in addition to existing `blur`) that runs validation
- Use a short debounce (~150–300ms) to avoid firing on every keystroke
- On invalid: set `aria-invalid="true"`, add CSS class `.invalid`, clamp value, show toast (once per "session" of invalid state to avoid spam)
- On valid: set `aria-invalid="false"`, remove `.invalid`
- Keep existing `validateFrameInput` for blur; share clamping logic

**Validation rules (unchanged):** `FRAME_MIN` ≤ value ≤ `FRAME_MAX`; NaN → `FRAME_MIN`.

### 4. Inline Error State (CSS)

**css/style.css** — add:

```css
.control-group input[type="number"].invalid,
.control-group input.invalid {
  border-color: var(--color-danger);
  outline-color: var(--color-danger);
}
```

- Use existing `--color-danger` from [css/variables.css](02product/01_coding/project/goja/css/variables.css)
- Optional: `:focus` styling for invalid state

### 5. Optional: Computed Aspect Ratio Display

**index.html** — add read-only line below inputs:

```html
<p class="control-feedback" id="frameDimensionFeedback" aria-live="polite">
  <span data-i18n="frameDimensions">1080 × 1350</span>
  <span id="frameAspectRatio">(4:5)</span>
</p>
```

**app.js** — on `input`/`change` of frameWidth or frameHeight:

- Update `#frameDimensionFeedback` with "W × H"
- Compute GCD-reduced ratio (e.g. 1080/1350 → 4/5), display "(4:5)"
- Use `aria-live="polite"` so screen readers announce updates
- **i18n:** `frameDimensions` can be a template like "{w} × {h}" or two separate numbers

**Scope:** Mark as optional; implement if time allows.

---

## Implementation Order (TDD)

1. **HTML** — Add `inputmode`, `pattern`, `aria-describedby`, `aria-invalid` to inputs; add `#frameDimensionHint` with i18n
2. **i18n** — Add `frameDimensionHint` to all 11 locales
3. **CSS** — Add `.invalid` styles for number inputs
4. **JS** — Extend `validateFrameInput` to support `setInvalidState(input, isValid)`; add debounced `input` listener; set `aria-invalid` and `.invalid` class
5. **Unit test** — `validateFrameInput` returns clamped value; sets invalid state when out of range
6. **E2E** — Frame width/height: type invalid value, blur, verify clamp and visual feedback
7. **Optional** — Aspect ratio display + i18n

---

## Files to Modify


| File                                                                              | Changes                                                                     |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [index.html](02product/01_coding/project/goja/index.html)                         | Input attributes; `#frameDimensionHint`; optional `#frameDimensionFeedback` |
| [js/app.js](02product/01_coding/project/goja/js/app.js)                           | Debounced input validation; `setInvalidState`; optional aspect ratio update |
| [css/style.css](02product/01_coding/project/goja/css/style.css)                   | `.invalid` styles for number inputs                                         |
| [js/locales/*.js](02product/01_coding/project/goja/js/locales/)                   | `frameDimensionHint`; optional `frameDimensions`                            |
| [tests/unit/](02product/01_coding/project/goja/tests/unit/)                       | Extract/refactor `validateFrameInput` for unit test if needed               |
| [tests/e2e/goja.spec.js](02product/01_coding/project/goja/tests/e2e/goja.spec.js) | E2E for invalid input → clamp + visual feedback                             |


---

## GATE Checkpoint

- Unit and E2E pass
- Width/Height inputs have `inputmode="numeric"`, range hint visible
- Invalid values show border/aria feedback, clamp on blur
- No regressions to preset buttons or export

---

## Merge Point

Append this as **Section 3.9** to [goja_settings_polish_381858f4.plan.md](goja_settings_polish_381858f4.plan.md), add to Implementation Order (step 9), and extend Files to Modify table.