import {test,expect} from '@playwright/test';
import {openSampleMap} from './helpers';
test('workspace templates, recent documents and dark mode are real controls',async({page})=>{
 await openSampleMap(page);await page.getByRole('button',{name:'切換深色模式',exact:true}).click();await expect(page.locator('.app')).toHaveClass('app dark');await page.screenshot({path:'artifacts/dark-interface.png'});await page.getByRole('button',{name:'切換深色模式',exact:true}).click();
 await page.getByRole('button',{name:'新增心智圖',exact:true}).click();await page.getByRole('button',{name:'專案規劃 整理目標，找到下一步'}).click();await expect(page.getByLabel('文件名稱',{exact:true})).toHaveValue('專案規劃');await page.getByRole('button',{name:'最近文件',exact:true}).click();await page.locator('.document-card').filter({hasText:'讓好想法，清晰展開'}).click();await expect(page.getByTestId('canvas').locator('[data-node-id]')).toHaveCount(17);await expect(page.getByLabel('文件名稱',{exact:true})).toHaveValue('讓好想法，清晰展開');
});
test('undoing a sheet creation in outline view safely restores the previous sheet',async({page})=>{
 await openSampleMap(page);await page.getByRole('button',{name:'大綱',exact:true}).click();await page.getByRole('button',{name:'新增工作表',exact:true}).click();await expect(page.locator('.outline-row')).toHaveCount(1);await page.getByRole('button',{name:'復原',exact:true}).click();await expect(page.locator('.outline-row')).toHaveCount(17,{timeout:3000});
});
