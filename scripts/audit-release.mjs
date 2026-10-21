// Real browser/native acceptance artifacts, using synthetic data and isolated profiles.
import {chromium,_electron as electron,expect} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),out=path.join(root,'artifacts/audit');await mkdir(out,{recursive:true});
if(process.env.OPENMIND_EXECUTABLE){
 const app=await electron.launch({executablePath:process.env.OPENMIND_EXECUTABLE,args:[`--user-data-dir=${out}/native-profile-${Date.now()}`],timeout:30000});
 try{
  const page=await app.firstWindow();await expect(page.locator('.library')).toBeVisible();const expected=JSON.parse(await readFile(`${out}/release-fixture.openmind`,'utf8'));
  await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},`${out}/release-fixture.openmind`);
  await page.getByRole('button',{name:'開啟檔案',exact:true}).click();await expect(page).toHaveURL(/#\/map\/[^/]+$/);await expect(page.getByLabel('文件名稱',{exact:true})).toHaveValue(expected.title);
  const saved=`${out}/native-roundtrip.openmind`;await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},saved);await page.getByRole('button',{name:'儲存檔案',exact:true}).click();await expect(page.getByRole('status')).toContainText('檔案已儲存');expect(JSON.parse(await readFile(saved,'utf8'))).toEqual(expected);
  const outputs=[];
  async function pdf(name,button){await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},`${out}/native-${name}.pdf`);await page.getByRole('button',{name:button,exact:true}).click();await expect(page.getByRole('status')).toContainText(`已輸出 PDF：native-${name}.pdf`,{timeout:45000});outputs.push(name);}
  await page.getByRole('button',{name:'列印與 PDF',exact:true}).click();await page.getByRole('button',{name:/主要分支分頁/}).click();await pdf('rich','輸出 PDF');await page.getByRole('button',{name:'返回編輯',exact:true}).click();
  await page.getByRole('button',{name:'任務',exact:true}).click();await pdf('tasks','匯出任務 PDF');await page.screenshot({path:`${out}/native-tasks.png`});await page.getByRole('button',{name:'心智圖',exact:true}).click();
  await page.getByRole('button',{name:'簡報',exact:true}).click();await pdf('slides','匯出簡報 PDF');await page.screenshot({path:`${out}/native-slides.png`});await page.keyboard.press('Escape');
  await writeFile(`${out}/native-acceptance.json`,JSON.stringify({version:'0.3.0',nativeRoundtrip:true,outputs,isolatedProfile:true},null,2));console.log('Native full metadata roundtrip and three actual PDF flows passed.');
 }finally{await app.close();}
}else{
 const browser=await chromium.launch();try{
  const page=await browser.newPage({viewport:{width:1480,height:960}});await page.goto('http://127.0.0.1:5187/');await page.waitForLoadState('networkidle');
  const data=await page.evaluate(async()=>{
   const mp='/src/core/model.ts',lp='/src/engine/layout.ts',ep='/src/engine/print.ts',vp='/src/engine/viewPlans.ts';const m=await import(mp),l=await import(lp),e=await import(ep),v=await import(vp);const measurements=[];
   for(const count of [10,50,200,1000])for(const structure of Object.keys(m.structures)){
    const s=m.activeSheet(m.fixture(count));s.structure=structure;const begin=performance.now(),scene=l.layout(s),durationMS=performance.now()-begin;
    if(scene.nodes.length!==count)throw new Error('Missing topics '+structure);const ordered=[...scene.nodes].sort((a,b)=>a.x-b.x);let overlaps=0;
    for(let i=0;i<ordered.length;i++){const a=ordered[i];if(!Number.isFinite(a.x+a.y+a.width+a.height))throw new Error('Invalid geometry');for(let j=i+1;j<ordered.length&&ordered[j].x<a.x+a.width-1;j++){const b=ordered[j];if(a.y+1<b.y+b.height&&a.y+a.height>b.y+1)overlaps++;}}
    if(overlaps)throw new Error(`${structure}/${count}: ${overlaps} overlaps`);measurements.push({structure,count,durationMS,overlaps});
   }
   const book=m.fixture(50),s=m.activeSheet(book),ids=Object.keys(s.nodes);book.title='完整度驗收 繁體中文';s.nodes[s.rootId].text='臺灣繁體中文 完整度驗收 龜鬱';s.nodes[s.rootId].equation='\\frac{a+b}{c}=\\sqrt{2}';s.nodes[s.rootId].sticker='💡';s.nodes[ids[1]].attachments=[{id:m.uid(),name:'驗收.txt',mime:'text/plain',data:'data:application/octet-stream;base64,aGVsbG8='}];s.nodes[ids[1]].style={...s.nodes[ids[1]].style,align:'center',font:'mono',opacity:.8,strokeWidth:2,dashed:true};
   s.summaries=[{id:m.uid(),topicIds:[ids[1],ids[49]],text:'跨頁摘要驗收與繁體中文彙整'}];s.relationships.push({id:m.uid(),from:ids[1],to:ids[49],text:'跨頁依賴與完整關係文字驗收',directed:true,dashed:true});
   ids.forEach((id,i)=>{s.nodes[id].task={status:i%3===0?'done':i%3===1?'doing':'todo',start:'2026-10-20',due:'2026-10-25',dependencies:i===49?[ids[0]]:[]};});s.slides=[s.rootId,ids[1],ids[2]];m.validateWorkbook(book);
   const plans={rich:e.planPrint(s,{...e.defaultPrint,mode:'branches',header:book.title}),tasks:v.taskPlan(s,ids,book.title),slides:v.presentationPlan(s,book.title)};const outputs={};for(const [name,plan]of Object.entries(plans))outputs[name]={html:await e.preparePrintHTML(plan),pages:plan.pages.length,widthMM:plan.widthMM,heightMM:plan.heightMM,minPt:plan.estimatedPt,indexPages:plan.indexPages,topics:plan.topicPages};return {book,measurements,outputs};
  });
  await writeFile(`${out}/release-fixture.openmind`,JSON.stringify(data.book,null,2));
  const output=await browser.newPage(),external=[];output.on('request',request=>{if(/^https?:/.test(request.url()))external.push(request.url());});
  for(const [name,plan]of Object.entries(data.outputs)){await output.setContent(plan.html);await output.evaluate(()=>document.fonts.ready);await output.pdf({path:`${out}/browser-${name}.pdf`,preferCSSPageSize:true,printBackground:true});}
  expect(external).toEqual([]);await page.getByTestId('file-input').setInputFiles({name:'rich.openmind',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data.book))});await expect(page.getByLabel('文件名稱',{exact:true})).toHaveValue(data.book.title);await page.getByRole('button',{name:'列印與 PDF',exact:true}).click();await page.getByRole('button',{name:/主要分支分頁/}).click();await page.getByRole('button',{name:'展開專注預覽',exact:true}).click();await page.screenshot({path:`${out}/rich-focus-preview.png`});
  const actualSVG=await page.getByTestId('print-page').locator('svg').first().evaluate(svg=>{const copy=svg.cloneNode(true);copy.querySelector('[data-preview-guide]')?.remove();return copy.outerHTML;});const plan=data.outputs.rich;await output.setViewportSize({width:Math.ceil(plan.widthMM*96/25.4),height:Math.ceil(plan.heightMM*96/25.4)});await output.setContent(plan.html.replace(/<body>[\s\S]*<\/body>/,`<body><section class="page">${actualSVG}</section></body>`));await output.evaluate(()=>document.fonts.ready);await output.screenshot({path:`${out}/rich-preview-physical.png`});
  await writeFile(`${out}/browser-acceptance.json`,JSON.stringify({...data,book:undefined,outputs:Object.fromEntries(Object.entries(data.outputs).map(([name,p])=>[name,{...p,html:undefined}])) ,externalRequests:external},null,2));console.log(`36 layout cases passed; rich, task and slide PDFs generated with no external requests.`);
 }finally{await browser.close();}
}
