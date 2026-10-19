import { descendants, type Sheet } from '../core/model';
import { branchSheet, FONT, layout, wrapText, type Scene, type PlacedNode } from './layout';
import { escapeXML, sceneMarkup } from './svg';
export type PrintMode = 'fit' | 'readable' | 'poster' | 'branches' | 'selection' | 'outline';
export const papers = { A4: [210, 297], A3: [297, 420], A2: [420, 594], Letter: [215.9, 279.4], Legal: [215.9, 355.6] } as const;
export type PrintSettings = {
    paper: keyof typeof papers | 'Custom';
    customWidth: number;
    customHeight: number;
    landscape: boolean;
    margin: number;
    minPt: number;
    mode: PrintMode;
    overlap: number;
    header: string;
    footer: string;
    pageNumbers: boolean;
    background: boolean;
    monochrome: boolean;
};
export const defaultPrint: PrintSettings = { paper: 'A4', customWidth: 210, customHeight: 297, landscape: true, margin: 12, minPt: 10, mode: 'fit', overlap: 8, header: '', footer: '', pageNumbers: true, background: false, monochrome: false };
export type PrintPage = {
    scene: Scene;
    scale: number;
    offsetX: number;
    offsetY: number;
    label: string;
    row?: number;
    col?: number;
    splitNodes: string[];
    minPt: number;
};
export type PrintPlan = {
    pages: PrintPage[];
    widthMM: number;
    heightMM: number;
    width: number;
    height: number;
    contentWidth: number;
    contentHeight: number;
    margin: number;
    warnings: string[];
    nodeCount: number;
    estimatedPt: number;
    mode: PrintMode;
    settings: PrintSettings;
};
const PX = 96 / 25.4;
export function planPrint(sheet: Sheet, settings: PrintSettings, selection = sheet.rootId): PrintPlan {
    const mm = settings.paper === 'Custom' ? [settings.customWidth, settings.customHeight] : papers[settings.paper];
    let [wm, hm] = mm;
    if (settings.landscape && wm < hm)
        [wm, hm] = [hm, wm];
    if (!settings.landscape && wm > hm)
        [wm, hm] = [hm, wm];
    if (![wm, hm, settings.margin, settings.minPt, settings.overlap].every(Number.isFinite) || wm < 60 || hm < 60 || wm > 1200 || hm > 1200 || settings.margin < 0 || settings.margin > Math.min(wm, hm) / 3 || settings.minPt < 6 || settings.minPt > 36 || settings.overlap < 0 || settings.overlap > 30)
        throw new Error('紙張、邊界、重疊或最低字級超出可用範圍。');
    const width = wm * PX, height = hm * PX, margin = settings.margin * PX;
    const cw = width - 2 * margin, ch = height - 2 * margin - 42;
    if (cw < 100 || ch < 100)
        throw new Error('可列印範圍太小，請增加紙張大小或減少邊界。');
    const scoped = settings.mode === 'selection' ? branchSheet(sheet, selection) : sheet;
    const scene = layout(scoped, scoped.rootId, true);
    const pages: PrintPage[] = [];
    const warnings: string[] = [];
    const reflowNodes = new Map<string, Sheet['nodes'][string]>();
    const fit = (sc: Scene, label: string) => { const scale = Math.min(cw / sc.bounds.width, ch / sc.bounds.height, 1.6); pages.push({ scene: sc, scale, offsetX: (cw - sc.bounds.width * scale) / 2 - sc.bounds.x * scale, offsetY: (ch - sc.bounds.height * scale) / 2 - sc.bounds.y * scale, label, splitNodes: [], minPt: Math.min(...sc.nodes.map(n => n.fontSize)) * scale * 0.75 }); };
    const addPage = (page: PrintPage) => { if (pages.length >= 500)
        throw new Error('列印超過 500 頁安全上限，請選取分支或增加紙張大小。'); pages.push(page); };
    if (settings.mode === 'fit' || settings.mode === 'selection')
        fit(scene, settings.mode === 'selection' ? '選取分支' : '完整心智圖');
    else if (settings.mode === 'branches') {
        const roots = [sheet.rootId, ...sheet.nodes[sheet.rootId].children, ...sheet.floating];
        for (const id of roots) {
            if (id === sheet.rootId) {
                const s = { ...sheet, nodes: { [id]: { ...sheet.nodes[id], children: [] } }, floating: [], relationships: [], boundaries: [] };
                fit(layout(s, id, true), '中心主題');
            }
            else
                fit(layout(branchSheet(sheet, id), id, true), sheet.nodes[id].text);
        }
    }
    else if (settings.mode === 'poster') {
        const scale = Math.max(1, settings.minPt / (Math.min(...scene.nodes.map(n => n.fontSize)) * 0.75));
        const overlap = settings.overlap * PX;
        if (overlap >= Math.min(cw, ch) / 2)
            throw new Error('重疊區域過大。');
        const cols = Math.max(1, Math.ceil((scene.bounds.width * scale - overlap) / (cw - overlap))), rows = Math.max(1, Math.ceil((scene.bounds.height * scale - overlap) / (ch - overlap)));
        if (cols * rows > 500)
            throw new Error('海報超過 500 頁，請改用可讀分頁或選取分支。');
        for (let row = 0; row < rows; row++)
            for (let col = 0; col < cols; col++) {
                const ox = -scene.bounds.x * scale - col * (cw - overlap), oy = -scene.bounds.y * scale - row * (ch - overlap);
                const split = scene.nodes.filter(n => { const x = n.x * scale + ox, y = n.y * scale + oy, w = n.width * scale, h = n.height * scale; return x < cw && x + w > 0 && y < ch && y + h > 0 && (x < 0 || x + w > cw || y < 0 || y + h > ch); }).map(n => n.id);
                addPage({ scene, scale, offsetX: ox, offsetY: oy, label: `拼接：第 ${row + 1} 列 / 第 ${col + 1} 欄`, row: row + 1, col: col + 1, splitNodes: split, minPt: Math.min(...scene.nodes.map(n => n.fontSize)) * scale * 0.75 });
            }
        warnings.push(`海報 ${rows} 列 × ${cols} 欄，由左至右、由上至下排列；相鄰頁重疊 ${settings.overlap} mm。沿虛線對齊接合，請勿裁掉重疊內容。邊緣節點可能刻意跨頁。`);
    }
    else {
        // Readable/outline pagination is a semantic reflow, not silent map shrinking.
        const order = [...descendants(sheet, sheet.rootId), ...sheet.floating.flatMap(id => descendants(sheet, id))];
        const parent = new Map<string, string>();
        for (const n of Object.values(sheet.nodes))
            for (const c of n.children)
                parent.set(c, n.id);
        const depth = new Map<string, number>();
        const f = Math.max(14, settings.minPt / 0.75);
        let y = 0;
        let ns: PlacedNode[] = [];
        let seq = 1;
        const flush = () => { if (!ns.length)
            return; const ps: Scene = { nodes: ns, edges: [], bounds: { x: 0, y: 0, width: cw, height: ch }, sheet: { ...sheet, relationships: [], boundaries: [] } }; addPage({ scene: ps, scale: 1, offsetX: 0, offsetY: 0, label: `${settings.mode === 'outline' ? '大綱' : '可讀分頁'} ${seq++}`, splitNodes: [], minPt: f * 0.75 }); ns = []; y = 0; };
        for (const id of order) {
            const p = parent.get(id);
            const d = p ? (depth.get(p) ?? 0) + 1 : 0;
            depth.set(id, d);
            const indent = Math.min(d, 5) * 17;
            const orig = sheet.nodes[id];
            const context = p ? `〔${sheet.nodes[p].text.slice(0, 28).replaceAll('\n', ' ')}〕\n` : '';
            const text = settings.mode === 'outline' ? `${'· '.repeat(Math.min(d, 5))}${orig.text}` : context + orig.text;
            const style = { ...orig.style, fontSize: f };
            const lines = wrapText(text, f, cw - indent - 36);
            const meta = orig.marker || orig.labels.length || orig.task || orig.notes || orig.link;
            const fullHeight = lines.length * f * 1.45 + 24 + (meta ? 23 : 0) + (orig.image ? 112 : 0);
            // Split exceptionally long text into explicit continuation cards, never clip it.
            const maxLines = Math.max(1, Math.floor((ch - 24 - (meta ? 23 : 0) - (orig.image ? 112 : 0)) / (f * 1.45)));
            for (let i = 0; i < lines.length; i += maxLines) {
                const part = lines.slice(i, i + maxLines);
                const h = Math.min(fullHeight, part.length * f * 1.45 + 24 + (meta ? 23 : 0) + (orig.image ? 112 : 0));
                if (y + h > ch && ns.length)
                    flush();
                const renderedId = i === 0 ? id : `${id}:continuation:${i}`;
                const n = { ...orig, id: renderedId, text: part.join('\n'), style, children: [] };
                if (i > 0)
                    n.text = '（續）' + n.text;
                // Retain original data fields while giving reflow its own immutable sheet.
                ns.push({ id: renderedId, x: indent, y, width: cw - indent, height: h, lines: part, fontSize: f, color: '#3263ce', depth: d });
                reflowNodes.set(renderedId, n);
                y += h + 12;
            }
        }
        flush();
        for (const page of pages)
            page.scene = { ...page.scene, sheet: { ...page.scene.sheet, nodes: Object.fromEntries(page.scene.nodes.map(n => [n.id, reflowNodes.get(n.id)!])) } };
        if (sheet.relationships.length || sheet.boundaries.length)
            warnings.push('可讀／大綱分頁重排階層；外框與關係線不繪製。完整幾何標註請用單頁、分支或海報模式。');
    }
    const estimatedPt = Math.min(...pages.map(p => p.minPt));
    if (estimatedPt + 0.01 < settings.minPt)
        warnings.push(`${scene.nodes.length} 個節點；目前最小節點文字約 ${estimatedPt.toFixed(1)} pt，低於設定的 ${settings.minPt} pt。建議改用可讀分頁、較大紙張或分支分頁。`);
    if (pages.length > 100)
        warnings.push(`目前共 ${pages.length} 頁，建議選取分支以減少紙張。`);
    return { pages, widthMM: wm, heightMM: hm, width, height, contentWidth: cw, contentHeight: ch, margin, warnings, nodeCount: scene.nodes.length, estimatedPt, mode: settings.mode, settings };
}
export function pageSVG(plan: PrintPlan, index: number): string {
    const p = plan.pages[index], s = plan.settings;
    const m = plan.margin;
    const marks = plan.mode === 'poster' ? `<rect x="${m}" y="${m + 22}" width="${plan.contentWidth}" height="${plan.contentHeight}" fill="none" stroke="#666" stroke-width="0.6" stroke-dasharray="6 4"/><text x="${m}" y="${plan.height - m + 10}" font-size="9">重疊 ${s.overlap} mm · ${escapeXML(p.label)}</text>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${plan.width}" height="${plan.height}" viewBox="0 0 ${plan.width} ${plan.height}" style="font-family:${escapeXML(FONT)}"><rect width="100%" height="100%" fill="white"/><defs><clipPath id="print-area"><rect width="${plan.contentWidth}" height="${plan.contentHeight}"/></clipPath></defs><text x="${m}" y="${m + 10}" font-size="10" fill="#444">${escapeXML((s.header || p.scene.sheet.name).slice(0, 100))}</text><g transform="translate(${m},${m + 22})"><g clip-path="url(#print-area)">${s.background ? `<rect width="${plan.contentWidth}" height="${plan.contentHeight}" fill="${s.monochrome ? 'white' : p.scene.sheet.background}"/>` : ''}<g transform="translate(${p.offsetX},${p.offsetY}) scale(${p.scale})">${sceneMarkup(p.scene, { monochrome: s.monochrome })}</g></g></g>${marks}<text x="${m}" y="${plan.height - m}" font-size="9" fill="#555">${escapeXML(s.footer.slice(0, 100))}</text>${s.pageNumbers ? `<text x="${plan.width - m}" y="${plan.height - m}" font-size="9" text-anchor="end" fill="#555">${index + 1} / ${plan.pages.length}</text>` : ''}</svg>`;
}
export function printHTML(plan: PrintPlan): string { return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:"><title>OpenMind 列印</title><style>@page{size:${plan.widthMM}mm ${plan.heightMM}mm;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:white}.page{width:${plan.widthMM}mm;height:${plan.heightMM}mm;break-after:page;overflow:hidden}.page:last-child{break-after:auto}.page>svg{display:block;width:100%;height:100%}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>${plan.pages.map((_, i) => `<section class="page">${pageSVG(plan, i)}</section>`).join('')}</body></html>`; }
