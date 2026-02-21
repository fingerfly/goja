import { test, expect } from '@playwright/test';
import path from 'path';

const fixtures = path.resolve('tests/fixtures');

test.describe('Goja App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows header with branding', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Goja');
    await expect(page.locator('.tagline')).toContainText('Grid craft');
  });

  test('shows drop zone on load', async ({ page }) => {
    await expect(page.locator('#dropZone')).toBeVisible();
    await expect(page.locator('#preview')).not.toBeVisible();
    await expect(page.locator('#controls')).not.toBeVisible();
  });

  test('uploads photos and shows preview grid', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    await expect(page.locator('#controls')).toBeVisible();
    await expect(page.locator('#actions')).toBeVisible();
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
});
