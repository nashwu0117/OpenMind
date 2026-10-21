import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test('nine structures have actual layouts and structure changes undo without losing nodes',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/');await page.waitForLoadState('networkidle');
  const ids=await page.getByTestId('canvas').locator('[data-node-id]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-node-id')).sort());
  const geometry:Record<string,string>={};for(const structure of ['mindmap','logic','brace','tree','org','timeline','fishbone','matrix','treetable']){await page.getByLabel('圖表結構',{exact:true}).selectOption(structure);await expect(page.getByTestId('canvas').locator('[data-node-id]')).toHaveCount(17);await expect.poll(()=>page.getByTestId('canvas').evaluate(svg=>{const box=svg.getBoundingClientRect();return [...svg.querySelectorAll('[data-node-id]')].every(node=>{const r=node.getBoundingClientRect();return r.left>=box.left-1&&r.right<=box.right+1&&r.top>=box.top-1&&r.bottom<=box.bottom+1;});})).toBe(true);geometry[structure]=await page.getByTestId('canvas').locator('[data-node-id]>rect').evaluateAll(nodes=>JSON.stringify(nodes.map(n=>[n.getAttribute('x'),n.getAttribute('y'),n.getAttribute('width'),n.getAttribute('height')])));}
  for(const structure of ['timeline','matrix','fishbone','treetable'])expect(geometry[structure]).not.toBe(geometry.org);
  await page.getByRole('button',{name:'復原',exact:true}).click();await expect(page.getByLabel('圖表結構',{exact:true})).toHaveValue('matrix');
  expect(await page.getByTestId('canvas').locator('[data-node-id]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-node-id')).sort())).toEqual(ids);expect(errors).toEqual([]);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.screenshot({path:'artifacts/audit/matrix.png'});
});
test('summaries, vector equations, attachments and full styles survive save/reopen and undo',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'建立選取摘要',exact:true}).click();await page.getByLabel('摘要文字 1',{exact:true}).fill('驗收摘要與依賴');await page.getByLabel('摘要文字 1',{exact:true}).press('Enter');
  await expect(page.getByTestId('canvas').locator('[data-annotation="summary"]')).toHaveCount(1);
  await page.getByText('貼圖、公式與附件',{exact:true}).click();await page.getByLabel('節點貼圖',{exact:true}).selectOption('💡');
  await page.getByLabel('節點公式',{exact:true}).fill('\\frac{a+b}{c}=\\sqrt{2}');await page.getByLabel('節點公式',{exact:true}).press('ControlOrMeta+Enter');
  await expect(page.getByTestId('canvas').locator('[data-equation] path')).not.toHaveCount(0);
  await page.getByTestId('attachment-input').setInputFiles({name:'驗收附件.txt',mimeType:'text/plain',buffer:Buffer.from('繁體中文附件\n原始內容')});
  const [attachment]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'驗收附件.txt',exact:true}).click()]);expect(await readFile((await attachment.path())!,'utf8')).toBe('繁體中文附件\n原始內容');
  await page.getByText('更多文字與線條樣式',{exact:true}).click();await page.getByLabel('文字對齊',{exact:true}).selectOption('center');await page.getByLabel('虛線外框',{exact:true}).check();
  const [native]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'儲存檔案',exact:true}).click()]);const saved=JSON.parse(await readFile((await native.path())!,'utf8'));expect(saved.version).toBe(2);
  await page.getByTestId('file-input').setInputFiles({name:'full.openmind',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});await expect(page.getByText('已儲存於此裝置',{exact:true})).toBeVisible();await page.reload();
  const actual=await page.evaluate(async()=>{const path='/src/core/library.ts',m=await import(path);return (await m.restoreLocal()).book;});expect(actual).toEqual(saved);
  await page.getByRole('button',{name:'刪除摘要 1',exact:true}).click();await expect(page.getByTestId('canvas').locator('[data-annotation="summary"]')).toHaveCount(0);await page.getByRole('button',{name:'復原',exact:true}).click();await expect(page.getByTestId('canvas').locator('[data-annotation="summary"]')).toHaveCount(1);
});
test('custom themes and templates are persistent and produce independent documents',async({page})=>{
  await page.goto('/');await page.getByText('主題與範本',{exact:true}).click();await page.getByLabel('套用主題',{exact:true}).selectOption('forest');await page.getByLabel('自訂主題名稱',{exact:true}).fill('我的森林主題');await page.getByRole('button',{name:'保存目前樣式為主題',exact:true}).click();await expect(page.getByRole('status')).toContainText('已保存自訂主題');
  await page.getByLabel('範本名稱',{exact:true}).fill('森林範本');await page.getByRole('button',{name:'保存文件為範本',exact:true}).click();await expect(page.getByRole('status')).toContainText('已保存範本');await page.reload();
  await page.getByRole('button',{name:'新增心智圖',exact:true}).click();await page.getByRole('button',{name:'森林範本',exact:true}).click();await expect(page.getByLabel('文件名稱',{exact:true})).toHaveValue('森林範本');await expect(page.getByTestId('canvas').locator('[data-node-id]')).toHaveCount(17);
  await page.getByText('主題與範本',{exact:true}).click();await expect(page.getByLabel('套用主題',{exact:true}).locator('option').filter({hasText:'我的森林主題'})).toHaveCount(1);
});
test('task dependencies schedule real dates, detect cycles and undo as one transaction',async({page})=>{
  await page.goto('/');const data=await page.evaluate(async()=>{const path='/src/core/model.ts',m=await import(path),b=m.fixture(10),s=m.activeSheet(b),ids=Object.keys(s.nodes);s.nodes[ids[1]].task={status:'done',start:'2026-09-25',due:'2026-09-27'};s.nodes[ids[2]].task={status:'todo',start:'2026-09-26',due:'2026-09-28',dependencies:[ids[1]]};return {book:b,a:ids[1],b:ids[2]};});
  await page.getByTestId('file-input').setInputFiles({name:'tasks.openmind',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data.book))});await expect(page.getByLabel('文件名稱',{exact:true})).toHaveValue('列印測試 10 節點');await page.getByRole('button',{name:'任務',exact:true}).click();
  await expect(page.getByLabel('依真實日期計算的甘特圖').locator('[data-task-bar]')).toHaveCount(2);await page.getByRole('button',{name:'依相依關係排程',exact:true}).click();await expect(page.getByLabel(`任務開始 ${data.b}`,{exact:true})).toHaveValue('2026-09-28');await expect(page.getByLabel(`任務截止 ${data.b}`,{exact:true})).toHaveValue('2026-09-30');
  await page.getByRole('button',{name:'復原',exact:true}).click();await expect(page.getByLabel(`任務開始 ${data.b}`,{exact:true})).toHaveValue('2026-09-26');
  await page.getByLabel(`前置任務 ${data.a}`,{exact:true}).selectOption([data.b]);await expect(page.getByRole('status')).toContainText('循環');await expect(page.getByLabel(`前置任務 ${data.a}`,{exact:true})).toHaveValues([]);
  await page.screenshot({path:'artifacts/audit/tasks-gantt.png'});
});
test('presentation navigation is view-only and customized order persists',async({page})=>{
  await page.goto('/');await expect(page.getByText('已儲存於此裝置',{exact:true})).toBeVisible();const before=await page.evaluate(()=>localStorage.getItem('openmind.recovery.v1'));
  await page.getByRole('button',{name:'簡報',exact:true}).click();await expect(page.getByTestId('presentation-slide')).toHaveAttribute('data-slide','1');await page.keyboard.press('ArrowRight');await expect(page.getByTestId('presentation-slide')).toHaveAttribute('data-slide','2');
  expect(await page.evaluate(()=>localStorage.getItem('openmind.recovery.v1'))).toBe(before);await page.getByRole('button',{name:'投影片順序',exact:true}).click();await page.getByRole('button',{name:'投影片 2 上移',exact:true}).click();await expect(page.getByTestId('presentation-slide')).toHaveAttribute('data-slide','1');
  await page.screenshot({path:'artifacts/audit/presentation.png'});await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'簡報模式'})).not.toBeVisible();await expect(page.getByText('已儲存於此裝置',{exact:true})).toBeVisible();await page.reload();await page.getByRole('button',{name:'簡報',exact:true}).click();await expect(page.getByTestId('presentation-slide')).toContainText('探索方向');
  await page.clock.install();await page.getByRole('button',{name:'自動播放',exact:true}).click();await page.clock.fastForward(5000);await expect(page.getByTestId('presentation-slide')).toHaveAttribute('data-slide','2');await page.keyboard.press('Space');await expect(page.getByRole('button',{name:'自動播放',exact:true})).toHaveAttribute('aria-pressed','false');
});
test('FreeMind subset round trips real hierarchy, CJK, styles, notes and links',async({page})=>{
  await page.goto('/');page.on('dialog',dialog=>dialog.accept());const data=await page.evaluate(async()=>{const p='/src/core/model.ts',f='/src/io/freemind.ts',m=await import(p),formats=await import(f),b=m.fixture(10),s=m.activeSheet(b),ids=Object.keys(s.nodes);s.nodes[ids[1]].notes='繁體筆記\n第二行';s.nodes[ids[1]].link='openmind:'+ids[2];s.nodes[ids[1]].style.bold=true;s.nodes[ids[1]].style.color='#11938a';const walk=(id:string):unknown=>({text:s.nodes[id].text,children:s.nodes[id].children.map(walk)});return {xml:formats.freemind(s),tree:walk(s.rootId)};});
  await page.getByTestId('file-input').setInputFiles({name:'roundtrip.mm',mimeType:'application/xml',buffer:Buffer.from(data.xml)});await expect(page.getByRole('status')).toContainText('FreeMind 僅轉換');await expect(page.getByTestId('canvas').locator('[data-node-id]')).toHaveCount(10);
  await expect(page.getByText('已儲存於此裝置',{exact:true})).toBeVisible();const book=await page.evaluate(async()=>{const p='/src/core/library.ts',l=await import(p);return (await l.restoreLocal()).book;});const s=book.sheets[0],walk=(id:string):unknown=>({text:s.nodes[id].text,children:s.nodes[id].children.map(walk)});expect(walk(s.rootId)).toEqual(data.tree);expect(Object.values(s.nodes).some((n:any)=>n.notes==='繁體筆記\n第二行'&&n.link.startsWith('openmind:')&&n.style.color==='#11938a')).toBe(true);
  await page.getByRole('button',{name:'匯出',exact:true}).click();const [file]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:/^MM/}).click()]);await page.getByTestId('file-input').setInputFiles({name:'again.mm',mimeType:'application/xml',buffer:await readFile((await file.path())!)});await expect(page.getByTestId('canvas').locator('[data-node-id]')).toHaveCount(10);
});
test('FreeMind rejects oversized XML structure before rich-content conversion',async({page})=>{
  await page.goto('/');
  const error=await page.evaluate(async()=>{
    const path='/src/io/freemind.ts';
    const parser=await import(path);
    const repeated='<span>x</span>'.repeat(50001);
    try{parser.parseFreeMind(`<map><node ID="root" TEXT="中心"><richcontent TYPE="NOTE">${repeated}</richcontent></node></map>`);return '';}
    catch(reason){return (reason as Error).message;}
  });
  expect(error).toContain('XML 結構超過安全上限');
});
test('expanded focused SVG and PNG export include visible descendants and embedded TC fonts',async({page})=>{
  await page.goto('/');const canvas=page.getByTestId('canvas');await canvas.locator('[data-node-id]').filter({hasText:'探索方向'}).click();await page.getByRole('button',{name:'收合分支',exact:true}).click();await page.getByRole('button',{name:'預覽選取分支',exact:true}).click();await page.getByRole('button',{name:'展開此分支',exact:true}).click();
  await page.getByRole('button',{name:'匯出',exact:true}).click();const [svg]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:/^SVG/}).click()]);const text=await readFile((await svg.path())!,'utf8');expect(text.match(/data-node-id=/g)).toHaveLength(4);expect(text).toContain('data:font/woff2;base64,');expect(text).not.toMatch(/url\((?:https?:|\.\/)/);expect(text).toContain('收集靈感與參考');
  await page.getByRole('button',{name:'匯出',exact:true}).click();const [png]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:/^PNG/}).click()]);expect((await readFile((await png.path())!)).subarray(1,4).toString()).toBe('PNG');
});
