import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('首页没有 WCAG 2.1 AA 违规', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'General Data Collection System' })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('首页的外观和基准截图一致', async ({ page }) => {
  // 固定接口状态：预览服务器对未知路径也返回首页，不固定的话截图内容取决于环境。
  await page.route('**/api/**', (route) => route.fulfill({ status: 503 }));
  await page.goto('/');
  await expect(page.getByText('API is not reachable.')).toBeVisible();
  await expect(page).toHaveScreenshot('home.png', { fullPage: true });
});
