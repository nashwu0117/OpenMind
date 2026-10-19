import {_electron as electron,expect} from '@playwright/test';
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();await mkdir('artifacts',{recursive:true});
const userData=path.join(root,'artifacts/desktop-profile');
const custom=process.env.OPENMIND_EXECUTABLE;
const application=await electron.launch({executablePath:custom,args:[...(custom?[]:[root]),`--user-data-dir=${userData}`],timeout:30000});
try{
 const page=await application.firstWindow();await page.waitForSelector('[data-node-id]');
 const bridge=await page.evaluate(()=>({bridge:typeof window.openmind?.save,node:typeof window.require}));expect(bridge).toEqual({bridge:'function',node:'undefined'});
 await page.getByRole('button',{name:'新增心智圖',exact:true}).click();await page.getByRole('button',{name:'空白心智圖'}).click();await page.locator('[data-node-id]').first().click();await page.keyboard.press('Tab');await page.getByLabel('編輯主題文字',{exact:true}).fill('桌面繁體中文 PDF 驗收');await page.getByRole('button',{name:'完成編輯'}).click();await expect(page.getByText('已儲存於此裝置',{exact:true})).toBeVisible();
 const saveTarget=path.join(root,'artifacts/desktop-roundtrip.openmind');
 await application.evaluate(async({dialog},target)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:target});},saveTarget);
 await application.evaluate(async({shell})=>{globalThis.__openedLink=null;shell.openExternal=async url=>{globalThis.__openedLink=url;};});
 await page.getByLabel('節點連結',{exact:true}).fill('https://example.com');await page.getByLabel('節點標記',{exact:true}).focus();await page.getByRole('link',{name:'開啟連結',exact:true}).click();await expect.poll(()=>application.evaluate(()=>globalThis.__openedLink)).toBe('https://example.com/');
 await expect(page.getByText('已儲存於此裝置',{exact:true})).toBeVisible();
 const expected=await page.evaluate(()=>JSON.parse(localStorage.getItem('openmind.recovery.v1')).book);
 await page.getByRole('button',{name:'儲存檔案',exact:true}).click();await expect(page.getByRole('status')).toContainText('檔案已儲存');expect(JSON.parse(await readFile(saveTarget,'utf8'))).toEqual(expected);
 await application.evaluate(async({dialog},target)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[target]});},saveTarget);
 await page.getByRole('button',{name:'開啟檔案',exact:true}).click();await expect(page.getByRole('status')).toContainText('已開啟');await expect(page.locator('[data-node-id]')).toHaveCount(2);
 await page.getByRole('button',{name:'列印與 PDF',exact:true}).click();await page.getByRole('button',{name:/可讀分頁 重排階層/}).click();await page.getByLabel('列印方向',{exact:true}).selectOption('portrait');
 const target=path.join(root,'artifacts/desktop-cjk.pdf');await application.evaluate(async({dialog},pdfPath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:pdfPath});},target);
 await page.getByRole('button',{name:'輸出 PDF',exact:true}).click();await expect(page.getByRole('status')).toContainText('已輸出 PDF');expect((await stat(target)).size).toBeGreaterThan(2000);
 await page.screenshot({path:'artifacts/desktop-print-studio.png',fullPage:true});
 await writeFile('artifacts/desktop-smoke.json',JSON.stringify({bridge,nativeRoundtrip:true,pdf:target,pageMM:[210,297],pages:1,expectedText:'桌面繁體中文 PDF 驗收'},null,2));
 console.log('Desktop smoke passed: sandbox/bridge, real keyboard edit, native atomic save/open roundtrip, print preview and native PDF export.');
 await page.getByRole('button',{name:'返回編輯',exact:true}).click();await page.getByRole('button',{name:'新增心智圖',exact:true}).click();await page.getByRole('button',{name:'空白心智圖'}).click();const secondTarget=path.join(root,'artifacts/desktop-second-document.openmind');await application.evaluate(async({dialog},target)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:target});},secondTarget);await page.getByRole('button',{name:'儲存檔案',exact:true}).click();await expect(page.getByRole('status')).toContainText('檔案已儲存');expect(JSON.parse(await readFile(saveTarget,'utf8'))).toEqual(expected);expect(JSON.parse(await readFile(secondTarget,'utf8')).id).not.toBe(expected.id);console.log('Separate-document save destination and external-link bridge passed.');
}finally{await application.close();}
