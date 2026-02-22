import { test, expect } from '@playwright/test';
import path from 'path';

const fixtures = path.resolve('tests/fixtures');

test.describe('Goja App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('goja-locale', 'en'));
    await page.reload();
  });

  test('shows header with branding', async ({ page }) => {
    await expect(page.locator('.top-bar__brand')).toHaveText('Goja');
    await expect(page.locator('.top-bar__tagline')).toContainText('Grid your photos');
  });

  test('shows drop zone on load', async ({ page }) => {
    await expect(page.locator('#dropZone')).toBeVisible();
    await expect(page.locator('#preview')).not.toBeVisible();
    await expect(page.locator('#bottomBar')).toBeVisible();
  });

  test('action buttons match workflow: Add and Clear enabled, Export disabled at startup', async ({ page }) => {
    await expect(page.locator('#addBtn')).toBeEnabled();
    await expect(page.locator('#clearBtn')).toBeEnabled();
    await expect(page.locator('#exportBtn')).toBeDisabled();
  });

  test('action buttons: Export becomes enabled after adding photos', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([path.join(fixtures, 'landscape.jpg')]);
    await expect(page.locator('#preview')).toBeVisible();
    await expect(page.locator('#addBtn')).toBeEnabled();
    await expect(page.locator('#clearBtn')).toBeEnabled();
    await expect(page.locator('#exportBtn')).toBeEnabled();
  });

  test('action buttons: Add and Clear stay enabled, Export disabled after clear', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([path.join(fixtures, 'landscape.jpg')]);
    await expect(page.locator('#preview')).toBeVisible();
    await expect(page.locator('#exportBtn')).toBeEnabled();
    await page.locator('#clearBtn').click();
    await expect(page.locator('#preview')).not.toBeVisible();
    await expect(page.locator('#addBtn')).toBeEnabled();
    await expect(page.locator('#clearBtn')).toBeEnabled();
    await expect(page.locator('#exportBtn')).toBeDisabled();
  });

  test('uploads photos and shows preview grid', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    await expect(page.locator('#bottomBar')).toBeVisible();
    const images = page.locator('#previewGrid img');
    await expect(images).toHaveCount(2);
  });

  test('gap slider updates grid', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'square.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    const grid = page.locator('#previewGrid');
    const gapBefore = await grid.evaluate(el => el.style.gap);
    await page.locator('#gapSlider').fill('15');
    await page.locator('#gapSlider').dispatchEvent('input');
    const gapAfter = await grid.evaluate(el => el.style.gap);
    expect(gapAfter).toBe('15px');
  });

  test('clear button removes all photos', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([path.join(fixtures, 'landscape.jpg')]);
    await expect(page.locator('#preview')).toBeVisible();
    await page.locator('#clearBtn').click();
    await expect(page.locator('#preview')).not.toBeVisible();
    await expect(page.locator('#previewGrid img')).toHaveCount(0);
  });

  test('export button opens options sheet', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#exportBtn')).toBeVisible();
    await page.locator('#exportBtn').click();
    await expect(page.locator('#exportOptionsSheet')).toHaveClass(/open/);
    await expect(page.locator('#exportOptionDownload')).toBeVisible();
    await expect(page.locator('#exportOptionOpenInNewTab')).toBeVisible();
  });

  test('export open in new tab opens image', async ({ page, context }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#exportBtn')).toBeVisible();
    await page.locator('#exportBtn').click();
    await expect(page.locator('#exportOptionsSheet')).toHaveClass(/open/);
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.locator('#exportOptionOpenInNewTab').click(),
    ]);
    await expect(newPage).toHaveURL(/^blob:/);
    await newPage.close();
  });

  test('export download option triggers download and toast', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#exportBtn')).toBeVisible();
    await page.locator('#exportBtn').click();
    await expect(page.locator('#exportOptionsSheet')).toHaveClass(/open/);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#exportOptionDownload').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/goja-grid\.(jpg|png)/);
    await expect(page.locator('.toast')).toContainText('Export saved');
  });

  test('context menu on cell shows Remove and removes photo', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
      path.join(fixtures, 'square.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    const images = page.locator('#previewGrid img');
    await expect(images).toHaveCount(3);
    await images.first().dispatchEvent('contextmenu', { bubbles: true });
    await expect(page.locator('.cell-context-menu')).toBeVisible();
    await expect(page.locator('.cell-context-menu')).toContainText('Remove');
    await page.locator('.cell-context-menu button').click();
    await expect(page.locator('#previewGrid img')).toHaveCount(2);
  });

  test('export success shows toast', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    await page.locator('#exportBtn').click();
    await expect(page.locator('#exportOptionsSheet')).toHaveClass(/open/);
    await Promise.all([
      page.waitForEvent('download'),
      page.locator('#exportOptionDownload').click(),
    ]);
    await expect(page.locator('.toast')).toBeVisible();
    await expect(page.locator('.toast')).toContainText('Export saved');
  });

  test('resize handles exist and have usable dimensions when grid shown', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'landscape.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    await expect(page.locator('.resize-overlay')).toBeVisible();
    const handles = page.locator('.resize-handle');
    await expect(handles).toHaveCount(1);
    const box = await handles.first().boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);
  });

  test('resize handle drag changes grid proportions', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'portrait.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    await expect(page.locator('.resize-handle--col')).toBeVisible();
    const grid = page.locator('#previewGrid');
    const before = await grid.evaluate(el => el.style.gridTemplateColumns);
    const handle = page.locator('.resize-handle--col').first();
    await handle.hover();
    const box = await handle.boundingBox();
    if (!box) throw new Error('Handle has no bounding box');
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.down();
    await page.mouse.move(cx + 80, cy, { steps: 5 });
    await page.mouse.up();
    const after = await grid.evaluate(el => el.style.gridTemplateColumns);
    expect(after).not.toBe(before);
  });

  test('language selector exists when settings open', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await expect(page.locator('#langSelect')).toBeVisible();
    await expect(page.locator('#langSelect option')).toHaveCount(11);
  });

  test('switching to Simplified Chinese updates visible text', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await page.locator('#langSelect').selectOption('zh-Hans');
    await page.locator('.settings-backdrop').click();
    await expect(page.locator('#addBtn')).toHaveText('+ 添加');
  });

  test('language choice persists after page refresh', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await page.locator('#langSelect').selectOption('zh-Hans');
    await page.locator('.settings-backdrop').click();
    await page.reload();
    await expect(page.locator('#addBtn')).toHaveText('+ 添加');
  });

  test('drag and drop reorders photos', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
      path.join(fixtures, 'square.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    const imgs = page.locator('#previewGrid img');
    const first = imgs.first();
    const last = imgs.last();
    await first.dragTo(last, { force: true });
    const orderAfter = await page.locator('#previewGrid img').evaluateAll((els) =>
      els.map((e) => e.src)
    );
    expect(orderAfter).toHaveLength(3);
  });

  test('watermark export with text watermark', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    await page.locator('#settingsBtn').click();
    await page.locator('#watermarkType').selectOption('text');
    await page.locator('#watermarkText').fill('Test Watermark');
    await page.locator('.settings-backdrop').click();
    await page.locator('#exportBtn').click();
    await expect(page.locator('#exportOptionsSheet')).toHaveClass(/open/);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#exportOptionDownload').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/goja-grid\.(jpg|png)/);
  });

  test('settings close returns focus to settings button', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await page.locator('#langSelect').focus();
    await page.locator('#settingsCloseBtn').click();
    await expect(page.locator('#settingsPanel')).not.toHaveClass(/open/);
    await expect(page.locator('#settingsBtn')).toBeFocused();
  });

  test('image fit setting switches preview to contain and export works', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await page.locator('#imageFit').selectOption('contain');
    await page.locator('.settings-backdrop').click();
    const objFit = await page.locator('#previewGrid img').first().evaluate((el) =>
      getComputedStyle(el).objectFit
    );
    expect(objFit).toBe('contain');
    await page.locator('#exportBtn').click();
    await expect(page.locator('#exportOptionsSheet')).toHaveClass(/open/);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#exportOptionDownload').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/goja-grid\.(jpg|png)/);
  });
});
