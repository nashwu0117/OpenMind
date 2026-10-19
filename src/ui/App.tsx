import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, BookOpen, ChevronDown, ChevronRight, Copy, Download, FilePlus2, FolderOpen, Focus, GitBranch, Layers, ListTree, Map, MoreHorizontal, Moon, PanelRightClose, Plus, Printer, Redo2, Save, Search, Sun, Trash2, Undo2, X, Check, ImagePlus, Link2, Square, Network, Files, ArrowLeft, LockKeyhole, Eye, Maximize2, Minimize2 } from 'lucide-react';
import { activeSheet, addTopic, clone, defaultStyle, demoWorkbook, descendants, moveTopic, newSheet, newWorkbook, palette, parentId, pasteBranches, removeTopics, topic, uid, validateWorkbook, type NodeStyle, type Sheet, type Structure, type Topic, type Workbook } from '../core/model';
import { commit, historyOf, redo, undo } from '../core/history';
import { loadRecovery, saveRecovery } from '../core/storage';
import { branchSheet, type Scene } from '../engine/layout';
import { layout } from '../engine/layout';
import { renderSVG } from '../engine/svg';
import { download, importFile, LOSS_WARNING, markdown, nativeJSON, opml, pngFromSVG } from '../io/formats';
import { Canvas } from './Canvas';
import { PrintStudio } from './PrintStudio';
import { TextField } from './Fields';
import { BranchPreview } from './BranchPreview';
import {version as appVersion} from '../../package.json';
type Clip = {
    sheet: Sheet;
    ids: string[];
};
type Recent = {
    book: Workbook;
    date: string;
};
const RECENTS = 'openmind.library.v1';
const structureNames: Record<Structure, string> = { mindmap: '心智圖', logic: '邏輯圖', tree: '樹狀圖', org: '組織圖', timeline: '時間軸' };
function readRecents(): Recent[] { try {
    return (JSON.parse(localStorage.getItem(RECENTS) || '[]') as Recent[]).map(r => ({ ...r, book: importFile('file.openmind', JSON.stringify(r.book)).book }));
}
catch {
    return [];
} }
export function App() {
    const initial = useMemo(() => loadRecovery(localStorage), []);
    const [history, setHistory] = useState(() => historyOf(initial.book ?? demoWorkbook()));
    const book = history.present, sheet = activeSheet(book);
    const [selected, setSelected] = useState<string[]>([sheet.rootId]);
    const [focusId, setFocus] = useState(sheet.rootId);
    const focus = sheet.nodes[focusId] ? focusId : sheet.rootId;
    const [reveal, setReveal] = useState('');
    const [view, setView] = useState<'map' | 'outline'>('map');
    const [print, setPrint] = useState(false);
    const [dark, setDark] = useState(false);
    const [readOnly, setReadOnly] = useState(false);
    const [inspector, setInspector] = useState(true);
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(initial.warning ?? '');
    const [status, setStatus] = useState('準備儲存');
    const [editing, setEditing] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [exportMenu, setExportMenu] = useState(false);
    const [newDialog, setNewDialog] = useState(false);
    const [library, setLibrary] = useState(false);
    const [recents, setRecents] = useState<Recent[]>(readRecents);
    const [help, setHelp] = useState(false);
    const [editorFocus, setEditorFocus] = useState(false);
    const [branchPreview, setBranchPreview] = useState<string | null>(null);
    const [viewExpanded, setViewExpanded] = useState<ReadonlySet<string>>(() => new Set());
    const previousFocus = useRef(sheet.rootId);
    function enterFocus(id = focus) {previousFocus.current = focus; setFocus(id); setViewExpanded(new Set(descendants(sheet, id))); setEditorFocus(true); setBranchPreview(null);}
    function leaveFocus() {setFocus(previousFocus.current); setViewExpanded(new Set()); setEditorFocus(false);}
    useEffect(() => {setEditorFocus(false); setViewExpanded(new Set()); setBranchPreview(null);}, [book.id, sheet.id]);
    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (print || event.target instanceof Element && event.target.closest('input,textarea,select')) return;
            if (event.key === 'Escape') {if (branchPreview) setBranchPreview(null); else if (editorFocus) leaveFocus();}
            if (event.key === 'F9') {event.preventDefault(); editorFocus ? leaveFocus() : enterFocus();}
        };
        window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
    }, [print, branchPreview, editorFocus, focus]);
    const clipboard = useRef<Clip | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const imageInput = useRef<HTMLInputElement>(null);
    const scene = useRef<Scene | null>(null);
    const editRef = useRef<HTMLTextAreaElement>(null);
    const latestBook = useRef(book);
    latestBook.current = book;
    const notify = (text: string) => setToast(text);
    const primary = sheet.nodes[selected[0]] ?? sheet.nodes[sheet.rootId];
    const selection = selected.filter(id => !!sheet.nodes[id]);
    function remember(b: Workbook) { const list = [{ book: b, date: new Date().toISOString() }, ...readRecents().filter(r => r.book.id !== b.id)].slice(0, 8); localStorage.setItem(RECENTS, JSON.stringify(list)); setRecents(list); }
    useEffect(() => { setStatus('正在儲存…'); const timer = setTimeout(() => { try {
        saveRecovery(localStorage, book);
        remember(book);
        setStatus('已儲存於此裝置');
    }
    catch (e) {
        setStatus('儲存失敗，請下載檔案');
        notify(`本機儲存失敗：${(e as Error).message}。請立即儲存 .openmind 檔案。`);
    } }, 300); return () => clearTimeout(timer); }, [book]);
    useEffect(() => { if (!toast)
        return; const t = setTimeout(() => setToast(''), 9000); return () => clearTimeout(t); }, [toast]);
    useEffect(() => { setSelected(s => { const valid = s.filter(id => !!sheet.nodes[id]); return valid.length ? valid : [sheet.rootId]; }); if (!sheet.nodes[focus])
        setFocus(sheet.rootId); }, [sheet, focus]);
    useEffect(() => { if (editing) {
        editRef.current?.focus();
        editRef.current?.select();
    } }, [editing]);
    const edit = (fn: (b: Workbook, s: Sheet) => void) => { if (readOnly)
        return; try {
        const next = commit(history, b => fn(b, activeSheet(b)));
        validateWorkbook(next.present);
        setHistory(next);
    }
    catch (e) {
        notify((e as Error).message);
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
        notify('舊文件無法寫入最近清單；請確認已下載檔案。');
    } setHistory(historyOf(b)); setSelected([activeSheet(b).rootId]); setFocus(activeSheet(b).rootId); setReveal(''); setSearch(''); setLibrary(false); }
    function add(sibling = false) { let id = ''; edit((_b, s) => { const p = sibling ? parentId(s, primary.id) ?? s.rootId : primary.id; id = addTopic(s, p, '新主題', sibling ? s.nodes[p].children.indexOf(primary.id) + 1 : undefined); }); if (id) {
        setSelected([id]);
        setEditing(id);
        setEditText('新主題');
    } }
    function beginEdit(id: string) { if (readOnly)
        return; setEditing(id); setEditText(sheet.nodes[id].text); }
    function finishEdit() { if (editing && sheet.nodes[editing] && sheet.nodes[editing].text !== editText)
        edit((_b, s) => { s.nodes[editing].text = editText; }); setEditing(null); }
    function move(id: string, target: string, before = false) { edit((_b, s) => { const p = before ? parentId(s, target) : target; if (!p || !moveTopic(s, id, p, before ? s.nodes[p].children.indexOf(target) : undefined))
        notify('無法移動：中心主題不可移動，分支也不能移入自己的子樹。'); }); }
    function reorder(direction: number) { const p = parentId(sheet, primary.id); if (!p)
        return; const ids = sheet.nodes[p].children; const i = ids.indexOf(primary.id), j = i + direction; if (j < 0 || j >= ids.length)
        return; edit((_b, s) => { const children = s.nodes[p].children; [children[i], children[j]] = [children[j], children[i]]; }); }
    function copy(cut = false) { const ids = selection.filter(id => !selection.some(other => other !== id && descendants(sheet, other).includes(id))); clipboard.current = { sheet: clone(sheet), ids }; if (cut)
        edit((_b, s) => removeTopics(s, ids)); notify(cut ? '已剪下分支；可在 OpenMind 內貼上。' : '已複製分支；可在 OpenMind 內貼上。'); }
    function paste() { const clip = clipboard.current; if (!clip) {
        navigator.clipboard?.readText().then(t => { if (t.trim())
            edit((_b, s) => { t.split('\n').filter(Boolean).forEach(line => addTopic(s, primary.id, line)); }); }).catch(() => notify('請先在 OpenMind 複製分支，或將文字貼入節點編輯框。'));
        return;
    } let pasted: string[] = []; edit((_b, s) => { pasted = pasteBranches(clip.sheet, clip.ids, s, primary.id); }); if (pasted.length)
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
                notify(`檔案已儲存：${r.name}`);
        }
        else {
            download(`${current.title}.openmind`, text, 'application/json');
            notify('已下載原生檔案；包含全部工作表與樣式。');
        }
    }
    catch (e) {
        notify(`儲存失敗：${(e as Error).message}`);
    } }
    async function receive(name: string, text: string) { try {
        const r = importFile(name, text);
        adopt(r.book);
        notify(r.warning ?? `已開啟 ${name}`);
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
        notify(`開啟失敗：${(e as Error).message}`);
    } }
    async function exportFile(kind: 'svg' | 'png' | 'md' | 'opml') { setExportMenu(false); try {
        const sc = layout(focus === sheet.rootId ? sheet : branchSheet(sheet, focus));
        if (kind === 'md' || kind === 'opml') {
            if (!window.confirm(`${LOSS_WARNING}\n\n仍要匯出？`))
                return;
            download(`${book.title}.${kind}`, kind === 'md' ? markdown(sc.sheet) : opml(sc.sheet), kind === 'md' ? 'text/markdown;charset=utf-8' : 'application/xml');
        }
        else {
            const svg = renderSVG(sc, { background: true });
            if (kind === 'svg')
                download(`${book.title}.svg`, svg, 'image/svg+xml');
            else
                download(`${book.title}.png`, await pngFromSVG(svg), 'image/png');
        }
        notify(`已匯出 ${kind.toUpperCase()}。`);
    }
    catch (e) {
        notify(`匯出失敗：${(e as Error).message}`);
    } }
    function locate(id: string) { edit((_b, s) => { let p = parentId(s, id); while (p) {
        s.nodes[p].collapsed = false;
        p = parentId(s, p);
    } }); setFocus(sheet.rootId); setSelected([id]); setReveal(id); }
    const results = useMemo(() => search.trim() ? Object.values(sheet.nodes).filter(n => `${n.text}\n${n.notes}\n${n.labels.join(' ')}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())).slice(0, 100) : [], [sheet, search]);
    useEffect(() => { const handler = (e: KeyboardEvent) => { const field = e.target instanceof HTMLElement && !!e.target.closest('input,textarea,select,[contenteditable="true"]'); const mod = e.metaKey || e.ctrlKey; if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void save(e.shiftKey);
        return;
    } if (field || print || newDialog || help || library)
        return; if (mod && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[aria-label="搜尋心智圖"]')?.focus();
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
        b.title = '專案規劃';
        activeSheet(b).nodes[activeSheet(b).rootId].text = '我的新專案';
    } if (template === 'study') {
        b.title = '學習筆記';
        activeSheet(b).nodes[activeSheet(b).rootId].text = '我想學會的事';
    } adopt(b); setNewDialog(false); }
    const outline = (id: string, depth = 0): React.ReactNode => { const n = sheet.nodes[id]; const folded = n.collapsed && !viewExpanded.has(id); return <div key={id}><div className={'outline-row' + (selection.includes(id) ? ' selected' : '')} style={{ paddingLeft: 18 + depth * 23 }} onClick={e => setSelected(e.shiftKey ? [...new Set([...selection, id])] : [id])}><button aria-label={`${folded ? '展開' : '收合'} ${n.text}`} disabled={!n.children.length || readOnly} onClick={e => { e.stopPropagation(); toggleCollapse(id); }}>{n.children.length ? folded ? <ChevronRight size={15}/> : <ChevronDown size={15}/> : <span className="leaf-dot"/>}</button><TextField label={`大綱：${n.text}`} value={n.text} disabled={readOnly} onCommit={t => edit((_b, s) => { s.nodes[id].text = t; })}/>{n.task && <small>{n.task.status === 'done' ? '完成' : '待辦'}</small>}<button aria-label={`新增 ${n.text} 的子主題`} disabled={readOnly} onClick={e => { e.stopPropagation(); let child = ''; edit((_b, s) => { child = addTopic(s, id); }); setSelected([child]); }}><Plus size={15}/></button></div>{!folded && n.children.map(c => outline(c, depth + 1))}</div>; };
    return <div className={'app' + (dark ? ' dark' : '') + (editorFocus ? ' editor-focus' : '')} onClickCapture={e => { const a = e.target instanceof Element ? e.target.closest('a.node-link') : null; const href = a?.getAttribute('href'); if (window.openmind && href && /^(https?:|mailto:)/i.test(href)) {
        e.preventDefault();
        void window.openmind.openLink(href).catch(error => notify(`無法開啟連結：${error.message}`));
    } }}>
  <header className="app-header"><a className="brand" href="#" aria-label="OpenMind 首頁" onClick={e => { e.preventDefault(); setLibrary(true); }}><span className="brand-symbol"><GitBranch size={23}/></span><span>Open<span className="brand-light">Mind</span></span></a><span className="header-divider"/><div className="document-title"><TextField label="文件名稱" value={book.title} onCommit={title => edit(b => { b.title = title.trim() || '未命名心智圖'; })} disabled={readOnly}/><span><span className={'save-dot' + (status.includes('失敗') ? ' error' : '')}/>{status}</span></div><div className="header-right"><span className="private-badge"><LockKeyhole size={12}/>僅儲存於本機</span><button aria-label="開啟檔案" title="開啟檔案" onClick={open}><FolderOpen size={18}/></button><button aria-label="儲存檔案" title="儲存檔案 ⌘S" onClick={() => save()}><Save size={18}/></button><button className="primary print-open" onClick={() => setPrint(true)}><Printer size={16}/>列印與 PDF</button><button aria-label="切換深色模式" onClick={() => setDark(!dark)}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button></div></header>
  <aside className="sidebar"><button className="new-map" onClick={() => setNewDialog(true)}><Plus size={17}/>新增心智圖</button><div className="sidebar-label">工作空間</div><button className={'nav-item' + (!library ? ' active' : '')} onClick={() => setLibrary(false)}><Map size={17}/>目前心智圖<span className="count-badge">{book.sheets.length}</span></button><button className="nav-item" onClick={() => setLibrary(true)}><Files size={17}/>最近文件</button><div className="sidebar-separator"/><div className="sidebar-label">工作表<button aria-label="新增工作表" disabled={readOnly} onClick={() => { const next = newSheet(`工作表 ${book.sheets.length + 1}`); edit(b => { b.sheets.push(next); b.activeSheetId = next.id; }); setSelected([next.rootId]); setFocus(next.rootId); }}><Plus size={15}/></button></div><div className="sheet-list">{book.sheets.map((s, i) => <button key={s.id} className={'sheet-item' + (sheet.id === s.id ? ' active' : '')} onClick={() => { setHistory({ ...history, present: { ...book, activeSheetId: s.id } }); setSelected([s.rootId]); setFocus(s.rootId); }}><span className="sheet-icon"><GitBranch size={15}/></span><span>{s.name}</span><small>{String(i + 1).padStart(2, '0')}</small></button>)}</div><div className="sidebar-bottom"><div className="paper-tip"><span className="tip-icon"><Printer size={20}/></span><strong>讓想法躍然紙上</strong><p>選擇可讀分頁，讓大型心智圖的每個字都清晰。</p><button onClick={() => setPrint(true)}>探索列印工作室 <ChevronRight size={14}/></button></div><button className="nav-item" onClick={() => setHelp(true)}><BookOpen size={16}/>操作指南<span>⌘ ?</span></button><div className="open-source"><span className="live-dot"/>自由開源 · 離線可用 <small>v{appVersion}</small></div></div></aside>
  <main className="editor-main"><div className="editor-toolbar"><div className="view-switch"><button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}><GitBranch size={15}/>心智圖</button><button className={view === 'outline' ? 'active' : ''} onClick={() => setView('outline')}><ListTree size={15}/>大綱</button></div><span className="toolbar-line"/><button aria-label="復原" title="復原 ⌘Z" disabled={!history.past.length || readOnly} onClick={() => setHistory(undo(history))}><Undo2 size={17}/></button><button aria-label="重做" title="重做 ⇧⌘Z" disabled={!history.future.length || readOnly} onClick={() => setHistory(redo(history))}><Redo2 size={17}/></button><span className="toolbar-line"/><button disabled={readOnly} onClick={() => add()}><Plus size={16}/>子主題</button><button title="新增同層 Enter" aria-label="新增同層主題" disabled={readOnly} onClick={() => add(true)}><GitBranch size={16}/></button><button title="複製分支" aria-label="複製分支" onClick={() => copy()}><Copy size={16}/></button><button title="聚焦選取分支" aria-label="聚焦分支" onClick={() => { setFocus(primary.id); setSearch(''); }}><Focus size={16}/></button><button aria-label="預覽選取分支" title="預覽選取分支" onClick={() => setBranchPreview(primary.id)}><Eye size={16}/></button><button className="focus-toolbar-button" aria-label={editorFocus ? "離開編輯專注模式" : "展開編輯專注模式"} aria-pressed={editorFocus} onClick={() => editorFocus ? leaveFocus() : enterFocus()}>{editorFocus ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}<span>{editorFocus ? "返回工作區" : "專注"}</span></button><div className="toolbar-spacer"/><div className="export-wrap"><button aria-expanded={exportMenu} onClick={() => setExportMenu(!exportMenu)}><Download size={16}/>匯出<ChevronDown size={12}/></button>{exportMenu && <div className="dropdown">{(['svg', 'png', 'md', 'opml'] as const).map(k => <button key={k} onClick={() => exportFile(k)}>{k.toUpperCase()}<small>{['md', 'opml'].includes(k) ? '文字與階層' : '目前完整／聚焦畫布'}</small></button>)}<button onClick={() => { setExportMenu(false); void save(true); }}>另存原生檔案</button></div>}</div><button aria-label="切換屬性面板" onClick={() => setInspector(!inspector)}><PanelRightClose size={17}/></button></div>
   <div className="canvas-area">{branchPreview && <BranchPreview sheet={sheet} topicId={branchPreview} onClose={() => setBranchPreview(null)} onExpand={() => enterFocus(branchPreview)}/>}{library ? <div className="library"><div className="eyebrow">YOUR LOCAL WORKSPACE</div><h1>留住每一次靈感。</h1><p>文件保存在這個裝置的本機空間。下載原生檔案，可自行備份與分享。</p><div className="library-grid"><button className="library-new" onClick={() => setNewDialog(true)}><FilePlus2 size={28}/><strong>開始新的想法</strong></button>{recents.map(r => <button className="document-card" key={r.book.id} onClick={() => adopt(r.book)}><GitBranch size={32}/><strong>{r.book.title}</strong><span>{r.book.sheets.length} 個工作表</span><small>{new Date(r.date).toLocaleString('zh-TW')}</small></button>)}</div></div> : <>{focus !== sheet.rootId && <button className="focus-banner" onClick={() => setFocus(sheet.rootId)}><ArrowLeft size={14}/>返回完整心智圖 <span>／ {sheet.nodes[focus]?.text}</span></button>}{view === 'map' ? <Canvas sheet={sheet} focus={focus} expanded={viewExpanded} selected={selection} onSelect={setSelected} onEdit={beginEdit} onMove={move} onFloatMove={(id, x, y) => edit((_b, s) => { s.nodes[id].position = { x, y }; })} readOnly={readOnly} reveal={reveal} sceneRef={s => { scene.current = s; }}/> : <div className="outliner"><div className="outline-heading"><span className="eyebrow">OUTLINER</span><h1>{book.title}</h1><p>用文字整理脈絡，與心智圖同步編輯。</p></div>{outline(focus)}{focus === sheet.rootId && sheet.floating.map(id => outline(id))}</div>}</>}
    <div className="search-box"><Search size={15}/><input aria-label="搜尋心智圖" value={search} placeholder="搜尋想法、標籤或筆記" onChange={e => setSearch(e.target.value)}/>{search ? <button aria-label="清除搜尋" onClick={() => setSearch('')}><X size={13}/></button> : <kbd>⌘ F</kbd>}{search && <div className="search-results">{results.length ? results.map(n => <button key={n.id} onClick={() => { locate(n.id); setSearch(''); }}>{n.text}<small>{n.labels.join(' · ')}</small></button>) : <p>沒有符合的節點</p>}</div>}</div>
   </div><footer className="editor-status"><span><GitBranch size={12}/>{Object.keys(sheet.nodes).length} 個節點<span className="status-separator">·</span>{selection.length} 個已選取</span><span>{readOnly ? '唯讀模式' : structureNames[sheet.structure]}<span className="status-separator">·</span>本機自動復原已啟用</span></footer></main>
  {inspector && <aside className="inspector"><div className="inspector-heading"><span>格式與內容</span><button aria-label="更多操作" onClick={() => setHelp(true)}><MoreHorizontal size={18}/></button></div><div className="inspector-scroll"><div className="inspector-tabs"><span className="active">主題</span><span>{selection.length > 1 ? `${selection.length} 個節點` : '選取的節點'}</span></div><div className="section-label">內容</div><label className="wide-label">主題文字<TextField label="節點文字" value={primary.text} disabled={readOnly} multiline onCommit={text => patch(n => n.text = text)}/></label><div className="form-grid"><label>結構<select aria-label="圖表結構" value={sheet.structure} disabled={readOnly} onChange={e => edit((_b, s) => { s.structure = e.target.value as Structure; })}>{Object.entries(structureNames).map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></label><label>形狀<select aria-label="節點形狀" value={primary.style.shape} disabled={readOnly} onChange={e => style({ shape: e.target.value as NodeStyle['shape'] })}><option value="round">圓角矩形</option><option value="rect">矩形</option><option value="pill">膠囊</option></select></label></div><div className="section-label">文字與外觀</div><div className="type-controls"><select aria-label="文字大小" value={primary.style.fontSize} disabled={readOnly} onChange={e => style({ fontSize: +e.target.value })}>{[10, 12, 14, 16, 18, 20, 23, 26, 32, 40, 48, 64].map(n => <option key={n} value={n}>{n} px</option>)}</select><button aria-label="粗體" aria-pressed={primary.style.bold} className={primary.style.bold ? 'active' : ''} disabled={readOnly} onClick={() => style({ bold: !primary.style.bold })}><b>B</b></button><button aria-label="斜體" aria-pressed={primary.style.italic} className={primary.style.italic ? 'active' : ''} disabled={readOnly} onClick={() => style({ italic: !primary.style.italic })}><i>I</i></button><input aria-label="文字顏色" type="color" value={primary.style.color} disabled={readOnly} onChange={e => style({ color: e.target.value })}/></div><div className="swatch-label">填滿顏色</div><div className="swatches">{['#ffffff', '#edf3ff', '#eaf7f4', '#fff6e6', '#f4effb', '#fceef1'].map(c => <button key={c} aria-label={`填滿 ${c}`} className={primary.style.fill === c ? 'chosen' : ''} style={{ background: c }} disabled={readOnly} onClick={() => style({ fill: c })}>{primary.style.fill === c && <Check size={13}/>}</button>)}<input aria-label="自訂填滿顏色" type="color" value={primary.style.fill} disabled={readOnly} onChange={e => style({ fill: e.target.value })}/></div><label className="inline-label">外框顏色<input aria-label="外框顏色" type="color" value={primary.style.stroke} disabled={readOnly} onChange={e => style({ stroke: e.target.value })}/></label><div className="section-label">註記與標籤</div><label className="wide-label">備註<TextField label="節點備註" value={primary.notes} disabled={readOnly} multiline placeholder="記下想法背後的細節…" onCommit={notes => patch(n => n.notes = notes)}/></label><label className="wide-label">標籤（逗號分隔）<TextField label="標籤" value={primary.labels.join(', ')} disabled={readOnly} placeholder="靈感, 待討論" onCommit={v => patch(n => n.labels = v.split(/[,，]/).map(l => l.trim()).filter(Boolean))}/></label><label className="wide-label">連結<TextField label="節點連結" value={primary.link} disabled={readOnly} placeholder="https://… 或 openmind:節點ID" onCommit={link => { if (link && !/^(https?:\/\/|mailto:|openmind:)/i.test(link)) {
        notify('僅支援 http、https、mailto 或 openmind 連結。');
        return;
    } patch(n => n.link = link); }}/></label>{primary.link && <a className="node-link" href={primary.link.startsWith('openmind:') ? '#' : primary.link} target={primary.link.startsWith('openmind:') ? undefined : '_blank'} rel="noreferrer" onClick={e => { if (primary.link.startsWith('openmind:')) {
        e.preventDefault();
        const id = primary.link.slice(9);
        if (sheet.nodes[id])
            locate(id);
        else
            notify('此節點連結的目標不存在。');
    } }}><Link2 size={13}/>開啟連結</a>}<label className="wide-label">標記<select aria-label="節點標記" disabled={readOnly} value={primary.marker} onChange={e => patch(n => n.marker = e.target.value)}>{['', '★', '✓', '!', '?', '⚑', '①', '②', '③'].map(m => <option key={m} value={m}>{m || '無標記'}</option>)}</select></label><div className="section-label">任務</div><label className="wide-label">狀態<select aria-label="任務狀態" value={primary.task?.status ?? 'none'} disabled={readOnly} onChange={e => patch(n => { if (e.target.value === 'none')
        delete n.task;
    else
        n.task = { status: e.target.value as 'todo' | 'doing' | 'done', start: n.task?.start ?? '', due: n.task?.due ?? '' }; })}><option value="none">不設為任務</option><option value="todo">待辦</option><option value="doing">進行中</option><option value="done">已完成</option></select></label>{primary.task && <div className="form-grid"><label>開始日期<input aria-label="開始日期" type="date" value={primary.task.start} disabled={readOnly} max={primary.task.due || undefined} onChange={e => patch(n => { if (n.task)
        n.task.start = e.target.value; })}/></label><label>截止日期<input aria-label="截止日期" type="date" value={primary.task.due} disabled={readOnly} min={primary.task.start || undefined} onChange={e => patch(n => { if (n.task)
        n.task.due = e.target.value; })}/></label></div>}<div className="section-label">分支操作</div><div className="branch-actions"><button disabled={readOnly} onClick={() => patch(n => n.collapsed = !n.collapsed)}><Layers size={14}/>{primary.collapsed ? '展開分支' : '收合分支'}</button><button disabled={readOnly} onClick={() => reorder(-1)}><ArrowUp size={14}/>上移</button><button disabled={readOnly} onClick={() => reorder(1)}><ArrowDown size={14}/>下移</button><button disabled={readOnly} onClick={() => { let id = ''; edit((_b, s) => { const n = topic('自由主題'); n.position = { x: 400, y: 400 }; s.nodes[n.id] = n; s.floating.push(n.id); id = n.id; }); setSelected([id]); }}><Plus size={14}/>自由主題</button><button disabled={readOnly} onClick={() => edit((_b, s) => { s.boundaries.push({ id: uid(), topicId: primary.id, text: '重點分支' }); })}><Square size={14}/>分支外框</button><button disabled={readOnly || selection.length !== 2} title="選取兩個節點建立關係線" onClick={() => edit((_b, s) => { s.relationships.push({ id: uid(), from: selection[0], to: selection[1], text: '相關', directed: true, dashed: true }); })}><Network size={14}/>關係線</button><button disabled={readOnly} onClick={() => imageInput.current?.click()}><ImagePlus size={14}/>插入圖片</button>{primary.image && <button disabled={readOnly} onClick={() => patch(n => delete n.image)}><X size={14}/>移除圖片</button>}<button className="danger" disabled={readOnly || primary.id === sheet.rootId} onClick={() => edit((_b, s) => removeTopics(s, selection))}><Trash2 size={14}/>刪除節點</button></div>{(sheet.relationships.length > 0 || sheet.boundaries.length > 0) && <div className="annotation-list">{sheet.relationships.map(r => <div key={r.id}><TextField label="關係線文字" value={r.text} disabled={readOnly} onCommit={text => edit((_b, s) => { s.relationships.find(a => a.id === r.id)!.text = text; })}/><button aria-label="刪除關係線" disabled={readOnly} onClick={() => edit((_b, s) => { s.relationships = s.relationships.filter(a => a.id !== r.id); })}><X size={12}/></button></div>)}{sheet.boundaries.map(b => <div key={b.id}><TextField label="外框文字" value={b.text} disabled={readOnly} onCommit={text => edit((_b, s) => { s.boundaries.find(a => a.id === b.id)!.text = text; })}/><button aria-label="刪除外框" disabled={readOnly} onClick={() => edit((_b, s) => { s.boundaries = s.boundaries.filter(a => a.id !== b.id); })}><X size={12}/></button></div>)}</div>}<div className="section-label">工作表與主題</div><label className="wide-label">工作表名稱<TextField label="工作表名稱" value={sheet.name} disabled={readOnly} onCommit={name => edit((_b, s) => { s.name = name || '心智圖'; })}/></label><div className="branch-actions"><button disabled={readOnly} onClick={() => { const s = clone(sheet); s.id = uid(); s.name += ' 副本'; edit(b => { b.sheets.push(s); }); }}><Copy size={14}/>複製工作表</button><button disabled={readOnly || book.sheets.length < 2} className="danger" onClick={() => { const next = book.sheets.find(s => s.id !== sheet.id)!; edit(b => { b.sheets = b.sheets.filter(s => s.id !== sheet.id); b.activeSheetId = next.id; }); setFocus(next.rootId); setSelected([next.rootId]); }}><Trash2 size={14}/>刪除工作表</button></div><label className="inline-label">畫布背景<input type="color" aria-label="畫布背景" value={sheet.background} disabled={readOnly} onChange={e => edit((_b, s) => { s.background = e.target.value; })}/></label><button className="full-button" disabled={readOnly} onClick={() => edit((_b, s) => { s.nodes[s.rootId].children.forEach((id, i) => { const c = palette[i % palette.length]; s.nodes[id].style = { ...defaultStyle, stroke: c, color: c, bold: true }; }); })}>套用清晰分支色票</button><label className="check-label"><input type="checkbox" checked={readOnly} onChange={e => setReadOnly(e.target.checked)}/>唯讀模式</label></div></aside>}
  <input type="file" accept=".openmind,.json,.md,.opml" ref={fileInput} className="hidden" data-testid="file-input" onChange={async (e) => { const f = e.target.files?.[0]; if (f) {
        if (f.size > 20e6)
            notify('檔案超過 20 MB。');
        else
            await receive(f.name, await f.text());
    } e.target.value = ''; }}/>
  <input type="file" accept="image/png,image/jpeg,image/webp" ref={imageInput} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!f)
        return; if (f.size > 2e6) {
        notify('圖片超過 2 MB，請先縮小。');
        return;
    } const r = new FileReader(); r.onload = () => patch(n => n.image = String(r.result)); r.readAsDataURL(f); e.target.value = ''; }}/>
  {editing && <div className="modal-backdrop" onClick={() => setEditing(null)}><div className="edit-dialog" role="dialog" aria-label="編輯主題" onClick={e => e.stopPropagation()}><div className="dialog-heading"><strong>編輯主題</strong><button aria-label="取消編輯" onClick={() => setEditing(null)}><X size={18}/></button></div><textarea ref={editRef} aria-label="編輯主題文字" value={editText} maxLength={20000} onChange={e => setEditText(e.target.value)} onKeyDown={e => { if (e.nativeEvent.isComposing)
        return; if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        finishEdit();
    } if (e.key === 'Escape')
        setEditing(null); }}/><div className="dialog-footer"><small>Shift + Enter 換行 · Enter 完成</small><button className="primary" onClick={finishEdit}>完成編輯</button></div></div></div>}
  {newDialog && <div className="modal-backdrop"><div className="template-dialog" role="dialog" aria-label="建立心智圖"><div className="dialog-heading"><div><span className="eyebrow">A LITTLE SPACE FOR A BIG IDEA</span><h2>今天，想展開什麼？</h2></div><button aria-label="關閉新增視窗" onClick={() => setNewDialog(false)}><X size={20}/></button></div><div className="template-grid">{([['blank', '空白心智圖', '從一個想法開始'], ['project', '專案規劃', '整理目標，找到下一步'], ['study', '學習筆記', '串連知識，建立自己的脈絡']] as const).map(([key, title, desc]) => <button key={key} onClick={() => create(key)}><span className={'template-art ' + key}><GitBranch size={56}/></span><strong>{title}</strong><small>{desc}</small></button>)}</div><p className="muted small">目前的心智圖會保留在「最近文件」。重要文件請另存 .openmind 備份。</p></div></div>}
  {help && <div className="modal-backdrop"><div className="help-dialog" role="dialog" aria-label="操作指南"><div className="dialog-heading"><h2>讓思考保持流暢。</h2><button aria-label="關閉指南" onClick={() => setHelp(false)}><X size={20}/></button></div><p>選取節點後，使用工具列或快捷鍵編輯。按住 Shift 點選多個節點，拖曳到另一節點可改變父層，按住 Option 拖曳可插到同層前方。</p><div className="shortcut-grid">{[['Tab', '新增子主題'], ['Enter', '新增同層主題'], ['F2 / 雙擊', '編輯文字'], ['⌘ Z / ⇧⌘ Z', '復原／重做'], ['⌘ C / X / V', '複製／剪下／貼上分支'], ['⌘ S / ⇧⌘ S', '儲存／另存新檔'], ['⌘ P / F', '列印／搜尋'], ['⌘ + 滾輪', '以游標位置縮放'], ['方向鍵', '父子與同層導航']].map(([key, desc]) => <div key={key}><kbd>{key}</kbd><span>{desc}</span></div>)}</div><p className="muted">Windows／Linux 使用 Ctrl 取代 ⌘。核心功能離線可用，無帳號、無遙測。瀏覽器自動儲存受容量與清除資料影響，請保留原生檔案。尚未支援 XMind 格式、AI 推理及多人協作。</p></div></div>}
  {print && <PrintStudio sheet={sheet} selected={primary.id} title={book.title} onClose={() => setPrint(false)} notify={notify}/>}
  {toast && <div className="toast" role="status"><span>{toast}</span><button aria-label="關閉通知" onClick={() => setToast('')}><X size={15}/></button></div>}
 </div>;
}
