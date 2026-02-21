import { test, expect } from '@playwright/test';
import path from 'path';

const fixtures = path.resolve('tests/fixtures');

test.describe('Goja App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows header with branding', async ({ page }) => {
    await expect(page.locator('.top-bar__brand')).toHaveText('Goja');
    await expect(page.locator('.top-bar__tagline')).toContainText('Grid craft');
  });

  test('shows drop zone on load', async ({ page }) => {
    await expect(page.locator('#dropZone')).toBeVisible();
    await expect(page.locator('#preview')).not.toBeVisible();
    await expect(page.locator('#bottomBar')).toBeVisible();
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

  test('export button triggers download', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#exportBtn')).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#exportBtn').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/goja-grid\.(jpg|png)/);
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
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'landscape.jpg'),
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
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#exportBtn').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/goja-grid\.(jpg|png)/);
  });
});
