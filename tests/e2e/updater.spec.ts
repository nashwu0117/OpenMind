import { test, expect } from '@playwright/test';

test('desktop update dialog shows download progress and confirms install only after download', async ({ page }) => {
  await page.addInitScript(() => {
    let state = { phase: 'idle', currentVersion: '0.3.1', message: '目前版本 0.3.1。' };
    const listeners: ((next: typeof state) => void)[] = [];
    const publish = (next: typeof state) => { state = next; for (const listener of listeners) listener(state); };
    Object.defineProperty(window, 'openmind', { value: {
      open: async () => null,
      save: async () => null,
      pdf: async () => null,
      print: async () => true,
      openLink: async () => undefined,
      getUpdateState: async () => state,
      checkForUpdates: async () => { publish({ phase: 'downloading', currentVersion: '0.3.1', availableVersion: '0.3.2', progress: 38, message: '正在下載 0.3.2…' } as typeof state); return state; },
      installUpdate: async () => { publish({ phase: 'installing', currentVersion: '0.3.1', availableVersion: '0.3.2', message: '正在重新啟動並安裝更新…' } as typeof state); return true; },
      onUpdateState: (callback: (next: typeof state) => void) => { listeners.push(callback); return () => { const index = listeners.indexOf(callback); if (index >= 0) listeners.splice(index, 1); }; },
      onOpenUpdates: () => () => undefined,
    } });
    (window as typeof window & { publishUpdateState: (next: typeof state) => void }).publishUpdateState = publish;
  });

  await page.goto('/');
  await page.getByRole('button', { name: '檢查更新', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '軟體更新' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('正在下載 0.3.2');
  await expect(dialog.locator('progress')).toHaveJSProperty('value', 38);

  await page.evaluate(() => (window as typeof window & { publishUpdateState: (next: object) => void }).publishUpdateState({ phase: 'downloaded', currentVersion: '0.3.1', availableVersion: '0.3.2', progress: 100, message: 'OpenMind 0.3.2 已下載完成。' }));
  const install = dialog.getByRole('button', { name: '重新啟動並安裝' });
  await expect(install).toBeVisible();
  await install.click();
  await expect(dialog).toContainText('正在重新啟動並安裝更新');
});
