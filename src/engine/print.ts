import type {Sheet} from '../core/model';
import {branchSheet, FONT, layout, wrapText, type Scene} from './layout';
import {escapeXML, sceneMarkup} from './svg';
import {automaticBranchPages, fitPage, readablePages} from './pagination';
import {annotatePages, pageRange, type PageReference, type IndexLine} from './pageReferences';

export type PrintMode = 'fit' | 'readable' | 'poster' | 'branches' | 'selection' | 'outline';
export const papers = {A4: [210, 297], A3: [297, 420], A2: [420, 594], Letter: [215.9, 279.4], Legal: [215.9, 355.6]} as const;
export type PrintSettings = {paper: keyof typeof papers | 'Custom'; customWidth: number; customHeight: number; landscape: boolean; margin: number; minPt: number; mode: PrintMode; overlap: number; header: string; footer: string; pageNumbers: boolean; background: boolean; monochrome: boolean};
export const defaultPrint: PrintSettings = {paper: 'A4', customWidth: 210, customHeight: 297, landscape: true, margin: 12, minPt: 10, mode: 'fit', overlap: 8, header: '', footer: '', pageNumbers: true, background: false, monochrome: false};
export type PrintPage = {scene: Scene; scale: number; offsetX: number; offsetY: number; label: string; row?: number; col?: number; splitNodes: string[]; minPt: number; topicIds: string[]; contextIds: string[]; references: PageReference[]; branchId?: string; reflow?: boolean; indexLines?: IndexLine[]};
export type PrintPlan = {pages: PrintPage[]; widthMM: number; heightMM: number; width: number; height: number; contentWidth: number; contentHeight: number; margin: number; referenceArea: number; warnings: string[]; nodeCount: number; estimatedPt: number; mode: PrintMode; settings: PrintSettings; topicPages: Record<string, number[]>; indexPages: number[]};
const PX = 96 / 25.4;
export function planPrint(sheet: Sheet, settings: PrintSettings, selection = sheet.rootId): PrintPlan {
  const paper = settings.paper === 'Custom' ? [settings.customWidth, settings.customHeight] : papers[settings.paper];
  if (!paper) throw new Error('不支援的紙張尺寸。');
  let [wm, hm] = paper;
  if ((settings.landscape && wm < hm) || (!settings.landscape && wm > hm)) [wm, hm] = [hm, wm];
  if (![wm, hm, settings.margin, settings.minPt, settings.overlap].every(Number.isFinite) || wm < 60 || hm < 60 || wm > 1200 || hm > 1200 || settings.margin < 0 || settings.margin > Math.min(wm, hm) / 3 || settings.minPt < 6 || settings.minPt > 36 || settings.overlap < 0 || settings.overlap > 30) throw new Error('紙張、邊界、重疊或最低字級超出可用範圍。');
  const width = wm * PX, height = hm * PX, margin = settings.margin * PX;
  const referenceArea = sheet.relationships.length || ['branches', 'readable', 'outline'].includes(settings.mode) ? 92 : 0;
  const cw = width - 2 * margin, ch = height - 2 * margin - 50 - referenceArea;
  if (cw < 100 || ch < 100) throw new Error('可列印範圍太小，請增加紙張或減少邊界。');
  const area = {width: cw, height: ch, minPt: settings.minPt + .05};
  const scoped = settings.mode === 'selection' ? branchSheet(sheet, selection) : sheet;
  const scene = layout(scoped, scoped.rootId, true), pages: PrintPage[] = [], warnings: string[] = [];
  const add = (...next: PrintPage[]) => {if (pages.length + next.length > 500) throw new Error('列印超過 500 頁安全上限，請選取分支。'); pages.push(...next);};
  if (settings.mode === 'fit' || settings.mode === 'selection') add(fitPage(scene, area, settings.mode === 'selection' ? '選取分支' : '完整心智圖'));
  else if (settings.mode === 'branches') {
    const id = sheet.rootId, center = {...sheet, nodes: {[id]: {...sheet.nodes[id], children: []}}, floating: [], relationships: [], boundaries: []};
    const centerPage = fitPage(layout(center), area, '中心主題');
    add(...(centerPage.minPt >= settings.minPt ? [centerPage] : readablePages(center, area, false, '中心主題')));
    for (const root of [...sheet.nodes[id].children, ...sheet.floating]) add(...automaticBranchPages(sheet, root, area));
    if (pages.some(p => p.contextIds.length)) warnings.push('較大的主要分支已自動分頁；淡色節點為重複脈絡，不會遺失或修改原始節點。');
    if (sheet.boundaries.length && pages.some(p => p.contextIds.length || p.reflow)) warnings.push('跨頁分支的外框只在完整包含範圍的頁面顯示；原始外框資料不會變更。');
    if (pages.some(p => p.reflow)) warnings.push('個別節點或祖先路徑超過單頁範圍，該分支已改用可讀重排，維持最低主題字級。');
  } else if (settings.mode === 'poster') {
    const smallest = Math.min(...scene.nodes.map(n => n.fontSize)), scale = Math.max(1, settings.minPt / (smallest * .75)), overlap = settings.overlap * PX;
    if (overlap >= Math.min(cw, ch) / 2) throw new Error('重疊區域過大。');
    const cols = Math.max(1, Math.ceil((scene.bounds.width * scale - overlap) / (cw - overlap))), rows = Math.max(1, Math.ceil((scene.bounds.height * scale - overlap) / (ch - overlap)));
    if (cols * rows > 500) throw new Error('海報超過 500 頁，請改用可讀分頁或選取分支。');
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
      const ox = -scene.bounds.x * scale - col * (cw - overlap), oy = -scene.bounds.y * scale - row * (ch - overlap);
      const splitNodes = scene.nodes.filter(n => {const x = n.x * scale + ox, y = n.y * scale + oy, w = n.width * scale, h = n.height * scale; return x < cw && x + w > 0 && y < ch && y + h > 0 && (x < 0 || x + w > cw || y < 0 || y + h > ch);}).map(n => n.id);
      const topicIds = scene.nodes.filter(n => {const x = (n.x + n.width / 2) * scale + ox, y = (n.y + n.height / 2) * scale + oy; return x >= 0 && x <= cw && y >= 0 && y <= ch;}).map(n => n.id);
      add({scene, scale, offsetX: ox, offsetY: oy, label: `拼接：第 ${row + 1} 列 / 第 ${col + 1} 欄`, row: row + 1, col: col + 1, splitNodes, minPt: smallest * scale * .75, topicIds, contextIds: [], references: []});
    }
    warnings.push(`海報 ${rows} 列 × ${cols} 欄，由左至右、由上至下排列；相鄰頁重疊 ${settings.overlap} mm。虛線對齊接合，邊緣節點可能刻意跨頁。`);
  } else {
    add(...readablePages(sheet, area, settings.mode === 'outline'));
    if (sheet.boundaries.length) warnings.push('可讀／大綱分頁重排階層；外框不繪製，關係以頁面提示與關係索引保留。');
  }
  const {topicPages, indexPages} = annotatePages(scoped, pages, area);
  const estimatedPt = Math.min(...pages.map(p => p.minPt));
  if (estimatedPt + .01 < settings.minPt) warnings.push(`${scene.nodes.length} 個節點；目前最小主題文字約 ${estimatedPt.toFixed(1)} pt，低於設定的 ${settings.minPt} pt。建議改用可讀分頁、較大紙張或主要分支自動分頁。`);
  if (pages.length > 100) warnings.push(`目前共 ${pages.length} 頁，建議選取分支以減少紙張。`);
  return {pages, widthMM: wm, heightMM: hm, width, height, contentWidth: cw, contentHeight: ch, margin, referenceArea, warnings, nodeCount: scene.nodes.length, estimatedPt, mode: settings.mode, settings, topicPages, indexPages};
}
function shortLine(text: string, width: number, size: number): string {const lines = wrapText(text.replaceAll('\n', ' '), size, width); return lines.length > 1 ? lines[0].slice(0, -1) + '…' : lines[0];}
export function pageSVG(plan: PrintPlan, index: number, preview = false): string {
  const p = plan.pages[index], s = plan.settings, m = plan.margin;
  const clippedScene = p.indexLines ? p.indexLines.map((line, i) => `<text x="12" y="${20 + i * 21}" font-size="14" font-weight="${line.bold ? 700 : 400}" fill="${s.monochrome ? '#111111' : '#27364b'}">${escapeXML(line.text)}</text>`).join('') : `<g transform="translate(${p.offsetX},${p.offsetY}) scale(${p.scale})">${sceneMarkup(p.scene, {monochrome: s.monochrome})}</g>`;
  const refs = p.references.slice(0, p.references.length > 3 ? 2 : 3);
  const refLines = refs.map(ref => {const arrow = ref.direction === 'incoming' ? '←' : ref.direction === 'both' ? '↔' : '→'; return {text: shortLine(`${ref.key} ${arrow} 第 ${pageRange(ref.pages)} 頁 · ${ref.label} · ${ref.target}`, plan.contentWidth - 8, 13.333), page: ref.pages[0]};});
  if (p.references.length > 3) refLines.push({text: `另 ${p.references.length - 2} 項關係，詳見索引第 ${pageRange(plan.indexPages)} 頁`, page: plan.indexPages[0]});
  const references = refLines.map((line, i) => `<a href="#page-${line.page}" data-target-page="${line.page}"><text x="${m}" y="${m + 24 + plan.contentHeight + 22 + i * 19}" font-size="13.333" fill="${s.monochrome ? '#333' : '#526d96'}">${escapeXML(line.text)}</text></a>`).join('');
  const indexHint = p.references.length && plan.indexPages.length ? `<a href="#page-${plan.indexPages[0]}" data-target-page="${plan.indexPages[0]}"><text x="${m}" y="${m + 24 + plan.contentHeight + 82}" font-size="10" fill="#666">完整關係索引：第 ${escapeXML(pageRange(plan.indexPages))} 頁</text></a>` : '';
  const marks = plan.mode === 'poster' && !p.indexLines ? `<rect x="${m}" y="${m + 24}" width="${plan.contentWidth}" height="${plan.contentHeight}" fill="none" stroke="#666" stroke-width=".6" stroke-dasharray="6 4"/>` : '';
  const guide = preview ? `<rect data-preview-guide="printable-area" x="${m}" y="${m + 24}" width="${plan.contentWidth}" height="${plan.contentHeight}" fill="none" stroke="#a9bcd5" stroke-width=".6" stroke-dasharray="4 5" pointer-events="none"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${plan.width}" height="${plan.height}" viewBox="0 0 ${plan.width} ${plan.height}" style="font-family:${escapeXML(FONT)}"><rect width="100%" height="100%" fill="white"/><defs><clipPath id="print-area-${index}"><rect width="${plan.contentWidth}" height="${plan.contentHeight}"/></clipPath></defs><text x="${m}" y="${m + 9}" font-size="10" fill="#444">${escapeXML(shortLine(s.header || p.scene.sheet.name, plan.contentWidth, 10))}</text><text x="${m}" y="${m + 21}" font-size="8.5" fill="${s.monochrome ? '#666' : '#71829c'}">${escapeXML(shortLine(p.label, plan.contentWidth, 8.5))}</text><g transform="translate(${m},${m + 24})"><g clip-path="url(#print-area-${index})">${s.background ? `<rect width="${plan.contentWidth}" height="${plan.contentHeight}" fill="${s.monochrome ? 'white' : p.scene.sheet.background}"/>` : ''}${clippedScene}</g></g>${marks}${references}${indexHint}${guide}<text x="${m}" y="${plan.height - m}" font-size="9" fill="#555">${escapeXML(shortLine(s.footer, plan.contentWidth - 90, 9))}</text>${s.pageNumbers ? `<text x="${plan.width - m}" y="${plan.height - m}" font-size="9" text-anchor="end" fill="#555">${index + 1} / ${plan.pages.length}</text>` : ''}</svg>`;
}
export function printHTML(plan: PrintPlan, fontCSS = ''): string {
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:"><title>OpenMind 列印</title><style>${fontCSS}@page{size:${plan.widthMM}mm ${plan.heightMM}mm;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:white}.page{width:${plan.widthMM}mm;height:${plan.heightMM}mm;break-after:page;overflow:hidden}.page:last-child{break-after:auto}.page>svg{display:block;width:100%;height:100%}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>${plan.pages.map((_, i) => `<section id="page-${i + 1}" class="page">${pageSVG(plan, i)}</section>`).join('')}</body></html>`;
}
export async function preparePrintHTML(plan: PrintPlan): Promise<string> {
  const {embeddedFontCSS} = await import('./fontEmbedding');
  const text = plan.pages.map((_, i) => pageSVG(plan, i).replace(/<[^>]*>/g, '')).join('\n');
  const font = await embeddedFontCSS(text); return printHTML(plan, font.css);
}
