# Goja

**拼图成格.** Grid your photos.

Create photo grid collages directly in your browser. Drop in your photos, choose a layout, and export — no uploads, no server, no sign-up required.

## Features

### Grid & layout
- Smart grid layout engine with 15+ templates for 1–9 photos
- Template picker — choose layout manually or let Goja auto-select
- Orientation-aware photo assignment (landscape/portrait slots)
- Drag-and-drop rearrangement (desktop and mobile touch)
- Remove single photos via right-click or long-press context menu
- Undo/redo (Ctrl/Cmd+Z) for layout changes, swaps, and removals
- Keyboard navigation between cells; Alt+Arrow to swap with previous/next
- Grid cell resizing with draggable handles; configurable frame size (Width × Height)
- Image fit: Fill (cover) or Full display (contain)
- Adjustable gap and background color

### Watermark & overlays
- Watermark support (free text, date/time, copyright) with opacity, position, and font size options
- EXIF capture date & time overlay: optional per-photo DateTimeOriginal on each image, with position, opacity, and font size controls; locale-aware formatting

### Effects
- Eight filter presets: grayscale, sepia, brightness, contrast, saturated, faded, vintage, blur
- Vignette effect (darkened edges) with adjustable intensity
- Artistic cell-edge styles for collage cuts (`wavy`, `jagged`) with deterministic seed/frequency/intensity controls and improved template-based edge quality
- Minimal-surprise capability policy: advanced edge controls are hidden automatically on unsupported devices/browsers
- Edge style labels/options are fully localized in all supported app languages
- Live preview for filters and vignette on the grid before export

### Export
- Export as JPEG or PNG; customizable filename and optional date
- Export options: Share (Web Share API), Download (save to device), Copy to clipboard, Open in new tab — Share hidden on browsers without Web Share API
- Aspect presets (1:1, 3:4, 16:9, Instagram, Stories, 抖音, 小红书, 快手, 视频号)

### App
- 6 languages: English, 简体中文, 繁體中文, Español, 日本語, Esperanto
- PWA with update notification and offline support
- Toast notifications for export success/failure

## Usage

Open `index.html` in a browser, or visit the hosted version:

**https://fingerfly.github.io/goja/**

1. Drop photos onto the grid (or tap to select)
2. Rearrange by dragging; remove a photo via right-click or long-press
3. Adjust settings (template, frame size, gap, background, watermark, capture date overlay, filename) via the gear icon
4. Tap **Export** to choose Share, Download, Copy, or Open in new tab (Ctrl/Cmd+Z to undo changes)

## Help

- [FAQ](docs/FAQ.md) — common questions and answers | [常见问题](docs/FAQ.zh-Hans.md)
- [Changelog](CHANGELOG.md)
- [Security Policy](SECURITY.md)

## Development

```bash
npm install
npm test
```

`npm install` also runs `copy:vendor`, which copies `exifr` into `js/vendor/exifr.mjs`
for the capture-date overlay.

### E2E tests

```bash
npx playwright install
npm run test:e2e
```

### Security checks (local)

Before a release, mirror CI:

```bash
npm run audit:check
npm run security:verify
```

`audit:check` fails on moderate or higher npm audit findings. `security:verify`
runs audit, unit tests, and E2E.

### CI and GitHub Pages

On the standalone repository, push or PR to `main` triggers the **Test** workflow
(`audit`, `unit`, `e2e`). **Deploy** runs only after Test succeeds on `main`,
builds `js/vendor/exifr.mjs`, then publishes to Pages.

```
push/PR → Test (audit + unit + e2e) → on success → Deploy → GitHub Pages
```

Hosted app: https://fingerfly.github.io/goja/

See [SECURITY.md](SECURITY.md) for dependency policy and vulnerability reporting.

### Deploy

```bash
npm run deploy -- <build|patch|minor|major>
```

Bumps version, syncs files, updates CHANGELOG, and pushes to GitHub. Before the
bump, deploy runs `audit:check` and `copy:vendor`. The push starts Test; Pages
updates only when Test passes on `main`.

`deploy` defaults by OS:
- Windows: HTTPS `https://github.com/fingerfly/goja.git`
- macOS and other OS: SSH `git@github.com:fingerfly/goja.git`

You can override remote per shell with `GOJA_DEPLOY_REMOTE`.

Non-destructive remote check before deploy:

```bash
git ls-remote <your-remote-url> HEAD
```

PowerShell:

```powershell
$env:GOJA_DEPLOY_REMOTE='https://github.com/fingerfly/goja.git'; npm run deploy -- patch
$env:GOJA_DEPLOY_REMOTE='git@github.com:fingerfly/goja.git'; npm run deploy -- patch
```

CMD:

```cmd
cmd /C "set GOJA_DEPLOY_REMOTE=https://github.com/fingerfly/goja.git && npm run deploy -- patch"
set GOJA_DEPLOY_REMOTE=https://github.com/fingerfly/goja.git
npm run deploy -- patch
```

bash/zsh:

```bash
GOJA_DEPLOY_REMOTE=https://github.com/fingerfly/goja.git npm run deploy -- patch
export GOJA_DEPLOY_REMOTE=https://github.com/fingerfly/goja.git && npm run deploy -- patch
GOJA_DEPLOY_REMOTE=git@github.com:fingerfly/goja.git npm run deploy -- patch
```

## License

[AGPL-3.0-only](LICENSE)

## Trademark Notice

"Goja", "Goja 宫将", the Goja logo, and the tagline "拼图成格." are trademarks of Luke Wu.
The source code is licensed under AGPL-3.0-only, but trademarks are not licensed under AGPL.
See [TRADEMARK.md](TRADEMARK.md) for details.
