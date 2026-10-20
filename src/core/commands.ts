import {clone,defaultStyle,parentId,topic,uid,type Sheet,type NodeStyle} from './model';
export function insertParent(sheet:Sheet,id:string,text='新上層主題'):string {
  if(!sheet.nodes[id])throw new Error('選取的主題不存在。');
  const parent=parentId(sheet,id),node=topic(text,id===sheet.rootId);node.children=[id];sheet.nodes[node.id]=node;
  if(parent){const ids=sheet.nodes[parent].children;ids.splice(ids.indexOf(id),1,node.id);}
  else if(id===sheet.rootId)sheet.rootId=node.id;
  else{sheet.floating.splice(sheet.floating.indexOf(id),1,node.id);node.position=sheet.nodes[id].position;delete sheet.nodes[id].position;}
  return node.id;
}
export function addSummary(sheet:Sheet,ids:string[],text='重點摘要'):string {
  const members=[...new Set(ids)].filter(id=>!!sheet.nodes[id]);if(!members.length)throw new Error('請選取要摘要的主題。');
  const id=uid();sheet.summaries.push({id,topicIds:members,text});return id;
}
export {dayNumber,dateFromDay,taskDuration,validateDependencies,scheduleDependencies} from './tasks';
export function removeTask(sheet:Sheet,id:string){delete sheet.nodes[id].task;for(const n of Object.values(sheet.nodes))if(n.task?.dependencies)n.task.dependencies=n.task.dependencies.filter(d=>d!==id);}
export type Theme={id:string;name:string;background:string;root:NodeStyle;topic:NodeStyle;colors:string[]};
export const themes:Theme[]=[
  {id:'clear',name:'清晰藍',background:'#f6f8fb',root:{...defaultStyle,fill:'#244f9e',stroke:'#244f9e',color:'#ffffff',bold:true,fontSize:23},topic:{...defaultStyle},colors:['#3263ce','#11938a','#8963b8','#b27b28']},
  {id:'forest',name:'森林綠',background:'#f2f7f1',root:{...defaultStyle,fill:'#245b46',stroke:'#245b46',color:'#ffffff',bold:true,fontSize:23},topic:{...defaultStyle,fill:'#fcfffa',stroke:'#98b6a1'},colors:['#2d7757','#86723e','#476a8a','#8a5873']},
  {id:'ink',name:'深墨',background:'#162332',root:{...defaultStyle,fill:'#d8e6ff',stroke:'#d8e6ff',color:'#162332',bold:true,fontSize:23},topic:{...defaultStyle,fill:'#24374c',color:'#eff5ff',stroke:'#6e879f'},colors:['#a6c6ff','#8dd5c0','#eed29b','#d0b6ed']},
];
export function themeFromSheet(sheet:Sheet,name:string):Theme{return {id:uid(),name,background:sheet.background,root:clone(sheet.nodes[sheet.rootId].style),topic:clone(sheet.nodes[sheet.nodes[sheet.rootId].children[0]]?.style??defaultStyle),colors:sheet.nodes[sheet.rootId].children.map(id=>sheet.nodes[id].style.stroke).slice(0,8)};}
export function applyTheme(sheet:Sheet,theme:Theme){sheet.background=theme.background;for(const node of Object.values(sheet.nodes))node.style=clone(node.id===sheet.rootId?theme.root:theme.topic);
  sheet.nodes[sheet.rootId].children.forEach((id,i)=>{sheet.nodes[id].style={...clone(theme.topic),stroke:theme.colors[i%Math.max(1,theme.colors.length)]??theme.topic.stroke,bold:true};});}
