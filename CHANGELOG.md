# Changelog

## [Unreleased]

## [8.1.0] - 2026-02-24


## [8.0.1] - 2026-02-24

### Fixed
- Capture date/time overlay consistency between preview and export for rotated photos: preview now uses the same canvas drawing logic as export, improving on-screen positioning and visual alignment

### Changed
- Preview capture-date rendering now draws via `drawCaptureDateOverlay()` in a per-cell canvas overlay instead of DOM `<span>` placement, so size/margins/opacity follow the same code path as exported output
- PWA precache asset list in `sw.js` updated to include new rotation modules: `rotation-handler.js`, `rotation-math.js`, and `cell-draw.js`, ensuring offline cache completeness after feature rollout

### Tests
- Verified with unit coverage (`preview-renderer`, `capture-date-overlay`, `cell-draw`) and full regression suites (unit + E2E)


## [8.0.0] - 2026-02-24

### Added
- Per-photo rotation with draggable handle: each grid cell can now be rotated in 360 degrees, with whole-cell rotation (photo + overlays) and shrink-to-fit behavior to prevent overlap
- Rotation interaction module (`js/rotation-handler.js`) with mouse/touch drag, keyboard step rotation, and live per-cell transform updates during drag
- Rotation math module (`js/rotation-math.js`) with `computeAngleDeg`, `fitScaleFactor`, and `normalizeAngle`
- New config constants for rotation behavior and UI sizing: `ROTATION_HANDLE_SIZE`, `ROTATION_HANDLE_OFFSET`, `ROTATION_DEFAULT_ANGLE`, `ROTATION_KEYBOARD_STEP`
- Locale key `rotatePhoto` added across all 11 language files for rotation handle accessibility label

### Changed
- Preview rendering now applies per-cell rotation transforms using actual cell pixel dimensions (`layout.cells[i].width/height`) and stores `--cell-scale` for UI counter-scaling
- Export pipeline now carries per-photo angles through main thread and worker paths so exported images match rotated preview output
- App bootstrap/init wiring now rebinds rotation handles after preview re-renders and keeps undo/redo integration for rotation changes

### Refactored
- Extracted shared export cell draw logic into `js/cell-draw.js` to remove duplicated per-cell draw code between `export-handler.js` and `export-worker.js`
- Rotation transform wrapping in export is centralized in `cell-draw.js` for better reuse and maintainability

### Tests
- Added unit tests: `tests/unit/rotation-math.test.js`, `tests/unit/rotation-handler.test.js`, `tests/unit/cell-draw.test.js`
- Extended preview-renderer unit coverage for rotated cell transform behavior
- Full regression verification completed: unit suite and E2E suite both passing


## [7.5.0] - 2026-02-23

### Added
- User-facing FAQ (`docs/FAQ.md`) covering privacy, getting started, working with photos, settings/effects, and exporting
- Simplified Chinese FAQ (`docs/FAQ.zh-Hans.md`) for Chinese-speaking users
- Help section in README linking to FAQ, Changelog, and Security Policy

## [7.4.1] - 2026-02-23

### Security
- Exclude SVG files (`image/svg+xml`) from photo loading to prevent script injection via malicious SVGs
- Sanitize export filename: strip path separators and reserved characters (`/ \ ? % * : | " < >`) via new `sanitizeFilename()` in `utils.js`
- Simplify CSP `script-src` to `'self'` only; removed obsolete inline script hash

### Fixed
- Validate frame dimensions before layout: `updatePreview` now clamps `frameW`/`frameH` via `clampFrameValue` so `computeGridLayout` never receives `NaN`
- Handle `loadPhotos` promise rejections: `readImageDimensions`/`readDateTimeOriginal` failures are caught per file, reported via `onLoadError` toast, and do not break the load loop; successful photos are still added
- Bounds-check `photoOrder` indices in `preview-renderer.js` and `app-init.js` context menu callback to prevent out-of-bounds access

### Added
- Config constants: `EXPORT_FILENAME_DEFAULT`, `EXPORT_FILENAME_MAX_LENGTH`
- Locale key `loadFailed` added to all 11 languages

## [7.4.0] - 2026-02-23

### Added
- app.js modularization Phase 10: extracted `app-bootstrap.js`; app.js reduced to 2 lines (bootstrap entry point). sw.js: added `./js/app-bootstrap.js` to ASSETS.



### Added
- app.js modularization: extracted `update-banner.js`, `template-storage.js`, `preview-renderer.js`, `photo-loader.js`; `debounce` in utils, `setFrameInputInvalidState` in frame-validation; `buildFormFromRefs` in grid-effects-settings. Config: `FRAME_INPUT_DEBOUNCE_MS`, `TEMPLATE_STORAGE_KEY`. Unit tests for all new modules.

## [7.3.0] - 2026-02-23


### Added
- Grid effects code-sharing: `grid-effects-settings.js` module with `getWatermarkOptions`, `getCaptureDateOptions`, `getVignetteOptions`, `getGridEffectsOptions`; shared by preview (renderGrid) and export (handleExport). Config constants (WATERMARK_POSITION_DEFAULT, WATERMARK_FONT_SCALE_DEFAULT, etc.) used in export-handler and export-worker instead of inline literals.

## [7.2.3] - 2026-02-23

### Added
- TDD: Unit test for tiled watermark spacing (measureText-based); E2E for watermark overlay removed on clear.

## [7.2.2] - 2026-02-23

### Added
- Watermark live preview: when watermark is enabled in Settings, the on-screen grid now shows the watermark; previously it appeared only on export.

### Fixed
- Tiled watermark: spacing now based on text width (measureText) to prevent overlapping when text is long; previously used a fixed canvas-ratio spacing.
- Clear now removes watermark overlay from DOM; previously the overlay persisted when photos were cleared.

## [7.2.1] - 2026-02-23

### Fixed
- Capture date overlay in preview now respects Settings opacity and font size; previously only the exported grid applied these values.


## [7.2.0] - 2026-02-23

### Added
- Live preview for filter and vignette: effects now display in the grid before export (CSS filter on img; radial-gradient vignette overlay). Previously effects applied only on export.
- Six new filter presets: brightness, contrast, saturated, faded, vintage, blur. All use ctx.filter; config-driven values. i18n for filterBrightness, filterContrast, filterSaturated, filterFaded, filterVintage, filterBlur in all 11 locales.
- TDD coverage: unit test for filter option passed to drawPhotoOnCanvas in export-handler; E2E for filter preset preview, vignette overlay, vignette options visibility, effects section controls; i18n unit test for required effects keys in all locales.

## [7.1.0] - 2026-02-23


## [7.0.0] - 2026-02-23


### Added
- Filter and effect prototype: exportable photo filters (none, grayscale, sepia) via Canvas ctx.filter; vignette effect (radial gradient dark edges) per cell. Settings: Effects fieldset with filter preset dropdown, vignette checkbox, intensity slider. Live preview: filter and vignette shown in grid before export (CSS filter on img; radial-gradient overlay). Graceful Safari fallback (filter unsupported; vignette works). i18n (effectsSection, filterPreset, filterNone, filterGrayscale, filterSepia, vignetteEnabled, vignetteStrength) in all 11 locales. Unit tests for image-effects, image-processor filter option, export-handler vignette.

## [6.1.0] - 2026-02-23

### Added
- EXIF capture date & time overlay: optional per-photo capture date-time (DateTimeOriginal) on photos in grid, with Settings options (position, opacity, font size). Uses exifr for EXIF parsing; locale-aware date-time format (e.g. Feb 22, 2025, 2:30 PM). Preview and export both support the overlay when enabled. i18n for showCaptureDate, captureDatePos, captureDateOpacity, captureDateFontSize in all 11 locales. E2E for capture date options visibility.

## [5.6.0] - 2026-02-22

### Changed
- exportDownload label aligned across all locales with 保存到本机 (save to device): en, de, nl, es, it, tr, fi, ja, eo now use "Save to device" / equivalent instead of "Download"

### Fixed
- Share option no longer shown on OPPO Browser and similar browsers that lack `navigator.share`; prevents "Share not supported" error

### Changed
- `canShareFiles`: require `navigator.share` (removed viewport fallback)
- Export options: Download becomes primary (btn-primary) when Share unavailable
- zh-Hans/zh-Hant: `exportDownload` label updated to 保存到本机 / 保存到本機 for clearer save-to-device intent

### Added
- Unit test: `canShareFiles` returns false when `navigator.share` undefined (including narrow viewport); Download-primary when Share hidden

## [5.5.1] - 2026-02-22

### Added
- Width/Height input hardening: `inputmode="numeric"`, `pattern="[0-9]*"`, `aria-describedby="frameDimensionHint"`, `aria-invalid`; `.invalid` styles for out-of-range; debounced validation (~200 ms); `frameDimensionHint` i18n in all 11 locales; `js/frame-validation.js` with `clampFrameValue`, `isFrameValueValid`; unit + E2E tests for frame dimension clamp on blur and debounced input

## [5.5.0] - 2026-02-22

### Added
- Settings polish: config constants (GAP_*, WATERMARK_OPACITY_*); unit tests for config; E2E for filename i18n and settings panel dialog role
- TDD: unit test all locales have exportFilename/exportFilenamePlaceholder/exportUseDate; unit test preset34
- TDD: E2E watermark groups visibility (.hidden) per type; checkbox touch target ≥44px; aspect preset 3:4 sets 1080×1440; gap/watermark opacity init from config
- Filename i18n: `exportFilename`, `exportFilenamePlaceholder`, `exportUseDate` in all 11 locales (was missing in 10 non-English locales)
- Settings panel accessibility: `role="dialog"`, `aria-labelledby="settingsTitle"`, `aria-modal="true"`
- Checkbox touch target: `.control-group:has(input[type="checkbox"]) label` min-height 44px
- Aspect preset 3:4 (was mislabeled 4:3 for 1080×1440 portrait)
- Utility class `.hidden` in `css/style.css` for visibility toggling

### Changed
- Watermark conditional groups: replace inline `style="display:none"` with CSS class `.hidden`
- Gap and watermark opacity controls: init from `js/config.js` (GAP_MIN/MAX/DEFAULT, WATERMARK_OPACITY_*)
- Media query: use 768px to align with `--bp-md` (was 769px)
- Preset 4:3 renamed to 3:4 (1080×1440 is 3:4 portrait)

### Fixed
- i18n unit test: renamed `it` locale import to `itLocale` to avoid shadowing vitest's `it`

## [5.4.1] - 2026-02-22


### Changed
- Export options: remove unused `t` parameter from `showExportOptions`; simplify options passed from `app.js`
- `shareBlob`: no longer checks `navigator.canShare` before calling; tries `navigator.share` directly (supports mobile viewport fallback)
- `canShareFiles`: simplified to return true when `navigator.share` exists or viewport width < 768px; removed `canShare`/`MINIMAL_PNG`-based detection

### Added
- Unit tests for `canShareFiles` viewport-based detection (narrow/wide) and `shareBlob` without `canShare`


### Fixed
- CI E2E tests: Playwright config used `channel: 'chrome'` but workflow installs Chromium only; now uses Chromium in CI, Chrome locally
- CI reproducibility: commit package-lock.json and use `npm ci`; removed from .gitignore and deploy EXCLUDE

## [5.4.0] - 2026-02-22

### Added
- TDD unit tests for action-buttons: edge cases (single photo, isExporting with 0 photos), i18n key verification, override of previous disabled state


### Changed
- Action buttons aligned with workflow: Add and Clear enabled at startup, Export disabled; Export enabled only when photos present; `updateActionButtons` + `js/action-buttons.js` (`syncActionButtons`) centralize state
- Export button has `disabled` in HTML for correct initial state before JS runs

## [5.3.1] - 2026-02-22


### Fixed
- Export options sheet visible on page load; now uses `visibility: hidden` and `pointer-events: none` when closed so it never appears until Export is clicked
- Share option missing on Oppo Find X8 and similar; now always shown on mobile (viewport < 768px) or when `navigator.share` exists

### Added
- Export options: when Export is pressed, users choose Share / Download / Copy to clipboard / Open in new tab
- Share uses Web Share API (Save to Photos, WeChat, etc. on mobile)
- Copy to clipboard for paste into chat/Notes
- `js/export-options.js` with `showExportOptions`, `canShareFiles`, `canCopyImage`
- `shareBlob` and `copyBlobToClipboard` in `js/export-handler.js`
- i18n keys: exportOptionsTitle, exportShare, exportDownload, exportCopy, exportOpenInNewTab, exportShareFailed, exportCopySuccess, exportCopyFailed

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
