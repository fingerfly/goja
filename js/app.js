import { bootstrap } from './app-bootstrap.js';
import { initBackgroundColorControl } from './bg-color-control.js';

const bgColorInput = document.getElementById('bgColor');
const bgColorPalette = document.getElementById('bgColorPalette');
const safeBgFallbackEnabled = initBackgroundColorControl(bgColorInput, { paletteRoot: bgColorPalette });
bgColorPalette?.classList.toggle('hidden', !safeBgFallbackEnabled);
bootstrap();
