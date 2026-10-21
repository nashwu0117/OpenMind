import {test,expect} from '@playwright/test';
import {openFirstMap,openSampleMap} from './helpers';
test('switching nodes commits an inspector draft to its original node',async({page})=>{
  await openSampleMap(page);await page.waitForLoadState('networkidle');
  const canvas=page.getByTestId('canvas'),root=canvas.locator('[data-node-id]').filter({hasText:'我的下一個好想法'});
  const rootId=await root.getAttribute('data-node-id');await page.getByLabel('節點備註',{exact:true}).fill('只能屬於中心主題的備註');
  await canvas.locator('[data-node-id]').filter({hasText:'探索方向'}).click();
  await expect(page.getByLabel('節點備註',{exact:true})).toHaveValue('');
  await expect.poll(async()=>page.evaluate(id=>{const data=JSON.parse(localStorage.getItem('openmind.recovery.v1')??'null');return data?.book.sheets[0].nodes[id!].notes;},rootId)).toBe('只能屬於中心主題的備註');
});
test('Chinese IME Enter does not commit or blur a field while composing',async({page})=>{
  await openSampleMap(page);const field=page.getByLabel('節點備註',{exact:true});await field.fill('輸入法組字中');
  await field.evaluate(el=>el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',ctrlKey:true,isComposing:true,bubbles:true})));
  await expect(field).toBeFocused();
});
test('Tab on toolbar controls traverses focus without adding a topic',async({page})=>{
  await openSampleMap(page);await expect(page.getByTestId('canvas').locator('[data-node-id]')).toHaveCount(17);
  await page.getByRole('button',{name:'預覽選取分支',exact:true}).focus();await page.keyboard.press('Tab');
  await expect(page.getByTestId('canvas').locator('[data-node-id]')).toHaveCount(17);
});
test('large attachments recover through IndexedDB after reload without Web Storage quota failure',async({page})=>{
  await page.goto('/');const book=await page.evaluate(async()=>{const path='/src/core/model.ts',m=await import(path),b=m.newWorkbook('大型附件復原驗收'),s=m.activeSheet(b);s.nodes[s.rootId].attachments=Array.from({length:4},(_,i)=>({id:m.uid(),name:`附件${i}.bin`,mime:'application/octet-stream',data:'data:application/octet-stream;base64,'+'A'.repeat(2000000)}));return b;});
  await page.getByTestId('file-input').setInputFiles({name:'large.openmind',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(book))});
  await expect(page.getByLabel('文件名稱',{exact:true})).toHaveValue('大型附件復原驗收');await expect(page.getByText('已儲存於此裝置',{exact:true})).toBeVisible();
  await page.reload();await expect(page.getByLabel('文件名稱',{exact:true})).toHaveValue('大型附件復原驗收');
  const sizes=await page.evaluate(async()=>{const path='/src/core/library.ts',m=await import(path),r=await m.restoreLocal();return r.book.sheets[0].nodes[r.book.sheets[0].rootId].attachments.map((a:{data:string})=>a.data.length);});
  expect(sizes).toEqual([2000037,2000037,2000037,2000037]);
});
test('storage access denied does not prevent startup when IndexedDB is available',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('denied','SecurityError');}}));
  await openSampleMap(page);await expect(page.getByTestId('canvas').locator('[data-node-id]')).toHaveCount(17);await expect(page.getByText('已儲存於此裝置',{exact:true})).toBeVisible();
});
test('search locates folded topics in read-only mode without modifying document data',async({page})=>{
  await openSampleMap(page);const canvas=page.getByTestId('canvas');await canvas.locator('[data-node-id]').filter({hasText:'探索方向'}).click();await page.getByRole('button',{name:'收合分支',exact:true}).click();await page.getByLabel('唯讀模式',{exact:true}).check();await expect(page.getByText('已儲存於此裝置',{exact:true})).toBeVisible();const before=await page.evaluate(()=>localStorage.getItem('openmind.recovery.v1'));
  await page.getByLabel('搜尋心智圖',{exact:true}).fill('收集靈感');await page.getByRole('button',{name:'收集靈感與參考',exact:true}).click();await expect(canvas.locator('[data-node-id]').filter({hasText:'收集靈感與參考'})).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('openmind.recovery.v1'))).toBe(before);
});
test('delayed image decoding cannot modify another document with reused topic IDs',async({page})=>{
  await page.addInitScript(()=>{const original=FileReader.prototype.readAsDataURL;FileReader.prototype.readAsDataURL=function(blob){setTimeout(()=>original.call(this,blob),700);};});
  await openSampleMap(page);const replacement=await page.evaluate(async()=>{const p='/src/core/model.ts',m=await import(p),b=m.demoWorkbook();b.id=m.uid();b.title='切換後的新文件';return b;});
  // Reuse the exact source IDs so a stale callback would otherwise hit valid but wrong nodes.
  await expect(page.getByText('已儲存於此裝置',{exact:true})).toBeVisible();const original=await page.evaluate(async()=>{const p='/src/core/library.ts',m=await import(p);return (await m.restoreLocal()).book;});
  replacement.sheets=original.sheets;replacement.activeSheetId=original.activeSheetId;
  await page.locator('input[type=file][accept="image/png,image/jpeg,image/webp"]').setInputFiles({name:'pixel.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=','base64')});
  await page.getByTestId('file-input').setInputFiles({name:'other.openmind',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(replacement))});await expect(page.getByLabel('文件名稱',{exact:true})).toHaveValue('切換後的新文件');await expect(page.getByRole('status')).toContainText('加入圖片時已切換');await expect(page.getByTestId('canvas').locator('image')).toHaveCount(0);
});
test('new and help dialogs close with Escape and keep keyboard focus inside',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'新增心智圖',exact:true}).click();const dialog=page.getByRole('dialog',{name:'建立心智圖'});await expect(dialog).toBeVisible();
  for(let i=0;i<7;i++)await page.keyboard.press('Tab');expect(await dialog.evaluate(el=>el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
  await openFirstMap(page);
  await page.getByRole('button',{name:/操作指南/}).click();await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'操作指南'})).not.toBeVisible();
});
test('marquee and automatic floating placement preserve the document and avoid duplicate positions',async({page})=>{
  await openSampleMap(page);await expect(page.getByText('已儲存於此裝置',{exact:true})).toBeVisible();const before=await page.evaluate(()=>localStorage.getItem('openmind.recovery.v1'));
  await page.getByRole('button',{name:'框選工具',exact:true}).click();const box=(await page.getByTestId('canvas').boundingBox())!;await page.mouse.move(box.x+3,box.y+3);await page.mouse.down();await page.mouse.move(box.x+box.width-3,box.y+box.height-3,{steps:10});await page.mouse.up();await expect(page.locator('.editor-status')).toContainText('17 個已選取');expect(await page.evaluate(()=>localStorage.getItem('openmind.recovery.v1'))).toBe(before);
  await page.locator('button').filter({hasText:/^自由主題$/}).click();await page.locator('button').filter({hasText:/^自由主題$/}).click();await expect(page.getByText('已儲存於此裝置',{exact:true})).toBeVisible();const positions=await page.evaluate(async()=>{const p='/src/core/library.ts',m=await import(p),s=(await m.restoreLocal()).book.sheets[0];return s.floating.map((id:string)=>s.nodes[id].position);});expect(positions).toHaveLength(2);expect(positions[0]).not.toEqual(positions[1]);
});
test('search trims queries, shows all counts, loads more, and retains its query after locating',async({page})=>{
  await openSampleMap(page);await expect(page.getByTestId('canvas').locator('[data-node-id]')).toHaveCount(17);const book=await page.evaluate(async()=>{const p='/src/core/model.ts',m=await import(p);return m.fixture(200);});await page.getByTestId('file-input').setInputFiles({name:'search.openmind',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(book))});await expect(page.getByLabel('文件名稱',{exact:true})).toHaveValue('列印測試 200 節點');
  const input=page.getByLabel('搜尋心智圖',{exact:true});await input.fill('  節點  ');await expect(page.locator('.search-controls')).toContainText('199 個結果');await expect(page.locator('.search-results>button')).toHaveCount(101);await page.getByRole('button',{name:/顯示更多結果/}).click();await expect(page.locator('.search-results>button')).toHaveCount(199);await page.locator('.search-results>button').first().click();await expect(input).toHaveValue('  節點  ');await expect(page.locator('.search-results')).not.toBeVisible();await input.click();await expect(page.locator('.search-controls')).toContainText('199 個結果');await page.getByLabel('搜尋範圍',{exact:true}).selectOption('notes');await expect(page.locator('.search-results')).toContainText('沒有符合的節點');
});
test('central topic cut is refused with a truthful message',async({page})=>{await openSampleMap(page);await page.getByTestId('canvas').locator('[data-node-id]').first().click();await page.keyboard.press('ControlOrMeta+x');await expect(page.getByRole('status')).toContainText('中央主題無法剪下');await expect(page.getByTestId('canvas').locator('[data-node-id]')).toHaveCount(17);});
