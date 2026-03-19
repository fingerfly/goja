---
name: Goja Security Risk Fixes
overview: Fix the security vulnerabilities, legal gaps, and reliability issues identified in the Goja codebase audit, following the established TDD-first and modular coding rules.
todos:
  - id: cmd-injection
    content: "TDD: Write publish.test.js, then refactor publish.js to use execFileSync with argument arrays (fixes command injection)"
    status: completed
  - id: export-reliability
    content: "TDD: Write export-handler.test.js, then add onerror handler to image loading in export-handler.js"
    status: completed
  - id: license-author
    content: Create GPL-3.0 LICENSE file, update package.json license and author fields
    status: completed
  - id: csp-sw
    content: Add CSP meta tag to index.html; update sw.js to network-first for navigation requests
    status: completed
  - id: cleanup
    content: Remove dead EXIF code from utils.js + tests, cap photo count at 9, derive remote URL in publish.js, untrack test artifacts
    status: completed
  - id: regression
    content: Run full test suite (unit + E2E), verify all fixes, fix any regressions
    status: completed
isProject: false
---

# Goja Security & Risk Fixes

## Coding Rules

(Carried forward from [goja_grid_cell_resizing_260bac6c.plan.md]())

- **TDD First**: Write failing tests before implementation. Every new function gets a unit test.
- **99-Line Rule**: No source file may exceed 99 real lines of code (excluding comments and blanks). If a module grows beyond this, split it.
- **Single Responsibility**: One module, one purpose.
- **Functional Programming**: Prefer pure functions, immutable data, composition over mutation.
- **No Hardcoding**: Use CSS custom properties and constants.
- **Bottom-Up Modular**: Build small cooperating modules, each testable in isolation.
- **ES Module Pattern**: Named exports. No monolithic files.
- **Test Location**: All tests in `tests/unit/` and `tests/e2e/`.
- **Clean Codebase**: No temporary files left behind.
- **Run All Tests**: After every phase, run full test suite to catch regressions.

## Responsive UI and CSS Rules

- Breakpoints: <=480px (small phone), <=768px (phone/small tablet), <=1024px (tablet), >1024px (desktop), max-height<=600px (landscape phone)
- Touch targets minimum 44x44px on all touch devices.
- No horizontal overflow on any device.
- Use CSS custom properties in `variables.css`.
- Mobile-first: base styles target phone, `@media` queries scale up.
- Use `-webkit-` prefixes where needed for Safari compatibility.

---

## 1. CRITICAL: Command Injection in `publish.js`

**File:** [scripts/publish.js](02product/01_coding/project/goja/scripts/publish.js) line 98

**Problem:** Commit message from `prompt()` is interpolated into a shell string via `execSync`. Backticks, `$()`, and other shell metacharacters are not escaped.

**Fix:** Replace `git(...)` with `execSync` using an args array via `execFileSync`, which bypasses shell interpretation entirely:

```javascript
import { execSync, execFileSync } from 'child_process';

// Replace line 98:
execFileSync('git', ['commit', '-m', msg.trim()], { cwd: PUBLISH, stdio: 'pipe' });
```

This passes the message as a raw argument to `git`, never touching a shell. No escaping needed.

Also extract the `git()` helper to use `execFileSync` for all calls:

```javascript
function git(args, cwd = PUBLISH) {
  return execFileSync('git', args, { cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();
}
```

All callers updated from string args to arrays (e.g., `git('add -A')` becomes `git(['add', '-A'])`).

**Test:** Add `tests/unit/publish.test.js` -- test that commit messages with shell metacharacters (`$()`, backticks, `&&`, `;`) are passed through safely (mock `execFileSync`).

---

## 2. HIGH: License and Author

**Problem:** `package.json` has `"license": "TBD"` and `"author": ""`. No LICENSE file exists.

**Fix:**

- Create `LICENSE` file at project root with GPL-3.0 full text
- Update [package.json](02product/01_coding/project/goja/package.json): `"license": "GPL-3.0-only"`, `"author": "fingerfly"`
- No test needed (metadata only)

---

## 3. MEDIUM: Content Security Policy

**File:** [index.html](02product/01_coding/project/goja/index.html)

**Problem:** No CSP meta tag. Any XSS vector (current or future) would be unrestricted.

**Fix:** Add after line 6 (`<meta name="theme-color">`):

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; img-src 'self' blob:; style-src 'self' 'unsafe-inline'">
```

- `default-src 'self'` -- blocks all external scripts/resources
- `img-src 'self' blob:` -- allows blob URLs for user photos
- `style-src 'self' 'unsafe-inline'` -- allows inline style assignments from JS (`Object.assign(el.style, ...)`)

No test needed (HTML meta tag).

---

## 4. MEDIUM: Export Hangs on Image Load Failure

**File:** [js/export-handler.js](02product/01_coding/project/goja/js/export-handler.js) lines 12-18

**Problem:** `new Image()` has `onload` but no `onerror`. If a blob URL is revoked or image is corrupt, the promise hangs forever.

**TDD approach:**

1. Write test in new `tests/unit/export-handler.test.js`: verify that `handleExport` rejects when an image fails to load (mock `Image` with onerror)
2. Fix: Add `img.onerror = () => reject(new Error(...))` in the promise constructor

```javascript
const imgElements = await Promise.all(photos.map((p, i) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load photo ${i + 1}`));
    img.src = p.url;
  });
}));
```

---

## 5. MEDIUM: Untrack Test Artifacts from Git

**Problem:** `playwright-report/` and `test-results/` are in `.gitignore` but were committed before the ignore rule existed. They contain local paths, screenshots, and traces.

**Fix:** Run `git rm --cached -r` for both directories. This removes them from tracking without deleting local files.

---

## 6. MEDIUM: Hardcoded Remote URL in Publish Script

**File:** [scripts/publish.js](02product/01_coding/project/goja/scripts/publish.js) line 11

**Problem:** `const REMOTE = 'git@github.com:fingerfly/goja.git'` is hardcoded. Forks or repo renames break silently.

**Fix:** Derive from the local git config, with the hardcoded value as fallback:

```javascript
function getRemote() {
  try {
    return execFileSync('git', ['remote', 'get-url', 'origin'],
      { cwd: SOURCE, encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch {
    return 'git@github.com:fingerfly/goja.git';
  }
}
const REMOTE = getRemote();
```

---

## 7. LOW: Cap Photo Count at Template Maximum

**File:** [js/app.js](02product/01_coding/project/goja/js/app.js)

**Problem:** Users can add unlimited photos, but templates only support 1-9. Extra photos cause `getTemplatesForCount` to return an empty array, throwing an error.

**Fix:** Add a `MAX_PHOTOS` constant and guard in `loadPhotos`:

```javascript
const MAX_PHOTOS = 9;

async function loadPhotos(files) {
  const items = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (items.length === 0) return;
  const slots = MAX_PHOTOS - photos.length;
  if (slots <= 0) return;
  const accepted = items.slice(0, slots);
  // ... process accepted
}
```

**Test:** Add to existing app-level tests or `layout-engine.test.js` -- verify `computeGridLayout` throws for count > 9 (already throws, just document), and that `loadPhotos` caps input.

---

## 8. LOW: Remove Dead EXIF Code

**File:** [js/utils.js](02product/01_coding/project/goja/js/utils.js)

**Problem:** `needsExifRotation` and `correctedDimensions` are exported but never imported or called anywhere in the app. Dead code.

**Fix:** Remove both functions and their associated constants (`ROTATED_ORIENTATIONS`, `SWAPPED_ORIENTATIONS`). Remove corresponding tests from [tests/unit/utils.test.js](02product/01_coding/project/goja/tests/unit/utils.test.js). This keeps the codebase clean per project rules.

---

## 9. LOW: Service Worker Navigation Fallback

**File:** [sw.js](02product/01_coding/project/goja/sw.js)

**Problem:** Cache-first for all requests means corrupted cache = stuck user.

**Fix:** Use network-first for navigation requests (HTML documents), cache-first for assets:

```javascript
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
```

---

## Implementation Order

Following TDD, each phase ends with a full test run.

1. **Phase 1 -- Command injection fix** (CRITICAL): Write publish.test.js, then refactor publish.js to use `execFileSync` with args arrays
2. **Phase 2 -- Export reliability**: Write export-handler.test.js, then add onerror handler
3. **Phase 3 -- License and metadata**: Create LICENSE (GPL-3.0), update package.json
4. **Phase 4 -- CSP + SW**: Add CSP meta tag to index.html, update sw.js fetch strategy
5. **Phase 5 -- Cleanup**: Remove dead EXIF code, cap photo count, derive remote URL, untrack test artifacts
6. **Phase 6 -- Full regression**: Run complete unit + E2E test suite, fix any regressions

