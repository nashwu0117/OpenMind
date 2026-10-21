import {_electron as electron,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),qaDir=path.resolve(process.env.OPENMIND_QA_DIR??'artifacts');await mkdir(qaDir,{recursive:true});
const userData=path.join(qaDir,'desktop-profile');
const custom=process.env.OPENMIND_EXECUTABLE;
const application=await electron.launch({executablePath:custom,args:[...(custom?[]:[root]),`--user-data-dir=${userData}`],timeout:30000});
try{
 const page=await application.firstWindow();await expect(page.locator('.library')).toBeVisible();
 const folderName=`桌面分類驗收 ${Date.now()}`;
 await page.getByRole('button',{name:'新增資料夾',exact:true}).first().click();let folderDialog=page.getByRole('dialog',{name:'新增資料夾',exact:true});await folderDialog.getByRole('textbox',{name:'名稱',exact:true}).fill(folderName);await folderDialog.getByRole('button',{name:'儲存',exact:true}).click();await expect(folderDialog).toHaveCount(0);
 await page.getByRole('button',{name:/^所有心智圖/}).click();const firstCard=page.locator('.document-card').first(),libraryTitle=await firstCard.locator('strong').textContent();await firstCard.click({button:'right'});await page.getByRole('menuitem',{name:'移至資料夾',exact:true}).click();folderDialog=page.getByRole('dialog',{name:'移至資料夾',exact:true});await folderDialog.getByRole('combobox',{name:'選擇資料夾',exact:true}).selectOption({label:folderName});await folderDialog.getByRole('button',{name:'移動',exact:true}).click();await expect(folderDialog).toHaveCount(0);await page.locator('.library-folder-row .library-nav').filter({hasText:folderName}).click();await expect(page.locator('.document-card')).toHaveCount(1);await page.screenshot({path:path.join(qaDir,'desktop-library-folders.png'),animations:'disabled'});
 await page.locator('.document-card').click();await expect(page).toHaveURL(/#\/map\/[^/]+$/);await page.waitForSelector('[data-node-id]');await expect(page.getByLabel('文件名稱',{exact:true})).toHaveValue(libraryTitle);await page.getByRole('button',{name:'返回資料庫',exact:true}).click();await expect(page.locator('.library')).toBeVisible();await expect(page.locator('.document-card')).toHaveCount(1);await page.locator('.document-card').click();await expect(page).toHaveURL(/#\/map\/[^/]+$/);
 const updateStatus=await page.evaluate(()=>window.openmind?.getUpdateState());
 expect(['idle','manual','unavailable','unsupported']).toContain(updateStatus?.phase);
 const configuredUpdates=updateStatus?.phase==='idle';
 const manualUpdates=updateStatus?.phase==='manual';
 if(manualUpdates){
  const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
  expect(updateStatus.currentVersion).toBe(pkg.version);
  expect(updateStatus.releasesUrl).toBe('https://github.com/nashwu0117/OpenMind/releases');
  expect(await application.evaluate(({autoUpdater})=>autoUpdater.getFeedURL())).toBe('');
  await application.evaluate(({autoUpdater,shell})=>{globalThis.__previewUpdateChecks=0;globalThis.__previewUpdateLink=null;autoUpdater.checkForUpdates=()=>{globalThis.__previewUpdateChecks++;};shell.openExternal=async url=>{globalThis.__previewUpdateLink=url;};});
 }
 if(configuredUpdates){
  const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
  expect(updateStatus.currentVersion).toBe(pkg.version);
  expect(await application.evaluate(({autoUpdater})=>autoUpdater.getFeedURL())).toBe(`https://update.electronjs.org/nashwu0117/OpenMind/darwin-${process.arch}/${pkg.version}`);
  // Validate the configured native IPC/UI without depending on a live update server.
  await application.evaluate(({autoUpdater})=>{globalThis.__updateChecks=0;autoUpdater.checkForUpdates=()=>{globalThis.__updateChecks++;autoUpdater.emit('update-not-available');};});
 }
 await page.getByRole('button',{name:'檢查更新',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'軟體更新'})).toContainText(manualUpdates?'預覽版採用手動更新':configuredUpdates?`目前已是最新版本（${updateStatus.currentVersion}）`:updateStatus?.phase==='unsupported'?'自動更新僅適用':'尚未設定有效的 GitHub 更新來源');
 if(manualUpdates){
  expect(await application.evaluate(()=>globalThis.__previewUpdateLink)).toBe(null);
  await page.getByRole('button',{name:'開啟下載頁面',exact:true}).click();
  await expect.poll(()=>application.evaluate(()=>globalThis.__previewUpdateLink)).toBe('https://github.com/nashwu0117/OpenMind/releases');
  await page.screenshot({path:path.join(qaDir,'desktop-update-guide.png'),animations:'disabled'});
 }
 await page.keyboard.press('Escape');
 const appMenu=await application.evaluate(({Menu})=>Menu.getApplicationMenu()?.items[0]?.submenu?.items.map(item=>item.label||item.role));expect(appMenu).toContain('檢查更新…');
 await page.locator('.language-control select').selectOption('en');
 await expect(page.getByRole('button',{name:'Print & PDF',exact:true})).toBeVisible();
 await expect(page.locator('html')).toHaveAttribute('lang','en');
 await page.getByRole('button',{name:'Check for Updates',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Software Update'})).toContainText(manualUpdates?'Preview builds use manual updates':configuredUpdates?`Already up to date: ${updateStatus.currentVersion}`:updateStatus?.phase==='unsupported'?'Automatic updates are only available':'No valid GitHub update source');
 if(manualUpdates){await expect(page.getByRole('button',{name:'Open Download Page',exact:true})).toBeVisible();expect(await application.evaluate(()=>globalThis.__previewUpdateChecks)).toBe(0);}
 if(configuredUpdates)expect(await application.evaluate(()=>globalThis.__updateChecks)).toBe(2);
 await page.keyboard.press('Escape');
 await expect.poll(()=>application.evaluate(({Menu})=>Menu.getApplicationMenu()?.items[0]?.submenu?.items.map(item=>item.label||item.role))).toContain('Check for Updates…');
 await page.locator('.language-control select').selectOption('zh-TW');await expect(page.getByRole('button',{name:'列印與 PDF',exact:true})).toBeVisible();
 const electronRuntime=process.platform==='darwin'?path.join(root,'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron'):path.join(root,'node_modules/electron/dist',process.platform==='win32'?'electron.exe':'electron');
 const executable=custom??electronRuntime;
 const secondInstance=spawn(executable,[...(custom?[]:[root]),`--user-data-dir=${userData}`],{stdio:'ignore'});
 const secondExit=await Promise.race([new Promise(resolve=>secondInstance.once('exit',(code,signal)=>resolve({code,signal}))),new Promise(resolve=>setTimeout(()=>resolve(null),10000))]);
 if(!secondExit){secondInstance.kill();throw new Error('第二個 OpenMind 執行個體未能在 10 秒內退出。');}
 expect(secondExit).toEqual({code:0,signal:null});
 expect(await application.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().length)).toBe(1);
 const bridge=await page.evaluate(()=>({bridge:typeof window.openmind?.save,node:typeof window.require}));expect(bridge).toEqual({bridge:'function',node:'undefined'});
 await page.getByRole('button',{name:'新增心智圖',exact:true}).click();await page.getByRole('button',{name:'空白心智圖'}).click();await page.locator('[data-node-id]').first().click();await page.keyboard.press('Tab');await page.getByLabel('編輯主題文字',{exact:true}).fill('桌面繁體中文 PDF 驗收');await page.getByRole('button',{name:'完成編輯'}).click();await expect(page.getByText('已儲存於此裝置',{exact:true})).toBeVisible();
 const saveTarget=path.join(qaDir,'desktop-roundtrip.openmind');
 await application.evaluate(async({dialog},target)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:target});},saveTarget);
 await application.evaluate(async({shell})=>{globalThis.__openedLink=null;shell.openExternal=async url=>{globalThis.__openedLink=url;};});
 await page.getByLabel('節點連結',{exact:true}).fill('https://example.com');await page.getByLabel('節點標記',{exact:true}).focus();await page.getByRole('link',{name:'開啟連結',exact:true}).click();await expect.poll(()=>application.evaluate(()=>globalThis.__openedLink)).toBe('https://example.com/');
 await expect(page.getByText('已儲存於此裝置',{exact:true})).toBeVisible();
 const expected=await page.evaluate(()=>JSON.parse(localStorage.getItem('openmind.recovery.v1')).book);
 await page.getByRole('button',{name:'儲存檔案',exact:true}).click();await expect(page.getByRole('status')).toContainText('檔案已儲存');expect(JSON.parse(await readFile(saveTarget,'utf8'))).toEqual(expected);
 await application.evaluate(async({dialog},target)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[target]});},saveTarget);
 await page.getByRole('button',{name:'開啟檔案',exact:true}).click();await expect(page.getByRole('status')).toContainText('已開啟');await expect(page.locator('[data-node-id]')).toHaveCount(2);
 await page.getByRole('button',{name:'列印與 PDF',exact:true}).click();await page.getByRole('button',{name:/可讀分頁 重排階層/}).click();await page.getByLabel('列印方向',{exact:true}).selectOption('portrait');
 const target=path.join(qaDir,'desktop-cjk.pdf');await application.evaluate(async({dialog},pdfPath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:pdfPath});},target);
 await page.getByRole('button',{name:'輸出 PDF',exact:true}).click();await expect(page.getByRole('status')).toContainText('已輸出 PDF');expect((await stat(target)).size).toBeGreaterThan(2000);
 await page.screenshot({path:path.join(qaDir,'desktop-print-studio.png'),fullPage:true});
 await writeFile(path.join(qaDir,'desktop-smoke.json'),JSON.stringify({bridge,nativeRoundtrip:true,pdf:target,pageMM:[210,297],pages:1,expectedText:'桌面繁體中文 PDF 驗收'},null,2));
 console.log('Desktop smoke passed: sandbox/bridge, update IPC/menu, real keyboard edit, native atomic save/open roundtrip, print preview and native PDF export.');
 await page.getByRole('button',{name:'返回編輯',exact:true}).click();await page.getByRole('button',{name:'新增心智圖',exact:true}).click();await page.getByRole('button',{name:'空白心智圖'}).click();const secondTarget=path.join(qaDir,'desktop-second-document.openmind');await application.evaluate(async({dialog},target)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:target});},secondTarget);await page.getByRole('button',{name:'儲存檔案',exact:true}).click();await expect(page.getByRole('status')).toContainText('檔案已儲存');expect(JSON.parse(await readFile(saveTarget,'utf8'))).toEqual(expected);expect(JSON.parse(await readFile(secondTarget,'utf8')).id).not.toBe(expected.id);console.log('Separate-document save destination and external-link bridge passed.');
}finally{await application.close();}
