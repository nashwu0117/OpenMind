import { addTopic, activeSheet, newWorkbook, validateWorkbook, type Workbook, type Sheet } from '../core/model';
import { escapeXML } from '../engine/svg';
import {FREEMIND_WARNING,parseFreeMind} from './freemind';
export const LOSS_WARNING = 'Markdown／OPML 只轉換節點文字與階層；樣式、註記、圖片、標籤、任務、關係線與其他工作表不會包含在此格式。原生 .openmind 可完整保存。';
function interchangeText(text:string,format:string):string{if(new TextEncoder().encode(text).length>2e6)throw new Error(`${format} 超過 2 MB 上限，請選取較小分支或儲存原生檔案。`);return text;}
export function nativeJSON(book: Workbook): string { validateWorkbook(book); let json = JSON.stringify(book, null, 2); if (new TextEncoder().encode(json).length > 20e6) json=JSON.stringify(book); if(new TextEncoder().encode(json).length>20e6) throw new Error('文件超過 20 MB 上限，請減少附件或拆分工作表後再儲存。'); return json; }
export function parseNative(text: string): Workbook { if (new TextEncoder().encode(text).length > 20e6)
    throw new Error('檔案超過 20 MB 上限。'); try {
    return validateWorkbook(JSON.parse(text));
}
catch (error) {
    throw new Error(error instanceof Error ? error.message : '無法解析 JSON。');
} }
function walk(sheet: Sheet, id: string, depth: number, visit: (text: string, depth: number) => void) { visit(sheet.nodes[id].text, depth); for (const child of sheet.nodes[id].children)
    walk(sheet, child, depth + 1, visit); }
export function markdown(sheet: Sheet): string { const lines: string[] = []; const encode = (text:string) => escapeXML(text).replaceAll('\n', ' <br> ').replaceAll('\\', '\\\\'); walk(sheet, sheet.rootId, 0, (text, d) => lines.push(`${'  '.repeat(d)}- ${encode(text)}`)); for (const id of sheet.floating)
    walk(sheet, id, 1, (text, d) => lines.push(`${'  '.repeat(d)}- ${encode(text)}`)); return interchangeText(lines.join('\n') + '\n','Markdown'); }
export function parseMarkdown(text: string): Workbook { if (new TextEncoder().encode(text).length > 2e6)
    throw new Error('Markdown 超過 2 MB 上限。'); const book = newWorkbook('匯入的 Markdown'); const s = activeSheet(book); const stack: string[] = []; let first = true; let count = 0; for (const line of text.split(/\r?\n/)) {
    if (!line.trim())
        continue;
    const match = /^(\s*)(?:[-*+]\s+|#{1,6}\s+)(.*)$/.exec(line);
    if (!match)
        throw new Error('Markdown 僅支援縮排清單與標題；請將其他段落整理成清單，避免遺失內容。');
    const d = line.trimStart().startsWith('#') ? Math.max(0, (line.match(/#+/)?.[0].length ?? 1) - 1) : Math.floor(match[1].replaceAll('\t', '  ').length / 2);
    const content = match[2].replaceAll(' <br> ', '\n').replaceAll('\\\\', '\\').replace(/&(amp|lt|gt|quot|apos);/g, (_all, entity: string) => ({amp: '&', lt: '<', gt: '>', quot: '"', apos: "'"}[entity]!));
    if (d > 128 || ++count > 10000)
        throw new Error('階層或節點數超過上限。');
    if (first) {
        s.nodes[s.rootId].text = content;
        stack[0] = s.rootId;
        first = false;
    }
    else {
        const depth = Math.min(Math.max(1, d), stack.length);
        const id = addTopic(s, stack[depth - 1], content);
        stack[depth] = id;
        stack.length = depth + 1;
    }
} if (first)
    throw new Error('Markdown 沒有可匯入的節點。'); return validateWorkbook(book); }
export function opml(sheet: Sheet): string { const build = (id: string): string => `<outline text="${escapeXML(sheet.nodes[id].text).replaceAll('\n', '&#10;')}">${sheet.nodes[id].children.map(build).join('')}</outline>`; return interchangeText(`<?xml version="1.0" encoding="UTF-8"?><opml version="2.0"><head><title>${escapeXML(sheet.name)}</title></head><body>${build(sheet.rootId)}${sheet.floating.map(build).join('')}</body></opml>`,'OPML'); }
export function parseOPML(text: string): Workbook { if (new TextEncoder().encode(text).length > 2e6 || /<!DOCTYPE|<!ENTITY/i.test(text))
    throw new Error('OPML 超過大小限制或含不允許的 XML 實體。'); const doc = new DOMParser().parseFromString(text, 'application/xml'); if (doc.querySelector('parsererror') || doc.documentElement.tagName !== 'opml')
    throw new Error('OPML XML 格式錯誤。'); const unknown = [...doc.querySelectorAll('*')].filter(e => !['opml', 'head', 'title', 'body', 'outline'].includes(e.tagName) || e.tagName === 'outline' && [...e.attributes].some(a => a.name !== 'text')); if (unknown.length)
    throw new Error('OPML 含目前未支援的元素或屬性，已停止匯入以避免資料遺失。'); const roots = [...doc.querySelector('body')?.children ?? []]; if (!roots.length)
    throw new Error('OPML 沒有節點。'); const b = newWorkbook('匯入的 OPML'), s = activeSheet(b); let count = 0; const add = (el: Element, parent: string, depth: number) => { if (depth > 128 || ++count > 10000)
    throw new Error('OPML 超過階層或節點上限。'); const id = addTopic(s, parent, el.getAttribute('text') ?? ''); for (const c of el.children)
    add(c, id, depth + 1); }; if (roots.length === 1) {
    s.nodes[s.rootId].text = roots[0].getAttribute('text') ?? '';
    for (const c of roots[0].children)
        add(c, s.rootId, 1);
}
else
    for (const root of roots)
        add(root, s.rootId, 1); return validateWorkbook(b); }
export function importFile(name: string, text: string): {
    book: Workbook;
    warning?: string;
} { if (/\.mm$/i.test(name)) return {book:parseFreeMind(text),warning:FREEMIND_WARNING}; if (/\.md$/i.test(name))
    return { book: parseMarkdown(text), warning: LOSS_WARNING }; if (/\.opml$/i.test(name))
    return { book: parseOPML(text), warning: LOSS_WARNING }; if (!/\.(openmind|json)$/i.test(name))
    throw new Error('目前僅支援 .openmind、.json、.md、.opml 及 .mm；尚未支援 .xmind。'); return { book: parseNative(text),warning:JSON.parse(text).version===1?'舊版 v1 已在記憶體升級至 v2，原始檔未修改。請另存原生檔案以保存新功能。':undefined }; }
export function download(name: string, data: BlobPart, type: string) { const url = URL.createObjectURL(new Blob([data], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000); }
export async function pngFromSVG(svg: string): Promise<Blob> { const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(2, 12000 / Math.max(img.width, img.height));
    if (img.width * img.height * scale * scale > 40e6)
        throw new Error('圖片超過 4,000 萬像素限制，請選取分支或匯出 SVG。');
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(img.width * scale);
    canvas.height = Math.ceil(img.height * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('PNG 編碼失敗。')), 'image/png'));
}
finally {
    URL.revokeObjectURL(url);
} }
