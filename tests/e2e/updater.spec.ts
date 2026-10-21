import { test, expect, type Page } from '@playwright/test';
import type { UpdateStatus } from '../../src/desktop';

type UpdateHarness = { checks: number; installs: number; links: string[]; publish: (next: UpdateStatus) => void };
type HarnessWindow = typeof window & { updateHarness: UpdateHarness };
const manualState: UpdateStatus = { phase: 'manual', currentVersion: '0.3.3', releasesUrl: 'https://github.com/nashwu0117/OpenMind/releases', message: '預覽版採用手動更新，請開啟下載頁面取得新版，再拖曳至「應用程式」取代舊版。' };

async function mockDesktop(page: Page, initialState: UpdateStatus, options: { downloadingOnCheck?: boolean; rejectCheck?: boolean; locale?: 'zh-TW' | 'en' } = {}) {
  await page.addInitScript(({ initialState, options }) => {
    localStorage.setItem('openmind.locale', options.locale ?? 'zh-TW');
    let state = initialState;
    const listeners: ((next: UpdateStatus) => void)[] = [];
    const harness: UpdateHarness = { checks: 0, installs: 0, links: [], publish: next => { state = next; for (const listener of listeners) listener(state); } };
    Object.defineProperty(window, 'openmind', { value: {
      open: async () => null, save: async () => null, pdf: async () => null, print: async () => true,
      openLink: async (url: string) => { harness.links.push(url); },
      getUpdateState: async () => state,
      checkForUpdates: async () => {
        harness.checks++;
        if (options.rejectCheck) throw new Error('private path and token=secret');
        if (options.downloadingOnCheck) harness.publish({ phase: 'downloading', currentVersion: '0.3.3', message: '正在下載更新…' });
        return state;
      },
      installUpdate: async () => { harness.installs++; harness.publish({ phase: 'installing', currentVersion: '0.3.3', message: '正在重新啟動並安裝更新…' }); return true; },
      onUpdateState: (callback: (next: UpdateStatus) => void) => { listeners.push(callback); return () => { const index = listeners.indexOf(callback); if (index >= 0) listeners.splice(index, 1); }; },
      onOpenUpdates: () => () => undefined,
    } });
    (window as HarnessWindow).updateHarness = harness;
  }, { initialState, options });
}

async function activity(page: Page) {
  return page.evaluate(() => { const { checks, installs, links } = (window as HarnessWindow).updateHarness; return { checks, installs, links }; });
}

test('stable update dialog shows indeterminate native download and installs only after an explicit click', async ({ page }) => {
  await mockDesktop(page, { phase: 'idle', currentVersion: '0.3.3', message: '目前版本 0.3.3。' }, { downloadingOnCheck: true });
  await page.goto('/');
  const check = page.getByRole('button', { name: '檢查更新', exact: true });
  await expect(check).toBeVisible();
  expect(await activity(page)).toEqual({ checks: 0, installs: 0, links: [] });
  await check.click();
  const dialog = page.getByRole('dialog', { name: '軟體更新' });
  await expect(dialog).toContainText('正在下載更新…');
  await expect(dialog.getByRole('progressbar')).not.toHaveAttribute('value');
  await expect(dialog.getByRole('button', { name: '重新啟動並安裝' })).toHaveCount(0);
  expect(await activity(page)).toEqual({ checks: 1, installs: 0, links: [] });

  await page.evaluate(() => (window as HarnessWindow).updateHarness.publish({ phase: 'downloaded', currentVersion: '0.3.3', availableVersion: '0.3.4', message: 'OpenMind 0.3.4 已下載完成。' }));
  const install = dialog.getByRole('button', { name: '重新啟動並安裝' });
  await expect(install).toBeVisible();
  await expect(dialog).toContainText('OpenMind 0.3.4 已下載完成。');
  expect((await activity(page)).installs).toBe(0);
  await install.click();
  await expect(dialog).toContainText('正在重新啟動並安裝更新');
  expect(await activity(page)).toEqual({ checks: 1, installs: 1, links: [] });
});

test('preview dialog explains manual updates and opens the trusted download page only on click', async ({ page }) => {
  await mockDesktop(page, manualState);
  await page.goto('/');
  const check = page.getByRole('button', { name: '檢查更新', exact: true });
  await expect(check).toBeVisible();
  expect(await activity(page)).toEqual({ checks: 0, installs: 0, links: [] });
  await check.click();
  const dialog = page.getByRole('dialog', { name: '軟體更新' });
  await expect(dialog).toContainText('預覽版採用手動更新');
  await expect(dialog).toContainText('目前版本 0.3.3');
  await expect(dialog.getByRole('progressbar')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: '重新啟動並安裝' })).toHaveCount(0);
  expect(await activity(page)).toEqual({ checks: 1, installs: 0, links: [] });
  await dialog.getByRole('button', { name: '開啟下載頁面' }).click();
  expect(await activity(page)).toEqual({ checks: 1, installs: 0, links: [manualState.releasesUrl] });
  await expect(dialog).toContainText('預覽版採用手動更新');
});

test('preview download instructions and action are translated into English', async ({ page }) => {
  await mockDesktop(page, manualState, { locale: 'en' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Check for Updates', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Software Update' });
  await expect(dialog).toContainText('Preview builds use manual updates');
  await expect(dialog.getByRole('button', { name: 'Open Download Page' })).toBeVisible();
  expect(await activity(page)).toEqual({ checks: 1, installs: 0, links: [] });
});

test('update check failures use safe copy without disclosing raw details or incorrectly blaming the network', async ({ page }) => {
  await mockDesktop(page, { phase: 'idle', currentVersion: '0.3.3', message: '目前版本 0.3.3。' }, { rejectCheck: true });
  await page.goto('/');
  await page.getByRole('button', { name: '檢查更新', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '軟體更新' });
  await expect(dialog).toContainText('更新失敗，請稍後再試。');
  await expect(dialog).not.toContainText('secret');
  await expect(dialog).not.toContainText('網路');
  expect(await activity(page)).toEqual({ checks: 1, installs: 0, links: [] });
});
