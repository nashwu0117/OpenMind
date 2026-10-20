import {activeSheet,addTopic,newWorkbook,uid,validateWorkbook,type Sheet,type Workbook} from '../core/model';
import {escapeXML} from '../engine/svg';
export const FREEMIND_WARNING='FreeMind 僅轉換文字、階層、基本顏色／字型、摺疊、筆記、連結與箭頭關係；自由主題會成為中央主題的子節點。標籤、任務、附件、圖片、公式、摘要、精確版面與其他工作表不包含。圖示、箭頭標題與線條外觀會簡化。請保留原生 .openmind 備份。';
const color=(value:string|null,fallback:string)=>value&&/^#[0-9a-f]{6}$/i.test(value)?value:fallback;
export function freemind(sheet:Sheet):string {
  const build=(id:string):string=>{const n=sheet.nodes[id],style=n.style;return `<node ID="${escapeXML(id)}" TEXT="${escapeXML(n.text).replaceAll('\n','&#10;')}" COLOR="${style.color}" BACKGROUND_COLOR="${style.fill}" FOLDED="${n.collapsed}"${n.link?` LINK="${escapeXML(n.link.startsWith('openmind:')?'#'+n.link.slice(9):n.link)}"`:''}><font SIZE="${style.fontSize*.75}" BOLD="${style.bold}" ITALIC="${style.italic}" NAME="${style.font==='serif'?'Serif':style.font==='mono'?'Monospaced':'SansSerif'}"/>${n.notes?`<richcontent TYPE="NOTE"><html><body><p>${escapeXML(n.notes).replaceAll('\n','<br/>')}</p></body></html></richcontent>`:''}${sheet.relationships.filter(r=>r.from===id).map(r=>`<arrowlink DESTINATION="${escapeXML(r.to)}" ENDARROW="${r.directed?'Default':'None'}" STARTARROW="None"/>`).join('')}${n.children.map(build).join('')}${id===sheet.rootId?sheet.floating.map(build).join(''):''}</node>`;};
  const xml=`<?xml version="1.0" encoding="UTF-8"?><map version="1.0.1">${build(sheet.rootId)}</map>`;
  if(new TextEncoder().encode(xml).length>2e6)throw new Error('FreeMind 匯出超過 2 MB，請選取較小分支。');return xml;
}
export function parseFreeMind(text:string):Workbook {
  if(new TextEncoder().encode(text).length>2e6||/<!DOCTYPE|<!ENTITY/i.test(text))throw new Error('FreeMind 超過 2 MB 或含不允許的 XML 實體。');
  const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.querySelector('parsererror')||doc.documentElement.tagName!=='map')throw new Error('FreeMind XML 格式錯誤。');
  const allowed=new Set(['map','node','font','edge','icon','richcontent','arrowlink','cloud','html','head','body','p','br','b','strong','i','em','span','div','ul','ol','li','a']);
  for(const element of doc.querySelectorAll('*')){if(!allowed.has(element.tagName))throw new Error(`FreeMind 含尚未支援的 ${element.tagName}，停止匯入以避免資料遺失。`);if(!['node','font','edge','icon','richcontent','arrowlink','cloud'].includes(element.tagName)&&!element.closest('richcontent')&&element.tagName!=='map')throw new Error('FreeMind 文件層級無效。');}
  const roots=[...doc.documentElement.children];if(roots.length!==1||roots[0].tagName!=='node')throw new Error('FreeMind 必須有一個中央主題。');
  const book=newWorkbook('匯入的 FreeMind'),sheet=activeSheet(book),mapping=new Map<string,string>(),links:{id:string;target:string}[]=[],arrows:{id:string;target:string;directed:boolean}[]=[];let count=0;
  const walk=(element:Element,parent:string|undefined,depth:number)=>{if(depth>128||++count>10000)throw new Error('FreeMind 節點或階層超過上限。');const id=parent?addTopic(sheet,parent,element.getAttribute('TEXT')??''):sheet.rootId,n=sheet.nodes[id],old=element.getAttribute('ID');n.text=element.getAttribute('TEXT')??'';if(old){if(mapping.has(old))throw new Error('FreeMind 節點 ID 重複。');mapping.set(old,id);}n.collapsed=element.getAttribute('FOLDED')==='true';n.style.color=color(element.getAttribute('COLOR'),n.style.color);n.style.fill=color(element.getAttribute('BACKGROUND_COLOR'),n.style.fill);
    const link=element.getAttribute('LINK');if(link){if(link.startsWith('#'))links.push({id,target:link.slice(1)});else n.link=link;}
    for(const child of element.children){if(child.tagName==='node')walk(child,id,depth+1);else if(child.tagName==='font'){const size=Number(child.getAttribute('SIZE'));if(child.hasAttribute('SIZE'))n.style.fontSize=Math.min(64,Math.max(10,size*4/3));n.style.bold=child.getAttribute('BOLD')==='true';n.style.italic=child.getAttribute('ITALIC')==='true';const name=child.getAttribute('NAME')??'';n.style.font=/mono/i.test(name)?'mono':/^serif$|times|georgia/i.test(name)?'serif':'sans';}
      else if(child.tagName==='richcontent'){const clone=child.cloneNode(true) as Element;for(const br of clone.querySelectorAll('br'))br.replaceWith(doc.createTextNode('\n'));if(child.getAttribute('TYPE')==='NOTE')n.notes=clone.textContent??'';else if(child.getAttribute('TYPE')==='NODE')n.text=clone.textContent??n.text;else if(child.getAttribute('TYPE')!=='NOTE')throw new Error('FreeMind richcontent 類型不受支援。');}
      else if(child.tagName==='arrowlink')arrows.push({id,target:child.getAttribute('DESTINATION')??'',directed:child.getAttribute('ENDARROW')!=='None'});
      else if(child.tagName==='icon'){const name=child.getAttribute('BUILTIN')??'';n.marker=({button_ok:'✓',button_cancel:'!',idea:'★',flag:'⚑',help:'?'} as Record<string,string>)[name]??n.marker;if(!['button_ok','button_cancel','idea','flag','help'].includes(name))n.labels.push('FreeMind:'+name);}
      else if(child.tagName==='cloud')sheet.boundaries.push({id:uid(),topicId:id,text:'FreeMind 範圍'});
    }n.collapsed=element.getAttribute('FOLDED')==='true';
  };walk(roots[0],undefined,0);
  for(const link of links){const target=mapping.get(link.target);if(!target)throw new Error('FreeMind 主題連結指向遺失節點。');sheet.nodes[link.id].link='openmind:'+target;}
  for(const arrow of arrows){const to=mapping.get(arrow.target);if(!to)throw new Error('FreeMind 箭頭指向遺失節點。');sheet.relationships.push({id:uid(),from:arrow.id,to,text:'FreeMind 關係',directed:arrow.directed,dashed:false});}
  return validateWorkbook(book);
}
