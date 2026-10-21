import { test, expect } from '@playwright/test';

const nodes = (page: import('@playwright/test').Page) => page.getByTestId('canvas').locator('[data-node-id]');

test('two open editors cannot silently replace another window’s saved topic change', async ({ page, context }) => {
  await page.goto('/');
  await expect(nodes(page)).toHaveCount(17);
  await expect(page.getByText('已儲存於此裝置', { exact: true })).toBeVisible();

  const second = await context.newPage();
  await second.goto('/');
  await expect(nodes(second)).toHaveCount(17);
  await expect(second.getByRole('status')).toContainText('另一個 OpenMind 視窗正在編輯');
  await expect(second.getByLabel('節點文字', { exact: true })).toBeDisabled();

  await nodes(page).filter({ hasText: '探索方向' }).click();
  await page.getByLabel('節點文字', { exact: true }).fill('視窗甲已保存');
  await page.keyboard.press('Tab');
  await expect.poll(() => page.evaluate(async () => {
    const path = '/src/core/library.ts';
    const library = await import(path);
    const restore = await library.restoreLocal();
    return Object.values(restore.book!.sheets[0].nodes as Record<string, {text:string}>).some(node => node.text === '視窗甲已保存');
  })).toBe(true);

  await page.close();
  await expect(second.locator('.writer-notice')).toHaveCount(0);
  await expect(nodes(second).filter({ hasText: '視窗甲已保存' })).toHaveCount(1);
  await nodes(second).filter({ hasText: '整理想法' }).click();
  await second.getByLabel('節點文字', { exact: true }).fill('視窗乙已保存');
  await second.keyboard.press('Tab');
  await expect.poll(() => second.evaluate(async () => {
    const path = '/src/core/library.ts';
    const library = await import(path);
    const restore = await library.restoreLocal();
    return Object.values(restore.book!.sheets[0].nodes as Record<string, {text:string}>).some(node => node.text === '視窗乙已保存');
  })).toBe(true);

  await second.reload();
  await expect(nodes(second).filter({ hasText: '視窗甲已保存' })).toHaveCount(1);
  await expect(nodes(second).filter({ hasText: '視窗乙已保存' })).toHaveCount(1);
  await second.close();
});

test('when cross-window locking is unavailable, editing fails closed without autosaving', async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined }));
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('本視窗以唯讀方式開啟');
  await expect(page.getByLabel('節點文字', { exact: true })).toBeDisabled();
  await page.close();
  await context.close();
});
