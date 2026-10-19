import {describe, expect, it} from 'vitest';
import {activeSheet, addTopic, fixture, newWorkbook, uid} from '../src/core/model';
import {defaultPrint, pageSVG, planPrint} from '../src/engine/print';
import {pageRange} from '../src/engine/pageReferences';

describe('readable automatic main branch pagination', () => {
  it.each([10, 50, 200, 1000])('%i topics retain exact primary coverage and minimum point size', count => {
    const sheet = activeSheet(fixture(count)), before = JSON.stringify(sheet);
    const plan = planPrint(sheet, {...defaultPrint, mode: 'branches'});
    const primary = plan.pages.flatMap(p => p.topicIds);
    expect(primary).toHaveLength(count); expect(new Set(primary).size).toBe(count);
    expect(plan.estimatedPt).toBeGreaterThanOrEqual(10 - .001);
    expect(JSON.stringify(sheet)).toBe(before);
    for (const page of plan.pages) {
      expect(page.minPt).toBeGreaterThanOrEqual(10 - .001);
      expect(page.splitNodes).toEqual([]);
      for (const n of page.scene.nodes) {
        const x = n.x * page.scale + page.offsetX, y = n.y * page.scale + page.offsetY;
        expect(x).toBeGreaterThanOrEqual(-.01); expect(y).toBeGreaterThanOrEqual(-.01);
        expect(x + n.width * page.scale).toBeLessThanOrEqual(plan.contentWidth + .01);
        expect(y + n.height * page.scale).toBeLessThanOrEqual(plan.contentHeight + .01);
      }
    }
  });
  it('splits an oversized single branch with repeated ancestors and reciprocal continuation hints', () => {
    const sheet = activeSheet(newWorkbook()), branch = addTopic(sheet, sheet.rootId, '大型分支');
    for (let i = 0; i < 90; i++) addTopic(sheet, branch, `行動 ${i} 繁體中文內容`);
    const plan = planPrint(sheet, {...defaultPrint, mode: 'branches'}), pages = plan.pages.filter(p => p.branchId === branch);
    expect(pages.length).toBeGreaterThan(1); expect(pages.some(p => p.contextIds.includes(branch))).toBe(true);
    expect(pages[0].references.some(r => r.label === '分支續頁')).toBe(true);
    expect(pages[1].references.some(r => r.label === '接續前頁')).toBe(true);
  });
  it('falls back explicitly when a deep path or a single long node cannot fit', () => {
    const sheet = activeSheet(newWorkbook()); let current = addTopic(sheet, sheet.rootId, '深層分支');
    for (let i = 0; i < 24; i++) current = addTopic(sheet, current, `${i} 階層`);
    sheet.nodes[current].text = '繁體中文'.repeat(1000);
    const plan = planPrint(sheet, {...defaultPrint, mode: 'branches'});
    expect(plan.pages.some(p => p.reflow)).toBe(true); expect(plan.estimatedPt).toBeGreaterThanOrEqual(10);
    expect(plan.warnings.join('')).toContain('可讀重排');
  });
});
describe('cross-page relationships', () => {
  it('resolves actual source/target page numbers in both directions and a complete index', () => {
    const sheet = activeSheet(fixture(50)), ids = Object.keys(sheet.nodes), from = ids[10], to = ids[45];
    sheet.relationships.push({id: uid(), from, to, text: '跨頁依賴關係', directed: true, dashed: true});
    const plan = planPrint(sheet, {...defaultPrint, mode: 'branches'});
    const a = plan.topicPages[from][0], b = plan.topicPages[to][0]; expect(a).not.toBe(b);
    expect(plan.pages[a - 1].references).toContainEqual(expect.objectContaining({key: 'R1', direction: 'outgoing', pages: [b]}));
    expect(plan.pages[b - 1].references).toContainEqual(expect.objectContaining({key: 'R1', direction: 'incoming', pages: [a]}));
    expect(plan.indexPages.length).toBeGreaterThan(0);
    expect(plan.pages.filter(p => p.indexLines).flatMap(p => p.indexLines!.map(l => l.text)).join('')).toContain('跨頁依賴關係');
    expect(pageSVG(plan, a - 1)).toContain(`data-target-page="${b}"`);
    const monochrome = planPrint(sheet, {...defaultPrint, mode: 'branches', monochrome: true});
    expect(pageSVG(monochrome, monochrome.indexPages[0] - 1)).not.toContain('#27364b');
  });
  it('retains every relationship label when footer capacity is exceeded', () => {
    const sheet = activeSheet(fixture(50)), ids = Object.keys(sheet.nodes);
    for (let i = 0; i < 30; i++) sheet.relationships.push({id: uid(), from: ids[1], to: ids[20 + i], text: `關係標籤 ${i} <&>`, directed: false, dashed: false});
    const plan = planPrint(sheet, {...defaultPrint, mode: 'branches'});
    const text = plan.pages.filter(p => p.indexLines).flatMap(p => p.indexLines!.map(l => l.text)).join('\n');
    for (let i = 0; i < 30; i++) expect(text).toContain(`關係標籤 ${i} <&>`);
    const busy = plan.pages.findIndex(p => p.references.length > 3); expect(busy).toBeGreaterThanOrEqual(0);
    expect(pageSVG(plan, busy)).toContain('詳見索引');
  });
  it('prints same-page relationships as references in reflow and handles missing scoped endpoints', () => {
    const sheet = activeSheet(fixture(10)), ids = Object.keys(sheet.nodes);
    sheet.relationships.push({id: uid(), from: ids[0], to: ids[1], text: '同頁仍有意義', directed: true, dashed: true});
    const plan = planPrint(sheet, {...defaultPrint, mode: 'readable'});
    expect(plan.pages.some(p => p.references.some(r => r.key === 'R1'))).toBe(true);
    const scoped = planPrint(sheet, {...defaultPrint, mode: 'selection'}, ids.at(-1)!);
    expect(scoped.indexPages).toEqual([]);
  });
  it('formats deterministic ranges and keeps preview-only guides out of export', () => {
    expect(pageRange([5, 2, 1, 2, 3, 8])).toBe('1–3、5、8');
    const plan = planPrint(activeSheet(fixture(10)), defaultPrint);
    expect(pageSVG(plan, 0, true)).toContain('data-preview-guide'); expect(pageSVG(plan, 0)).not.toContain('data-preview-guide');
  });
});
