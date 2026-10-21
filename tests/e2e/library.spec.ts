import {test, expect, type Page} from '@playwright/test';

async function createFolder(page: Page, name: string) {
  await page.getByRole('button', {name: '新增資料夾', exact: true}).first().click();
  const dialog = page.getByRole('dialog', {name: '新增資料夾', exact: true});
  await dialog.getByRole('textbox', {name: '名稱', exact: true}).fill(name);
  await dialog.getByRole('button', {name: '儲存', exact: true}).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('heading', {level: 1, name, exact: true})).toBeVisible();
}
async function allMaps(page: Page) {
  await page.getByRole('button', {name: /^所有心智圖/}).click();
}

test('library-first launch opens a dedicated editor and supports history and reload', async ({page}) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.library')).toBeVisible();
  await expect(page.getByTestId('canvas')).toHaveCount(0);
  await expect(page.locator('.editor-toolbar')).toHaveCount(0);
  await page.locator('.document-card').first().click();
  await expect(page).toHaveURL(/#\/map\/[^/]+$/);
  const mapUrl = page.url();
  await expect(page.getByTestId('canvas').locator('[data-node-id]')).toHaveCount(17);
  await expect(page.locator('.library')).toHaveCount(0);
  await page.getByLabel('文件名稱', {exact: true}).fill('專心編輯的想法');
  await page.getByLabel('文件名稱', {exact: true}).press('Enter');
  await page.getByRole('button', {name: '返回資料庫', exact: true}).click();
  await expect(page).toHaveURL(/#\/library$/);
  await expect(page.locator('.document-card')).toContainText(['專心編輯的想法']);
  await page.goBack();
  await expect(page).toHaveURL(mapUrl);
  await expect(page.getByLabel('文件名稱', {exact: true})).toHaveValue('專心編輯的想法');
  await page.reload();
  await expect(page.getByLabel('文件名稱', {exact: true})).toHaveValue('專心編輯的想法');
  await page.screenshot({path: 'artifacts/dedicated-editor.png'});
  await expect(page.getByRole('button', {name: '返回資料庫', exact: true})).toBeVisible();
  expect(errors).toEqual([]);
});

test('right-click renames, moves and duplicates maps durably within folders', async ({page}) => {
  await page.goto('/');
  await createFolder(page, '工作專案');
  await allMaps(page);
  await page.locator('.document-card').first().click({button: 'right'});
  await page.getByRole('menuitem', {name: '重新命名', exact: true}).click();
  let dialog = page.getByRole('dialog', {name: '重新命名心智圖', exact: true});
  await dialog.getByRole('textbox', {name: '名稱', exact: true}).fill('產品規劃');
  await dialog.getByRole('button', {name: '儲存', exact: true}).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', {name: '心智圖選單：產品規劃', exact: true}).click();
  await page.getByRole('menuitem', {name: '移至資料夾', exact: true}).click();
  dialog = page.getByRole('dialog', {name: '移至資料夾', exact: true});
  await dialog.getByRole('combobox', {name: '選擇資料夾', exact: true}).selectOption({label: '工作專案'});
  await dialog.getByRole('button', {name: '移動', exact: true}).click();
  await expect(dialog).toHaveCount(0);
  await page.locator('.library-folder-row').getByRole('button', {name: /^工作專案/}).click();
  await expect(page.locator('.document-card')).toHaveCount(1);
  await page.locator('.document-card').click({button: 'right'});
  await page.getByRole('menuitem', {name: '建立副本', exact: true}).click();
  await expect(page.locator('.document-card')).toHaveCount(2);
  await page.reload();
  await page.locator('.library-folder-row').getByRole('button', {name: /^工作專案/}).click();
  await expect(page.locator('.document-card')).toHaveCount(2);
  await expect(page.locator('.document-card strong')).toHaveText(['產品規劃 副本', '產品規劃']);
  await page.screenshot({path: 'artifacts/library-folders.png'});
  await page.locator('.document-card').filter({hasText: '產品規劃 副本'}).click();
  await expect(page.getByLabel('文件名稱', {exact: true})).toHaveValue('產品規劃 副本');
  await expect(page.getByTestId('canvas').locator('[data-node-id]')).toHaveCount(17);
});

test('new maps inherit the folder and removing a folder keeps every map', async ({page}) => {
  await page.goto('/');
  await createFolder(page, '學習筆記');
  await page.getByRole('button', {name: '新增心智圖', exact: true}).click();
  await page.getByRole('button', {name: '空白心智圖 從一個想法開始'}).click();
  await expect(page.getByTestId('canvas').locator('[data-node-id]')).toHaveCount(1);
  await page.getByRole('button', {name: '返回資料庫', exact: true}).click();
  await expect(page.getByRole('heading', {level: 1, name: '學習筆記', exact: true})).toBeVisible();
  await expect(page.locator('.document-card')).toHaveCount(1);
  await page.getByRole('button', {name: '資料夾選單：學習筆記', exact: true}).click();
  await page.getByRole('menuitem', {name: '重新命名', exact: true}).click();
  let dialog = page.getByRole('dialog', {name: '重新命名資料夾', exact: true});
  await dialog.getByRole('textbox', {name: '名稱', exact: true}).fill('閱讀');
  await dialog.getByRole('button', {name: '儲存', exact: true}).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', {name: '資料夾選單：閱讀', exact: true}).click();
  await page.getByRole('menuitem', {name: '移除資料夾', exact: true}).click();
  dialog = page.getByRole('dialog', {name: '移除資料夾', exact: true});
  await expect(dialog).toContainText('所有內容都會保留');
  await dialog.getByRole('button', {name: '移除資料夾', exact: true}).click();
  await expect(dialog).toHaveCount(0);
  await allMaps(page);
  await expect(page.locator('.document-card')).toHaveCount(2);
  await page.reload();
  await expect(page.locator('.document-card')).toHaveCount(2);
  await expect(page.locator('.library-folder-row')).toHaveCount(0);
});

test('menus support keyboard dismissal and library shortcuts leave maps unchanged', async ({page}) => {
  await page.goto('/');
  const card = page.locator('.document-card').first();
  await card.focus();
  await card.press('Shift+F10');
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(page.getByRole('menuitem', {name: '開啟心智圖', exact: true})).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', {name: '重新命名', exact: true})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(card).toBeFocused();
  await page.locator('.library-title-row h1').click();
  await page.keyboard.press('F9'); await page.keyboard.press('Delete');
  await expect(page.locator('.library')).toBeVisible();
  await expect(page.locator('.app')).not.toHaveClass(/editor-focus/);
  await card.click();
  await expect(page.getByTestId('canvas').locator('[data-node-id]')).toHaveCount(17);
});

test('library search, mobile layout and English controls remain usable', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('.document-card')).toHaveCount(1);
  await page.getByRole('textbox', {name: '搜尋心智圖檔案', exact: true}).fill('不存在的名稱');
  await expect(page.locator('.document-card')).toHaveCount(0);
  await expect(page.getByRole('heading', {name: '找不到符合的心智圖', exact: true})).toBeVisible();
  await page.getByRole('button', {name: '清除搜尋', exact: true}).click();
  await page.setViewportSize({width: 390, height: 844});
  await expect(page.locator('.document-card')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', {name: '切換深色模式', exact: true}).click();
  await page.screenshot({path: 'artifacts/library-mobile-dark.png', animations: 'disabled'});
  await page.getByRole('combobox', {name: '語言', exact: true}).selectOption('en');
  await expect(page.getByRole('heading', {level: 1, name: 'All Mind Maps', exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'New Folder', exact: true}).first().click();
  await expect(page.getByRole('dialog', {name: 'New Folder', exact: true})).toBeVisible();
});

test('each document URL restores its own map rather than the most recently edited map', async ({page}) => {
  await page.goto('/');
  await page.locator('.document-card').first().click();
  await expect(page.getByTestId('canvas').locator('[data-node-id]')).toHaveCount(17);
  const sampleUrl = page.url();
  await page.getByRole('button', {name: '新增心智圖', exact: true}).click();
  await page.getByRole('button', {name: '空白心智圖 從一個想法開始'}).click();
  await expect(page.getByTestId('canvas').locator('[data-node-id]')).toHaveCount(1);
  const blankUrl = page.url();
  expect(blankUrl).not.toBe(sampleUrl);
  await page.goto(sampleUrl);
  await expect(page.getByTestId('canvas').locator('[data-node-id]')).toHaveCount(17);
  await expect(page.getByLabel('文件名稱', {exact: true})).toHaveValue('讓好想法，清晰展開');
  await page.goto(blankUrl);
  await expect(page.getByTestId('canvas').locator('[data-node-id]')).toHaveCount(1);
  await page.goto('/#/map/missing-document');
  await expect(page.locator('.library')).toBeVisible();
  await expect(page.locator('.document-card')).toHaveCount(2);
});
