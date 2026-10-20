import {validateDependencies} from './tasks';
export type Structure = 'mindmap' | 'logic' | 'brace' | 'tree' | 'org' | 'timeline' | 'fishbone' | 'matrix' | 'treetable';
export const structures: Record<Structure,string> = {mindmap:'心智圖',logic:'邏輯圖',brace:'括號圖',tree:'樹狀圖',org:'組織圖',timeline:'時間軸',fishbone:'魚骨圖',matrix:'矩陣圖',treetable:'樹狀表格'};
export type NodeStyle = {
    fill: string;
    color: string;
    stroke: string;
    fontSize: number;
    bold: boolean;
    italic: boolean;
    shape: 'round' | 'rect' | 'pill';
    align: 'left' | 'center' | 'right';
    font: 'sans' | 'serif' | 'mono';
    opacity: number;
    strokeWidth: number;
    dashed: boolean;
};
export type Task = {
    status: 'todo' | 'doing' | 'done';
    start: string;
    due: string;
    dependencies?: string[];
};
export type Attachment = {id: string; name: string; mime: string; data: string};
export type Summary = {id: string; topicIds: string[]; text: string};
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
    sticker: string;
    equation: string;
    attachments: Attachment[];
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
    summaries: Summary[];
    spacing: {horizontal: number; vertical: number};
    connector: 'curve' | 'elbow' | 'straight';
    slides: string[];
};
export type Workbook = {
    format: 'openmind';
    version: 2;
    id: string;
    title: string;
    activeSheetId: string;
    sheets: Sheet[];
    updatedAt: string;
};
export const palette = ['#3263ce', '#11938a', '#b27b28', '#8963b8', '#d06679', '#4388a8'];
export const defaultStyle: NodeStyle = { fill: '#ffffff', color: '#27364b', stroke: '#cbd5e1', fontSize: 16, bold: false, italic: false, shape: 'round', align:'left', font:'sans', opacity:1, strokeWidth:1.2, dashed:false };
export const uid = (): string => crypto.randomUUID();
export const clone = <T,>(value: T): T => structuredClone(value);
export function topic(text: string, root = false): Topic { return { id: uid(), text, children: [], collapsed: false, notes: '', labels: [], marker: '', link: '', sticker:'',equation:'',attachments:[], style: root ? { ...defaultStyle, fill: '#244f9e', color: '#ffffff', stroke: '#244f9e', fontSize: 23, bold: true } : { ...defaultStyle } }; }
export function newSheet(name = '心智圖'): Sheet { const root = topic('中心主題', true); return { id: uid(), name, rootId: root.id, nodes: { [root.id]: root }, floating: [], structure: 'mindmap', relationships: [], boundaries: [], summaries:[], spacing:{horizontal:74,vertical:24},connector:'curve',slides:[], background: '#f6f8fb' }; }
export function newWorkbook(title = '未命名心智圖'): Workbook { const sheet = newSheet(); return { format: 'openmind', version: 2, id: uid(), title, activeSheetId: sheet.id, sheets: [sheet], updatedAt: new Date().toISOString() }; }
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
    n.children = n.children.filter(id => !gone.has(id)); for (const n of Object.values(sheet.nodes)) {if (/^openmind:/i.test(n.link) && gone.has(n.link.slice(9))) n.link = ''; if(n.task?.dependencies)n.task.dependencies=n.task.dependencies.filter(id=>!gone.has(id));} sheet.floating = sheet.floating.filter(id => !gone.has(id)); sheet.relationships = sheet.relationships.filter(r => !gone.has(r.from) && !gone.has(r.to)); sheet.boundaries = sheet.boundaries.filter(b => !gone.has(b.topicId)); sheet.summaries=sheet.summaries.map(s=>({...s,topicIds:s.topicIds.filter(id=>!gone.has(id))})).filter(s=>s.topicIds.length);sheet.slides=sheet.slides.filter(id=>!gone.has(id)); }
export function moveTopic(sheet: Sheet, id: string, parent: string, index?: number): boolean { if (id === sheet.rootId || id === parent || descendants(sheet, id).includes(parent))
    return false; const old = parentId(sheet, id); if (old === parent && index !== undefined && sheet.nodes[parent].children.indexOf(id) < index)
    index--; if (old)
    sheet.nodes[old].children = sheet.nodes[old].children.filter(c => c !== id); sheet.floating = sheet.floating.filter(c => c !== id); delete sheet.nodes[id].position; sheet.nodes[parent].children.splice(index ?? sheet.nodes[parent].children.length, 0, id); sheet.nodes[parent].collapsed = false; return true; }
export function copyBranch(sheet: Sheet, id: string, target: string): string {return pasteBranches(sheet, [id], sheet, target)[0];}
export function pasteBranches(source: Sheet, ids: string[], destination: Sheet, target: string): string[] {
    const mapping = new Map(ids.flatMap(id => descendants(source, id)).map(old => [old, uid()]));
    for (const [old, id] of mapping) {
        const n = clone(source.nodes[old]);
        n.id = id;
        n.children = n.children.map(c => mapping.get(c)!);
        delete n.position;
        if (/^openmind:/i.test(n.link)) {
            const oldTarget = n.link.slice(9);
            if (mapping.has(oldTarget))
                n.link = 'openmind:' + mapping.get(oldTarget);
            else if (!destination.nodes[oldTarget]) n.link = '';
        }
        if(n.task?.dependencies)n.task.dependencies=n.task.dependencies.map(id=>mapping.get(id)??id).filter(id=>!!destination.nodes[id]?.task||[...mapping.values()].includes(id));
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
    for(const summary of source.summaries)if(summary.topicIds.every(id=>mapping.has(id)))destination.summaries.push({...clone(summary),id:uid(),topicIds:summary.topicIds.map(id=>mapping.get(id)!)});
    return roots;
}
export function demoWorkbook(): Workbook { const book = newWorkbook('讓好想法，清晰展開'); const s = activeSheet(book); s.nodes[s.rootId].text = '我的下一個好想法'; const content = [['探索方向', '我想解決什麼問題？', '誰會從中受益？', '收集靈感與參考'], ['整理想法', '找到核心價值', '拆解成小步驟', '留下思考的空間'], ['開始行動', '設定第一個里程碑', '邀請夥伴一起討論', '追蹤每一次進展'], ['清晰呈現', '保留文字的可讀性', '選擇合適的列印方式', '分享一張完整的心智圖']]; content.forEach(([t, ...children], i) => { const id = addTopic(s, s.rootId, t); s.nodes[id].style = { ...defaultStyle, stroke: palette[i], color: palette[i], fill: ['#edf3ff', '#eaf7f4', '#fff6e6', '#f4effb'][i], bold: true, fontSize: 18 }; children.forEach(c => addTopic(s, id, c)); }); return book; }
export function fixture(count: number): Workbook { const b = newWorkbook(`列印測試 ${count} 節點`); const s = activeSheet(b); s.nodes[s.rootId].text = '繁體中文 Print-first 心智圖'; const parents = [s.rootId]; for (let i = 1; i < count; i++) {
    const p = parents[Math.floor((i - 1) / 5)] ?? s.rootId;
    parents.push(addTopic(s, p, `節點 ${i} — 思考與行動 ${i % 9 === 0 ? '中文與 English 混合的較長文字，保持清晰易讀。' : ''}`));
} return b; }
// Strict trust boundary: reject unknown fields rather than silently losing them.
export function migrateWorkbook(raw:unknown):unknown {
    if(!raw||typeof raw!=='object'||(raw as {version?:unknown}).version!==1)return raw;
    const migrated=clone(raw) as Record<string,unknown>;migrated.version=2;
    if(Array.isArray(migrated.sheets))for(const value of migrated.sheets){if(!value||typeof value!=='object')continue;const sheet=value as Record<string,unknown>;
        sheet.summaries??=[];sheet.spacing??={horizontal:74,vertical:24};sheet.connector??='curve';sheet.slides??=[];
        if(sheet.nodes&&typeof sheet.nodes==='object')for(const value of Object.values(sheet.nodes)){if(!value||typeof value!=='object')continue;const n=value as Record<string,unknown>;n.sticker??='';n.equation??='';n.attachments??=[];
            if(n.style&&typeof n.style==='object'){const style=n.style as Record<string,unknown>;style.align??='left';style.font??='sans';style.opacity??=1;style.strokeWidth??=1.2;style.dashed??=false;}}
    }return migrated;
}
export function validateWorkbook(raw: unknown): Workbook {
    raw=migrateWorkbook(raw);
    const fail = (m: string): never => { throw new Error(`無法開啟文件：${m}`); };
    const obj = (v: unknown, keys: string[], label: string): Record<string, unknown> => { if (!v || typeof v !== 'object' || Array.isArray(v))
        return fail(label); const o = v as Record<string, unknown>; const extra = Object.keys(o).filter(k => !keys.includes(k)); if (extra.length)
        fail(`${label}含尚未支援的欄位 ${extra.join(', ')}`); return o; };
    const str = (v: unknown, max = 20000): v is string => typeof v === 'string' && v.length <= max;
    const arr = (v: unknown): v is string[] => Array.isArray(v) && v.every(x => str(x, 200));
    const b = obj(raw, ['format', 'version', 'id', 'title', 'activeSheetId', 'sheets', 'updatedAt'], '文件');
    if (b.format !== 'openmind' || b.version !== 2)
        fail('格式或版本不受支援，原始檔案未變更');
    if (!str(b.id, 200) || !str(b.title, 300) || !str(b.activeSheetId, 200) || !str(b.updatedAt, 100) || !Array.isArray(b.sheets) || !b.sheets.length || b.sheets.length > 50)
        fail('文件基本資料不完整');
    const sheetIds = new Set<string>();
    let total = 0;
    for (const rawSheet of b.sheets as unknown[]) {
        const s = obj(rawSheet, ['id', 'name', 'rootId', 'nodes', 'floating', 'structure', 'relationships', 'boundaries', 'background','summaries','spacing','connector','slides'], '工作表');
        if (!str(s.id, 200) || sheetIds.has(s.id as string) || !str(s.name, 300) || !str(s.rootId, 200) || !arr(s.floating) || !Object.hasOwn(structures,s.structure as string) || !/^#[0-9a-f]{6}$/i.test(String(s.background)) || !['curve','elbow','straight'].includes(s.connector as string) || !arr(s.slides) || new Set(s.slides).size!==s.slides.length)
            fail('工作表屬性無效');
        const spacing=obj(s.spacing,['horizontal','vertical'],'分支間距');if(![spacing.horizontal,spacing.vertical].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=12&&v<=200))fail('分支間距無效');
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
            const n = obj(nodes[id], ['id', 'text', 'children', 'collapsed', 'notes', 'labels', 'marker', 'link', 'style', 'task', 'image', 'position','sticker','equation','attachments'], '節點');
            if (n.id !== id || !str(n.text) || !arr(n.children) || new Set(n.children as string[]).size !== (n.children as string[]).length || !str(n.notes, 100000) || !arr(n.labels) || !str(n.marker, 20) || !str(n.link, 2000) || typeof n.collapsed !== 'boolean')
                fail('節點資料無效');
            if(!str(n.sticker,32)||!str(n.equation,2000)||!Array.isArray(n.attachments)||n.attachments.length>10)fail('貼圖、公式或附件無效');
            const attachmentIds=new Set<string>();for(const rawAttachment of n.attachments as unknown[]){const attachment=obj(rawAttachment,['id','name','mime','data'],'附件');if(!str(attachment.id,200)||!attachment.id||attachmentIds.has(attachment.id)||!str(attachment.name,255)||!attachment.name||!str(attachment.mime,100)||!str(attachment.data,2700000)||!/^data:application\/octet-stream;base64,[A-Za-z0-9+/]*={0,2}$/.test(attachment.data as string))fail('附件必須是小於 2 MB 的內嵌檔案');const encoded=(attachment.data as string).split(',')[1];if(encoded.length%4!==0||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)||encoded.length/4*3-(encoded.endsWith('==')?2:encoded.endsWith('=')?1:0)>2e6)fail('附件必須是小於 2 MB 的內嵌檔案');attachmentIds.add(attachment.id as string);}
            if (n.link && !/^(https?:\/\/|mailto:|openmind:)/i.test(n.link as string))
                fail('連結協定不受支援');
            const st = obj(n.style, ['fill', 'color', 'stroke', 'fontSize', 'bold', 'italic', 'shape','align','font','opacity','strokeWidth','dashed'], '樣式');
            if (!['fill', 'color', 'stroke'].every(k => /^#[0-9a-f]{6}$/i.test(String(st[k]))) || typeof st.fontSize !== 'number' || !Number.isFinite(st.fontSize) || st.fontSize < 10 || st.fontSize > 64 || typeof st.bold !== 'boolean' || typeof st.italic !== 'boolean' || !['round', 'rect', 'pill'].includes(st.shape as string))
                fail('樣式無效');
            if(!['left','center','right'].includes(st.align as string)||!['sans','serif','mono'].includes(st.font as string)||typeof st.opacity!=='number'||!Number.isFinite(st.opacity)||st.opacity<0||st.opacity>1||typeof st.strokeWidth!=='number'||!Number.isFinite(st.strokeWidth)||st.strokeWidth<0||st.strokeWidth>8||typeof st.dashed!=='boolean')fail('進階樣式無效');
            if (n.task !== undefined) {
                const t = obj(n.task, ['status', 'start', 'due','dependencies'], '任務');
                if (!['todo', 'doing', 'done'].includes(t.status as string) || ![t.start, t.due].every(d => d === '' || (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d)) || (t.start && t.due && String(t.due) < String(t.start)))
                    fail('任務日期或狀態無效');
                if(t.dependencies!==undefined&&(!arr(t.dependencies)||new Set(t.dependencies).size!==t.dependencies.length))fail('任務相依性無效');
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
        if (!Array.isArray(s.relationships) || !Array.isArray(s.boundaries) || !Array.isArray(s.summaries))
            fail('標註無效');
        const annotationIds = new Set<string>();
        for (const rawR of s.relationships as unknown[]) {
            const r = obj(rawR, ['id', 'from', 'to', 'text', 'directed', 'dashed'], '關係線');
            if (!str(r.id, 200) || !r.id || annotationIds.has(r.id) || !str(r.text, 1000) || !nodes[String(r.from)] || !nodes[String(r.to)] || typeof r.directed !== 'boolean' || typeof r.dashed !== 'boolean')
                fail('關係線指向不存在節點');
            annotationIds.add(r.id as string);
        }
        for (const rawB of s.boundaries as unknown[]) {
            const a = obj(rawB, ['id', 'topicId', 'text'], '外框');
            if (!str(a.id, 200) || !a.id || annotationIds.has(a.id) || !str(a.text, 1000) || !nodes[String(a.topicId)])
                fail('外框指向不存在節點');
            annotationIds.add(a.id as string);
        }
        for(const value of s.summaries as unknown[]){const summary=obj(value,['id','topicIds','text'],'摘要');if(!str(summary.id,200)||!summary.id||annotationIds.has(summary.id)||!str(summary.text,1000)||!arr(summary.topicIds)||!summary.topicIds.length||new Set(summary.topicIds).size!==summary.topicIds.length||!summary.topicIds.every(id=>Object.hasOwn(nodes,id)))fail('摘要參照無效');annotationIds.add(summary.id as string);}
        if(!(s.slides as string[]).every(id=>Object.hasOwn(nodes,id)))fail('簡報參照無效');
        try{validateDependencies(s as unknown as Sheet);}catch(error){fail((error as Error).message);}
    }
    if (!sheetIds.has(b.activeSheetId as string))
        fail('目前工作表不存在');
    return clone(raw as Workbook);
}
