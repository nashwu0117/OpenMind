import {useEffect, useRef, useState, type KeyboardEvent, type MouseEvent} from 'react';
import {ChevronRight, Copy, Download, Files, Folder, FolderInput, FolderOpen, FolderPlus, GitBranch, LockKeyhole, Moon, MoreHorizontal, Pencil, Plus, Search, Sun, Trash2, X} from 'lucide-react';
import {uid, type Workbook} from '../core/model';
import type {LibraryOrganization, Recent} from '../core/library';
import {useModalFocus} from './useModalFocus';
import {t, tTemplate, useI18n} from './i18n';
import './library.css';

type Props = {
  recents: Recent[];
  organization: LibraryOrganization;
  folderId: string;
  onFolder: (id: string) => void;
  readOnly: boolean;
  dark: boolean;
  onDark: () => void;
  onNew: () => void;
  onImport: () => void;
  onOpen: (book: Workbook) => void;
  onRename: (book: Workbook, title: string) => Promise<void>;
  onDuplicate: (book: Workbook) => Promise<void>;
  onOrganize: (next: LibraryOrganization) => Promise<void>;
  onUpdates?: () => void;
};
type Menu = {kind: 'map' | 'folder'; id: string; x: number; y: number};
type Dialog = {kind: 'create' | 'rename-folder' | 'rename-map' | 'move' | 'remove-folder'; id?: string};

export function LibraryWorkspace(props: Props) {
  const {locale} = useI18n();
  const {recents, organization, folderId, readOnly} = props;
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState<Menu | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const activeFolder = organization.folders.find(folder => folder.id === folderId);
  const title = activeFolder?.name ?? t(folderId === 'unfiled' ? '未分類' : '所有心智圖');
  const dialogTitle = dialog ? t({create: '新增資料夾', 'rename-folder': '重新命名資料夾', 'rename-map': '重新命名心智圖', move: '移至資料夾', 'remove-folder': '移除資料夾'}[dialog.kind]) : null;
  useModalFocus(dialogTitle);
  const count = (id: string) => recents.filter(row => id === 'all' || (id === 'unfiled' ? !organization.assignments[row.book.id] : organization.assignments[row.book.id] === id)).length;
  const visible = recents.filter(row => (folderId === 'all' || (folderId === 'unfiled' ? !organization.assignments[row.book.id] : organization.assignments[row.book.id] === folderId)) && row.book.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));

  function closeMenu(restoreFocus = false) {
    setMenu(null);
    if (restoreFocus) triggerRef.current?.focus();
  }
  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const outside = (event: PointerEvent) => {if (!menuRef.current?.contains(event.target as Node)) setMenu(null);};
    const dismiss = () => setMenu(null);
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', dismiss);
    window.addEventListener('scroll', dismiss, true);
    return () => {document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', dismiss); window.removeEventListener('scroll', dismiss, true);};
  }, [menu]);
  useEffect(() => {
    if (!dialog) return;
    const dismiss = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && !event.isComposing && !busy) {event.preventDefault(); setDialog(null);}
    };
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, [dialog, busy]);

  function openMenu(event: MouseEvent<HTMLElement>, kind: Menu['kind'], id: string, atPointer = false) {
    event.preventDefault();
    event.stopPropagation();
    triggerRef.current = event.currentTarget;
    const bounds = event.currentTarget.getBoundingClientRect();
    setMenu({kind, id, x: Math.max(8, Math.min(atPointer ? event.clientX : bounds.right - 208, window.innerWidth - 216)), y: Math.max(8, Math.min(atPointer ? event.clientY : bounds.bottom + 6, window.innerHeight - 218))});
  }
  function begin(next: Dialog) {
    setError('');
    setName(next.kind === 'rename-map' ? recents.find(row => row.book.id === next.id)?.book.title ?? '' : next.kind === 'rename-folder' ? organization.folders.find(folder => folder.id === next.id)?.name ?? '' : '');
    setDestination(next.id ? organization.assignments[next.id] ?? '' : '');
    closeMenu();
    setDialog(next);
  }
  async function run(action: () => Promise<void>) {
    setBusy(true); setError('');
    try {await action(); setDialog(null);}
    catch (cause) {setError((cause as Error).message);}
    finally {setBusy(false);}
  }
  async function submit() {
    if (!dialog || busy || readOnly) return;
    const cleanName = name.trim();
    if (['create', 'rename-folder', 'rename-map'].includes(dialog.kind) && !cleanName) {setError(t('請輸入名稱。')); return;}
    if (['create', 'rename-folder'].includes(dialog.kind) && organization.folders.some(folder => folder.id !== dialog.id && folder.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase())) {setError(t('已有同名資料夾，請使用其他名稱。')); return;}
    await run(async () => {
      if (dialog.kind === 'rename-map') {
        const row = recents.find(row => row.book.id === dialog.id);
        if (row) await props.onRename(row.book, cleanName);
      } else if (dialog.kind === 'create') {
        const id = uid();
        await props.onOrganize({...organization, folders: [...organization.folders, {id, name: cleanName}]});
        props.onFolder(id);
      } else if (dialog.kind === 'rename-folder') {
        await props.onOrganize({...organization, folders: organization.folders.map(folder => folder.id === dialog.id ? {...folder, name: cleanName} : folder)});
      } else if (dialog.kind === 'move' && dialog.id) {
        const assignments = {...organization.assignments};
        if (destination) assignments[dialog.id] = destination;
        else delete assignments[dialog.id];
        await props.onOrganize({...organization, assignments});
      } else if (dialog.kind === 'remove-folder') {
        const assignments = Object.fromEntries(Object.entries(organization.assignments).filter(([, id]) => id !== dialog.id));
        await props.onOrganize({folders: organization.folders.filter(folder => folder.id !== dialog.id), assignments});
        if (folderId === dialog.id) props.onFolder('unfiled');
      }
    });
  }
  function menuKeys(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
    } else if (event.key === 'Escape') {event.preventDefault(); closeMenu(true);}
    else if (event.key === 'Tab') closeMenu();
  }
  const menuBook = menu?.kind === 'map' ? recents.find(row => row.book.id === menu.id)?.book : undefined;

  return <div className="library-workspace">
    <header className="library-header">
      <a className="brand" href="#/library" onClick={() => props.onFolder('all')}><span className="brand-symbol"><GitBranch size={23}/></span><span>Open<span className="brand-light">Mind</span></span></a>
      <span className="library-header-label">{t('我的心智圖')}</span>
      <div className="header-right"><span className="private-badge"><LockKeyhole size={12}/>{t('僅儲存於本機')}</span><button aria-label={t('開啟檔案')} onClick={props.onImport}><FolderOpen size={18}/></button>{props.onUpdates && <button aria-label={t('檢查更新')} onClick={props.onUpdates}><Download size={17}/></button>}<button aria-label={t('切換深色模式')} onClick={props.onDark}>{props.dark ? <Sun size={18}/> : <Moon size={18}/>}</button></div>
    </header>
    <aside className="library-sidebar" aria-label={t('心智圖資料庫')}>
      <button className="new-map" disabled={readOnly} onClick={props.onNew}><Plus size={17}/>{t('新增心智圖')}</button>
      <nav aria-label={t('心智圖分類')}>
        <button className={'library-nav' + (folderId === 'all' ? ' active' : '')} onClick={() => props.onFolder('all')}><Files size={18}/><span>{t('所有心智圖')}</span><small>{count('all')}</small></button>
        <button className={'library-nav' + (folderId === 'unfiled' ? ' active' : '')} onClick={() => props.onFolder('unfiled')}><FolderOpen size={18}/><span>{t('未分類')}</span><small>{count('unfiled')}</small></button>
        <div className="library-folder-heading"><span>{t('資料夾')}</span><button aria-label={t('新增資料夾')} disabled={readOnly || busy} onClick={() => begin({kind: 'create'})}><FolderPlus size={16}/></button></div>
        <div className="library-folder-list">{organization.folders.map(folder => <div key={folder.id} className={'library-folder-row' + (folderId === folder.id ? ' active' : '')} onContextMenu={event => openMenu(event, 'folder', folder.id, true)}>
          <button className="library-nav" onClick={() => props.onFolder(folder.id)}><Folder size={18}/><span>{folder.name}</span><small>{count(folder.id)}</small></button>
          <button className="folder-more" aria-label={tTemplate('資料夾選單：{0}', [folder.name])} aria-haspopup="menu" aria-expanded={menu?.kind === 'folder' && menu.id === folder.id} onClick={event => openMenu(event, 'folder', folder.id)}><MoreHorizontal size={16}/></button>
        </div>)}</div>
        {!organization.folders.length && <p className="library-folder-hint">{t('為工作、學習與生活建立資料夾。')}</p>}
      </nav>
      <p className="library-local-note"><LockKeyhole size={14}/><span>{t('想法留在你的裝置。')}<small>{t('離線也能自由整理。')}</small></span></p>
    </aside>
    <main className="library library-content">
      <div className="library-breadcrumb"><span>{t('我的心智圖')}</span><ChevronRight size={13}/><span>{title}</span></div>
      <div className="library-title-row"><div><h1>{title}</h1><p>{t('整理想法，從這裡開始。')}</p></div><button className="library-create-folder" disabled={readOnly || busy} onClick={() => begin({kind: 'create'})}><FolderPlus size={16}/>{t('新增資料夾')}</button></div>
      <div className="library-controls"><label className="library-search"><Search size={16}/><input aria-label={t('搜尋心智圖檔案')} placeholder={t('搜尋心智圖名稱')} value={query} onChange={event => setQuery(event.target.value)}/>{query && <button aria-label={t('清除搜尋')} onClick={() => setQuery('')}><X size={14}/></button>}</label><span>{visible.length} {t('份心智圖')}<span className="library-sort"> · {t('最近更新')}</span></span></div>
      <div className="library-grid">
        <button className="library-new" disabled={readOnly} onClick={props.onNew}><span className="library-add-icon"><Plus size={26}/></span><strong>{t('開始新的想法')}</strong><span>{activeFolder ? tTemplate('建立於「{0}」', [activeFolder.name]) : t('從一個想法開始')}</span></button>
        {visible.map(row => {
          const folder = organization.folders.find(folder => folder.id === organization.assignments[row.book.id]);
          return <article className="library-card" key={row.book.id} onContextMenu={event => openMenu(event, 'map', row.book.id, true)}>
            <button className="document-card" onClick={() => props.onOpen(row.book)} onKeyDown={event => {if (event.key === 'ContextMenu' || event.shiftKey && event.key === 'F10') {event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); triggerRef.current = event.currentTarget; setMenu({kind: 'map', id: row.book.id, x: Math.max(8, Math.min(rect.left + 20, window.innerWidth - 216)), y: Math.max(8, Math.min(rect.top + 40, window.innerHeight - 218))});}}}>
              <span className="library-map-art"><GitBranch size={34}/><span/><span/></span><strong>{row.book.title}</strong><span>{row.book.sheets.length} {t(' 個工作表')}</span><small>{new Date(row.date).toLocaleString(locale === 'en' ? 'en-US' : 'zh-TW', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'})}</small>{folder && <span className="library-folder-tag"><Folder size={12}/>{folder.name}</span>}
            </button>
            <button className="library-card-more" aria-label={tTemplate('心智圖選單：{0}', [row.book.title])} aria-haspopup="menu" aria-expanded={menu?.kind === 'map' && menu.id === row.book.id} onClick={event => openMenu(event, 'map', row.book.id)}><MoreHorizontal size={19}/></button>
          </article>;
        })}
      </div>
      {!visible.length && <div className="library-empty"><FolderOpen size={30}/><h2>{query ? t('找不到符合的心智圖') : t('這裡準備好迎接新想法了。')}</h2><p>{query ? t('試試其他名稱，或切換到所有心智圖。') : t('新增心智圖，或從卡片選單將現有心智圖移到這裡。')}</p></div>}
      <p className="library-bottom-hint">{t('在心智圖上按右鍵，或點選 ⋯，即可重新命名、複製與分類。')}</p>
    </main>
    {menu && <div ref={menuRef} className="library-context-menu" role="menu" aria-label={t(menu.kind === 'map' ? '心智圖選單' : '資料夾選單')} style={{left: menu.x, top: menu.y}} onKeyDown={menuKeys}>
      {menuBook ? <><button role="menuitem" onClick={() => {closeMenu(); props.onOpen(menuBook);}}><FolderOpen size={16}/>{t('開啟心智圖')}</button><button role="menuitem" disabled={readOnly || busy} onClick={() => begin({kind: 'rename-map', id: menu.id})}><Pencil size={16}/>{t('重新命名')}</button><button role="menuitem" disabled={readOnly || busy} onClick={() => {closeMenu(); void run(() => props.onDuplicate(menuBook));}}><Copy size={16}/>{t('建立副本')}</button><div className="library-menu-divider"/><button role="menuitem" disabled={readOnly || busy} onClick={() => begin({kind: 'move', id: menu.id})}><FolderInput size={16}/>{t('移至資料夾')}</button></> : <><button role="menuitem" disabled={readOnly || busy} onClick={() => begin({kind: 'rename-folder', id: menu.id})}><Pencil size={16}/>{t('重新命名')}</button><button role="menuitem" disabled={readOnly || busy} onClick={() => begin({kind: 'remove-folder', id: menu.id})}><Trash2 size={16}/>{t('移除資料夾')}</button></>}
    </div>}
    {error && !dialog && <div className="library-inline-error" role="alert">{error}<button aria-label={t('關閉通知')} onClick={() => setError('')}><X size={16}/></button></div>}
    {dialog && <div className="modal-backdrop"><form className="library-dialog" role="dialog" aria-modal="true" aria-label={dialogTitle!} onSubmit={event => {event.preventDefault(); void submit();}}>
      <div className="dialog-heading"><h2>{dialogTitle}</h2><button type="button" aria-label={t('關閉視窗')} disabled={busy} onClick={() => setDialog(null)}><X size={19}/></button></div>
      {dialog.kind === 'move' ? <label>{t('選擇資料夾')}<select aria-label={t('選擇資料夾')} value={destination} onChange={event => setDestination(event.target.value)}><option value="">{t('未分類')}</option>{organization.folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label> : dialog.kind === 'remove-folder' ? <p>{t('資料夾內的心智圖會移至「未分類」，所有內容都會保留。')}</p> : <label>{t('名稱')}<input aria-label={t('名稱')} autoFocus value={name} maxLength={120} onFocus={event => event.currentTarget.select()} onChange={event => setName(event.target.value)}/></label>}
      {error && <p className="library-form-error" role="alert">{error}</p>}
      <div className="dialog-footer"><button type="button" disabled={busy} onClick={() => setDialog(null)}>{t('取消')}</button><button className="primary" type="submit" disabled={busy || readOnly}>{busy ? t('正在儲存…') : dialog.kind === 'remove-folder' ? t('移除資料夾') : dialog.kind === 'move' ? t('移動') : t('儲存')}</button></div>
    </form></div>}
  </div>;
}
