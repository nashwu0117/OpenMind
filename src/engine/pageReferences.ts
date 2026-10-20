import type {Sheet} from '../core/model';
import {wrapText} from './layout';
import type {PrintPage} from './print';
import type {PageArea} from './pagination';

export type PageReference = {key: string; kind: 'relationship' | 'continuation' | 'summary'; direction: 'outgoing' | 'incoming' | 'both'; label: string; target: string; pages: number[]};
export type IndexLine = {text: string; bold?: boolean};
export function pageRange(pages: number[]): string {
  const values = [...new Set(pages)].sort((a, b) => a - b), ranges: string[] = [];
  for (let i = 0; i < values.length; i++) {const first = values[i]; let last = first;
    while (values[i + 1] === last + 1) last = values[++i];
    ranges.push(first === last ? `${first}` : `${first}–${last}`);}
  return ranges.join('、');
}
export function annotatePages(sheet: Sheet, pages: PrintPage[], area: PageArea): {topicPages: Record<string, number[]>; indexPages: number[]} {
  const locations = new Map<string, number[]>();
  pages.forEach((page, index) => {page.references = [];
    for (const id of new Set(page.topicIds)) locations.set(id, [...locations.get(id) ?? [], index + 1]);});
  const indexRows: {key: string; lines: IndexLine[]}[] = [];
  let needsIndex = false;
  sheet.relationships.forEach((relationship, i) => {
    const fromPages = locations.get(relationship.from), toPages = locations.get(relationship.to);
    if (!fromPages?.length || !toPages?.length) return;
    const key = `R${i + 1}`;
    const add = (source: number[], target: number[], targetId: string, direction: PageReference['direction']) => {
      for (const number of source) {const page = pages[number - 1];
        if (target.includes(number) && !page.reflow) continue;
        page.references.push({key, kind: 'relationship', direction, label: relationship.text || '未命名關係',
          target: sheet.nodes[targetId].text, pages: target.includes(number) ? [number] : target}); needsIndex = true;}
    };
    add(fromPages, toPages, relationship.to, relationship.directed ? 'outgoing' : 'both');
    add(toPages, fromPages, relationship.from, relationship.directed ? 'incoming' : 'both');
    indexRows.push({key, lines: [
      ...wrapText(`${key} · ${relationship.text || '未命名關係'}`, 14, area.width - 24).map(text => ({text, bold: true})),
      {text: `來源：第 ${pageRange(fromPages)} 頁 · ${sheet.nodes[relationship.from].text.replaceAll('\n', ' ').slice(0, 80)}`},
      {text: `${relationship.directed ? '指向' : '連結'}：第 ${pageRange(toPages)} 頁 · ${sheet.nodes[relationship.to].text.replaceAll('\n', ' ').slice(0, 80)}`},
    ]});
  });
  sheet.summaries.forEach((summary,i)=>{
    const numbers=[...new Set(summary.topicIds.flatMap(id=>locations.get(id)??[]))].sort((a,b)=>a-b);if(!numbers.length)return;
    const key=`S${i+1}`;
    if(numbers.length>1||numbers.some(number=>pages[number-1].reflow)){needsIndex=true;for(const number of numbers)pages[number-1].references.push({key,kind:'summary',direction:'both',label:summary.text,target:'摘要範圍',pages:numbers.filter(n=>n!==number).length?numbers.filter(n=>n!==number):[number]});}
    indexRows.push({key,lines:[...wrapText(`${key} · ${summary.text}`,14,area.width-24).map(text=>({text,bold:true})),{text:`範圍：第 ${pageRange(numbers)} 頁`},...summary.topicIds.filter(id=>locations.has(id)).map(id=>({text:`第 ${pageRange(locations.get(id)!)} 頁 · ${sheet.nodes[id].text.replaceAll('\n',' ').slice(0,80)}`}))]});
  });
  const branches = new Map<string, number[]>();
  pages.forEach((page, index) => {if (page.branchId) branches.set(page.branchId, [...branches.get(page.branchId) ?? [], index + 1]);});
  let branchIndex = 0;
  for (const [id, numbers] of branches) {branchIndex++; if (numbers.length < 2) continue;
    numbers.forEach((number, i) => {
      const add = (target: number, label: string, direction: PageReference['direction']) => pages[number - 1].references.unshift({key: `B${branchIndex}`, kind: 'continuation', direction, label, target: sheet.nodes[id].text, pages: [target]});
      if (i) add(numbers[i - 1], '接續前頁', 'incoming');
      if (i + 1 < numbers.length) add(numbers[i + 1], '分支續頁', 'outgoing');
    });
  }
  const indexPages: number[] = [], maxLines = Math.floor((area.height - 16) / 21);
  if (!needsIndex) return {topicPages: Object.fromEntries(locations), indexPages};
  let lines: IndexLine[] = [];
  const flush = () => {
    if (!lines.length) return;
    if (pages.length >= 500) throw new Error('含跨頁關係索引超過 500 頁，請縮小列印範圍。');
    pages.push({scene: {nodes: [], edges: [], bounds: {x: 0, y: 0, width: area.width, height: area.height}, sheet},
      scale: 1, offsetX: 0, offsetY: 0, label: `跨頁關係索引 ${indexPages.length + 1}`, splitNodes: [], minPt: 10.5,
      topicIds: [], contextIds: [], references: [], indexLines: lines});
    indexPages.push(pages.length); lines = [];
  };
  for (const row of indexRows) {
    const expanded = row.lines.flatMap(line => wrapText(line.text, 14, area.width - 24).map(text => ({...line, text})));
    if (lines.length && expanded.length + 1 > maxLines - lines.length) flush();
    for (const line of expanded) {if (lines.length >= maxLines) {flush(); lines.push({text: `${row.key}（續）`, bold: true});} lines.push(line);}
    if (lines.length < maxLines) lines.push({text: ''});
  }
  flush(); return {topicPages: Object.fromEntries(locations), indexPages};
}
