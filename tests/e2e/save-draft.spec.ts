import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test('save shortcut commits the focused field and an open topic editor before writing',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'新增心智圖',exact:true}).click();await page.getByRole('button',{name:'空白心智圖'}).click();
 const field=page.getByLabel('節點文字',{exact:true});await field.fill('尚未離開欄位的內容');
 const [first]=await Promise.all([page.waitForEvent('download'),field.press('ControlOrMeta+s')]);const b=JSON.parse(await readFile((await first.path())!,'utf8'));expect(b.sheets[0].nodes[b.sheets[0].rootId].text).toBe('尚未離開欄位的內容');
 await page.getByTestId('canvas').locator('[data-node-id]').first().click();await page.keyboard.press('F2');const modal=page.getByLabel('編輯主題文字',{exact:true});await modal.fill('編輯視窗中的最新內容');
 const [second]=await Promise.all([page.waitForEvent('download'),modal.press('ControlOrMeta+s')]);const c=JSON.parse(await readFile((await second.path())!,'utf8'));expect(c.sheets[0].nodes[c.sheets[0].rootId].text).toBe('編輯視窗中的最新內容');await expect(page.getByRole('dialog',{name:'編輯主題',exact:true})).not.toBeVisible();
});
