/**
 * Template selection localStorage and DOM population.
 * Extracted from app.js for modularity.
 */
import { TEMPLATE_STORAGE_KEY } from './config.js';

export function getStoredTemplate(count) {
  try {
    return localStorage.getItem(`${TEMPLATE_STORAGE_KEY}-${count}`) || 'auto';
  } catch {
    return 'auto';
  }
}

export function setStoredTemplate(count, id) {
  try {
    localStorage.setItem(`${TEMPLATE_STORAGE_KEY}-${count}`, id);
  } catch {}
}

/**
 * Populates the template select element with options.
 * @param {HTMLSelectElement | null} templateSelect
 * @param {number} count
 * @param {(n: number) => { id: string }[]} getTemplatesForCount
 * @param {(key: string) => string} t
 */
export function populateTemplateSelect(templateSelect, count, getTemplatesForCount, t) {
  if (!templateSelect) return;
  const templates = getTemplatesForCount(count);
  const current = templateSelect.value || getStoredTemplate(count);
  templateSelect.innerHTML = '';
  const auto = document.createElement('option');
  auto.value = 'auto';
  auto.textContent = t('templateAuto');
  templateSelect.appendChild(auto);
  for (const tpl of templates) {
    const opt = document.createElement('option');
    opt.value = tpl.id;
    opt.textContent = tpl.id;
    templateSelect.appendChild(opt);
  }
  const valid = ['auto', ...templates.map((x) => x.id)].includes(current);
  templateSelect.value = valid ? current : 'auto';
}
