export type Structure = 'mindmap' | 'logic' | 'tree' | 'org' | 'timeline';
export type NodeStyle = {
    fill: string;
    color: string;
    stroke: string;
    fontSize: number;
    bold: boolean;
    italic: boolean;
    shape: 'round' | 'rect' | 'pill';
};
export type Task = {
    status: 'todo' | 'doing' | 'done';
    start: string;
    due: string;
};
export type Topic = {
    id: string;
    text: string;
    children: string[];
    collapsed: boolean;
    notes: string;
    labels: string[];
    marker: string;
    link: string;
    style: NodeStyle;
    task?: Task;
    image?: string;
    position?: {
        x: number;
        y: number;
    };
};
export type Relationship = {
    id: string;
    from: string;
    to: string;
    text: string;
    directed: boolean;
    dashed: boolean;
};
export type Boundary = {
    id: string;
    topicId: string;
    text: string;
};
export type Sheet = {
    id: string;
    name: string;
    rootId: string;
    nodes: Record<string, Topic>;
    floating: string[];
    structure: Structure;
    relationships: Relationship[];
    boundaries: Boundary[];
    background: string;
};
export type Workbook = {
    format: 'openmind';
    version: 1;
    id: string;
    title: string;
    activeSheetId: string;
    sheets: Sheet[];
    updatedAt: string;
};
export const palette = ['#3263ce', '#11938a', '#b27b28', '#8963b8', '#d06679', '#4388a8'];
export const defaultStyle: NodeStyle = { fill: '#ffffff', color: '#27364b', stroke: '#cbd5e1', fontSize: 16, bold: false, italic: false, shape: 'round' };
export const uid = () => crypto.randomUUID();
export const clone = <T,>(value: T): T => structuredClone(value);
export function topic(text: string, root = false): Topic { return { id: uid(), text, children: [], collapsed: false, notes: '', labels: [], marker: '', link: '', style: root ? { ...defaultStyle, fill: '#244f9e', color: '#ffffff', stroke: '#244f9e', fontSize: 23, bold: true } : { ...defaultStyle } }; }
export function newSheet(name = '心智圖'): Sheet { const root = topic('中心主題', true); return { id: uid(), name, rootId: root.id, nodes: { [root.id]: root }, floating: [], structure: 'mindmap', relationships: [], boundaries: [], background: '#f6f8fb' }; }
export function newWorkbook(title = '未命名心智圖'): Workbook { const sheet = newSheet(); return { format: 'openmind', version: 1, id: uid(), title, activeSheetId: sheet.id, sheets: [sheet], updatedAt: new Date().toISOString() }; }
export const activeSheet = (book: Workbook) => book.sheets.find(s => s.id === book.activeSheetId)!;
export function descendants(sheet: Sheet, id: string): string[] { const out: string[] = []; const stack = [id]; while (stack.length) {
    const next = stack.pop()!;
    out.push(next);
    stack.push(...sheet.nodes[next].children.toReversed());
} return out; }
export function parentId(sheet: Sheet, id: string): string | undefined { return Object.values(sheet.nodes).find(n => n.children.includes(id))?.id; }
export function addTopic(sheet: Sheet, parent: string, text = '新主題', index?: number): string { const n = topic(text); sheet.nodes[n.id] = n; sheet.nodes[parent].children.splice(index ?? sheet.nodes[parent].children.length, 0, n.id); sheet.nodes[parent].collapsed = false; return n.id; }
export function removeTopics(sheet: Sheet, ids: string[]) { const gone = new Set(ids.filter(id => id !== sheet.rootId).flatMap(id => descendants(sheet, id))); for (const id of gone)
    delete sheet.nodes[id]; for (const n of Object.values(sheet.nodes))
    n.children = n.children.filter(id => !gone.has(id)); sheet.floating = sheet.floating.filter(id => !gone.has(id)); sheet.relationships = sheet.relationships.filter(r => !gone.has(r.from) && !gone.has(r.to)); sheet.boundaries = sheet.boundaries.filter(b => !gone.has(b.topicId)); }
export function moveTopic(sheet: Sheet, id: string, parent: string, index?: number): boolean { if (id === sheet.rootId || id === parent || descendants(sheet, id).includes(parent))
    return false; const old = parentId(sheet, id); if (old === parent && index !== undefined && sheet.nodes[parent].children.indexOf(id) < index)
    index--; if (old)
    sheet.nodes[old].children = sheet.nodes[old].children.filter(c => c !== id); sheet.floating = sheet.floating.filter(c => c !== id); delete sheet.nodes[id].position; sheet.nodes[parent].children.splice(index ?? sheet.nodes[parent].children.length, 0, id); sheet.nodes[parent].collapsed = false; return true; }
export function copyBranch(sheet: Sheet, id: string, target: string): string { const map = new Map(descendants(sheet, id).map(old => [old, uid()])); for (const [old, next] of map) {
    sheet.nodes[next] = { ...clone(sheet.nodes[old]), id: next, children: sheet.nodes[old].children.map(c => map.get(c)!) };
    delete sheet.nodes[next].position;
} const root = map.get(id)!; sheet.nodes[target].children.push(root); sheet.nodes[target].collapsed = false; return root; }
export function pasteBranches(source: Sheet, ids: string[], destination: Sheet, target: string): string[] {
    const mapping = new Map(ids.flatMap(id => descendants(source, id)).map(old => [old, uid()]));
    for (const [old, id] of mapping) {
        const n = clone(source.nodes[old]);
        n.id = id;
        n.children = n.children.map(c => mapping.get(c)!);
        delete n.position;
        if (n.link.startsWith('openmind:')) {
            const oldTarget = n.link.slice(9);
            if (mapping.has(oldTarget))
                n.link = 'openmind:' + mapping.get(oldTarget);
        }
        destination.nodes[id] = n;
    }
    const roots = ids.map(id => mapping.get(id)!);
    destination.nodes[target].children.push(...roots);
    destination.nodes[target].collapsed = false;
    for (const r of source.relationships)
        if (mapping.has(r.from) && mapping.has(r.to))
            destination.relationships.push({ ...clone(r), id: uid(), from: mapping.get(r.from)!, to: mapping.get(r.to)! });
    for (const b of source.boundaries)
        if (mapping.has(b.topicId))
            destination.boundaries.push({ ...clone(b), id: uid(), topicId: mapping.get(b.topicId)! });
    return roots;
}
export function demoWorkbook(): Workbook { const book = newWorkbook('讓好想法，清晰展開'); const s = activeSheet(book); s.nodes[s.rootId].text = '我的下一個好想法'; const content = [['探索方向', '我想解決什麼問題？', '誰會從中受益？', '收集靈感與參考'], ['整理想法', '找到核心價值', '拆解成小步驟', '留下思考的空間'], ['開始行動', '設定第一個里程碑', '邀請夥伴一起討論', '追蹤每一次進展'], ['清晰呈現', '保留文字的可讀性', '選擇合適的列印方式', '分享一張完整的心智圖']]; content.forEach(([t, ...children], i) => { const id = addTopic(s, s.rootId, t); s.nodes[id].style = { ...defaultStyle, stroke: palette[i], color: palette[i], fill: ['#edf3ff', '#eaf7f4', '#fff6e6', '#f4effb'][i], bold: true, fontSize: 18 }; children.forEach(c => addTopic(s, id, c)); }); return book; }
export function fixture(count: number): Workbook { const b = newWorkbook(`列印測試 ${count} 節點`); const s = activeSheet(b); s.nodes[s.rootId].text = '繁體中文 Print-first 心智圖'; const parents = [s.rootId]; for (let i = 1; i < count; i++) {
    const p = parents[Math.floor((i - 1) / 5)] ?? s.rootId;
    parents.push(addTopic(s, p, `節點 ${i} — 思考與行動 ${i % 9 === 0 ? '中文與 English 混合的較長文字，保持清晰易讀。' : ''}`));
} return b; }
// Strict trust boundary: reject unknown fields rather than silently losing them.
export function validateWorkbook(raw: unknown): Workbook {
    const fail = (m: string): never => { throw new Error(`無法開啟文件：${m}`); };
    const obj = (v: unknown, keys: string[], label: string): Record<string, unknown> => { if (!v || typeof v !== 'object' || Array.isArray(v))
        return fail(label); const o = v as Record<string, unknown>; const extra = Object.keys(o).filter(k => !keys.includes(k)); if (extra.length)
        fail(`${label}含尚未支援的欄位 ${extra.join(', ')}`); return o; };
    const str = (v: unknown, max = 20000): v is string => typeof v === 'string' && v.length <= max;
    const arr = (v: unknown): v is string[] => Array.isArray(v) && v.every(x => str(x, 200));
    const b = obj(raw, ['format', 'version', 'id', 'title', 'activeSheetId', 'sheets', 'updatedAt'], '文件');
    if (b.format !== 'openmind' || b.version !== 1)
        fail('格式或版本不受支援，原始檔案未變更');
    if (!str(b.id, 200) || !str(b.title, 300) || !str(b.activeSheetId, 200) || !str(b.updatedAt, 100) || !Array.isArray(b.sheets) || !b.sheets.length || b.sheets.length > 50)
        fail('文件基本資料不完整');
    const sheetIds = new Set<string>();
    let total = 0;
    for (const rawSheet of b.sheets as unknown[]) {
        const s = obj(rawSheet, ['id', 'name', 'rootId', 'nodes', 'floating', 'structure', 'relationships', 'boundaries', 'background'], '工作表');
        if (!str(s.id, 200) || sheetIds.has(s.id as string) || !str(s.name, 300) || !str(s.rootId, 200) || !arr(s.floating) || !['mindmap', 'logic', 'tree', 'org', 'timeline'].includes(s.structure as string) || !/^#[0-9a-f]{6}$/i.test(String(s.background)))
            fail('工作表屬性無效');
        sheetIds.add(s.id as string);
        if (!s.nodes || typeof s.nodes !== 'object' || Array.isArray(s.nodes))
            fail('缺少節點');
        const nodes = s.nodes as Record<string, unknown>;
        const ids = Object.keys(nodes);
        total += ids.length;
        if (total > 10000)
            fail('文件超過 10,000 個節點限制');
        if (!nodes[s.rootId as string])
            fail('缺少中心主題');
        for (const id of ids) {
            if (['__proto__', 'constructor', 'prototype'].includes(id) || id.length > 200)
                fail('節點 ID 無效');
            const n = obj(nodes[id], ['id', 'text', 'children', 'collapsed', 'notes', 'labels', 'marker', 'link', 'style', 'task', 'image', 'position'], '節點');
            if (n.id !== id || !str(n.text) || !arr(n.children) || new Set(n.children as string[]).size !== (n.children as string[]).length || !str(n.notes, 100000) || !arr(n.labels) || !str(n.marker, 20) || !str(n.link, 2000) || typeof n.collapsed !== 'boolean')
                fail('節點資料無效');
            if (n.link && !/^(https?:\/\/|mailto:|openmind:)/i.test(n.link as string))
                fail('連結協定不受支援');
            const st = obj(n.style, ['fill', 'color', 'stroke', 'fontSize', 'bold', 'italic', 'shape'], '樣式');
            if (!['fill', 'color', 'stroke'].every(k => /^#[0-9a-f]{6}$/i.test(String(st[k]))) || typeof st.fontSize !== 'number' || !Number.isFinite(st.fontSize) || st.fontSize < 10 || st.fontSize > 64 || typeof st.bold !== 'boolean' || typeof st.italic !== 'boolean' || !['round', 'rect', 'pill'].includes(st.shape as string))
                fail('樣式無效');
            if (n.task !== undefined) {
                const t = obj(n.task, ['status', 'start', 'due'], '任務');
                if (!['todo', 'doing', 'done'].includes(t.status as string) || ![t.start, t.due].every(d => d === '' || (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d)) || (t.start && t.due && String(t.due) < String(t.start)))
                    fail('任務日期或狀態無效');
            }
            if (n.position !== undefined) {
                const p = obj(n.position, ['x', 'y'], '位置');
                if (![p.x, p.y].every(v => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) < 1e6))
                    fail('位置無效');
            }
            if (n.image !== undefined && (!str(n.image, 3e6) || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(n.image)))
                fail('圖片必須是小於 2 MB 的內嵌 PNG/JPEG/WebP');
        }
        const seen = new Set<string>();
        const stack = [{ id: s.rootId as string, depth: 0 }, ...(s.floating as string[]).map(id => ({ id, depth: 0 }))];
        while (stack.length) {
            const { id, depth } = stack.pop()!;
            if (seen.has(id) || !nodes[id] || depth > 128)
                fail('樹狀結構有循環、重複父節點、遺失節點或超過 128 層');
            seen.add(id);
            for (const c of (nodes[id] as Topic).children)
                stack.push({ id: c, depth: depth + 1 });
        }
        if (seen.size !== ids.length)
            fail('存在未連接節點');
        if (!Array.isArray(s.relationships) || !Array.isArray(s.boundaries))
            fail('標註無效');
        for (const rawR of s.relationships as unknown[]) {
            const r = obj(rawR, ['id', 'from', 'to', 'text', 'directed', 'dashed'], '關係線');
            if (!str(r.id, 200) || !str(r.text, 1000) || !nodes[String(r.from)] || !nodes[String(r.to)] || typeof r.directed !== 'boolean' || typeof r.dashed !== 'boolean')
                fail('關係線指向不存在節點');
        }
        for (const rawB of s.boundaries as unknown[]) {
            const a = obj(rawB, ['id', 'topicId', 'text'], '外框');
            if (!str(a.id, 200) || !str(a.text, 1000) || !nodes[String(a.topicId)])
                fail('外框指向不存在節點');
        }
    }
    if (!sheetIds.has(b.activeSheetId as string))
        fail('目前工作表不存在');
    return clone(raw as Workbook);
}
