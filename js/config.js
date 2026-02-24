/**
 * Centralized configuration constants.
 * No magic numbers in the codebase; use these named constants.
 */
export const JPEG_QUALITY = 0.92;
export const MIN_FRACTION = 0.2;
export const FRAME_MIN = 320;
export const FRAME_MAX = 4096;
export const FRAME_INPUT_DEBOUNCE_MS = 200;
export const MAX_PHOTOS = 9;

export const GAP_MIN = 0;
export const GAP_MAX = 20;
export const GAP_DEFAULT = 4;

export const TEMPLATE_STORAGE_KEY = 'goja-template';

export const WATERMARK_OPACITY_MIN = 0.3;
export const WATERMARK_OPACITY_MAX = 0.9;
export const WATERMARK_OPACITY_DEFAULT = 0.8;
export const WATERMARK_POSITION_DEFAULT = 'bottom-right';
export const WATERMARK_FONT_SCALE_DEFAULT = 1;

export const EXIF_TAG_SET = ['DateTimeOriginal'];

export const CAPTURE_DATE_POSITION_DEFAULT = 'bottom-left';
export const CAPTURE_DATE_OPACITY_MIN = 0.3;
export const CAPTURE_DATE_OPACITY_MAX = 0.9;
export const CAPTURE_DATE_OPACITY_DEFAULT = 0.7;
export const CAPTURE_DATE_FONT_RATIO = 0.025;
export const CAPTURE_DATE_MARGIN_RATIO = 0.02;
export const CAPTURE_DATE_FONT_SCALE_DEFAULT = 1;

export const FILTER_PRESET_NONE = 'none';
export const FILTER_PRESET_GRAYSCALE = 'grayscale';
export const FILTER_PRESET_SEPIA = 'sepia';
export const FILTER_PRESET_BRIGHTNESS = 'brightness';
export const FILTER_PRESET_CONTRAST = 'contrast';
export const FILTER_PRESET_SATURATED = 'saturated';
export const FILTER_PRESET_FADED = 'faded';
export const FILTER_PRESET_VINTAGE = 'vintage';
export const FILTER_PRESET_BLUR = 'blur';
export const FILTER_GRAYSCALE_VALUE = 1;
export const FILTER_SEPIA_VALUE = 0.8;
export const FILTER_BRIGHTNESS_VALUE = 1.15;
export const FILTER_CONTRAST_VALUE = 1.2;
export const FILTER_SATURATE_VALUE = 1.4;
export const FILTER_FADED_SATURATE = 0.65;
export const FILTER_FADED_BRIGHTNESS = 1.05;
export const FILTER_VINTAGE_SEPIA = 0.35;
export const FILTER_VINTAGE_BRIGHTNESS = 1.05;
export const FILTER_VINTAGE_CONTRAST = 1.1;
export const FILTER_BLUR_PX = 1.5;
export const EXPORT_URL_REVOKE_DELAY_MS = 60000;
export const EXPORT_FILENAME_DEFAULT = 'goja-grid';
export const EXPORT_FILENAME_MAX_LENGTH = 200;

export const VIGNETTE_STRENGTH_MIN = 0.2;
export const VIGNETTE_STRENGTH_MAX = 0.8;
export const VIGNETTE_STRENGTH_DEFAULT = 0.5;

export const ROTATION_HANDLE_SIZE = 28;
export const ROTATION_HANDLE_OFFSET = 8;
export const ROTATION_DEFAULT_ANGLE = 0;
export const ROTATION_KEYBOARD_STEP = 1;
