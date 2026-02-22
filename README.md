# Goja

**拼图成格.** Grid your photos.

Create photo grid collages directly in your browser. Drop in your photos, choose a layout, and export — no uploads, no server, no sign-up required.

## Features

- Smart grid layout engine with 15+ templates for 1–9 photos
- Template picker — choose layout manually or let Goja auto-select
- Orientation-aware photo assignment (landscape/portrait slots)
- Drag-and-drop rearrangement (desktop and mobile touch)
- Remove single photos via right-click or long-press context menu
- Undo/redo (Ctrl/Cmd+Z) for layout changes, swaps, and removals
- Keyboard navigation between cells; Alt+Arrow to swap with previous/next
- Watermark support (free text, date/time, copyright) with opacity and position options
- Export as JPEG or PNG; customizable filename and optional date
- Aspect presets (1:1, 4:3, 16:9, Instagram, Stories)
- Adjustable gap and background color
- PWA with update notification and offline support
- Toast notifications for export success/failure

## Usage

Open `index.html` in a browser, or visit the hosted version:

**https://fingerfly.github.io/goja/**

1. Drop photos onto the grid (or tap to select)
2. Rearrange by dragging; remove a photo via right-click or long-press
3. Adjust settings (template, gap, background, watermark, filename) via the gear icon
4. Tap **Export** to download (Ctrl/Cmd+Z to undo changes)

## Development

```bash
npm install
npm test
```

### E2E tests

```bash
npx playwright install
npm run test:e2e
```

### Deploy

```bash
npm run deploy -- <build|patch|minor|major>
```

Bumps version, syncs files, updates CHANGELOG, and pushes to GitHub. GitHub Actions deploys to Pages at https://fingerfly.github.io/goja/
