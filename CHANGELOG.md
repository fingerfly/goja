# Changelog

## [Unreleased]

## [2.0.0] - 2026-02-21


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
