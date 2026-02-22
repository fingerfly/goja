# Changelog

## [Unreleased]

## [5.2.1] - 2026-02-22


### Fixed
- Suppress iOS/Android native image context menu on long-press so app Remove menu shows instead

## [5.2.0] - 2026-02-22


### Changed
- Relocate version display from footer to top bar (left of settings button)

## [5.1.0] - 2026-02-22

### Added
- China app aspect ratio presets: 抖音 Douyin (1080×1920), 小红书 Xiaohongshu (1080×1440), 快手 Kuaishou (1080×1920), 视频号 WeChat Channels (1080×1920)


## [5.0.0] - 2026-02-22

### Added (Goja Improvement Proposals)
- Toast notifications for export success/failure (`js/toast.js`)
- PWA update notification banner with Refresh to update
- Remove single photo via context menu (right-click / long-press) (`js/cell-context-menu.js`)
- Config constants (`js/config.js`): JPEG_QUALITY, FRAME_MIN, FRAME_MAX, MAX_PHOTOS
- Template picker in Settings; optional `templateId` in layout-engine
- Export filename customization and date option; aspect preset buttons (1:1, 4:3, 16:9, Instagram, Stories)
- Focus management in Settings; skip link for accessibility
- Undo/redo with state module (`js/state.js`); Ctrl/Cmd+Z shortcuts
- Keyboard navigation between grid cells; Alt+Arrow swap with previous/next (`js/cell-keyboard-nav.js`)
- Frame dimension validation (320–4096 px); toast on invalid
- Loading overlay during photo load ("Loading... 1/5")
- Watermark options: opacity slider, font size, positions (top-left, top-right, bottom-left); dark-mode watermark
- Web Worker export with main-thread fallback (`js/export-worker.js`)
- Lazy load layout templates
- Offline banner when disconnected
- E2E: drag-and-drop, watermark export, focus return; unit: trackBoundaryPos, dark/light watermark
- manifest.json version aligned with package.json; dark background export verified


## [4.0.0] - 2026-02-22

### Added
- Eight additional languages: German (Deutsch), Dutch (Nederlands), Spanish (Español), Italian (Italiano), Turkish (Türkçe), Finnish (Suomi), Japanese (日本語), Esperanto
- Locale files: `js/locales/de.js`, `nl.js`, `es.js`, `it.js`, `tr.js`, `fi.js`, `ja.js`, `eo.js`
- Browser language detection for new locales
- Language selector options for all 11 languages

### Changed
- Tagline redefined: 拼图成格 (Chinese), Grid your photos (English)
- Removed "One tap" / "一步到位" from tagline across all locales

### Added
- Multi-language support (i18n): English, Simplified Chinese (简体中文), Traditional Chinese (繁體中文)
- Lightweight vanilla i18n module: `js/i18n.js` with `t()`, `setLocale`, `init`, `applyToDOM`
- Locale files: `js/locales/en.js`, `zh-Hans.js`, `zh-Hant.js`
- Language selector in Settings (Grid section)
- Browser language detection on first load; preference persisted in localStorage
- Watermark datetime formatted per selected locale
- E2E tests for language switch and persistence

## [3.1.2] - 2026-02-21

### Fixed
- Full display mode: preview now matches export; added `min-width: 0` and `min-height: 0` on `.preview__grid img` so images constrain to grid cells instead of overflowing (CSS Grid `min-height: auto` was causing overflow and `overflow: hidden` on `.preview` clipped content, making preview look cropped like Fill)
- Set `objectFit` inline on each img when rendering grid for robustness

## [3.1.1] - 2026-02-21


### Fixed
- Full display mode: preview not updating when switching Image fit in Settings; added `change` listener for select (some browsers only fire `change` not `input`)

## [3.1.0] - 2026-02-21

### Added
- Layout algorithm design doc (`docs/contain-mode-layout-algorithm.md`) defining best grid layout for Cover and Contain
- Unit tests for contain-mode layout: 3 landscape/portrait, 4 and 6 photos; cover-mode 2 landscape

### Changed
- Full display (contain) mode: layout now picks template by aspect-ratio match to minimize letterboxing (e.g. 2 landscape photos → vertical stack 2×1 instead of horizontal 1×2; 2 portrait photos → horizontal 1×2)
- Fill (cover) mode: unified with same aspect-ratio-matching algorithm to minimize cropping; both modes now share optimal layout selection
- E2E resize test: use 2 portrait photos (1×2 layout) so column resize handle exists after layout change

## [3.0.0] - 2026-02-21

### Added
- Image fit setting (Fill / Full display) in Grid settings; preview and export respect the choice (cover vs contain)
- TDD unit tests for image fit: cover/contain modes, landscape letterboxing, default fitMode/backgroundColor in export

## [2.2.3] - 2026-02-21

### Added
- `scripts/generate-fixtures.js` to create E2E test images (landscape, portrait, square) with correct dimensions
- `jpeg-js` devDependency for fixture generation
- `pretest:e2e` hook runs `generate-fixtures` before E2E tests
- `.github/workflows/test.yml` for unit and E2E tests on push/PR

### Changed
- E2E fixture images no longer committed: `tests/fixtures/*.jpg` in `.gitignore`
- Deploy excludes fixture images from copy and runs `git rm --cached` to remove them from remote on next push
- Deploy uses `execFileSync` for upgrade-version call (no shell string) to prevent command injection

## [2.2.2] - 2026-02-21

### Fixed
- Resize handles not working: `showUI(true)` now runs before `enableGridResize` so handles get correct dimensions (preview was hidden when `getBoundingClientRect()` ran, returning zeros)

### Added
- E2E tests for resize: handles exist with usable dimensions; drag changes grid proportions (TDD coverage for resize fix)

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
