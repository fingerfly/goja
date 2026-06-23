import { test, expect } from '@playwright/test';
import path from 'path';

const fixtures = path.resolve('tests/fixtures');
const mobileSettingsViewports = [
  { name: 'iphone-12', width: 390, height: 844 },
  { name: 'small-android', width: 360, height: 800 },
  { name: 'legacy-small', width: 320, height: 568 },
  { name: 'large-android', width: 412, height: 915 },
  { name: 'phone-landscape', width: 844, height: 390 },
];

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
      await expect(page.locator('.cell-context-menu')).toHaveCount(0, { timeout: 3000 });
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

  test('uses safe background fallback control on OPPO-like user agents', async ({ page }) => {
    const oppoUa = 'Mozilla/5.0 (Linux; Android 14; CPH2651 Build/UP1A) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36 OPPOReno';
    await page.addInitScript((ua) => {
      Object.defineProperty(window.navigator, 'userAgent', {
        configurable: true,
        get: () => ua,
      });
    }, oppoUa);
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('goja-locale', 'en'));
    await page.reload();

    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    const bgInput = page.locator('#bgColor');
    await expect(bgInput).toHaveAttribute('type', 'text');
    await expect(page.locator('#bgColorPalette')).toBeVisible();
    await bgInput.fill('bad-value');
    await bgInput.dispatchEvent('change');
    await expect(bgInput).toHaveValue('#ffffff');
  });

  test('keeps native background color picker UI on non-fallback desktop browsers', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await expect(page.locator('#bgColor')).toHaveAttribute('type', 'color');
    await expect(page.locator('#bgColorPalette')).toBeHidden();
  });

  mobileSettingsViewports.forEach(({ name, width, height }) => {
    test(`settings mobile layout keeps tabs usable on ${name} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => localStorage.setItem('goja-locale', 'zh-Hans'));
      await page.reload();
      await page.locator('#settingsBtn').click();
      await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
      await expect(page.locator('#settingsSectionTabs')).toBeVisible();
      await expect(page.locator('#settingsActions')).toBeVisible();
      const layoutState = await page.evaluate(() => {
        const panel = document.querySelector('#settingsPanel');
        const body = document.querySelector('#settingsPanelBody');
        const tabs = document.querySelector('#settingsSectionTabs');
        const actions = document.querySelector('#settingsActions');
        if (!panel || !body || !tabs || !actions) {
          return { ok: false };
        }
        const panelRect = panel.getBoundingClientRect();
        const tabsRect = tabs.getBoundingClientRect();
        const actionsRect = actions.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const buttons = Array.from(tabs.querySelectorAll('button'));
        const buttonRects = buttons.map((btn) => btn.getBoundingClientRect());
        const visibleButtonRects = buttonRects.filter((rect) => {
          return rect.right > tabsRect.left && rect.left < tabsRect.right && rect.bottom > tabsRect.top && rect.top < tabsRect.bottom;
        });
        let overlapCount = 0;
        for (let i = 0; i < visibleButtonRects.length; i += 1) {
          for (let j = i + 1; j < visibleButtonRects.length; j += 1) {
            const a = visibleButtonRects[i];
            const b = visibleButtonRects[j];
            const overlapW = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const overlapH = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (overlapW > 1 && overlapH > 1) overlapCount += 1;
          }
        }
        const minVisibleTabHeight = visibleButtonRects.reduce((min, rect) => Math.min(min, rect.height), Infinity);
        return {
          ok: true,
          panelHeightRatio: panelRect.height / viewportHeight,
          hasHorizontalOverflow: body.scrollWidth > body.clientWidth,
          tabsVisibleButtonCount: visibleButtonRects.length,
          overlapCount,
          minVisibleTabHeight: Number.isFinite(minVisibleTabHeight) ? minVisibleTabHeight : 0,
          actionsWithinPanel: actionsRect.bottom <= panelRect.bottom + 1 && actionsRect.top >= panelRect.top - 1,
          tabsInsidePanel: tabsRect.top >= panelRect.top - 1 && tabsRect.bottom <= panelRect.bottom + 1,
        };
      });
      expect(layoutState.ok).toBe(true);
      expect(layoutState.panelHeightRatio).toBeGreaterThanOrEqual(0.8);
      expect(layoutState.hasHorizontalOverflow).toBe(false);
      expect(layoutState.tabsVisibleButtonCount).toBeGreaterThanOrEqual(2);
      expect(layoutState.overlapCount).toBe(0);
      expect(layoutState.minVisibleTabHeight).toBeGreaterThanOrEqual(38);
      expect(layoutState.actionsWithinPanel).toBe(true);
      expect(layoutState.tabsInsidePanel).toBe(true);
    });
  });

  test('settings tabs use horizontal snap affordance on ultra narrow phones', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.evaluate(() => localStorage.setItem('goja-locale', 'zh-Hans'));
    await page.reload();
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    const tabsState = await page.locator('#settingsSectionTabs').evaluate((tabs) => {
      const css = getComputedStyle(tabs);
      const firstButton = tabs.querySelector('button');
      const firstCss = firstButton ? getComputedStyle(firstButton) : null;
      return {
        overflowX: css.overflowX,
        scrollSnapType: css.scrollSnapType,
        firstButtonSnapAlign: firstCss ? firstCss.scrollSnapAlign : '',
      };
    });
    expect(tabsState.overflowX).toBe('auto');
    expect(tabsState.scrollSnapType).toContain('x');
    expect(tabsState.firstButtonSnapAlign).toBe('start');
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

  test('desktop settings uses wider panel and multi-column section layout', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    const panelWidth = await page.locator('#settingsPanel').evaluate((el) => el.getBoundingClientRect().width);
    expect(panelWidth).toBeGreaterThanOrEqual(600);
    const desktopMetrics = await page.evaluate(() => {
      const ids = ['settingsSectionGrid', 'settingsSectionExport', 'settingsSectionWatermark'];
      const sectionLayout = ids.map((id) => {
        const section = document.getElementById(id);
        if (!section) return { id, display: 'none', columns: 0 };
        const style = getComputedStyle(section);
        const columns = style.gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length;
        return {
          id,
          display: style.display,
          columns,
          paddingInline: parseFloat(style.paddingLeft) || 0,
          sectionGap: parseFloat(style.gap) || 0,
          radius: parseFloat(style.borderTopLeftRadius) || 0,
        };
      });
      const firstTab = document.querySelector('#settingsSectionTabs button');
      const firstTabStyle = firstTab ? getComputedStyle(firstTab) : null;
      return {
        sectionLayout,
        tabsPaddingX: firstTabStyle ? parseFloat(firstTabStyle.paddingLeft) || 0 : 0,
        tabsMinHeight: firstTabStyle ? parseFloat(firstTabStyle.minHeight) || 0 : 0,
      };
    });
    desktopMetrics.sectionLayout.forEach(({ display, columns, paddingInline, sectionGap, radius }) => {
      expect(display).toBe('grid');
      expect(columns).toBeGreaterThanOrEqual(2);
      expect(paddingInline).toBeGreaterThanOrEqual(20);
      expect(sectionGap).toBeGreaterThanOrEqual(12);
      expect(radius).toBeGreaterThanOrEqual(12);
    });
    expect(desktopMetrics.tabsPaddingX).toBeGreaterThanOrEqual(12);
    expect(desktopMetrics.tabsMinHeight).toBeGreaterThanOrEqual(44);
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

  test('edge controls are localized in zh-Hans', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('goja-locale', 'zh-Hans'));
    await page.reload();
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    const edgeStyleLabel = page.locator('label[for="edgeStyle"]');
    await expect(edgeStyleLabel).toHaveText('单元格边缘样式');
    await expect(page.locator('#edgeStyle option[value="straight"]')).toHaveText('直线');
    await expect(page.locator('#edgeStyle option[value="soft-wave"]')).toHaveCount(0);
    await expect(page.locator('#edgeStyle option[value="paper-torn"]')).toHaveText('纸张撕边');
    await expect(page.locator('#edgeStyle option[value="film-scallop"]')).toHaveText('胶片齿孔');
    await expect(page.locator('#edgeStyle option[value="graphic-zigzag"]')).toHaveText('图形锯齿');
    await expect(page.locator('#edgeStyle option[value="silk-wave"]')).toHaveText('丝绸波纹');
    await expect(page.locator('#edgeStyle option[value="linen-deckle"]')).toHaveText('亚麻毛边');
    await expect(page.locator('#edgeStyle option[value="postage-perf"]')).toHaveText('邮票齿孔');
    await expect(page.locator('#edgeFrequencyHint')).toHaveText('每条单元格边的整数周期（1-20）');
  });

  test('background labels are localized in zh-Hans', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('goja-locale', 'zh-Hans'));
    await page.reload();
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await expect(page.locator('label[for="bgColor"]')).toHaveText('宫格内背景色');
    await expect(page.locator('label[for="outsideBackgroundColor"]')).toHaveText('整体边框外背景色');
  });

  test('background labels remain semantically distinct in en', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('goja-locale', 'en'));
    await page.reload();
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await expect(page.locator('label[for="bgColor"]')).toHaveText('Grid interior background');
    await expect(page.locator('label[for="outsideBackgroundColor"]')).toHaveText('Outside grid-frame background');
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

  test('tiled watermark export completes and opens options sheet', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    await page.locator('#settingsBtn').click();
    await page.locator('#watermarkType').selectOption('text');
    await page.locator('#watermarkText').fill('Tiled');
    await page.locator('#watermarkPos').selectOption('tiled');
    await page.locator('#watermarkTileSpacing').fill('0');
    await page.locator('#watermarkTileColSpacing').fill('0');
    await page.locator('.settings-backdrop').click();
    await page.locator('#exportBtn').click();
    await expect(page.locator('#exportOptionsSheet')).toHaveClass(/open/, { timeout: 15000 });
  });

  test('watermark tile options visible when position is tiled', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await page.locator('#watermarkType').selectOption('text');
    await page.locator('#watermarkPos').selectOption('bottom-right');
    await expect(page.locator('#watermarkTileOptionsGroup')).toHaveClass(/hidden/);
    await page.locator('#watermarkPos').selectOption('tiled');
    await expect(page.locator('#watermarkTileOptionsGroup')).not.toHaveClass(/hidden/);
  });

  test('watermark tile spacing accepts numeric input', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await page.locator('#watermarkType').selectOption('text');
    await page.locator('#watermarkPos').selectOption('tiled');
    await page.locator('#watermarkTileSpacing').fill('120');
    await expect(page.locator('#watermarkTileSpacing')).toHaveValue('120');
    await page.locator('#watermarkTileColSpacing').fill('40');
    await expect(page.locator('#watermarkTileColSpacing')).toHaveValue('40');
  });

  test('watermark tile controls meet 44px touch target', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await page.locator('#watermarkType').selectOption('text');
    await page.locator('#watermarkPos').selectOption('tiled');
    const spacingBox = await page.locator('#watermarkTileSpacing').boundingBox();
    expect(spacingBox?.height).toBeGreaterThanOrEqual(44);
    const colSpacingBox = await page.locator('#watermarkTileColSpacing').boundingBox();
    expect(colSpacingBox?.height).toBeGreaterThanOrEqual(44);
    const rotationBox = await page.locator('#watermarkTileRotation').boundingBox();
    expect(rotationBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('watermark tile hints linked via aria-describedby', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await page.locator('#watermarkType').selectOption('text');
    await page.locator('#watermarkPos').selectOption('tiled');
    await expect(page.locator('#watermarkTileSpacingHint')).toBeVisible();
    await expect(page.locator('#watermarkTileColSpacingHint')).toBeVisible();
    await expect(page.locator('#watermarkTileRotationHint')).toBeVisible();
    await expect(page.locator('#watermarkTileSpacing')).toHaveAttribute(
      'aria-describedby', 'watermarkTileSpacingHint'
    );
    await expect(page.locator('#watermarkTileColSpacing')).toHaveAttribute(
      'aria-describedby', 'watermarkTileColSpacingHint'
    );
    await expect(page.locator('#watermarkTileRotation')).toHaveAttribute(
      'aria-describedby', 'watermarkTileRotationHint'
    );
  });

  test('watermark tile spacing and rotation init from config', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await page.locator('#watermarkType').selectOption('text');
    await page.locator('#watermarkPos').selectOption('tiled');
    await expect(page.locator('#watermarkTileSpacing')).toHaveValue('80');
    await expect(page.locator('#watermarkTileSpacing')).toHaveAttribute('min', '0');
    await expect(page.locator('#watermarkTileSpacing')).toHaveAttribute('max', '400');
    await expect(page.locator('#watermarkTileColSpacing')).toHaveValue('0');
    await expect(page.locator('#watermarkTileColSpacing')).toHaveAttribute('min', '0');
    await expect(page.locator('#watermarkTileColSpacing')).toHaveAttribute('max', '400');
    await expect(page.locator('#watermarkTileRotation')).toHaveValue('-30');
    await expect(page.locator('#watermarkTileRotation')).toHaveAttribute('min', '-90');
    await expect(page.locator('#watermarkTileRotation')).toHaveAttribute('max', '90');
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
    await expect(page.locator('#frameWidth')).toHaveValue('320', { timeout: 1500 });
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

  test('edge controls are shown on supported browsers and apply clip path', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await expect(page.locator('#edgeOptionsGroup')).not.toHaveClass(/hidden/);
    await expect(page.locator('#edgeIntensityInput')).toBeVisible();
    await expect(page.locator('#edgeFrequency')).toHaveAttribute('max', '20');
    await page.locator('#edgeStyle').selectOption('silk-wave');
    await page.locator('.settings-backdrop').click();
    const clipPath = await page.locator('#previewGrid .preview-cell').first().evaluate((el) =>
      getComputedStyle(el).clipPath
    );
    expect(clipPath).toContain('path(');
  });

  test('iPhone class devices use text numeric controls for edge cycles and seed', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/');
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await expect(page.locator('#edgeFrequency')).toHaveAttribute('type', 'text');
    await expect(page.locator('#edgeSeed')).toHaveAttribute('type', 'text');
    await context.close();
  });

  test('shape controls and edge controls reflect cell ownership hierarchy', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await expect(page.locator('#globalFrameShapeGroup')).toBeVisible();
    await expect(page.locator('#cellShapeTemplateGroup')).toBeVisible();
    const hierarchy = await page.evaluate(() => {
      const edgeRoot = document.querySelector('#edgeTextureOverlayGroup');
      const globalGroup = document.querySelector('#globalFrameShapeGroup');
      const cellGroup = document.querySelector('#cellShapeTemplateGroup');
      if (!edgeRoot || !globalGroup || !cellGroup) return false;
      return globalGroup.parentElement?.id === 'edgeOptionsGroup'
        && cellGroup.parentElement?.id === 'edgeOptionsGroup'
        && edgeRoot.parentElement === cellGroup;
    });
    expect(hierarchy).toBe(true);
  });

  test('iPhone class preview applies selected shape and edge style', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/');
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await page.locator('#globalFrameShape').selectOption('ellipse');
    await page.locator('#cellShapeTemplate').selectOption('circle');
    await page.locator('#edgeStyle').selectOption('straight');
    await page.locator('#settingsCloseBtn').click();
    const clipState = await page.evaluate(() => {
      const container = document.querySelector('#previewGrid');
      const firstCell = document.querySelector('#previewGrid .preview-cell');
      const firstImg = document.querySelector('#previewGrid .preview-cell img');
      const c = container ? getComputedStyle(container).clipPath : '';
      const cell = firstCell ? getComputedStyle(firstCell).clipPath : '';
      const img = firstImg ? getComputedStyle(firstImg).clipPath : '';
      const xValues = c.includes('polygon(')
        ? c.slice('polygon('.length, c.lastIndexOf(')'))
          .split(',')
          .map((token) => {
            const nums = token.match(/-?\d+(?:\.\d+)?/g);
            return nums && nums.length > 0 ? Number(nums[0]) : NaN;
          })
          .filter((n) => Number.isFinite(n))
        : [];
      const minX = xValues.length ? Math.min(...xValues) : NaN;
      return { c, cell, img, minX };
    });
    expect(clipState.c).toContain('polygon(');
    expect(clipState.minX).toBeLessThan(1);
    expect(clipState.cell).toContain('circle(50% at 50% 50%)');
    expect(clipState.img === 'none' || clipState.img === '').toBeTruthy();
    await context.close();
  });

  test('iPhone class preview stays in sync after repeated shape and edge toggles', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/');
    await page.locator('#fileInput').setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#previewGrid .preview-cell')).toHaveCount(2);
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    const toggles = [
      { edge: 'straight', cell: 'heart', expectCell: ['path(', 'polygon('], expectImgEmpty: true },
      { edge: 'paper-torn', cell: 'heart', expectCell: ['path('], expectImgEmpty: true },
      { edge: 'straight', cell: 'circle', expectCell: ['circle('], expectImgEmpty: true },
      { edge: 'graphic-zigzag', cell: 'regular-octagon', expectCell: ['path('], expectImgEmpty: true },
      { edge: 'silk-wave', cell: 'regular-36-gon', expectCell: ['path('], expectImgEmpty: true },
      { edge: 'paper-torn', cell: 'heart', expectCell: ['path('], expectImgEmpty: true },
    ];
    for (const step of toggles) {
      await page.locator('#edgeStyle').selectOption(step.edge);
      await page.locator('#cellShapeTemplate').selectOption(step.cell);
      const clipState = await page.evaluate(() => {
        const firstCell = document.querySelector('#previewGrid .preview-cell');
        const firstImg = document.querySelector('#previewGrid .preview-cell img');
        const cell = firstCell ? getComputedStyle(firstCell).clipPath : '';
        const img = firstImg ? getComputedStyle(firstImg).clipPath : '';
        return { cell, img };
      });
      expect(step.expectCell.some((token) => clipState.cell.includes(token))).toBeTruthy();
      if (step.expectImgEmpty) {
        expect(clipState.img === 'none' || clipState.img === '').toBeTruthy();
      }
    }
    await page.locator('#settingsCloseBtn').click();
    const finalState = await page.evaluate(() => {
      const firstCell = document.querySelector('#previewGrid .preview-cell');
      const firstImg = document.querySelector('#previewGrid .preview-cell img');
      return {
        cell: firstCell ? getComputedStyle(firstCell).clipPath : '',
        img: firstImg ? getComputedStyle(firstImg).clipPath : '',
      };
    });
    expect(finalState.cell).toContain('path(');
    expect(finalState.img === 'none' || finalState.img === '').toBeTruthy();
    await context.close();
  });

  test('frame stroke uses contour path in preview at width 20', async ({ page }) => {
    await page.locator('#fileInput').setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await page.locator('#globalFrameShape').selectOption('regular-octagon');
    await page.locator('#globalFrameStrokeEnabled').check();
    await page.locator('#globalFrameStrokeWidth').fill('20');
    await page.locator('#globalFrameStrokeOpacity').fill('1');
    await page.locator('#globalFrameStrokeColor').fill('#00ff00');
    await page.locator('#outsideBackgroundColor').fill('#000000');
    await page.locator('#settingsCloseBtn').click();
    const strokeState = await page.evaluate(() => {
      const overlay = document.querySelector('#preview .preview-frame-stroke-overlay');
      const path = overlay?.querySelector('svg path');
      const grid = document.querySelector('#previewGrid');
      return {
        overlay: Boolean(overlay),
        hasSvgPath: Boolean(path),
        dLength: (path?.getAttribute('d') || '').length,
        stroke: path?.getAttribute('stroke') || '',
        strokeWidth: path?.getAttribute('stroke-width') || '',
        borderStyle: overlay ? getComputedStyle(overlay).borderStyle : '',
        clipPath: grid ? getComputedStyle(grid).clipPath : '',
      };
    });
    expect(strokeState.overlay).toBe(true);
    expect(strokeState.hasSvgPath).toBe(true);
    expect(strokeState.dLength).toBeGreaterThan(20);
    expect(strokeState.stroke).toContain('rgba(');
    expect(strokeState.stroke).toContain('0,255,0');
    expect(strokeState.strokeWidth).toBe('20');
    expect(strokeState.borderStyle).toBe('none');
    expect(strokeState.clipPath).toContain('polygon(');
  });

  test('shape catalog applies wave11 scope and removes triangle', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await expect(page.locator('#globalFrameShape option[value="regular-octagon"]')).toHaveCount(1);
    await expect(page.locator('#globalFrameShape option[value="regular-triangle"]')).toHaveCount(0);
    await expect(page.locator('#globalFrameShape option[value="regular-decagon"]')).toHaveCount(1);
    await expect(page.locator('#globalFrameShape option[value="regular-dodecagon"]')).toHaveCount(1);
    await expect(page.locator('#globalFrameShape option[value="regular-hexadecagon"]')).toHaveCount(1);
    await expect(page.locator('#globalFrameShape option[value="regular-36-gon"]')).toHaveCount(1);
    await expect(page.locator('#globalFrameShape option[value="regular-64-gon"]')).toHaveCount(1);
    await expect(page.locator('#globalFrameShape option[value="rounded-rect"]')).toHaveCount(1);
    await expect(page.locator('#globalFrameShape option[value="superellipse"]')).toHaveCount(1);
    await expect(page.locator('#globalFrameShape option[value="capsule"]')).toHaveCount(1);
    await expect(page.locator('#globalFrameShape option[value="diamond"]')).toHaveCount(1);
    await expect(page.locator('#globalFrameShape option[value="heart"]')).toHaveCount(1);
    await expect(page.locator('#globalFrameShape option[value="regular-hexagon"]')).toHaveCount(0);
    await expect(page.locator('#globalFrameShape option[value="regular-nonagon"]')).toHaveCount(0);
    await expect(page.locator('#cellShapeTemplate option[value="regular-octagon"]')).toHaveCount(1);
    await expect(page.locator('#cellShapeTemplate option[value="regular-triangle"]')).toHaveCount(0);
    await expect(page.locator('#cellShapeTemplate option[value="regular-decagon"]')).toHaveCount(1);
    await expect(page.locator('#cellShapeTemplate option[value="regular-dodecagon"]')).toHaveCount(1);
    await expect(page.locator('#cellShapeTemplate option[value="regular-hexadecagon"]')).toHaveCount(1);
    await expect(page.locator('#cellShapeTemplate option[value="regular-36-gon"]')).toHaveCount(1);
    await expect(page.locator('#cellShapeTemplate option[value="regular-64-gon"]')).toHaveCount(1);
    await expect(page.locator('#cellShapeTemplate option[value="rounded-rect"]')).toHaveCount(1);
    await expect(page.locator('#cellShapeTemplate option[value="superellipse"]')).toHaveCount(1);
    await expect(page.locator('#cellShapeTemplate option[value="capsule"]')).toHaveCount(0);
    await expect(page.locator('#cellShapeTemplate option[value="diamond"]')).toHaveCount(0);
    await expect(page.locator('#cellShapeTemplate option[value="heart"]')).toHaveCount(1);
    await expect(page.locator('#cellShapeTemplate option[value="regular-hexagon"]')).toHaveCount(0);
    await expect(page.locator('#cellShapeTemplate option[value="regular-nonagon"]')).toHaveCount(0);
  });

  test('heart frame silhouette remains recognizable in preview', async ({ page }) => {
    await page.locator('#fileInput').setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#preview')).toBeVisible();
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/open/);
    await page.locator('#globalFrameShape').selectOption('heart');
    await page.locator('#edgeStyle').selectOption('straight');
    await page.locator('#settingsCloseBtn').click();
    const silhouette = await page.evaluate(() => {
      const grid = document.querySelector('#previewGrid');
      if (!grid) return { ok: false };
      const clip = getComputedStyle(grid).clipPath || '';
      if (!clip.includes('polygon(')) return { ok: false, clip };
      const inside = clip.slice(clip.indexOf('polygon(') + 'polygon('.length, clip.lastIndexOf(')'));
      const points = inside.split(',').map((token) => {
        const nums = token.match(/-?\d+(?:\.\d+)?/g);
        if (!nums || nums.length < 2) return null;
        return [Number(nums[0]), Number(nums[1])];
      }).filter(Boolean);
      const xs = points.map(([x]) => x);
      const ys = points.map(([, y]) => y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const cx = (minX + maxX) / 2;
      const width = maxX - minX;
      const centerBand = points.filter(([x]) => Math.abs(x - cx) <= width * 0.06).map(([, y]) => y);
      const leftBand = points.filter(([x]) => x >= minX + width * 0.12 && x <= minX + width * 0.38).map(([, y]) => y);
      const rightBand = points.filter(([x]) => x >= maxX - width * 0.38 && x <= maxX - width * 0.12).map(([, y]) => y);
      const concavityDepth = centerBand.length && leftBand.length && rightBand.length
        ? Math.min(...centerBand) - ((Math.min(...leftBand) + Math.min(...rightBand)) / 2)
        : 0;
      const tipBand = points.filter(([, y]) => ((maxY - y) / Math.max(1e-6, maxY - minY)) <= 0.01);
      const tipCenterX = tipBand.length ? tipBand.reduce((sum, [x]) => sum + x, 0) / tipBand.length : Infinity;
      return {
        ok: true,
        pointCount: points.length,
        concavityDepth,
        tipOffset: Math.abs(tipCenterX - cx),
      };
    });
    expect(silhouette.ok).toBe(true);
    expect(silhouette.pointCount).toBeGreaterThanOrEqual(64);
    expect(silhouette.concavityDepth).toBeGreaterThanOrEqual(2);
    expect(silhouette.tipOffset).toBeLessThanOrEqual(2);
  });

  test('edge controls stay hidden when capability check fails', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.addInitScript(() => {
      const css = window.CSS;
      if (css?.supports) {
        css.supports = (...args) => {
          if (args[0] === 'clip-path') return false;
          return false;
        };
      }
      window.Path2D = undefined;
    });
    await page.goto('/');
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([
      path.join(fixtures, 'landscape.jpg'),
      path.join(fixtures, 'portrait.jpg'),
    ]);
    await expect(page.locator('#previewGrid .preview-cell')).toHaveCount(2);
    const clipPath = await page.locator('#previewGrid .preview-cell').first().evaluate((el) =>
      getComputedStyle(el).clipPath
    );
    expect(clipPath === 'none' || clipPath === '').toBeTruthy();
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#edgeOptionsGroup')).toHaveClass(/hidden/);
    await context.close();
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
