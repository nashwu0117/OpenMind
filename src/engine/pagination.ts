import {descendants, type Sheet} from '../core/model';
import {branchSheet, layout, wrapText, type Scene, type PlacedNode} from './layout';
import type {PrintPage} from './print';
import {equationGraphic} from './equations';
import {printText, type PrintTranslator} from './locale';

export type PageArea = {width: number; height: number; minPt: number};
const LIMIT = 500;
export function fitPage(scene: Scene, area: PageArea, label: string): PrintPage {
  const scale = Math.min(area.width / scene.bounds.width, area.height / scene.bounds.height, 1.6);
  return {scene, scale, offsetX: (area.width - scene.bounds.width * scale) / 2 - scene.bounds.x * scale,
    offsetY: (area.height - scene.bounds.height * scale) / 2 - scene.bounds.y * scale, label,
    splitNodes: [], minPt: Math.min(...scene.nodes.map(n => n.fontSize)) * scale * .75,
    topicIds: scene.nodes.map(n => n.id), contextIds: [], references: []};
}

export function readablePages(sheet: Sheet, area: PageArea, outline = false, label = '', translate?: PrintTranslator): PrintPage[] {
  const tr = (source: string, values?: Array<string | number>) => printText(translate, source, values);
  const order = [...descendants(sheet, sheet.rootId), ...sheet.floating.flatMap(id => descendants(sheet, id))];
  const parents = new Map<string, string>();
  for (const node of Object.values(sheet.nodes)) for (const id of node.children) parents.set(id, node.id);
  const depths = new Map<string, number>();
  const f = Math.max(14, area.minPt / .75);
  const pages: PrintPage[] = [];
  let nodes: PlacedNode[] = [], originals: Sheet['nodes'] = {}, topicIds: string[] = [], y = 0;
  const flush = () => {
    if (!nodes.length) return;
    if (pages.length >= LIMIT) throw new Error(tr('列印超過 500 頁安全上限，請選取較小分支。'));
    pages.push({scene: {nodes, edges: [], bounds: {x: 0, y: 0, width: area.width, height: area.height},
      sheet: {...sheet, nodes: originals, relationships: [], boundaries: [],summaries:[]}}, scale: 1, offsetX: 0, offsetY: 0,
      label: tr('{0} · {1}', [label || tr(outline ? '大綱' : '可讀分頁'), pages.length + 1]), splitNodes: [], minPt: f * .75,
      topicIds: [...new Set(topicIds)], contextIds: [], references: [], reflow: true});
    nodes = []; originals = {}; topicIds = []; y = 0;
  };
  for (const id of order) {
    const parent = parents.get(id), depth = parent ? (depths.get(parent) ?? 0) + 1 : 0;
    depths.set(id, depth);
    const indent = Math.min(depth, 5) * 17, node = sheet.nodes[id];
    const context = parent ? `${tr('脈絡：{0}', [sheet.nodes[parent].text.slice(0, 28).replaceAll('\n', ' ')])}\n` : '';
    const text = outline ? `${'· '.repeat(Math.min(depth, 5))}${node.text}` : context + node.text;
    const lines = wrapText(text, f, area.width - indent - 36);
    const meta = node.marker || node.sticker || node.attachments.length || node.labels.length || node.task || node.notes || node.link;
    const equation=equationGraphic(node.equation,area.width-indent-36);
    const extra = 24 + (meta ? 23 : 0) + (node.image ? 112 : 0) + (equation?equation.height+16:0);
    const maxLines = Math.floor((area.height - extra) / (f * 1.45));
    if (maxLines < 1) throw new Error(tr('紙張無法容納目前字級與圖片，請增加紙張或降低最低字級。'));
    for (let start = 0; start < lines.length; start += maxLines) {
      const part = lines.slice(start, start + maxLines), height = part.length * f * 1.45 + extra;
      if (y + height > area.height && nodes.length) flush();
      const renderedId = start ? `${id}:continuation:${start}` : id;
      originals[renderedId] = {...node, id: renderedId, text: part.join('\n'), children: [], style: {...node.style, fontSize: f}};
      nodes.push({id: renderedId, x: indent, y, width: area.width - indent, height, lines: part, fontSize: f, color: '#3263ce', depth});
      topicIds.push(id); y += height + 12;
    }
  }
  flush(); return pages;
}

// Greedy connected partitions retain branch geometry. Ancestors repeat as context,
// while each original topic owns exactly one primary occurrence. If an individual
// path is itself too large, use explicit readable reflow for that whole branch.
export function automaticBranchPages(sheet: Sheet, root: string, area: PageArea, translate?: PrintTranslator): PrintPage[] {
  const tr = (source: string, values?: Array<string | number>) => printText(translate, source, values);
  const branch = branchSheet(sheet, root), order = descendants(branch, root), label = branch.nodes[root].text;
  const whole = fitPage(layout(branch, root, true), area, label);
  if (whole.minPt + .001 >= area.minPt) return [{...whole, branchId: root}];
  const parents = new Map<string, string>();
  for (const n of Object.values(branch.nodes)) for (const child of n.children) parents.set(child, n.id);
  const partialScene = (ids: Set<string>, primary: Set<string>): Scene => {
    const nodes = Object.fromEntries([...ids].map(id => {
      const n = branch.nodes[id];
      return [id, {...n, children: n.children.filter(c => ids.has(c)),
        style: primary.has(id) ? n.style : {...n.style, fill: '#f3f6fb', color: '#6d7e96', stroke: '#aab9cf'}}];
    }));
    return layout({...branch, nodes, relationships: branch.relationships.filter(r => ids.has(r.from) && ids.has(r.to)),
      boundaries: branch.boundaries.filter(b => descendants(branch, b.topicId).every(id => ids.has(id)))}, root, true);
  };
  const result: PrintPage[] = [];
  let current = new Set<string>(), primary = new Set<string>();
  const append = () => {
    if (!primary.size) return;
    const page = fitPage(partialScene(current, primary), area, label);
    result.push({...page, topicIds: [...primary], contextIds: [...current].filter(id => !primary.has(id)), branchId: root});
    if (result.length > LIMIT) throw new Error(tr('分支分頁超過 500 頁，請選取較小分支。'));
  };
  for (const id of order) {
    const path = [id]; let parent = parents.get(id);
    while (parent) {path.push(parent); parent = parents.get(parent);}
    const candidate = new Set([...current, ...path]), nextPrimary = new Set([...primary, id]);
    const page = fitPage(partialScene(candidate, nextPrimary), area, label);
    if (page.minPt + .001 >= area.minPt) {current = candidate; primary = nextPrimary; continue;}
    append(); current = new Set(path); primary = new Set([id]);
    if (fitPage(partialScene(current, primary), area, label).minPt + .001 < area.minPt) {
      return readablePages(branch, area, false, tr('分支 {0}（可讀重排）', [label]), translate).map(p => ({...p, branchId: root}));
    }
  }
  append();
  return result.map((page, index) => ({...page, label: tr('分支頁 {0} · {1}/{2}（淡色為重複脈絡）', [label, index + 1, result.length])}));
}
