import { defineConfig, devices } from '@playwright/test';

// 端到端和视觉回归测试。测试放在 e2e/，和单元测试分开（单元测试工具会排除这个目录）。
// 截图对比的容差按像素个数算：按比例算的话，一个小按钮变了颜色也会落在容差之内。
export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4173', trace: 'on-first-retry' },
  expect: { toHaveScreenshot: { maxDiffPixels: 20, animations: 'disabled' } },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm build && pnpm exec vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});
