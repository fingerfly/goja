import { TEMPLATES_SMALL } from './templates-small.js';
import { TEMPLATES_LARGE } from './templates-large.js';

export const TEMPLATES = [...TEMPLATES_SMALL, ...TEMPLATES_LARGE];

export function getTemplatesForCount(count) {
  return TEMPLATES.filter(t => t.photoCount === count);
}
