# Goja 宫将

**Grid craft. One and only.** 宫格匠，独一个。

A photo grid collage maker that runs entirely in the browser. Drop your photos, pick a layout, and export a composed image — no uploads, no server, no account.

## Features

- Smart grid layout engine with 15+ templates for 1–9 photos
- Orientation-aware photo assignment (landscape/portrait slots)
- Drag-and-drop rearrangement (desktop and mobile touch)
- Watermark support (free text, date/time, copyright)
- Export as JPEG or PNG
- Adjustable gap and background color
- Fully offline — works as a PWA
- Dark mode support

## Usage

Open `index.html` in a browser, or visit the hosted version:

**https://fingerfly.github.io/goja/**

1. Drop photos onto the grid (or tap to select)
2. Rearrange by dragging
3. Adjust settings (gap, background, watermark) via the gear icon
4. Tap **Export** to download

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
