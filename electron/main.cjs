const {app,BrowserWindow,dialog,ipcMain,session,Menu,shell,autoUpdater}=require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {createUpdater}=require('./updater.cjs');
let main,currentPath=null;
let updater;
const MAX=20e6;
const ownsSingleInstance=app.requestSingleInstanceLock();
if(ownsSingleInstance)app.on('second-instance',()=>{if(!main||main.isDestroyed())return;if(main.isMinimized())main.restore();if(!main.isVisible())main.show();main.focus();});
function trusted(event){if(!main||event.sender!==main.webContents||event.senderFrame!==main.webContents.mainFrame)throw new Error('不允許的來源。');}
function validText(value,max=MAX){if(typeof value!=='string'||Buffer.byteLength(value)>max)throw new Error('資料格式無效或超過大小上限。');return value;}
function safeName(value,ext){return String(value||'OpenMind').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').slice(0,100)+(String(value).endsWith(ext)?'':ext);}
async function atomicWrite(target,data){const temp=path.join(path.dirname(target),`.${path.basename(target)}.${crypto.randomUUID()}.tmp`);try{const handle=await fs.open(temp,'wx',0o600);try{await handle.writeFile(data);await handle.sync();}finally{await handle.close();}await fs.rename(temp,target);}catch(e){await fs.unlink(temp).catch(()=>{});throw e;}}
async function makePrintWindow(html){
 validText(html,80e6);
 // Native file loading avoids Chromium's data-URL length limit on large maps.
 const folder=await fs.mkdtemp(path.join(app.getPath('temp'),'openmind-print-'));
 let win;
 const dispose=async()=>{if(win&&!win.isDestroyed())win.destroy();await fs.rm(folder,{recursive:true,force:true});};
 try{
  const file=path.join(folder,'document.html');await fs.writeFile(file,html,{mode:0o600});
  win=new BrowserWindow({show:false,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());
  await win.loadFile(file);
  await win.webContents.executeJavaScript('document.fonts.ready.then(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))))');
  return {win,dispose};
 }catch(error){await dispose();throw error;}
}
function setApplicationMenu(locale='zh-TW'){
 const english=locale==='en';
 Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'OpenMind',submenu:[{role:'about'},{type:'separator'},{label:english?'Check for Updates…':'檢查更新…',click:()=>{if(main&&!main.isDestroyed())main.webContents.send('updates:open');}},{type:'separator'},{role:'quit'}]},{label:english?'Edit':'編輯',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},{label:english?'Window':'視窗',submenu:[{role:'minimize'},{role:'zoom'},{role:'togglefullscreen'}]}]));
}
if(!ownsSingleInstance)app.quit();
else app.whenReady().then(async()=>{
 session.defaultSession.setPermissionRequestHandler((_wc,_p,cb)=>cb(false));session.defaultSession.setPermissionCheckHandler(()=>false);
 let repository='',channel='preview';try{const updateConfig=JSON.parse(await fs.readFile(path.join(process.resourcesPath,'openmind-update.json'),'utf8'));if(typeof updateConfig.repository==='string')repository=updateConfig.repository;if(updateConfig.channel!==undefined)channel=updateConfig.channel;}catch{}
 main=new BrowserWindow({width:1480,height:960,minWidth:960,minHeight:640,title:'OpenMind',backgroundColor:'#f6f8fb',webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true}});
 updater=createUpdater({app,autoUpdater,repository,channel,onState:state=>{if(main&&!main.isDestroyed())main.webContents.send('updates:state',state);}});
 main.webContents.setWindowOpenHandler(()=>({action:'deny'}));main.webContents.on('will-navigate',e=>e.preventDefault());
 main.loadFile(path.join(__dirname,'../dist/index.html'));
 ipcMain.handle('link:open',async(event,url)=>{trusted(event);const parsed=new URL(validText(url,2000));if(!['https:','http:','mailto:'].includes(parsed.protocol)||parsed.username||parsed.password)throw new Error('不允許的外部連結。');await shell.openExternal(parsed.href);});
 ipcMain.handle('updates:get-state',event=>{trusted(event);return updater.getState();});
 ipcMain.handle('updates:check',event=>{trusted(event);return updater.check();});
 ipcMain.handle('updates:install',event=>{trusted(event);return updater.install();});
 setApplicationMenu();
 ipcMain.handle('app:set-locale',(event,locale)=>{trusted(event);if(locale!=='zh-TW'&&locale!=='en')throw new Error('語言設定無效。');setApplicationMenu(locale);return locale;});
 ipcMain.handle('file:open',async event=>{trusted(event);const {canceled,filePaths}=await dialog.showOpenDialog(main,{properties:['openFile'],filters:[{name:'OpenMind / Markdown / OPML',extensions:['openmind','json','md','opml','mm']}]});if(canceled)return null;const target=filePaths[0];if((await fs.stat(target)).size>MAX)throw new Error('檔案超過 20 MB。');const text=await fs.readFile(target,'utf8');currentPath=null;return {name:path.basename(target),text};});
 ipcMain.handle('file:save',async(event,payload)=>{trusted(event);validText(payload?.text);if(typeof payload.saveAs!=='boolean')throw new Error('儲存參數無效。');const document=JSON.parse(payload.text);if(document.format!=='openmind'||typeof document.id!=='string')throw new Error('文件格式無效。');let target=currentPath?.id===document.id?currentPath.path:null;if(!target||payload.saveAs){const result=await dialog.showSaveDialog(main,{defaultPath:safeName(payload.name,'.openmind'),filters:[{name:'OpenMind',extensions:['openmind']}]});if(result.canceled||!result.filePath)return null;target=result.filePath;}await atomicWrite(target,payload.text);currentPath={id:document.id,path:target};return {name:path.basename(target)};});
 ipcMain.handle('print:pdf',async(event,payload)=>{trusted(event);validText(payload?.html,80e6);const result=await dialog.showSaveDialog(main,{defaultPath:safeName(payload.name,'.pdf'),filters:[{name:'PDF',extensions:['pdf']}]});if(result.canceled||!result.filePath)return null;const {win,dispose}=await makePrintWindow(payload.html);try{const pdf=await win.webContents.printToPDF({printBackground:true,preferCSSPageSize:true,generateTaggedPDF:true});await atomicWrite(result.filePath,pdf);return {name:path.basename(result.filePath)};}finally{await dispose();}});
 ipcMain.handle('print:physical',async(event,payload)=>{trusted(event);const {win,dispose}=await makePrintWindow(payload?.html);try{return await new Promise((resolve,reject)=>win.webContents.print({silent:false,printBackground:true},(ok,reason)=>{if(!ok&&reason!=='cancelled')reject(new Error(reason));else resolve(ok);}));}finally{await dispose();}});
 app.on('activate',()=>{if(main&&!main.isDestroyed())main.show();});
});
app.on('window-all-closed',()=>app.quit());
module.exports={atomicWrite,makePrintWindow};
