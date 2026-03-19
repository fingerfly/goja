---
name: iOS Long-Press Fix
overview: Prevent iOS/Android default image context menu from appearing when long-pressing grid images, so the app's custom Remove menu shows instead.
todos: []
isProject: false
---

# Fix iOS Long-Press Image Context Menu Conflict

## Coding Rules (from [Goja Improvement Proposals](goja_improvement_proposals_9895157a.plan.md))

Apply these rules during implementation.

### Development Strategy

- **Build-fast, fail-fast:** One change at a time; run tests after each.
- **TDD first:** Write failing tests before implementation where possible.
- **Non-breaking changes:** New code must not break existing behavior without explicit approval.

### Coding Rules

- Prefer functional style: pure functions, immutable data, higher-order functions.
- Tests in `tests/` (unit: `tests/unit/`, E2E: `tests/e2e/`).
- ES modules, named exports.
- Run full test suite after every phase.

### Responsive / Mobile UI

- Touch targets ≥ 44×44px (`--touch-min`).
- Mobile-first: base styles for phone, `@media` for tablet/desktop.
- Use CSS custom properties from [css/variables.css](02product/01_coding/project/goja/css/variables.css).
- This fix targets mobile touch (long-press); ensure changes remain mobile-first and do not regress touch UX.

---

## Problem

On iPhone (and iPad), long-pressing a grid image triggers iOS's native callout menu ("Save Image", "Copy", etc.) instead of or before the app's custom Remove menu. On Android, the browser's context menu may also appear. Users want the app's Remove action, not the system menu.

## Solution

### 1. Add CSS to Suppress iOS Native Callout

In [css/style.css](02product/01_coding/project/goja/css/style.css), update `.preview__grid img` (lines 187–195):

```css
.preview__grid img {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  object-fit: var(--image-fit, cover);
  display: block;
  cursor: grab;
  -webkit-touch-callout: none;   /* Suppress iOS long-press callout */
  -webkit-user-select: none;
  user-select: none;
}
```

- `-webkit-touch-callout: none` — Disables the iOS system callout menu on long-press (Safari/WebKit).
- `-webkit-user-select: none` / `user-select: none` — Prevents selection highlight on long-press (both iOS and Android).
- Existing `var(--image-fit, cover)` etc. are preserved; no new magic values (per **No hardcoding**).

### 2. Strengthen contextmenu Handling (Belt-and-Suspenders for Android)

In [js/cell-context-menu.js](02product/01_coding/project/goja/js/cell-context-menu.js), add a capture-phase listener so `preventDefault()` runs early and reliably on Android Chrome:

```javascript
// Add before the existing contextmenu listener (around line 11)
gridEl.addEventListener('contextmenu', (e) => {
  if (e.target.closest('img')) e.preventDefault();
}, { capture: true });
```

The existing bubbling `contextmenu` handler (lines 11–18) remains and continues to show the custom menu.

### 3. Update CHANGELOG

In [CHANGELOG.md](02product/01_coding/project/goja/CHANGELOG.md), add under `[Unreleased]`:

```markdown
### Fixed
- Suppress iOS/Android native image context menu on long-press so app Remove menu shows instead
```

### 4. Verification

Per **Build-fast, fail-fast** and **Run full test suite after every phase**:

- After each file change: run `npm test` in the goja project.
- Existing e2e test: `test('context menu on cell shows Remove and removes photo')` — uses `dispatchEvent('contextmenu')` and must still pass.
- Manual check on real iPhone: long-press grid image → app Remove menu appears, not iOS save/copy menu.

## Files to Modify


| File                                                                                | Change                                       |
| ----------------------------------------------------------------------------------- | -------------------------------------------- |
| [css/style.css](02product/01_coding/project/goja/css/style.css)                     | Add 3 CSS properties to `.preview__grid img` |
| [js/cell-context-menu.js](02product/01_coding/project/goja/js/cell-context-menu.js) | Add capture-phase `contextmenu` listener     |
| [CHANGELOG.md](02product/01_coding/project/goja/CHANGELOG.md)                       | Add Fixed entry                              |


## Risk / Compatibility

- `-webkit-touch-callout` is non-standard but widely supported on iOS Safari. Unsupported browsers ignore it.
- `user-select: none` on images does not affect normal interactions (tap, drag, scroll).
- Existing drag-and-drop and keyboard navigation remain unchanged.

