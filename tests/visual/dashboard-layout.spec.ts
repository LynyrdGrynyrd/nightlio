import { expect, test } from '@playwright/test';

interface BreakpointSpec {
  width: number;
  height: number;
}

const breakpoints: BreakpointSpec[] = [
  { width: 320, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
  { width: 1280, height: 900 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

const routes = [
  '/dashboard',
  '/dashboard/goals',
  '/dashboard/stats',
  '/dashboard/achievements',
] as const;

const maxHorizontalOverflowPx = 4;

const getHorizontalOverflow = async (page: import('@playwright/test').Page) => {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const docOverflow = Math.max(0, doc.scrollWidth - doc.clientWidth);
    const bodyOverflow = Math.max(0, body.scrollWidth - body.clientWidth);
    return Math.max(docOverflow, bodyOverflow);
  });
};

test.describe('Dashboard responsive layout gates', () => {
  for (const route of routes) {
    for (const viewport of breakpoints) {
      test(`${route} @ ${viewport.width}px has no horizontal overflow`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(route, { waitUntil: 'networkidle' });

        // Allow async card/chart modules to settle.
        await page.waitForTimeout(400);

        const overflow = await getHorizontalOverflow(page);
        expect(overflow).toBeLessThanOrEqual(maxHorizontalOverflowPx);
      });
    }
  }

  test('home desktop shell switches to two-column at >=1280', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    const display = await page.getByTestId('dashboard-home-layout').evaluate((node) => {
      return window.getComputedStyle(node).display;
    });

    expect(display).toBe('grid');
    await expect(page.getByTestId('desktop-action-bar')).toBeVisible();
  });

  test('home shell remains single-column at mobile widths', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    const display = await page.getByTestId('dashboard-home-layout').evaluate((node) => {
      return window.getComputedStyle(node).display;
    });

    expect(display).toBe('block');
    await expect(page.getByTestId('desktop-action-bar')).toBeHidden();
  });

  test('stats dashboard uses analytics board layout at >=1280', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard/stats', { waitUntil: 'networkidle' });

    const display = await page.getByTestId('stats-desktop-layout').evaluate((node) => {
      return window.getComputedStyle(node).display;
    });

    expect(display).toBe('grid');
  });

  test('achievements grid density increases with width', async ({ page }) => {
    const columnsByViewport = [
      { viewport: { width: 1280, height: 900 }, minColumns: 4 },
      { viewport: { width: 1440, height: 900 }, minColumns: 5 },
      { viewport: { width: 1920, height: 1080 }, minColumns: 6 },
    ];

    for (const item of columnsByViewport) {
      await page.setViewportSize(item.viewport);
      await page.goto('/dashboard/achievements', { waitUntil: 'networkidle' });
      await expect(page.getByTestId('achievements-grid')).toBeVisible();

      const columns = await page.getByTestId('achievements-grid').evaluate((grid) => {
        const template = window.getComputedStyle(grid).gridTemplateColumns;
        if (!template || template === 'none') return 0;
        return template.split(' ').filter(Boolean).length;
      });

      expect(columns).toBeGreaterThanOrEqual(item.minColumns);
    }
  });
});
