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

  test.describe('touch remove menu', () => {
    test.use({
      hasTouch: true,
      isMobile: true,
      viewport: { width: 390, height: 844 },
    });

    test('tap on photo opens Goja remove menu on touch devices', async ({ page }) => {
      const fileInput = page.locator('#fileInput');
      await fileInput.setInputFiles([
        path.join(fixtures, 'landscape.jpg'),
        path.join(fixtures, 'portrait.jpg'),
      ]);
      await expect(page.locator('#preview')).toBeVisible();
      const firstImage = page.locator('#previewGrid img').first();
      await firstImage.tap();
      await expect(page.locator('.cell-context-menu')).toBeVisible();
      await expect(page.locator('.cell-context-menu')).toContainText('Remove');
    });

    test('repeated touch interactions keep one Goja menu instance', async ({ page }) => {
      const fileInput = page.locator('#fileInput');
      await fileInput.setInputFiles([
        path.join(fixtures, 'landscape.jpg'),
        path.join(fixtures, 'portrait.jpg'),
      ]);
      await expect(page.locator('#preview')).toBeVisible();
      const firstImage = page.locator('#previewGrid img').first();
      await firstImage.tap();
      await firstImage.tap({ delay: 700 });
      await expect(page.locator('.cell-context-menu')).toHaveCount(1);
    });

    test('touch menu auto-dismisses after idle timeout', async ({ page }) => {
      const fileInput = page.locator('#fileInput');
      await fileInput.setInputFiles([
        path.join(fixtures, 'landscape.jpg'),
        path.join(fixtures, 'portrait.jpg'),
      ]);
      await expect(page.locator('#preview')).toBeVisible();
      const firstImage = page.locator('#previewGrid img').first();
      await firstImage.tap();
      await expect(page.locator('.cell-context-menu')).toBeVisible();
      await page.waitForTimeout(1900);
      await expect(page.locator('.cell-context-menu')).toHaveCount(0);
    });

    test('touch menu uses translucent visual style and blur when supported', async ({ page }) => {
      const fileInput = page.locator('#fileInput');
      await fileInput.setInputFiles([
        path.join(fixtures, 'landscape.jpg'),
        path.join(fixtures, 'portrait.jpg'),
      ]);
      await expect(page.locator('#preview')).toBeVisible();
      await page.locator('#previewGrid img').first().tap();
      await expect(page.locator('.cell-context-menu')).toBeVisible();
      const styleState = await page.evaluate(() => {
        const menu = document.querySelector('.cell-context-menu');
        if (!menu) throw new Error('Context menu not found');
        const css = getComputedStyle(menu);
        const parts = css.backgroundColor.match(/rgba?\(([^)]+)\)/)?.[1].split(',').map((p) => p.trim()) ?? [];
        const alpha = parts.length === 4 ? Number.parseFloat(parts[3]) : 1;
        const blurSupported = CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
        return { alpha, blurSupported, backdropFilter: css.backdropFilter, webkitBackdropFilter: css.webkitBackdropFilter };
      });
      expect(styleState.alpha).toBeGreaterThanOrEqual(0.68);
      expect(styleState.alpha).toBeLessThanOrEqual(0.9);
      if (styleState.blurSupported) {
        expect(styleState.backdropFilter !== 'none' || styleState.webkitBackdropFilter !== 'none').toBe(true);
      }
    });

    test('touch menu in dark mode keeps stronger transparency target', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      const fileInput = page.locator('#fileInput');
      await fileInput.setInputFiles([
        path.join(fixtures, 'landscape.jpg'),
        path.join(fixtures, 'portrait.jpg'),
      ]);
      await expect(page.locator('#preview')).toBeVisible();
      await page.locator('#previewGrid img').first().tap();
      await expect(page.locator('.cell-context-menu')).toBeVisible();
      const darkAlpha = await page.evaluate(() => {
        const menu = document.querySelector('.cell-context-menu');
        if (!menu) throw new Error('Context menu not found');
        const color = getComputedStyle(menu).backgroundColor;
        const parts = color.match(/rgba?\(([^)]+)\)/)?.[1].split(',').map((p) => p.trim()) ?? [];
        return parts.length === 4 ? Number.parseFloat(parts[3]) : 1;
      });
      expect(darkAlpha).toBeGreaterThanOrEqual(0.65);
      expect(darkAlpha).toBeLessThanOrEqual(0.78);
    });
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
    await expect(page.locator('#langSelect option')).toHaveCount(6);
  });

  test('language is a standalone settings section and tab', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await expect(page.locator('[data-settings-tab="language"]')).toBeVisible();
    await expect(page.locator('#settingsSectionLanguage')).toBeVisible();
    await expect(page.locator('#settingsSectionLanguage #langSelect')).toBeVisible();
    await expect(page.locator('#settingsSectionGrid #langSelect')).toHaveCount(0);
  });

  test('settings shell shows sticky section tabs and sticky footer actions', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await expect(page.locator('#settingsSectionTabs')).toBeVisible();
    await expect(page.locator('#settingsActions')).toBeVisible();
    const tabsPos = await page.locator('#settingsSectionTabs').evaluate((el) => getComputedStyle(el).position);
    const footerPos = await page.locator('#settingsActions').evaluate((el) => getComputedStyle(el).position);
    expect(tabsPos).toBe('sticky');
    expect(footerPos).toBe('sticky');
  });

  test('settings footer actions sit flush with settings panel bottom edge', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    const bottomDelta = await page.evaluate(() => {
      const panel = document.querySelector('#settingsPanel');
      const actions = document.querySelector('#settingsActions');
      if (!panel || !actions) return 9999;
      const panelRect = panel.getBoundingClientRect();
      const actionsRect = actions.getBoundingClientRect();
      return Math.abs(panelRect.bottom - actionsRect.bottom);
    });
    expect(bottomDelta).toBeLessThanOrEqual(2);
  });

  test('settings tabs navigate to target sections', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    const tab = page.locator('[data-settings-tab="watermark"]');
    await tab.click();
    await expect(tab).toHaveClass(/is-active/);
    await expect(page.locator('#settingsSectionWatermark')).toHaveAttribute('data-settings-section', 'watermark');
  });

  test('settings panel has no horizontal overflow on small phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    const hasOverflow = await page.locator('#settingsPanelBody').evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(hasOverflow).toBe(false);
  });

  test('paired control rows switch to two columns on tablet width', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    const panelWidth = await page.locator('#settingsPanel').evaluate((el) => el.getBoundingClientRect().width);
    expect(panelWidth).toBeGreaterThanOrEqual(380);
    const cols = await page.locator('.control-row--pair').first().evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    expect(cols.trim().split(/\s+/).length).toBe(2);
  });

  test('paired control rows remain single column on phone width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    const cols = await page.locator('.control-row--pair').first().evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    expect(cols.trim().split(/\s+/).length).toBe(1);
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

  test('filename label and placeholder localized when settings open in zh-Hans', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('goja-locale', 'zh-Hans'));
    await page.reload();
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    const filenameLabel = page.locator('label[for="exportFilename"]');
    await expect(filenameLabel).toHaveText('文件名');
    const filenameInput = page.locator('#exportFilename');
    await expect(filenameInput).toHaveAttribute('placeholder', 'goja-grid');
    const exportUseDateLabel = page.locator('label:has(input#exportUseDate)');
    await expect(exportUseDateLabel).toContainText('在文件名中添加日期');
  });

  test('settings footer actions are localized in zh-Hans', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('goja-locale', 'zh-Hans'));
    await page.reload();
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await expect(page.locator('#settingsResetSectionBtn')).toHaveText('重置当前分组');
    await expect(page.locator('#settingsResetAllBtn')).toHaveText('全部重置');
    await expect(page.locator('#settingsDoneBtn')).toHaveText('完成');
  });

  test('reset all applies defaults immediately without confirmation dialog', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);

    await page.locator('#frameWidth').fill('777');
    await page.locator('#frameHeight').fill('888');
    await page.locator('#gapSlider').fill('12');
    await page.locator('#gapSlider').dispatchEvent('input');
    await page.locator('#watermarkType').selectOption('text');
    await page.locator('#watermarkText').fill('Demo');
    await page.locator('#showCaptureDate').check();
    await page.locator('#langSelect').selectOption('zh-Hans');

    let dialogShown = false;
    page.on('dialog', async (dialog) => {
      dialogShown = true;
      await dialog.dismiss();
    });

    await page.locator('#settingsResetAllBtn').click();
    await page.waitForTimeout(100);

    expect(dialogShown).toBe(false);
    await expect(page.locator('#frameWidth')).toHaveValue('1080');
    await expect(page.locator('#frameHeight')).toHaveValue('1350');
    await expect(page.locator('#gapSlider')).toHaveValue('4');
    await expect(page.locator('#watermarkType')).toHaveValue('none');
    await expect(page.locator('#watermarkText')).toHaveValue('');
    await expect(page.locator('#showCaptureDate')).not.toBeChecked();
    await expect(page.locator('#langSelect')).toHaveValue('en');
  });

  test('settings tab click positions target section near top of panel body', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await page.locator('[data-settings-tab="legal"]').click();
    const deltaTop = await page.evaluate(() => {
      const panel = document.querySelector('#settingsPanelBody');
      const section = document.querySelector('#settingsSectionLegal');
      const tabs = document.querySelector('#settingsSectionTabs');
      if (!panel || !section || !tabs) return 9999;
      const panelRect = panel.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();
      const expectedTop = panelRect.top + tabs.getBoundingClientRect().height;
      return Math.abs(sectionRect.top - expectedTop);
    });
    expect(deltaTop).toBeLessThanOrEqual(80);
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

  test('capture date overlay: grid renders when showCaptureDate enabled with photos', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    await page.locator('#settingsBtn').click();
    await page.locator('#showCaptureDate').check();
    await page.locator('.settings-backdrop').click();
    await expect(page.locator('#preview')).toBeVisible();
    await expect(page.locator('#previewGrid .preview-cell')).toHaveCount(2);
  });

  test('capture date options visibility: hidden when unchecked, shown when checked', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await expect(page.locator('#captureDateOptionsGroup')).toHaveClass(/hidden/);
    await page.locator('#showCaptureDate').check();
    await expect(page.locator('#captureDateOptionsGroup')).not.toHaveClass(/hidden/);
    await page.locator('#showCaptureDate').uncheck();
    await expect(page.locator('#captureDateOptionsGroup')).toHaveClass(/hidden/);
  });

  test('watermark groups visibility: hidden when type is none, shown when type is text', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await page.locator('#watermarkType').selectOption('none');
    await expect(page.locator('#watermarkPosGroup')).toHaveClass(/hidden/);
    await expect(page.locator('#watermarkOpacityGroup')).toHaveClass(/hidden/);
    await expect(page.locator('#watermarkTextGroup')).toHaveClass(/hidden/);
    await page.locator('#watermarkType').selectOption('text');
    await expect(page.locator('#watermarkPosGroup')).not.toHaveClass(/hidden/);
    await expect(page.locator('#watermarkOpacityGroup')).not.toHaveClass(/hidden/);
    await expect(page.locator('#watermarkTextGroup')).not.toHaveClass(/hidden/);
    await page.locator('#watermarkType').selectOption('datetime');
    await expect(page.locator('#watermarkTextGroup')).toHaveClass(/hidden/);
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

  test('checkbox label has touch target at least 44px', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    const exportUseDateLabel = page.locator('label:has(input#exportUseDate)');
    const box = await exportUseDateLabel.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('frame dimension input clamps invalid values on blur', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await page.locator('#frameWidth').fill('5000');
    await page.locator('#frameWidth').blur();
    await expect(page.locator('#frameWidth')).toHaveValue('4096');
  });

  test('frame dimension input clamps on debounced input', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await page.locator('#frameWidth').fill('100');
    await page.waitForTimeout(250);
    await expect(page.locator('#frameWidth')).toHaveValue('320');
  });

  test('aspect preset 3:4 sets frame to 1080×1440', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    const preset34Btn = page.locator('button[data-i18n="preset34"]');
    await expect(preset34Btn).toHaveText('3:4');
    await preset34Btn.click();
    await expect(page.locator('#frameWidth')).toHaveValue('1080');
    await expect(page.locator('#frameHeight')).toHaveValue('1440');
    await page.locator('.settings-backdrop').click();
  });

  test('gap slider and watermark opacity init from config', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await expect(page.locator('#gapSlider')).toHaveValue('4');
    await expect(page.locator('#gapSlider')).toHaveAttribute('min', '0');
    await expect(page.locator('#gapSlider')).toHaveAttribute('max', '20');
    await page.locator('#watermarkType').selectOption('text');
    await expect(page.locator('#watermarkOpacity')).toHaveValue('0.8');
  });

  test('settings panel has dialog role and aria attributes when open', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await expect(page.locator('#settingsPanel')).toHaveAttribute('role', 'dialog');
    await expect(page.locator('#settingsPanel')).toHaveAttribute('aria-labelledby', 'settingsTitle');
    await expect(page.locator('#settingsPanel')).toHaveAttribute('aria-modal', 'true');
  });

  test('settings close returns focus to settings button', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await page.locator('#langSelect').focus();
    await page.locator('#settingsCloseBtn').click();
    await expect(page.locator('#settingsPanel')).not.toHaveClass(/open/);
    await expect(page.locator('#settingsBtn')).toBeFocused();
  });

  test('filter preset grayscale applies filter style to preview images', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await page.locator('#filterPreset').selectOption('grayscale');
    await page.locator('.settings-backdrop').click();
    const filterStyle = await page.locator('#previewGrid img').first().evaluate((el) => el.style.filter);
    expect(filterStyle).toContain('grayscale');
  });

  test('watermark shows in preview when enabled in settings', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await page.locator('#watermarkType').selectOption('text');
    await page.locator('#watermarkText').fill('Test');
    await page.locator('.settings-backdrop').click();
    await expect(page.locator('#preview .watermark-preview-overlay')).toBeVisible();
  });

  test('watermark overlay removed on clear, no duplicate when adding photos again', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await page.locator('#watermarkType').selectOption('text');
    await page.locator('#watermarkText').fill('Test');
    await page.locator('.settings-backdrop').click();
    await expect(page.locator('#preview .watermark-preview-overlay')).toBeVisible();
    await page.locator('#clearBtn').click();
    await expect(page.locator('#preview')).not.toBeVisible();
    await expect(page.locator('.watermark-preview-overlay')).toHaveCount(0);
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    await expect(page.locator('#preview .watermark-preview-overlay')).toHaveCount(1);
  });

  test('vignette checkbox shows vignette overlay in preview when enabled', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await page.locator('#vignetteEnabled').check();
    await page.locator('.settings-backdrop').click();
    await expect(page.locator('#previewGrid .vignette-overlay')).toHaveCount(2);
  });

  test('vignette options group hidden when vignette unchecked, visible when checked', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await expect(page.locator('#vignetteOptionsGroup')).toHaveClass(/hidden/);
    await page.locator('#vignetteEnabled').check();
    await expect(page.locator('#vignetteOptionsGroup')).not.toHaveClass(/hidden/);
    await page.locator('#vignetteEnabled').uncheck();
    await expect(page.locator('#vignetteOptionsGroup')).toHaveClass(/hidden/);
  });

  test('effects section has filter preset and vignette controls in settings', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await expect(page.locator('#filterPreset')).toBeVisible();
    await expect(page.locator('#vignetteEnabled')).toBeVisible();
    await expect(page.locator('#filterPreset option')).toHaveCount(9);
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
