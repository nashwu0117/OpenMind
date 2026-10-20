import type {Sheet} from '../core/model';
import {dayNumber,dateFromDay} from '../core/tasks';
import {branchSheet,FONT,layout,wrapText,type Scene,type PlacedNode} from './layout';
import {escapeXML} from './svg';
import {defaultPrint,planPrint,type PrintPlan} from './print';
import {fitPage} from './pagination';
import {annotatePages} from './pageReferences';
export function slideOrder(sheet:Sheet):string[]{return sheet.slides.length?sheet.slides:[sheet.rootId,...sheet.nodes[sheet.rootId].children,...sheet.floating];}
function basePlan(sheet:Sheet,title:string,presentation=false):PrintPlan{
  const root={...sheet.nodes[sheet.rootId],children:[],equation:'',image:undefined};
  return planPrint({...sheet,nodes:{[root.id]:root},floating:[],relationships:[],boundaries:[],summaries:[],slides:[],structure:'logic'},presentation?{...defaultPrint,paper:'Custom',customWidth:338.67,customHeight:190.5,mode:'fit',header:title}:{...defaultPrint,mode:'fit',header:title});
}
export function presentationPlan(sheet:Sheet,title:string):PrintPlan{
  const base=basePlan(sheet,title,true),area={width:base.contentWidth,height:base.contentHeight,minPt:10},order=slideOrder(sheet);
  const pages=order.map((id,i)=>fitPage(layout(id===sheet.rootId?sheet:branchSheet(sheet,id),id,true),area,`投影片 ${i+1} · ${sheet.nodes[id].text}`));
  const estimatedPt=Math.min(...pages.map(page=>page.minPt));return {...base,pages,nodeCount:Object.keys(sheet.nodes).length,estimatedPt,topicPages:{},indexPages:[],warnings:estimatedPt<10?[`簡報保留整張分支，最小文字約 ${estimatedPt.toFixed(1)} pt；大型分支可另選較小主題作為投影片。`]:[]};
}
export function ganttScene(sheet:Sheet,ids:string[],rangeIds=ids):Scene{
  const days=rangeIds.flatMap(id=>{const task=sheet.nodes[id].task;return task?.start&&task.due?[dayNumber(task.start),dayNumber(task.due)]:[];}),first=days.length?Math.min(...days):0,last=days.length?Math.max(...days):first;
  const left=260,width=690,span=Math.max(1,last-first+1),x=(day:number)=>left+(day-first)/span*width;
  const nodes:PlacedNode[]=[],originals:Sheet['nodes']={},bars=new Map<string,{start:number;end:number;y:number}>();let y=44,markup='';
  const ticks=days.length?[...new Set(Array.from({length:7},(_,i)=>Math.round(first+(last-first)*i/6)))]:[];
  for(const day of ticks){const px=x(day);markup+=`<path d="M${px},32 V100000" stroke="#dce4ef" stroke-width=".6"/><text x="${px}" y="20" font-size="12" text-anchor="${day===first?'start':day===last?'end':'middle'}" fill="#526780">${dateFromDay(day)}</text>`;}
  let barsMarkup='',dependencies='';
  for(const id of ids){const source=sheet.nodes[id],task=source.task!;const lines=wrapText(source.text,14,208),height=Math.max(70,lines.length*20.3+47);originals[id]={...source,text:source.text,children:[],notes:'',labels:[],marker:'',sticker:'',equation:'',attachments:[],link:'',image:undefined,style:{...source.style,fontSize:14,align:'left',font:'sans',opacity:1}};
    nodes.push({id,x:0,y,width:236,height,lines,fontSize:14,depth:1,color:'#3263ce'});
    const center=y+height/2;if(task.start&&task.due){const start=x(dayNumber(task.start)),end=x(dayNumber(task.due)+1),fill={todo:'#799bcf',doing:'#287f9b',done:'#25846c'}[task.status];bars.set(id,{start,end,y:center});barsMarkup+=`<rect data-task-bar="${escapeXML(id)}" x="${start}" y="${center-10}" width="${Math.max(2,end-start)}" height="20" rx="4" fill="${fill}"/><text x="${start}" y="${center+27}" font-size="11" fill="#435a75">${escapeXML(task.start)} → ${escapeXML(task.due)}</text>`;}
    else barsMarkup+=`<text x="${left}" y="${center+4}" font-size="12" fill="#71829c">未排程</text>`;y+=height+18;
  }
  for(const id of ids){const target=bars.get(id);if(!target)continue;for(const dependency of sheet.nodes[id].task?.dependencies??[]){const source=bars.get(dependency);if(source)dependencies+=`<path d="M${source.end},${source.y} H${source.end+8} V${target.y} H${target.start}" stroke="#8b609b" fill="none" stroke-width="1.4" marker-end="url(#task-dependency)"/>`;}}
  markup=markup.replaceAll('V100000',`V${y}`);markup=`<g style="font-family:${escapeXML(FONT)}"><defs><marker id="task-dependency" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#8b609b"/></marker></defs>${markup}${dependencies}${barsMarkup}</g>`;
  return {nodes,edges:[],bounds:{x:-16,y:-8,width:left+width+32,height:y+24},sheet:{...sheet,rootId:ids[0]??sheet.rootId,nodes:originals,floating:ids.slice(1),relationships:[],boundaries:[],summaries:[],slides:[],structure:'logic',background:'#ffffff'},extraMarkup:markup};
}
export function taskPlan(sheet:Sheet,ids:string[],title:string):PrintPlan{
  if(!ids.length)throw new Error('沒有可匯出的任務。');const base=basePlan(sheet,title);base.referenceArea=92;base.contentHeight-=92;const area={width:base.contentWidth,height:base.contentHeight,minPt:10},groups:string[][]=[];let group:string[]=[],height=44;
  for(const id of ids){const h=Math.max(70,wrapText(sheet.nodes[id].text,14,208).length*20.3+47)+18;if(group.length&&height+h>area.height-48){groups.push(group);group=[];height=44;}group.push(id);height+=h;}if(group.length)groups.push(group);if(groups.length>500)throw new Error('任務 PDF 超過 500 頁，請縮小篩選範圍。');
  const pages=groups.map((group,i)=>fitPage(ganttScene(sheet,group,ids),area,`任務時程 ${i+1}/${groups.length}`));const relations={...sheet,summaries:[],relationships:ids.flatMap(id=>(sheet.nodes[id].task?.dependencies??[]).map((dep,i)=>({id:`${id}-${i}`,from:dep,to:id,text:"前置任務",directed:true,dashed:false})))};const references=annotatePages(relations,pages,area),estimatedPt=Math.min(...pages.map(p=>p.minPt));return {...base,pages,nodeCount:ids.length,estimatedPt,...references,warnings:estimatedPt<10?[`個別任務名稱過長，最小文字約 ${estimatedPt.toFixed(1)} pt；可在主題中分段或改用大綱列印。`]:[]};
}
