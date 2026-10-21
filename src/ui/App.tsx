import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, BookOpen, ChevronDown, ChevronRight, Copy, Download, FilePlus2, FolderOpen, Focus, GitBranch, Layers, ListTree, Map, MoreHorizontal, Moon, PanelRightClose, Plus, Printer, Redo2, Save, Search, Sun, Trash2, Undo2, X, Check, ImagePlus, Link2, Square, Network, Files, ArrowLeft, LockKeyhole, Eye, Maximize2, Minimize2 } from 'lucide-react';
import { activeSheet, addTopic, clone, defaultStyle, demoWorkbook, descendants, moveTopic, newSheet, newWorkbook, palette, parentId, pasteBranches, removeTopics, topic, uid, structures, validateWorkbook, type NodeStyle, type Sheet, type Structure, type Topic, type Workbook } from '../core/model';
import { commit, historyOf, redo, undo, type History } from '../core/history';
import {archiveLocal,persistLocal,restoreLocal,readPresets,deletePreset,type LocalRestore,type Recent} from '../core/library';
import { branchSheet, type Scene } from '../engine/layout';
import { layout } from '../engine/layout';
import {standaloneSVG} from '../io/visualExport';
import {freemind,FREEMIND_WARNING} from '../io/freemind';
import { download, importFile, LOSS_WARNING, markdown, nativeJSON, opml, pngFromSVG } from '../io/formats';
import { Canvas } from './Canvas';
import { PrintStudio } from './PrintStudio';
import { TextField } from './Fields';
import { BranchPreview } from './BranchPreview';
import {AdvancedInspector,type SavedTemplate} from './AdvancedInspector';
import {TaskBoard} from './TaskBoard';
import {Presentation} from './Presentation';
import {removeTask} from '../core/commands';
import {useModalFocus} from './useModalFocus';
import {version as appVersion} from '../../package.json';
import type { UpdateStatus } from '../desktop';
import {useI18n, t, tTemplate} from './i18n';
type Clip = {
    sheet: Sheet;
    ids: string[];
};
const structureNames = structures;
function updateMessage(status: UpdateStatus): string {
    switch (status.phase) {
        case 'idle': return tTemplate('目前版本 {0}。', [status.currentVersion]);
        case 'checking': return t('正在檢查更新…');
        case 'downloading': return status.availableVersion ? tTemplate('正在下載 {0}…', [status.availableVersion]) : t('正在下載更新…');
        case 'current': return tTemplate('目前已是最新版本（{0}）。', [status.currentVersion]);
        case 'downloaded': return tTemplate('OpenMind {0} 已下載完成。', [status.availableVersion ?? '']);
        case 'installing': return t('正在重新啟動並安裝更新…');
        default: return t(status.message);
    }
}
export function App() {
    const [session,setSession]=useState<{initial:LocalRestore;writer:'active'|'waiting'|'unavailable';generation:number}|null>(null);
    useEffect(()=>{
        let active=true;
        let release=()=>{};
        const hold=()=>new Promise<void>(resolve=>{release=resolve;});
        const becomeWriter=async(generation:number)=>{
            const latest=await restoreLocal();
            if(!active)return;
            setSession({initial:latest,writer:'active',generation});
            await hold();
        };
        const run=async()=>{
            if(!navigator.locks){
                const latest=await restoreLocal();
                if(active)setSession({initial:latest,writer:'unavailable',generation:0});
                return;
            }
            const granted=await navigator.locks.request('openmind:local-document-writer',{ifAvailable:true},async lock=>{
                if(!lock||!active)return false;
                await becomeWriter(0);
                return true;
            });
            if(granted||!active)return;
            const latest=await restoreLocal();
            if(!active)return;
            setSession({initial:latest,writer:'waiting',generation:0});
            await navigator.locks.request('openmind:local-document-writer',async lock=>{
                if(!lock||!active)return;
                await becomeWriter(1);
            });
        };
        void run().catch(async()=>{
            const latest=await restoreLocal();
            if(active)setSession({initial:latest,writer:'unavailable',generation:0});
        });
        return()=>{active=false;release();};
    },[]);
    return session ? <Editor key={session.generation} initial={session.initial} writer={session.writer}/> : <div role="status" className="startup-state">{t("正在讀取本機文件…")}</div>;
}
function Editor({initial,writer}:{initial:LocalRestore;writer:'active'|'waiting'|'unavailable'}) {
    const {locale} = useI18n();
    useEffect(() => {
        document.documentElement.lang = locale === 'en' ? 'en' : 'zh-Hant-TW';
        document.title = locale === 'en' ? 'OpenMind — Think freely, expand clearly' : 'OpenMind — 自由思考，清晰呈現';
        void window.openmind?.setLocale?.(locale).catch(() => {});
    }, [locale]);
    const [history, setHistoryState] = useState(() => historyOf(initial.book ?? demoWorkbook()));
    const historyRef = useRef(history); historyRef.current = history;
    function setHistory(next: History) {historyRef.current = next; setHistoryState(next);}
    function selectTopics(ids: string[]) {if (document.activeElement instanceof HTMLElement && document.activeElement.matches("input,textarea")) document.activeElement.blur(); setSelected(ids);}
    const book = history.present, sheet = activeSheet(book);
    const [selected, setSelected] = useState<string[]>([sheet.rootId]);
    const [focusId, setFocus] = useState(sheet.rootId);
    const focus = sheet.nodes[focusId] ? focusId : sheet.rootId;
    const [reveal, setReveal] = useState('');
    const [revealVersion,setRevealVersion]=useState(0);
    const [view, setView] = useState<'map' | 'outline' | 'tasks'>('map');
    const [print, setPrint] = useState(false);
    const [presentation,setPresentation]=useState(false);
    const [dark, setDark] = useState(false);
    const [manualReadOnly, setReadOnly] = useState(false);
    const readOnly = manualReadOnly || writer !== 'active';
    const [inspector, setInspector] = useState(true);
    const [search, setSearch] = useState('');
    const [searchOpen,setSearchOpen]=useState(false);
    useEffect(()=>{const outside=(event:PointerEvent)=>{if(event.target instanceof Element&&!event.target.closest('.search-box'))setSearchOpen(false);};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[]);
    const [searchFilter,setSearchFilter]=useState('all'),[searchLimit,setSearchLimit]=useState(100);
    useEffect(()=>setSearchLimit(100),[search,searchFilter]);
    const [toast, setToast] = useState(initial.warning ?? '');
    const [status, setStatus] = useState(t('準備儲存'));
    const [editing, setEditing] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [exportMenu, setExportMenu] = useState(false);
    const [newDialog, setNewDialog] = useState(false);
    const [templates,setTemplates]=useState<SavedTemplate[]>([]);
    const [copiedStyle,setCopiedStyle]=useState<NodeStyle>();
    useEffect(()=>{if(newDialog)void readPresets<SavedTemplate>('templates').then(rows=>setTemplates(rows.flatMap(row=>{try{return typeof row.id==='string'&&typeof row.name==='string'?[{...row,book:validateWorkbook(row.book)}]:[];}catch{return [];}}))).catch(()=>{});},[newDialog]);
    const [library, setLibrary] = useState(false);
    const [recents, setRecents] = useState<Recent[]>(initial.recents);
    const [help, setHelp] = useState(false);
    const [updateDialog,setUpdateDialog]=useState(false);
    const [updateStatus,setUpdateStatus]=useState<UpdateStatus>({phase:'idle',currentVersion:appVersion,message:tTemplate("目前版本 {0}。",[appVersion])});
    async function openUpdateDialog(){const api=window.openmind;if(!api)return;setUpdateDialog(true);try{setUpdateStatus(await api.checkForUpdates());}catch{setUpdateStatus({phase:'error',currentVersion:appVersion,message:t('無法連線至更新服務，請稍後再試。')});}}
    useEffect(()=>{const api=window.openmind;if(!api)return;let active=true;const offState=api.onUpdateState(state=>{if(active)setUpdateStatus(state);});const offOpen=api.onOpenUpdates(()=>{if(active)void openUpdateDialog();});void api.getUpdateState().then(state=>{if(active)setUpdateStatus(state);}).catch(()=>{});return()=>{active=false;offState();offOpen();};},[]);
    useModalFocus(presentation?t('簡報模式'):print?t('列印工作室'):updateDialog?t('軟體更新'):help?t('操作指南'):newDialog?t('建立心智圖'):editing?t('編輯主題'):null);
    useEffect(()=>{if(!editing&&!newDialog&&!help&&!updateDialog)return;const close=(event:KeyboardEvent)=>{if(event.key!=='Escape'||event.isComposing)return;event.preventDefault();event.stopImmediatePropagation();if(editing)setEditing(null);else if(newDialog)setNewDialog(false);else if(help)setHelp(false);else setUpdateDialog(false);};window.addEventListener('keydown',close,true);return()=>window.removeEventListener('keydown',close,true);},[editing,newDialog,help,updateDialog]);
    const [editorFocus, setEditorFocus] = useState(false);
    const [branchPreview, setBranchPreview] = useState<string | null>(null);
    const [viewExpanded, setViewExpanded] = useState<ReadonlySet<string>>(() => new Set());
    const previousFocus = useRef(sheet.rootId);
    function enterFocus(id = focus) {previousFocus.current = focus; setFocus(id); setViewExpanded(new Set(descendants(sheet, id))); setEditorFocus(true); setBranchPreview(null);}
    function leaveFocus() {setFocus(previousFocus.current); setViewExpanded(new Set()); setEditorFocus(false);}
    useEffect(() => {setEditorFocus(false); setViewExpanded(new Set()); setBranchPreview(null);}, [book.id, sheet.id]);
    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (print || presentation || event.target instanceof Element && event.target.closest('input,textarea,select')) return;
            if (event.key === 'Escape') {if (branchPreview) setBranchPreview(null); else if (editorFocus) leaveFocus();}
            if (event.key === 'F9') {event.preventDefault(); editorFocus ? leaveFocus() : enterFocus();}
        };
        window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
    }, [print, presentation, branchPreview, editorFocus, focus]);
    const clipboard = useRef<Clip | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const imageInput = useRef<HTMLInputElement>(null);
    const scene = useRef<Scene | null>(null);
    const editRef = useRef<HTMLTextAreaElement>(null);
    const latestBook = useRef(book);
    latestBook.current = book;
    const notify = (text: string) => setToast(t(text));
    const primary = sheet.nodes[selected[0]] ?? sheet.nodes[sheet.rootId];
    const selection = selected.filter(id => !!sheet.nodes[id]);
    function remember(b:Workbook) {if(writer!=='active')return;void archiveLocal(b).then(setRecents).catch(()=>notify(t('最近文件備份失敗；請確認已下載原生檔案。')));}
    useEffect(()=>{if(writer!=='active'){setStatus(writer==='waiting'?t('另一個視窗正在編輯'):t('唯讀保護已啟用'));return;}setStatus(t('正在儲存…'));const timer=setTimeout(()=>{void persistLocal(book).then(result=>{if(latestBook.current!==book)return;setRecents(result.recents);setStatus(t('已儲存於此裝置'));if(result.warning)notify(result.warning);}).catch(error=>{if(latestBook.current!==book)return;setStatus(t('儲存失敗，請下載檔案'));notify(tTemplate("本機儲存失敗：{0}。請立即儲存 .openmind 檔案。",[(error as Error).message]));});},300);return()=>clearTimeout(timer);},[book,writer]);
    useEffect(()=>{if(writer!=='active')return;const flush=()=>{void persistLocal(latestBook.current).catch(()=>{});};window.addEventListener('pagehide',flush);return()=>window.removeEventListener('pagehide',flush);},[writer]);
    useEffect(() => { if (!toast)
        return; const t = setTimeout(() => setToast(''), 9000); return () => clearTimeout(t); }, [toast]);
    useEffect(() => { setSelected(s => { const valid = s.filter(id => !!sheet.nodes[id]); return valid.length ? valid : [sheet.rootId]; }); if (!sheet.nodes[focus])
        setFocus(sheet.rootId); }, [sheet, focus]);
    useEffect(() => { if (editing) {
        editRef.current?.focus();
        editRef.current?.select();
    } }, [editing]);
    const edit = (fn: (b: Workbook, s: Sheet) => void): boolean => { if (readOnly)
        return false; try {
        const next = commit(historyRef.current, b => fn(b, activeSheet(b)));
        nativeJSON(next.present);
        setHistory(next);return true;
    }
    catch (e) {
        notify((e as Error).message);return false;
    } };
    const patch = (fn: (n: Topic) => void) => edit((_b, s) => selection.forEach(id => fn(s.nodes[id])));
    const style = (next: Partial<NodeStyle>) => patch(n => n.style = { ...n.style, ...next });
    function toggleCollapse(id: string) {
        const folded = sheet.nodes[id].collapsed && !viewExpanded.has(id);
        setViewExpanded(current => {const next = new Set(current); next.delete(id); return next;});
        edit((_b, s) => {s.nodes[id].collapsed = !folded;});
    }
    function adopt(b: Workbook) { try {
        remember(book);
    }
    catch {
        notify(t('舊文件無法寫入最近清單；請確認已下載檔案。'));
    } setHistory(historyOf(b)); setSelected([activeSheet(b).rootId]); setFocus(activeSheet(b).rootId); setReveal(''); setSearch(''); setLibrary(false); }
    function add(sibling = false) { let id = ''; const ok = edit((_b, s) => { const p = sibling ? parentId(s, primary.id) ?? s.rootId : primary.id; id = addTopic(s, p, t('新主題'), sibling ? s.nodes[p].children.indexOf(primary.id) + 1 : undefined); }); if (ok && id) {
        setSelected([id]);
        setEditing(id);
        setEditText(t('新主題'));
    } }
    function beginEdit(id: string) { if (readOnly)
        return; setEditing(id); setEditText(sheet.nodes[id].text); }
    function finishEdit() { if (editing && sheet.nodes[editing] && sheet.nodes[editing].text !== editText)
        edit((_b, s) => { s.nodes[editing].text = editText; }); setEditing(null); }
    function move(id: string, target: string, before = false) { edit((_b, s) => { const p = before ? parentId(s, target) : target; if (!p || !moveTopic(s, id, p, before ? s.nodes[p].children.indexOf(target) : undefined))
        notify(t('無法移動：中心主題不可移動，分支也不能移入自己的子樹。')); }); }
    function addFloating(){let id='';const ok=edit((_b,s)=>{const bounds=layout(s).bounds,n=topic(t('自由主題'));n.position={x:bounds.x+bounds.width+74,y:bounds.y+28};s.nodes[n.id]=n;s.floating.push(n.id);id=n.id;});if(ok){setView('map');setFocus(sheet.rootId);setSelected([id]);setReveal(id);setRevealVersion(v=>v+1);}}
    function reorder(direction: number) { const p = parentId(sheet, primary.id); if (!p)
        return; const ids = sheet.nodes[p].children; const i = ids.indexOf(primary.id), j = i + direction; if (j < 0 || j >= ids.length)
        return; edit((_b, s) => { const children = s.nodes[p].children; [children[i], children[j]] = [children[j], children[i]]; }); }
    function copy(cut = false) { const ids = selection.filter(id => !selection.some(other => other !== id && descendants(sheet, other).includes(id))); if(cut&&ids.includes(sheet.rootId)){notify(t('中央主題無法剪下；可複製整張心智圖。'));return;} clipboard.current = { sheet: clone(sheet), ids }; if (cut)
        edit((_b, s) => removeTopics(s, ids)); notify(cut ? t('已剪下分支；可在 OpenMind 內貼上。') : t('已複製分支；可在 OpenMind 內貼上。')); }
    function paste() { const clip = clipboard.current; if (!clip) {
        navigator.clipboard?.readText().then(t => { if (t.trim())
            edit((_b, s) => { t.split('\n').filter(Boolean).forEach(line => addTopic(s, primary.id, line)); }); }).catch(() => notify(t('請先在 OpenMind 複製分支，或將文字貼入節點編輯框。')));
        return;
    } let pasted: string[] = []; const ok = edit((_b, s) => { pasted = pasteBranches(clip.sheet, clip.ids, s, primary.id); }); if (ok && pasted.length)
        setSelected(pasted); }
    async function save(saveAs = false) { try {
        if (editing) finishEdit();
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        const current = latestBook.current;
        const text = nativeJSON(current);
        if (window.openmind) {
            const r = await window.openmind.save({ name: current.title, text, saveAs });
            if (r)
                notify(tTemplate("檔案已儲存：{0}",[r.name]));
        }
        else {
            download(`${current.title}.openmind`, text, 'application/json');
            notify(t('已下載原生檔案；包含全部工作表與樣式。'));
        }
    }
    catch (e) {
        notify(tTemplate("儲存失敗：{0}",[(e as Error).message]));
    } }
    async function receive(name: string, text: string) { try {
        const r = importFile(name, text);
        adopt(r.book);
        notify(r.warning ?? tTemplate("已開啟 {0}",[name]));
    }
    catch (e) {
        notify((e as Error).message);
    } }
    async function open() { try {
        if (window.openmind) {
            const r = await window.openmind.open();
            if (r)
                await receive(r.name, r.text);
        }
        else
            fileInput.current?.click();
    }
    catch (e) {
        notify(tTemplate("開啟失敗：{0}",[(e as Error).message]));
    } }
    async function exportFile(kind: 'svg' | 'png' | 'md' | 'opml' | 'mm') { setExportMenu(false); try {
        const scope = focus === sheet.rootId ? sheet : branchSheet(sheet, focus);
        const sc = layout(scope,scope.rootId,viewExpanded);
        if (kind === 'md' || kind === 'opml' || kind === 'mm') {
            if (!window.confirm(tTemplate("{0}\n\n仍要匯出？",[kind==='mm'?FREEMIND_WARNING:LOSS_WARNING])))
                return;
            download(`${book.title}.${kind}`, kind === 'md' ? markdown(sc.sheet) : kind==='mm'?freemind(sc.sheet):opml(sc.sheet), kind === 'md' ? 'text/markdown;charset=utf-8' : 'application/xml');
        }
        else {
            const svg = await standaloneSVG(sc, { background: true });
            if (kind === 'svg')
                download(`${book.title}.svg`, svg, 'image/svg+xml');
            else
                download(`${book.title}.png`, await pngFromSVG(svg), 'image/png');
        }
        notify(tTemplate("已匯出 {0}。",[kind.toUpperCase()]));
    }
    catch (e) {
        notify(tTemplate("匯出失敗：{0}",[(e as Error).message]));
    } }
    function locate(id: string) {if(!sheet.nodes[id])return;const ancestors:string[]=[];let parent=parentId(sheet,id);while(parent){ancestors.push(parent);parent=parentId(sheet,parent);}setViewExpanded(current=>new Set([...current,...ancestors]));setFocus(sheet.rootId);selectTopics([id]);setReveal(id);setRevealVersion(value=>value+1);}
    const results = useMemo(() => {const query=search.trim().toLocaleLowerCase();return query?Object.values(sheet.nodes).filter(n=>{const content=searchFilter==='notes'?n.notes:searchFilter==='labels'?n.labels.join(' '):searchFilter==='tasks'?(n.task?n.text:''):`${n.text}\n${n.notes}\n${n.labels.join(' ')}\n${n.equation}\n${n.attachments.map(a=>a.name).join(' ')}`;return content.toLocaleLowerCase().includes(query);}):[];},[sheet,search,searchFilter]);
    useEffect(() => { const handler = (e: KeyboardEvent) => { const field = e.target instanceof HTMLElement && !!e.target.closest('input,textarea,select,[contenteditable="true"]'); const mod = e.metaKey || e.ctrlKey; if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void save(e.shiftKey);
        return;
    } if (field || print || presentation || newDialog || help || library || !mod && e.target instanceof HTMLElement && !!e.target.closest('button,a'))
        return; if (mod && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('.search-box input')?.focus();
        return;
    } if (mod && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setPrint(true);
        return;
    } if (readOnly)
        return; if (mod) {
        if (e.key.toLowerCase() === 'z') {
            e.preventDefault();
            setHistory(e.shiftKey ? redo(history) : undo(history));
        }
        else if (e.key.toLowerCase() === 'y') {
            e.preventDefault();
            setHistory(redo(history));
        }
        else if (e.key.toLowerCase() === 'c') {
            e.preventDefault();
            copy();
        }
        else if (e.key.toLowerCase() === 'x') {
            e.preventDefault();
            copy(true);
        }
        else if (e.key.toLowerCase() === 'v') {
            e.preventDefault();
            paste();
        }
        else if (e.key.toLowerCase() === 'a') {
            e.preventDefault();
            setSelected(Object.keys(sheet.nodes));
        }
        return;
    } if (e.key === 'Tab') {
        e.preventDefault();
        add();
    }
    else if (e.key === 'Enter') {
        e.preventDefault();
        add(true);
    }
    else if (e.key === 'F2') {
        e.preventDefault();
        beginEdit(primary.id);
    }
    else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        edit((_b, s) => removeTopics(s, selection));
    }
    else if (e.key === 'ArrowLeft') {
        const p = parentId(sheet, primary.id);
        if (p) {
            e.preventDefault();
            setSelected([p]);
        }
    }
    else if (e.key === 'ArrowRight') {
        const child = primary.children[0];
        if (child) {
            e.preventDefault();
            if (primary.collapsed)
                patch(n => n.collapsed = false);
            setSelected([child]);
        }
    }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const p = parentId(sheet, primary.id);
        if (p) {
            const ids = sheet.nodes[p].children;
            setSelected([ids[Math.max(0, Math.min(ids.length - 1, ids.indexOf(primary.id) + (e.key === 'ArrowUp' ? -1 : 1)))]]);
        }
    } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); });
    function create(template: 'blank' | 'project' | 'study') { const b = template === 'blank' ? newWorkbook() : demoWorkbook(); if (template === 'project') {
        b.title = t('專案規劃');
        activeSheet(b).nodes[activeSheet(b).rootId].text = t('我的新專案');
    } if (template === 'study') {
        b.title = t('學習筆記');
        activeSheet(b).nodes[activeSheet(b).rootId].text = t('我想學會的事');
    } adopt(b); setNewDialog(false); }
    const outline = (id: string, depth = 0): React.ReactNode => { const n = sheet.nodes[id]; const folded = n.collapsed && !viewExpanded.has(id); return <div key={id}><div className={'outline-row' + (selection.includes(id) ? ' selected' : '')} style={{ paddingLeft: 18 + depth * 23 }} onClick={e => selectTopics(e.shiftKey ? [...new Set([...selection, id])] : [id])}><button aria-label={tTemplate("{0} {1}",[folded ? t('展開') : t('收合'),n.text])} disabled={!n.children.length || readOnly} onClick={e => { e.stopPropagation(); toggleCollapse(id); }}>{n.children.length ? folded ? <ChevronRight size={15}/> : <ChevronDown size={15}/> : <span className="leaf-dot"/>}</button><TextField label={tTemplate("大綱：{0}",[n.text])} value={n.text} disabled={readOnly} onCommit={t => edit((_b, s) => { s.nodes[id].text = t; })}/>{n.task && <small>{n.task.status === 'done' ? t('完成') : t('待辦')}</small>}<button aria-label={tTemplate("新增 {0} 的子主題",[n.text])} disabled={readOnly} onClick={e => { e.stopPropagation(); let child = ''; edit((_b, s) => { child = addTopic(s, id); }); setSelected([child]); }}><Plus size={15}/></button></div>{!folded && n.children.map(c => outline(c, depth + 1))}</div>; };
    return <div className={'app' + (dark ? ' dark' : '') + (editorFocus ? ' editor-focus' : '')} onClickCapture={e => { const a = e.target instanceof Element ? e.target.closest('a.node-link') : null; const href = a?.getAttribute('href'); if (window.openmind && href && /^(https?:|mailto:)/i.test(href)) {
        e.preventDefault();
        void window.openmind.openLink(href).catch(error => notify(tTemplate("無法開啟連結：{0}",[error.message])));
    } }}>
  <header className="app-header"><a className="brand" href="#" aria-label={t("OpenMind 首頁")} onClick={e => { e.preventDefault(); setLibrary(true); }}><span className="brand-symbol"><GitBranch size={23}/></span><span>{t("Open")}<span className="brand-light">{t("Mind")}</span></span></a><span className="header-divider"/><div className="document-title"><TextField label={t("文件名稱")} value={book.title} onCommit={title => edit(b => { b.title = title.trim() || t('未命名心智圖'); })} disabled={readOnly}/><span><span className={'save-dot' + (status.includes('失敗') ? ' error' : '')}/>{status}</span></div><div className="header-right"><span className="private-badge"><LockKeyhole size={12}/>{t("僅儲存於本機")}</span><button aria-label={t("開啟檔案")} title={t("開啟檔案")} onClick={open}><FolderOpen size={18}/></button><button aria-label={t("儲存檔案")} title={t("儲存檔案 ⌘S")} onClick={() => save()}><Save size={18}/></button>{window.openmind&&<button aria-label={t("檢查更新")} title={t("檢查更新")} onClick={()=>void openUpdateDialog()}><Download size={17}/><span className="update-label">{t("更新")}</span></button>}<button className="primary print-open" onClick={() => setPrint(true)}><Printer size={16}/>{t("列印與 PDF")}</button><button aria-label={t("切換深色模式")} onClick={() => setDark(!dark)}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button></div></header>
  <aside className="sidebar"><button className="new-map" onClick={() => setNewDialog(true)}><Plus size={17}/>{t("新增心智圖")}</button><div className="sidebar-label">{t("工作空間")}</div><button className={'nav-item' + (!library ? ' active' : '')} onClick={() => setLibrary(false)}><Map size={17}/>{t("目前心智圖")}<span className="count-badge">{book.sheets.length}</span></button><button className="nav-item" onClick={() => setLibrary(true)}><Files size={17}/>{t("最近文件")}</button><div className="sidebar-separator"/><div className="sidebar-label">{t("工作表")}<button aria-label={t("新增工作表")} disabled={readOnly} onClick={() => { const next = newSheet(tTemplate("工作表 {0}",[book.sheets.length + 1])); if(edit(b => { b.sheets.push(next); b.activeSheetId = next.id; })){setSelected([next.rootId]); setFocus(next.rootId);} }}><Plus size={15}/></button></div><div className="sheet-list">{book.sheets.map((s, i) => <button key={s.id} className={'sheet-item' + (sheet.id === s.id ? ' active' : '')} onClick={() => { setHistory({ ...history, present: { ...book, activeSheetId: s.id } }); setSelected([s.rootId]); setFocus(s.rootId); }}><span className="sheet-icon"><GitBranch size={15}/></span><span>{s.name}</span><small>{String(i + 1).padStart(2, '0')}</small></button>)}</div><div className="sidebar-bottom"><div className="paper-tip"><span className="tip-icon"><Printer size={20}/></span><strong>{t("讓想法躍然紙上")}</strong><p>{t("選擇可讀分頁，讓大型心智圖的每個字都清晰。")}</p><button onClick={() => setPrint(true)}>{t("探索列印工作室 ")}<ChevronRight size={14}/></button></div><button className="nav-item" onClick={() => setHelp(true)}><BookOpen size={16}/>{t("操作指南")}<span>⌘ ?</span></button><div className="open-source"><span className="live-dot"/>{t("自由開源 · 離線可用 ")}<small>{t("v")}{appVersion}</small></div></div></aside>
  <main className="editor-main"><div className="editor-toolbar"><div className="view-switch"><button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}><GitBranch size={15}/>{t("心智圖")}</button><button className={view === 'outline' ? 'active' : ''} onClick={() => setView('outline')}><ListTree size={15}/>{t("大綱")}</button><button className={view==='tasks'?'active':''} onClick={()=>setView('tasks')}>{t("任務")}</button></div><button onClick={()=>setPresentation(true)}>{t("簡報")}</button><span className="toolbar-line"/><button aria-label={t("復原")} title={t("復原 ⌘Z")} disabled={!history.past.length || readOnly} onClick={() => setHistory(undo(history))}><Undo2 size={17}/></button><button aria-label={t("重做")} title={t("重做 ⇧⌘Z")} disabled={!history.future.length || readOnly} onClick={() => setHistory(redo(history))}><Redo2 size={17}/></button><span className="toolbar-line"/><button disabled={readOnly} onClick={() => add()}><Plus size={16}/>{t("子主題")}</button><button title={t("新增同層 Enter")} aria-label={t("新增同層主題")} disabled={readOnly} onClick={() => add(true)}><GitBranch size={16}/></button><button title={t("複製分支")} aria-label={t("複製分支")} onClick={() => copy()}><Copy size={16}/></button><button title={t("聚焦選取分支")} aria-label={t("聚焦分支")} onClick={() => { setFocus(primary.id); setSearch(''); }}><Focus size={16}/></button><button aria-label={t("預覽選取分支")} title={t("預覽選取分支")} onClick={() => setBranchPreview(primary.id)}><Eye size={16}/></button><button className="focus-toolbar-button" aria-label={editorFocus ? t("離開編輯專注模式") : t("展開編輯專注模式")} aria-pressed={editorFocus} onClick={() => editorFocus ? leaveFocus() : enterFocus()}>{editorFocus ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}<span>{editorFocus ? t("返回工作區") : t("專注")}</span></button><div className="toolbar-spacer"/><div className="export-wrap"><button aria-expanded={exportMenu} onClick={() => setExportMenu(!exportMenu)}><Download size={16}/>{t("匯出")}<ChevronDown size={12}/></button>{exportMenu && <div className="dropdown">{(['svg', 'png', 'md', 'opml','mm'] as const).map(k => <button key={k} onClick={() => exportFile(k)}>{k.toUpperCase()}<small>{['md', 'opml','mm'].includes(k) ? t('文字與階層') : t('目前完整／聚焦畫布')}</small></button>)}<button onClick={() => { setExportMenu(false); void save(true); }}>{t("另存原生檔案")}</button></div>}</div><button aria-label={t("切換屬性面板")} onClick={() => setInspector(!inspector)}><PanelRightClose size={17}/></button></div>
   <div className="canvas-area">{branchPreview && <BranchPreview sheet={sheet} topicId={branchPreview} onClose={() => setBranchPreview(null)} onExpand={() => enterFocus(branchPreview)}/>}{library ? <div className="library"><div className="eyebrow">{t("YOUR LOCAL WORKSPACE")}</div><h1>{t("留住每一次靈感。")}</h1><p>{t("文件保存在這個裝置的本機空間。下載原生檔案，可自行備份與分享。")}</p><div className="library-grid"><button className="library-new" onClick={() => setNewDialog(true)}><FilePlus2 size={28}/><strong>{t("開始新的想法")}</strong></button>{recents.map(r => <button className="document-card" key={r.book.id} onClick={() => adopt(r.book)}><GitBranch size={32}/><strong>{r.book.title}</strong><span>{r.book.sheets.length} {t(" 個工作表")}</span><small>{new Date(r.date).toLocaleString(locale === 'en' ? 'en-US' : 'zh-TW')}</small></button>)}</div></div> : <>{focus !== sheet.rootId && <button className="focus-banner" onClick={() => setFocus(sheet.rootId)}><ArrowLeft size={14}/>{t("返回完整心智圖 ")}<span>／ {sheet.nodes[focus]?.text}</span></button>}{view === 'map' ? <Canvas sheet={sheet} focus={focus} expanded={viewExpanded} selected={selection} onSelect={selectTopics} onEdit={beginEdit} onMove={move} onFloatMove={(id, x, y) => edit((_b, s) => { s.nodes[id].position = { x, y }; })} readOnly={readOnly} reveal={reveal} revealVersion={revealVersion} sceneRef={s => { scene.current = s; }}/> : view==='tasks'? <TaskBoard sheet={sheet} title={book.title} readOnly={readOnly} edit={fn=>edit((b,s)=>{if(b.id!==book.id||s.id!==sheet.id)throw new Error(t("操作時已切換文件，請重新選取。"));fn(s);})} locate={id=>{locate(id);setView('map');}} notify={notify}/> : <div className="outliner"><div className="outline-heading"><span className="eyebrow">{t("OUTLINER")}</span><h1>{book.title}</h1><p>{t("用文字整理脈絡，與心智圖同步編輯。")}</p></div>{outline(focus)}{focus === sheet.rootId && sheet.floating.map(id => outline(id))}</div>}</>}
    <div className={'search-box'+(view==='tasks'?' task-search-hidden':'')}><Search size={15}/><input aria-label={t("搜尋心智圖")} value={search} placeholder={t("搜尋想法、標籤或筆記")} onFocus={()=>setSearchOpen(true)} onChange={e => {setSearch(e.target.value);setSearchOpen(true);}}/>{search ? <button aria-label={t("清除搜尋")} onClick={() => setSearch('')}><X size={13}/></button> : <kbd>{t("⌘ F")}</kbd>}{search&&searchOpen && <div className="search-results"><div className="search-controls"><select aria-label={t("搜尋範圍")} value={searchFilter} onChange={e=>setSearchFilter(e.target.value)}><option value="all">{t("所有內容")}</option><option value="notes">{t("備註")}</option><option value="labels">{t("標籤")}</option><option value="tasks">{t("任務")}</option></select><small>{results.length} {t(" 個結果")}</small></div>{results.length ? results.slice(0,searchLimit).map(n => <button key={n.id} onClick={() => { locate(n.id); setSearchOpen(false); }}>{n.text}<small>{n.labels.join(' · ')}</small></button>) : <p>{t("沒有符合的節點")}</p>}{results.length>searchLimit&&<button onClick={()=>setSearchLimit(limit=>limit+100)}>{t("顯示更多結果（")}{Math.min(searchLimit,results.length)} / {results.length}）</button>}</div>}</div>
   </div><footer className="editor-status"><span><GitBranch size={12}/>{Object.keys(sheet.nodes).length} {t(" 個節點")}<span className="status-separator">·</span>{selection.length} {t(" 個已選取")}</span><span>{readOnly ? t('唯讀模式') : t(structureNames[sheet.structure])}<span className="status-separator">·</span>{t("本機自動復原已啟用")}</span></footer></main>
  {inspector && <aside className="inspector"><div className="inspector-heading"><span>{t("格式與內容")}</span><button aria-label={t("更多操作")} onClick={() => setHelp(true)}><MoreHorizontal size={18}/></button></div><div className="inspector-scroll" key={primary.id}><div className="inspector-tabs"><span className="active">{t("主題")}</span><span>{selection.length > 1 ? tTemplate("{0} 個節點",[selection.length]) : t('選取的節點')}</span></div><div className="section-label">{t("內容")}</div><label className="wide-label">{t("主題文字")}<TextField label={t("節點文字")} value={primary.text} disabled={readOnly} multiline onCommit={text => patch(n => n.text = text)}/></label><div className="form-grid"><label>{t("結構")}<select aria-label={t("圖表結構")} value={sheet.structure} disabled={readOnly} onChange={e => edit((_b, s) => { s.structure = e.target.value as Structure; })}>{Object.entries(structureNames).map(([v, n]) => <option key={v} value={v}>{t(n)}</option>)}</select></label><label>{t("形狀")}<select aria-label={t("節點形狀")} value={primary.style.shape} disabled={readOnly} onChange={e => style({ shape: e.target.value as NodeStyle['shape'] })}><option value="round">{t("圓角矩形")}</option><option value="rect">{t("矩形")}</option><option value="pill">{t("膠囊")}</option></select></label></div><div className="section-label">{t("文字與外觀")}</div><div className="type-controls"><select aria-label={t("文字大小")} value={primary.style.fontSize} disabled={readOnly} onChange={e => style({ fontSize: +e.target.value })}>{[10, 12, 14, 16, 18, 20, 23, 26, 32, 40, 48, 64].map(n => <option key={n} value={n}>{n} {t(" px")}</option>)}</select><button aria-label={t("粗體")} aria-pressed={primary.style.bold} className={primary.style.bold ? 'active' : ''} disabled={readOnly} onClick={() => style({ bold: !primary.style.bold })}><b>{t("B")}</b></button><button aria-label={t("斜體")} aria-pressed={primary.style.italic} className={primary.style.italic ? 'active' : ''} disabled={readOnly} onClick={() => style({ italic: !primary.style.italic })}><i>{t("I")}</i></button><input aria-label={t("文字顏色")} type="color" value={primary.style.color} disabled={readOnly} onChange={e => style({ color: e.target.value })}/></div><div className="swatch-label">{t("填滿顏色")}</div><div className="swatches">{['#ffffff', '#edf3ff', '#eaf7f4', '#fff6e6', '#f4effb', '#fceef1'].map(c => <button key={c} aria-label={tTemplate("填滿 {0}",[c])} className={primary.style.fill === c ? 'chosen' : ''} style={{ background: c }} disabled={readOnly} onClick={() => style({ fill: c })}>{primary.style.fill === c && <Check size={13}/>}</button>)}<input aria-label={t("自訂填滿顏色")} type="color" value={primary.style.fill} disabled={readOnly} onChange={e => style({ fill: e.target.value })}/></div><label className="inline-label">{t("外框顏色")}<input aria-label={t("外框顏色")} type="color" value={primary.style.stroke} disabled={readOnly} onChange={e => style({ stroke: e.target.value })}/></label><div className="section-label">{t("註記與標籤")}</div><label className="wide-label">{t("備註")}<TextField label={t("節點備註")} value={primary.notes} disabled={readOnly} multiline placeholder={t("記下想法背後的細節…")} onCommit={notes => patch(n => n.notes = notes)}/></label><label className="wide-label">{t("標籤（逗號分隔）")}<TextField label={t("標籤")} value={primary.labels.join(', ')} disabled={readOnly} placeholder={t("靈感, 待討論")} onCommit={v => patch(n => n.labels = v.split(/[,，]/).map(l => l.trim()).filter(Boolean))}/></label><label className="wide-label">{t("連結")}<TextField label={t("節點連結")} value={primary.link} disabled={readOnly} placeholder={t("https://… 或 openmind:節點ID")} onCommit={link => { if (link && !/^(https?:\/\/|mailto:|openmind:)/i.test(link)) {
        notify(t('僅支援 http、https、mailto 或 openmind 連結。'));
        return;
    } patch(n => n.link = link); }}/></label>{primary.link && <a className="node-link" href={primary.link.startsWith('openmind:') ? '#' : primary.link} target={primary.link.startsWith('openmind:') ? undefined : '_blank'} rel="noreferrer" onClick={e => { if (primary.link.startsWith('openmind:')) {
        e.preventDefault();
        const id = primary.link.slice(9);
        if (sheet.nodes[id])
            locate(id);
        else
            notify(t('此節點連結的目標不存在。'));
    } }}><Link2 size={13}/>{t("開啟連結")}</a>}<label className="wide-label">{t("標記")}<select aria-label={t("節點標記")} disabled={readOnly} value={primary.marker} onChange={e => patch(n => n.marker = e.target.value)}>{['', '★', '✓', '!', '?', '⚑', '①', '②', '③'].map(m => <option key={m} value={m}>{m || t('無標記')}</option>)}</select></label><div className="section-label">{t("任務")}</div><label className="wide-label">{t("狀態")}<select aria-label={t("任務狀態")} value={primary.task?.status ?? 'none'} disabled={readOnly} onChange={e => edit((_b,s) => selection.forEach(id=>{const n=s.nodes[id]; if (e.target.value === 'none')
        removeTask(s,n.id);
    else
        n.task = { status: e.target.value as 'todo' | 'doing' | 'done', start: n.task?.start ?? '', due: n.task?.due ?? '',dependencies:n.task?.dependencies??[] }; }))}><option value="none">{t("不設為任務")}</option><option value="todo">{t("待辦")}</option><option value="doing">{t("進行中")}</option><option value="done">{t("已完成")}</option></select></label>{primary.task && <div className="form-grid"><label>{t("開始日期")}<input aria-label={t("開始日期")} type="date" value={primary.task.start} disabled={readOnly} max={primary.task.due || undefined} onChange={e => patch(n => { if (n.task)
        n.task.start = e.target.value; })}/></label><label>{t("截止日期")}<input aria-label={t("截止日期")} type="date" value={primary.task.due} disabled={readOnly} min={primary.task.start || undefined} onChange={e => patch(n => { if (n.task)
        n.task.due = e.target.value; })}/></label></div>}<div className="section-label">{t("分支操作")}</div><div className="branch-actions"><button disabled={readOnly} onClick={() => patch(n => n.collapsed = !n.collapsed)}><Layers size={14}/>{primary.collapsed ? t('展開分支') : t('收合分支')}</button><button disabled={readOnly} onClick={() => reorder(-1)}><ArrowUp size={14}/>{t("上移")}</button><button disabled={readOnly} onClick={() => reorder(1)}><ArrowDown size={14}/>{t("下移")}</button><button disabled={readOnly} onClick={addFloating}><Plus size={14}/>{t("自由主題")}</button><button disabled={readOnly} onClick={() => edit((_b, s) => { s.boundaries.push({ id: uid(), topicId: primary.id, text: t('重點分支') }); })}><Square size={14}/>{t("分支外框")}</button><button disabled={readOnly || selection.length !== 2} title={t("選取兩個節點建立關係線")} onClick={() => edit((_b, s) => { s.relationships.push({ id: uid(), from: selection[0], to: selection[1], text: t('相關'), directed: true, dashed: true }); })}><Network size={14}/>{t("關係線")}</button><button disabled={readOnly} onClick={() => imageInput.current?.click()}><ImagePlus size={14}/>{t("插入圖片")}</button>{primary.image && <button disabled={readOnly} onClick={() => patch(n => delete n.image)}><X size={14}/>{t("移除圖片")}</button>}<button className="danger" disabled={readOnly || primary.id === sheet.rootId} onClick={() => edit((_b, s) => removeTopics(s, selection))}><Trash2 size={14}/>{t("刪除節點")}</button></div>{(sheet.relationships.length > 0 || sheet.boundaries.length > 0) && <div className="annotation-list">{sheet.relationships.map(r => <div key={r.id}><TextField label={t("關係線文字")} value={r.text} disabled={readOnly} onCommit={text => edit((_b, s) => { s.relationships.find(a => a.id === r.id)!.text = text; })}/><button aria-label={t("刪除關係線")} disabled={readOnly} onClick={() => edit((_b, s) => { s.relationships = s.relationships.filter(a => a.id !== r.id); })}><X size={12}/></button></div>)}{sheet.boundaries.map(b => <div key={b.id}><TextField label={t("外框文字")} value={b.text} disabled={readOnly} onCommit={text => edit((_b, s) => { s.boundaries.find(a => a.id === b.id)!.text = text; })}/><button aria-label={t("刪除外框")} disabled={readOnly} onClick={() => edit((_b, s) => { s.boundaries = s.boundaries.filter(a => a.id !== b.id); })}><X size={12}/></button></div>)}</div>}<div className="section-label">{t("工作表與主題")}</div><label className="wide-label">{t("工作表名稱")}<TextField label={t("工作表名稱")} value={sheet.name} disabled={readOnly} onCommit={name => edit((_b, s) => { s.name = name || t('心智圖'); })}/></label><div className="branch-actions"><button disabled={readOnly} onClick={() => { const s = clone(sheet); s.id = uid(); s.name += t(' 副本'); edit(b => { b.sheets.push(s); }); }}><Copy size={14}/>{t("複製工作表")}</button><button disabled={readOnly || book.sheets.length < 2} className="danger" onClick={() => { const next = book.sheets.find(s => s.id !== sheet.id)!; edit(b => { b.sheets = b.sheets.filter(s => s.id !== sheet.id); b.activeSheetId = next.id; }); setFocus(next.rootId); setSelected([next.rootId]); }}><Trash2 size={14}/>{t("刪除工作表")}</button></div><label className="inline-label">{t("畫布背景")}<input type="color" aria-label={t("畫布背景")} value={sheet.background} disabled={readOnly} onChange={e => edit((_b, s) => { s.background = e.target.value; })}/></label><button className="full-button" disabled={readOnly} onClick={() => edit((_b, s) => { s.nodes[s.rootId].children.forEach((id, i) => { const c = palette[i % palette.length]; s.nodes[id].style = { ...defaultStyle, stroke: c, color: c, bold: true }; }); })}>{t("套用清晰分支色票")}</button><AdvancedInspector book={book} sheet={sheet} primary={primary} selection={selection} readOnly={readOnly} edit={fn=>edit((b,s)=>{if(b.id!==book.id||s.id!==sheet.id)throw new Error(t("操作時已切換文件，請重新選取。"));fn(s);})} select={selectTopics} notify={notify} copiedStyle={copiedStyle} copyStyle={style=>{setCopiedStyle(style);notify(t("已複製節點樣式。"));}}/><label className="check-label"><input type="checkbox" checked={readOnly} onChange={e => setReadOnly(e.target.checked)}/>{t("唯讀模式")}</label></div></aside>}
  <input type="file" accept=".openmind,.json,.md,.opml,.mm" ref={fileInput} className="hidden" data-testid="file-input" onChange={async (e) => { const f = e.target.files?.[0]; if (f) {
        if (f.size > 20e6)
            notify(t('檔案超過 20 MB。'));
        else
            await receive(f.name, await f.text());
    } e.target.value = ''; }}/>
  <input type="file" accept="image/png,image/jpeg,image/webp" ref={imageInput} className="hidden" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>2e6){notify(t('圖片超過 2 MB，請先縮小。'));return;}const sourceBook=book.id,sourceSheet=sheet.id,targets=[...selection],reader=new FileReader();reader.onerror=()=>notify(t('圖片讀取失敗，請重新選取。'));reader.onload=()=>edit((b,s)=>{if(b.id!==sourceBook||s.id!==sourceSheet)throw new Error(t('加入圖片時已切換文件，請重新選取圖片。'));for(const id of targets){if(!s.nodes[id])throw new Error(t('圖片目標已刪除。'));s.nodes[id].image=String(reader.result);}});reader.readAsDataURL(file);}}/>
  {editing && <div className="modal-backdrop" onClick={() => setEditing(null)}><div className="edit-dialog" role="dialog" aria-modal="true" aria-label={t("編輯主題")} onClick={e => e.stopPropagation()}><div className="dialog-heading"><strong>{t("編輯主題")}</strong><button aria-label={t("取消編輯")} onClick={() => setEditing(null)}><X size={18}/></button></div><textarea ref={editRef} aria-label={t("編輯主題文字")} value={editText} maxLength={20000} onChange={e => setEditText(e.target.value)} onKeyDown={e => { if (e.nativeEvent.isComposing)
        return; if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        finishEdit();
    } if (e.key === 'Escape')
        setEditing(null); }}/><div className="dialog-footer"><small>{t("Shift + Enter 換行 · Enter 完成")}</small><button className="primary" onClick={finishEdit}>{t("完成編輯")}</button></div></div></div>}
  {newDialog && <div className="modal-backdrop"><div className="template-dialog" role="dialog" aria-modal="true" aria-label={t("建立心智圖")}><div className="dialog-heading"><div><span className="eyebrow">{t("A LITTLE SPACE FOR A BIG IDEA")}</span><h2>{t("今天，想展開什麼？")}</h2></div><button aria-label={t("關閉新增視窗")} onClick={() => setNewDialog(false)}><X size={20}/></button></div><div className="template-grid">{([['blank', t('空白心智圖'), t('從一個想法開始')], ['project', t('專案規劃'), t('整理目標，找到下一步')], ['study', t('學習筆記'), t('串連知識，建立自己的脈絡')]] as const).map(([key, title, desc]) => <button key={key} onClick={() => create(key)}><span className={'template-art ' + key}><GitBranch size={56}/></span><strong>{title}</strong><small>{desc}</small></button>)}</div>{!!templates.length&&<><div className="section-label">{t("我的範本")}</div><div className="saved-templates">{templates.map(template=><div key={template.id}><button onClick={()=>{const next=clone(template.book);next.id=uid();next.title=template.name;next.updatedAt=new Date().toISOString();adopt(next);setNewDialog(false);}}>{template.name}</button><button aria-label={tTemplate("刪除範本 {0}",[template.name])} onClick={async()=>{try{await deletePreset(template.id);setTemplates(rows=>rows.filter(row=>row.id!==template.id));}catch(error){notify((error as Error).message);}}}>{t("移除")}</button></div>)}</div></>}<p className="muted small">{t("目前的心智圖會保留在「最近文件」。重要文件請另存 .openmind 備份。")}</p></div></div>}
  {help && <div className="modal-backdrop"><div className="help-dialog" role="dialog" aria-modal="true" aria-label={t("操作指南")}><div className="dialog-heading"><h2>{t("讓思考保持流暢。")}</h2><button aria-label={t("關閉指南")} onClick={() => setHelp(false)}><X size={20}/></button></div><p>{t("選取節點後，使用工具列或快捷鍵編輯。按住 Shift 點選多個節點，拖曳到另一節點可改變父層，按住 Option 拖曳可插到同層前方。")}</p><div className="shortcut-grid">{[['Tab', t('新增子主題')], ['Enter', t('新增同層主題')], [t('F2 / 雙擊'), t('編輯文字')], ['⌘ Z / ⇧⌘ Z', t('復原／重做')], ['⌘ C / X / V', t('複製／剪下／貼上分支')], ['⌘ S / ⇧⌘ S', t('儲存／另存新檔')], ['⌘ P / F', t('列印／搜尋')], [t('⌘ + 滾輪'), t('以游標位置縮放')], [t('方向鍵'), t('父子與同層導航')]].map(([key, desc]) => <div key={key}><kbd>{key}</kbd><span>{desc}</span></div>)}</div><p className="muted">{t("Windows／Linux 使用 Ctrl 取代 ⌘。核心功能離線可用，無帳號、無遙測。瀏覽器自動儲存受容量與清除資料影響，請保留原生檔案。尚未支援 XMind 格式、AI 推理及多人協作。")}</p></div></div>}
  {writer==='waiting'&&<div className="writer-notice" role="status">{t("另一個 OpenMind 視窗正在編輯。本視窗目前唯讀；關閉另一個視窗後，這裡會自動載入最新資料並接手。")}</div>}
  {writer==='unavailable'&&<div className="writer-notice" role="status">{t("無法確認其他視窗的編輯權，因此本視窗以唯讀方式開啟。請使用已開啟的 OpenMind 視窗編輯，或匯出副本。")}</div>}
  {presentation && <Presentation sheet={sheet} title={book.title} readOnly={readOnly} edit={fn=>edit((b,s)=>{if(b.id!==book.id||s.id!==sheet.id)throw new Error(t("操作時已切換文件，請重新選取。"));fn(s);})} onClose={()=>setPresentation(false)} notify={notify}/>}
  {print && <PrintStudio sheet={sheet} selected={primary.id} title={book.title} onClose={() => setPrint(false)} notify={notify}/>}
  {updateDialog&&<div className="modal-backdrop" onClick={()=>setUpdateDialog(false)}><div className="update-dialog" role="dialog" aria-modal="true" aria-label={t("軟體更新")} onClick={event=>event.stopPropagation()}><div className="dialog-heading"><div><span className="eyebrow">{t("OPENMIND UPDATE")}</span><h2>{t("軟體更新")}</h2></div><button aria-label={t("關閉更新視窗")} onClick={()=>setUpdateDialog(false)}><X size={19}/></button></div><p className="update-message" role="status" aria-live="polite">{updateMessage(updateStatus)}</p>{updateStatus.phase==='downloading'&&<progress className="update-progress" max={100} value={updateStatus.progress??0}/>}<div className="dialog-footer"><small>{t("目前版本 ")}{updateStatus.currentVersion}</small>{updateStatus.phase==='downloaded'?<button className="primary" onClick={()=>void window.openmind?.installUpdate()}><Download size={15}/>{t("重新啟動並安裝")}</button>:<button onClick={()=>void openUpdateDialog()} disabled={['checking','downloading','installing'].includes(updateStatus.phase)}>{t("重新檢查")}</button>}</div></div></div>}
  {toast && <div className="toast" role="status"><span>{t(toast)}</span><button aria-label={t("關閉通知")} onClick={() => setToast('')}><X size={15}/></button></div>}
 </div>;
}
