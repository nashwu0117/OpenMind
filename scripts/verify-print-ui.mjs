import {chromium, expect} from '@playwright/test';
import {mkdir, writeFile} from 'node:fs/promises';
await mkdir('artifacts/phase2/ui-comparison',{recursive:true});
const browser=await chromium.launch();
try {
  const page=await browser.newPage({viewport:{width:1480,height:960}});
  await page.goto('http://127.0.0.1:5187');await page.waitForLoadState('networkidle');
  const data=await page.evaluate(async()=>{
    const mp='/src/core/model.ts',ep='/src/engine/print.ts';const m=await import(mp),e=await import(ep);
    const book=m.fixture(80),s=m.activeSheet(book),ids=Object.keys(s.nodes);
    s.nodes[s.rootId].text='臺灣繁體中文印刷驗證 龜鬱體積 ABC 123';
    s.relationships.push({id:m.uid(),from:ids[10],to:ids[70],text:'跨頁審核與依賴關係',directed:true,dashed:true});
    const plan=e.planPrint(s,{...e.defaultPrint,mode:'branches',landscape:false,header:book.title});
    return {book,html:await e.preparePrintHTML(plan),pages:plan.pages.length,widthMM:plan.widthMM,heightMM:plan.heightMM,
      comparePages:[...new Set([1,plan.topicPages[ids[10]][0],plan.topicPages[ids[70]][0],plan.indexPages[0]])]};
  });
  await page.getByTestId('file-input').setInputFiles({name:'comparison.openmind',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data.book))});
  await writeFile('artifacts/phase2/fixture.openmind',JSON.stringify(data.book,null,2));
  await page.getByRole('button',{name:'列印與 PDF',exact:true}).click();await page.getByRole('button',{name:/主要分支分頁/}).click();await page.getByLabel('列印方向',{exact:true}).selectOption('portrait');
  await expect(page.locator('.print-metrics')).toContainText(`${data.pages} 頁`);
  const output=await browser.newPage({viewport:{width:Math.ceil(data.widthMM*96/25.4),height:Math.ceil(data.heightMM*96/25.4)}});
  await output.setContent(data.html);await output.evaluate(()=>document.fonts.ready);
  await output.pdf({path:'artifacts/phase2/ui-comparison/actual-output.pdf',preferCSSPageSize:true,printBackground:true});
  for(const number of data.comparePages){
    await page.getByLabel('預覽頁碼',{exact:true}).selectOption(String(number-1));await page.evaluate(()=>document.fonts.ready);
    const actualSVG=await page.getByTestId('print-page').locator('svg').evaluate(svg=>{const clone=svg.cloneNode(true);clone.querySelector('[data-preview-guide]')?.remove();return clone.outerHTML;});
    // Capture the actual UI's SVG DOM at physical size using the same embedded font CSS.
    // This is intentionally independent of a second pageSVG() call.
    await output.setContent(data.html.replace(/<body>[\s\S]*<\/body>/,`<body><section class="page">${actualSVG}</section></body>`));
    await output.evaluate(()=>document.fonts.ready);await output.screenshot({path:`artifacts/phase2/ui-comparison/preview-${number}.png`});
  }
  await page.getByRole('button',{name:'展開專注預覽',exact:true}).click();await page.screenshot({path:'artifacts/phase2/actual-focus-preview.png'});
  await writeFile('artifacts/phase2/ui-comparison/manifest.json',JSON.stringify({...data,html:undefined,book:undefined},null,2));
  const bulk=await page.evaluate(async()=>{const mp='/src/core/model.ts',ep='/src/engine/print.ts';const m=await import(mp),e=await import(ep);const book=m.fixture(1000),s=m.activeSheet(book),plan=e.planPrint(s,{...e.defaultPrint,mode:'branches',header:book.title});return {book,pages:plan.pages.length,minPt:plan.estimatedPt,widthMM:plan.widthMM,heightMM:plan.heightMM};});
  await writeFile('artifacts/phase2/fixture-1000.openmind',JSON.stringify(bulk.book));
  await writeFile('artifacts/phase2/bulk-plan.json',JSON.stringify({...bulk,book:undefined},null,2));
  console.log(`Captured actual UI SVGs for pages ${data.comparePages.join(', ')} of ${data.pages}, plus matching PDF.`);
} finally {await browser.close();}
