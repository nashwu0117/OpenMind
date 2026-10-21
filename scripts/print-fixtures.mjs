import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('artifacts/print-fixtures',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 const app=await browser.newPage({viewport:{width:1480,height:960}});await app.goto('http://127.0.0.1:5187');await app.waitForLoadState('networkidle');await expect(app.locator('.library')).toBeVisible();await app.locator('.document-card').first().click();await expect(app).toHaveURL(/#\/map\/[^/]+$/);await expect(app.getByTestId('canvas').locator('[data-node-id]')).toHaveCount(17);await app.screenshot({path:'artifacts/full-editor.png'});
 const cases=[{count:10,mode:'fit'},{count:50,mode:'branches'},{count:200,mode:'readable'},{count:1000,mode:'outline'},{count:200,mode:'poster'},{count:50,mode:'selection'},{count:10,mode:'fit',rich:true,monochrome:true}];
 const manifest=[];
 for(const c of cases){
  const data=await app.evaluate(async c=>{const modelPath='/src/core/model.ts',printPath='/src/engine/print.ts';const model=await import(modelPath),engine=await import(printPath);const s=model.activeSheet(model.fixture(c.count));if(c.rich){const ids=Object.keys(s.nodes);s.nodes[ids[1]].image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5p8AAAAASUVORK5CYII=';s.nodes[ids[1]].task={status:'doing',start:'2026-10-20',due:'2026-10-22'};s.nodes[ids[1]].labels=['重點'];s.boundaries.push({id:model.uid(),topicId:ids[1],text:'重點分支'});s.relationships.push({id:model.uid(),from:ids[1],to:ids[2],text:'關聯',directed:true,dashed:true});}const selection=s.nodes[s.rootId].children[0];const settings={...engine.defaultPrint,mode:c.mode,monochrome:!!c.monochrome};const plan=engine.planPrint(s,settings,selection);return {html:await engine.preparePrintHTML(plan),pages:plan.pages.length,widthMM:plan.widthMM,heightMM:plan.heightMM,minPt:plan.estimatedPt,warnings:plan.warnings,nodeCount:plan.nodeCount};},c);
  const out=await browser.newPage({viewport:{width:Math.ceil(data.widthMM*96/25.4),height:Math.ceil(data.heightMM*96/25.4)}});await out.setContent(data.html);await out.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
  const name=`${c.count}-${c.mode}${c.rich?'-rich-bw':''}`;await out.pdf({path:`artifacts/print-fixtures/${name}.pdf`,preferCSSPageSize:true,printBackground:true});await out.screenshot({path:`artifacts/print-fixtures/${name}.png`,fullPage:false});await out.close();manifest.push({...c,...data,html:undefined,name});console.log(`${name}: ${data.pages} pages, ${data.minPt.toFixed(2)}pt`);
 }
 await writeFile('artifacts/print-fixtures/manifest.json',JSON.stringify(manifest,null,2));
}finally{await browser.close();}
