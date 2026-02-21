# Changelog

## [Unreleased]

## [2.2.2] - 2026-02-21


## [2.2.1] - 2026-02-21


### Changed
- `publish.js` → `deploy.js`, `publish.test.js` → `deploy.test.js`, `npm run publish` → `npm run deploy` (aligned with LangBuilderJS)
- Deploy now accepts bump type (`build`|`patch`|`minor`|`major`) and runs `upgrade-version` before pushing
- Commit message auto-generated as `Release vX.Y.Z (build)` for non-interactive flow

### Fixed
- E2E tests: updated selectors to match current DOM (`h1`/`.tagline` → `.top-bar__brand`/`.top-bar__tagline`, `#controls`/`#actions` → `#bottomBar`)
- Content Security Policy: moved service worker registration from inline script to `app.js` (inline script was blocked by `default-src 'self'`)

## [2.2.0] - 2026-02-21

### Added
- GPL-3.0 license (`LICENSE` file) and author metadata in `package.json`
- Content Security Policy meta tag restricting resources to `'self'` and `blob:` for images
- Image load error handling in export pipeline (rejects instead of hanging)
- Photo count cap at 9 (maximum supported by layout templates)
- `publish.test.js` with 5 unit tests for shell-safe git argument passing
- `export-handler.test.js` with 2 unit tests for image load error handling

### Fixed
- **[CRITICAL]** Command injection in `publish.js`: commit messages with shell metacharacters (`$()`, backticks, `&&`, `;`) were interpolated via `execSync`; now uses `execFileSync` with argument arrays
- Export hanging indefinitely when an image fails to load (missing `onerror` handler)

### Changed
- Service worker uses network-first strategy for navigation requests, cache-first for assets
- Publish script derives remote URL from `git remote get-url origin` with hardcoded fallback
- Publish script guarded for safe module import (testable without side effects)

### Removed
- Dead EXIF orientation functions (`needsExifRotation`, `correctedDimensions`) and their tests
- Test artifacts (`playwright-report/`, `test-results/`) untracked from git

## [2.1.1] - 2026-02-21


## [2.1.0] - 2026-02-21

### Added
- Configurable frame size (Width × Height) in Grid settings, default 1080×1350 (4:5 portrait)
- Independent height control in layout engine (`outputHeight` parameter)
- Number input styling in CSS for frame size controls
- New unit tests for `outputHeight` and non-square frame layouts

### Fixed
- Row resize handles unusable due to swapped arguments in `makeHandle` call
- `resize-engine.js` and `resize-handler.js` missing from service worker asset cache
- `recomputePixelCells` now uses `canvasHeight` directly instead of deriving from column width

## [2.0.0] - 2026-02-21

### Added
- Grid cell resizing with draggable handles at column and row boundaries
- `resize-engine.js` module: pure functions for ratio adjustment and pixel recomputation
- `resize-handler.js` module: DOM overlay with touch-friendly 44px resize handles
- CSS resize handle styles with hover/active visual feedback
- Layout engine returns `colRatios` and `rowRatios` for non-uniform grid tracks
- 19 unit tests for resize engine


## [1.0.0] - 2026-02-21

### Added
- Complete UI redesign with mobile-first architecture
- Top bar with compact branding and settings gear icon
- Sticky bottom action bar with Add / Export / Clear buttons (always thumb-reachable)
- Settings bottom sheet on phone (slides up, 60vh) with drag handle
- Settings side panel on tablet/desktop (slides in from right, 320px)
- Backdrop overlay with tap-to-close and Escape key support
- Settings grouped into three fieldsets: Grid, Export, Watermark
- New `settings-panel.js` module with open/close/init logic
- SVG gear icon in top bar for settings access
- Drop zone hides when photos are loaded, Add button in bottom bar for adding more
- 9 new unit tests for settings panel (82 total)

### Changed
- All configuration controls moved from inline sidebar to dedicated Settings panel
- Bottom bar replaces old action buttons layout for better mobile ergonomics
- CSS completely rewritten for new layout structure with responsive breakpoints

## [0.2.1] - 2026-02-21

### Added
- Service worker `skipWaiting` and `clients.claim` for immediate cache updates on new versions
- `validate-version.js` now checks `sw.js` CACHE_NAME consistency

### Fixed
- Stale service worker cache serving outdated files after version upgrades

## [0.2.0] - 2026-02-21

### Added
- Drag-and-drop photo rearrangement within the grid (desktop HTML5 drag + mobile touch)
- Watermark feature with content types: Free text, Date/time, Copyright
- Watermark position control: Bottom-right, Center, Tiled
- Version upgrade tooling: bump, sync, validate, and changelog scripts

### Fixed
- Drag-and-drop crash caused by duplicate event listeners stacking on each render
- Service worker path resolution when served from a subdirectory

## [0.1.0] - 2026-02-20

Initial prototype release.

### Added
- Smart Grid Layout Engine: template-based spanning layouts with orientation-aware photo assignment
- Layout Templates: 15 templates for 1-9 photos with landscape/portrait preference slots
- Image Processor: Canvas API compositing with cover-mode crop
- Utils: EXIF orientation detection, image dimension reading
- Export Handler: download composed grid as JPEG or PNG
- UI: drag-and-drop / tap-to-select photo upload, CSS Grid live preview with cell spanning
- Controls: gap slider, background color picker, format selector
- Responsive design: mobile-first with 4 breakpoints (phone, tablet, desktop, landscape)
- Dark mode support via prefers-color-scheme
- PWA: manifest.json, service worker with offline caching
- Branding: Goja logo (SVG, 2x2 teal grid), favicon, tagline
- Version display in footer
- 36 unit tests (Vitest) + 6 E2E tests (Playwright)
