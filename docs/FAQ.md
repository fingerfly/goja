# Frequently Asked Questions

## Privacy and Security

### Where are my photos uploaded?

Nowhere. Goja runs entirely in your browser. Your photos never leave your device -- there is no server, no upload, and no account required.

### Is my data safe?

Yes. Goja does not collect, store, or transmit any data. All processing happens locally in the browser. A strict Content Security Policy (CSP) is enforced to prevent third-party scripts from running.

## Getting Started

### How do I use Goja?

1. Open [Goja](https://fingerfly.github.io/goja/) in your browser.
2. Drop photos onto the grid, or tap the drop zone to select files.
3. Rearrange photos by dragging. Remove a photo via right-click (desktop) or long-press (mobile).
4. Open Settings (gear icon) to adjust template, frame size, gap, background, watermark, capture date overlay, and filename.
5. Tap **Export** to share, download, copy to clipboard, or open in a new tab.

### Can I install Goja on my phone or desktop?

Yes. Goja is a Progressive Web App (PWA). On mobile, use your browser's "Add to Home Screen" option. On desktop Chrome or Edge, click the install icon in the address bar or choose "Install App" from the browser menu.

### Does it work offline?

Yes. Once you have visited Goja at least once, the service worker caches everything needed to run offline. You will see an "Offline" banner when you are disconnected, but all features remain available.

### What languages are supported?

Goja supports 11 languages: English, 简体中文, 繁體中文, Deutsch, Nederlands, Español, Italiano, Turkce, Suomi, 日本語, and Esperanto. The language switches automatically based on your browser setting.

## Working with Photos

### How do I add photos?

Drag and drop image files onto the grid area. Alternatively, tap or click the drop zone to open a file picker and select one or more images.

### How do I rearrange photos?

On desktop, drag a photo to another cell to swap positions. On mobile, use touch drag. You can also use keyboard shortcuts: press Alt+Arrow Left/Right to swap with the previous or next cell.

### How do I remove a single photo?

On desktop, right-click the photo and choose the remove option from the context menu. On mobile, long-press the photo to trigger the same context menu.

### How do I undo a change?

Press Ctrl+Z (Windows/Linux) or Cmd+Z (Mac) to undo layout changes, swaps, and removals.

### What photo formats are accepted?

Goja accepts any image format your browser supports -- typically JPEG, PNG, WebP, GIF, and HEIF/HEIC (on Safari). SVG files are excluded for security reasons.

## Settings and Effects

### How do I change the grid layout?

Open Settings (gear icon) and use the template picker to choose from 15+ layouts for 1 to 9 photos. You can pick a template manually or let Goja auto-select one based on the number of photos.

### How do I resize the grid frame?

In Settings, set the Width and Height values for the frame. You can also drag the resize handles directly on the grid cells.

### How do I add a watermark?

In Settings, enable the watermark option. Enter your text (free text, date/time, or copyright symbol), then adjust position, opacity, and font size. The watermark previews live on the grid and appears in the exported image.

### How do I show the capture date on photos?

In Settings, enable the capture date overlay. Goja reads each photo's EXIF DateTimeOriginal field and displays it on the image. You can configure the position, opacity, and font size. The date format follows your browser's locale.

### What filters are available?

Goja offers eight filter presets: grayscale, sepia, brightness, contrast, saturated, faded, vintage, and blur. There is also a vignette effect (darkened edges) with an adjustable intensity slider. Filters and vignette preview live on the grid.

### What are the aspect presets?

The export aspect presets are: 1:1, 3:4, 4:3, 16:9, Instagram, Stories, and several Chinese social media formats (抖音, 小红书, 快手, 视频号).

## Exporting

### What export formats are available?

JPEG and PNG. You can choose the format in the export options.

### What are the export options?

After tapping Export, you can choose from four options:

- **Share** -- uses the Web Share API to send the image to other apps
- **Download** -- saves the image file to your device
- **Copy** -- copies the image to your clipboard
- **Open in new tab** -- opens the exported image in a browser tab

### Why don't I see the Share button?

The Share option uses the Web Share API, which is not available in all browsers (notably desktop Firefox and some older browsers). If your browser does not support it, the button is hidden automatically. Use Download or Copy instead.

### Can I customize the filename?

Yes. In Settings, you can set a custom filename for the exported image. You can also toggle whether the current date is appended to the filename.
