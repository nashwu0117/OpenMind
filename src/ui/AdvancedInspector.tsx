import {useEffect,useRef,useState} from 'react';
import {clone,defaultStyle,newWorkbook,topic,uid,validateWorkbook,type NodeStyle,type Sheet,type Topic,type Workbook} from '../core/model';
import {addSummary,applyTheme,insertParent,themeFromSheet,themes,type Theme} from '../core/commands';
import {readPresets,savePreset} from '../core/library';
import {embeddedFile,attachmentBlob} from '../io/binary';
import {download} from '../io/formats';
import {equationGraphic} from '../engine/equations';
import {TextField} from './Fields';
export type SavedTemplate={id:string;name:string;book:Workbook};
type Props={book:Workbook;sheet:Sheet;primary:Topic;selection:string[];readOnly:boolean;edit:(fn:(sheet:Sheet)=>void)=>boolean;select:(ids:string[])=>void;notify:(message:string)=>void;copiedStyle?:NodeStyle;copyStyle:(style:NodeStyle)=>void};
function validTheme(value:unknown):value is Theme {try{const t=value as Theme;if(typeof t.id!=='string'||typeof t.name!=='string'||!Array.isArray(t.colors)||!t.colors.every(c=>/^#[0-9a-f]{6}$/i.test(c)))return false;const book=newWorkbook(),sheet=book.sheets[0];applyTheme(sheet,t);sheet.nodes[sheet.rootId].style=t.topic;validateWorkbook(book);return true;}catch{return false;}}
export function AdvancedInspector(p:Props){
  const [customThemes,setCustomThemes]=useState<Theme[]>([]),[themeName,setThemeName]=useState('我的主題'),[templateName,setTemplateName]=useState(p.book.title);
  const attachmentInput=useRef<HTMLInputElement>(null),n=p.primary;
  useEffect(()=>{void readPresets<unknown>('themes').then(values=>setCustomThemes(values.filter(validTheme))).catch(()=>{});},[]);
  const patch=(fn:(node:Topic)=>void)=>p.edit(sheet=>p.selection.forEach(id=>fn(sheet.nodes[id])));
  const style=(value:Partial<NodeStyle>)=>patch(node=>node.style={...node.style,...value});
  async function attach(files:File[]){try{const ids=[...p.selection],sheetId=p.sheet.id,data=await Promise.all(files.map(embeddedFile));p.edit(sheet=>{if(sheet.id!==sheetId)throw new Error('加入附件時已切換工作表，請重新選取附件。');for(const id of ids){if(!sheet.nodes[id])throw new Error('附件目標已刪除。');sheet.nodes[id].attachments.push(...data.map(item=>({...item,id:uid()})));}});}catch(error){p.notify((error as Error).message);}}
  return <div className="advanced-inspector">
    <details open><summary>階層與摘要</summary><div className="branch-actions">
      <button disabled={p.readOnly} onClick={()=>{let id='';if(p.edit(sheet=>{id=insertParent(sheet,n.id);}))p.select([id]);}}>插入上層主題</button>
      <button disabled={p.readOnly} onClick={()=>p.edit(sheet=>{addSummary(sheet,p.selection);})}>建立選取摘要</button>
    </div>{p.sheet.summaries.map((s,i)=><div className="annotation-editor" key={s.id}><TextField label={`摘要文字 ${i+1}`} value={s.text} disabled={p.readOnly} onCommit={text=>p.edit(sheet=>{sheet.summaries.find(row=>row.id===s.id)!.text=text;})}/><button aria-label={`刪除摘要 ${i+1}`} disabled={p.readOnly} onClick={()=>p.edit(sheet=>{sheet.summaries=sheet.summaries.filter(row=>row.id!==s.id);})}>移除</button></div>)}
    <label className="wide-label">連結至主題<select aria-label="連結至主題" disabled={p.readOnly} value={/^openmind:/i.test(n.link)?n.link.slice(9):''} onChange={event=>patch(node=>{node.link=event.target.value?'openmind:'+event.target.value:'';})}><option value="">選擇文件內的主題</option>{Object.values(p.sheet.nodes).filter(node=>node.id!==n.id).map(node=><option key={node.id} value={node.id}>{node.text.slice(0,48)}</option>)}</select></label></details>
    <details><summary>更多文字與線條樣式</summary><div className="form-grid">
      <label>字型<select aria-label="文字字型" value={n.style.font} disabled={p.readOnly} onChange={e=>style({font:e.target.value as NodeStyle['font']})}><option value="sans">Noto Sans TC</option><option value="serif">襯線／繁中回退</option><option value="mono">等寬／繁中回退</option></select></label>
      <label>對齊<select aria-label="文字對齊" value={n.style.align} disabled={p.readOnly} onChange={e=>style({align:e.target.value as NodeStyle['align']})}><option value="left">靠左</option><option value="center">置中</option><option value="right">靠右</option></select></label>
      <label>填色透明度<input aria-label="填色透明度" type="range" min="0" max="1" step="0.05" value={n.style.opacity} disabled={p.readOnly} onChange={e=>style({opacity:+e.target.value})}/></label>
      <label>外框粗細<input aria-label="外框粗細" type="number" min="0" max="8" step="0.5" value={n.style.strokeWidth} disabled={p.readOnly} onChange={e=>style({strokeWidth:+e.target.value})}/></label>
      <label>連接線<select aria-label="連接線樣式" value={p.sheet.connector} disabled={p.readOnly} onChange={e=>p.edit(sheet=>{sheet.connector=e.target.value as Sheet['connector'];})}><option value="curve">曲線</option><option value="elbow">折線</option><option value="straight">直線</option></select></label>
      <label>水平間距<input aria-label="水平分支間距" type="number" min="12" max="200" value={p.sheet.spacing.horizontal} disabled={p.readOnly} onChange={e=>p.edit(sheet=>{sheet.spacing.horizontal=+e.target.value;})}/></label>
      <label>垂直間距<input aria-label="垂直分支間距" type="number" min="12" max="200" value={p.sheet.spacing.vertical} disabled={p.readOnly} onChange={e=>p.edit(sheet=>{sheet.spacing.vertical=+e.target.value;})}/></label>
    </div><label className="check-label"><input type="checkbox" aria-label="虛線外框" checked={n.style.dashed} disabled={p.readOnly} onChange={e=>style({dashed:e.target.checked})}/>虛線外框</label>
    <div className="branch-actions"><button onClick={()=>p.copyStyle(clone(n.style))}>複製樣式</button><button disabled={p.readOnly||!p.copiedStyle} onClick={()=>style(p.copiedStyle!)}>貼上樣式</button><button disabled={p.readOnly} onClick={()=>style(n.id===p.sheet.rootId?topic('',true).style:defaultStyle)}>重設樣式</button></div></details>
    <details><summary>貼圖、公式與附件</summary><label className="wide-label">貼圖<select aria-label="節點貼圖" value={n.sticker} disabled={p.readOnly} onChange={e=>patch(node=>{node.sticker=e.target.value;})}>{['','🌱','💡','🎯','📌','🚀','📚','✅','❤️'].map(value=><option key={value} value={value}>{value||'無貼圖'}</option>)}</select></label>
      <label className="wide-label">數學公式（TeX／AMS）<TextField label="節點公式" value={n.equation} multiline disabled={p.readOnly} placeholder="例如 \\frac{a+b}{c}" onCommit={source=>{const result=equationGraphic(source);if(result?.error){p.notify(result.error);return;}patch(node=>{node.equation=source;});}}/></label>
      <button className="full-button" disabled={p.readOnly} onClick={()=>attachmentInput.current?.click()}>加入附件（每檔 2 MB）</button><input className="hidden" data-testid="attachment-input" ref={attachmentInput} type="file" multiple onChange={e=>{const files=[...e.target.files??[]];e.target.value='';void attach(files);}}/>
      <div className="attachment-list">{n.attachments.map(a=><div key={a.id}><button className="attachment-download" onClick={()=>download(a.name,attachmentBlob(a.data,a.mime),a.mime)}>{a.name}</button><button aria-label={`移除附件 ${a.name}`} disabled={p.readOnly} onClick={()=>p.edit(sheet=>{sheet.nodes[n.id].attachments=sheet.nodes[n.id].attachments.filter(item=>item.id!==a.id);})}>移除</button></div>)}</div>
    </details>
    <details><summary>主題與範本</summary><label className="wide-label">套用主題<select aria-label="套用主題" disabled={p.readOnly} defaultValue="" onChange={e=>{const theme=[...themes,...customThemes].find(t=>t.id===e.target.value);if(theme)p.edit(sheet=>applyTheme(sheet,theme));e.target.value='';}}><option value="">選擇主題</option>{[...themes,...customThemes].map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <label className="wide-label">自訂主題名稱<input aria-label="自訂主題名稱" maxLength={100} value={themeName} onChange={e=>setThemeName(e.target.value)}/></label><button className="full-button" onClick={async()=>{try{const theme=themeFromSheet(p.sheet,themeName.trim()||'我的主題');await savePreset(theme.id,'themes',theme);setCustomThemes(rows=>[...rows,theme]);p.notify('已保存自訂主題，可套用至其他文件。');}catch(error){p.notify(`主題儲存失敗：${(error as Error).message}`);}}}>保存目前樣式為主題</button>
      <label className="wide-label">範本名稱<input aria-label="範本名稱" maxLength={100} value={templateName} onChange={e=>setTemplateName(e.target.value)}/></label><button className="full-button" onClick={async()=>{try{const template:SavedTemplate={id:uid(),name:templateName.trim()||'我的範本',book:clone(p.book)};await savePreset(template.id,'templates',template);p.notify('已保存範本；新增心智圖時可選用。');}catch(error){p.notify(`範本儲存失敗：${(error as Error).message}`);}}}>保存文件為範本</button>
    </details>
  </div>;
}
