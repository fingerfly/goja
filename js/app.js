/**
 * Purpose: Minimal browser entry point for Goja app startup.
 * Description:
 * - Initializes safe background-color control behavior.
 * - Delegates full application bootstrapping to app-bootstrap module.
 */
import { bootstrap } from './app-bootstrap.js';
import { initBackgroundColorControl } from './bg-color-control.js';

const bgColorInput = document.getElementById('bgColor');
const bgColorPalette = document.getElementById('bgColorPalette');
const safeBgFallbackEnabled = initBackgroundColorControl(bgColorInput, { paletteRoot: bgColorPalette });
bgColorPalette?.classList.toggle('hidden', !safeBgFallbackEnabled);
bootstrap();
