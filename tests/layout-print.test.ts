import { describe, it, expect } from 'vitest';
import { activeSheet, addTopic, fixture, newWorkbook, uid, type Structure } from '../src/core/model';
import { branchSheet, layout, textWidth, wrapText } from '../src/engine/layout';
import { renderSVG } from '../src/engine/svg';
import { defaultPrint, papers, pageSVG, planPrint, printHTML, type PrintMode } from '../src/engine/print';
function overlaps(scene: ReturnType<typeof layout>) { const ns = scene.nodes; for (let i = 0; i < ns.length; i++)
    for (let j = i + 1; j < ns.length; j++) {
        const a = ns[i], b = ns[j];
        if (a.x + 1 < b.x + b.width && a.x + a.width > b.x + 1 && a.y + 1 < b.y + b.height && a.y + a.height > b.y + 1)
            return [a.id, b.id];
    } return []; }
describe('shared vector layout', () => {
    it.each([10, 50, 200, 1000])('%i-node CJK fixture has all topics, finite bounds and no overlap', count => { const start = performance.now(); const s = activeSheet(fixture(count)); const scene = layout(s); expect(scene.nodes).toHaveLength(count); expect(overlaps(scene)).toEqual([]); expect(scene.nodes.every(n => Number.isFinite(n.x) && Number.isFinite(n.y))).toBe(true); expect(performance.now() - start).toBeLessThan(3000); for (const n of scene.nodes) {
        expect(n.x).toBeGreaterThanOrEqual(scene.bounds.x);
        expect(n.y + n.height).toBeLessThanOrEqual(scene.bounds.y + scene.bounds.height);
    } });
    it.each(['mindmap', 'logic', 'tree', 'org', 'timeline'] as Structure[])('%s structure has valid geometry', structure => { const s = activeSheet(fixture(200)); s.structure = structure; const scene = layout(s); expect(overlaps(scene)).toEqual([]); expect(scene.edges).toHaveLength(199); });
    it('wraps long/multiline CJK and measures image/annotation bounds', () => { const s = activeSheet(newWorkbook()); s.nodes[s.rootId].text = '繁體中文長文字'.repeat(90) + '\n第二行'; s.nodes[s.rootId].image = 'data:image/png;base64,YQ=='; s.boundaries.push({ id: uid(), topicId: s.rootId, text: '重要內容' }); const scene = layout(s); expect(scene.nodes[0].lines.length).toBeGreaterThan(50); for (const line of scene.nodes[0].lines)
        expect(textWidth(line, 23)).toBeLessThanOrEqual(224); expect(scene.bounds.height).toBeGreaterThan(scene.nodes[0].height + 50); expect(renderSVG(scene)).toContain('data:image/png'); });
    it('handles extreme width/height and collapsed branches deterministically', () => { for (const kind of ['wide', 'deep']) {
        const s = activeSheet(newWorkbook());
        let p = s.rootId;
        for (let i = 0; i < 110; i++) {
            p = addTopic(s, kind === 'wide' ? s.rootId : p, `${i}`);
        }
        const a = layout(s);
        expect(overlaps(a)).toEqual([]);
        expect(layout(s)).toEqual(a);
        s.nodes[s.rootId].collapsed = true;
        expect(layout(s).nodes).toHaveLength(1);
        expect(layout(s, s.rootId, true).nodes).toHaveLength(111);
    } });
    it('escapes hostile text in SVG and has no foreignObject/script', () => { const s = activeSheet(newWorkbook()); s.nodes[s.rootId].text = '<script>alert("x")</script> & 中文'; const svg = renderSVG(layout(s)); expect(svg).toContain('&lt;'); expect(svg).not.toContain('<script>'); expect(svg).not.toContain('foreignObject'); expect(wrapText('中文\nEnglish', 16, 50).join('')).toContain('中文'); });
});
describe('physical print planning', () => {
    it.each([10, 50, 200, 1000])('readability pagination covers %i nodes at >=10pt without clipping', count => { const s = activeSheet(fixture(count)); const plan = planPrint(s, { ...defaultPrint, mode: 'readable' }); const ids = plan.pages.flatMap(p => p.scene.nodes.map(n => n.id)); expect(new Set(ids).size).toBe(count); expect(plan.estimatedPt).toBeGreaterThanOrEqual(10); for (const p of plan.pages) {
        expect(overlaps(p.scene)).toEqual([]);
        for (const n of p.scene.nodes) {
            expect(n.x).toBeGreaterThanOrEqual(0);
            expect(n.x + n.width).toBeLessThanOrEqual(plan.contentWidth + 0.01);
            expect(n.y + n.height).toBeLessThanOrEqual(plan.contentHeight + 0.01);
        }
    } });
    it.each(Object.keys(papers) as (keyof typeof papers)[])('%s portrait and landscape have correct physical sizes', paper => { const s = activeSheet(fixture(10)); for (const landscape of [false, true]) {
        const plan = planPrint(s, { ...defaultPrint, paper, landscape });
        expect(plan.widthMM > plan.heightMM).toBe(landscape);
        expect(printHTML(plan)).toContain(`size:${plan.widthMM}mm ${plan.heightMM}mm`);
    } });
    it('warns from actual size rather than silently promising readability', () => { const s = activeSheet(fixture(1000)); const small = planPrint(s, defaultPrint); expect(small.estimatedPt).toBeLessThan(10); expect(small.warnings.join('')).toContain('1000'); const bigger = planPrint(s, { ...defaultPrint, paper: 'A2' }); expect(bigger.estimatedPt).toBeGreaterThan(small.estimatedPt); });
    it.each(['fit', 'readable', 'poster', 'branches', 'selection', 'outline'] as PrintMode[])('%s has finite pages and immutable input', mode => { const s = activeSheet(fixture(50)), before = JSON.stringify(s); const plan = planPrint(s, { ...defaultPrint, mode }, s.nodes[s.rootId].children[0]); expect(plan.pages.length).toBeGreaterThan(0); expect(plan.pages.every(p => Number.isFinite(p.scale) && p.scale > 0)).toBe(true); expect(JSON.stringify(s)).toBe(before); expect(pageSVG(plan, 0)).toContain('<svg'); });
    it('posters use row-major order, overlap and intentional cut reporting', () => { const s = activeSheet(fixture(200)); const plan = planPrint(s, { ...defaultPrint, mode: 'poster' }); expect(plan.pages.length).toBeGreaterThan(1); expect(plan.pages[0].row).toBe(1); expect(plan.pages[0].col).toBe(1); expect(plan.pages.some(p => p.splitNodes.length > 0)).toBe(true); expect(pageSVG(plan, 0)).toContain('stroke-dasharray'); expect(plan.warnings.join('')).toContain('8 mm'); });
    it('selection includes exactly its subtree and does not depend on canvas state', () => { const s = activeSheet(fixture(50)); const id = s.nodes[s.rootId].children[0]; const a = planPrint(s, { ...defaultPrint, mode: 'selection' }, id); expect(a.nodeCount).toBe(Object.keys(branchSheet(s, id).nodes).length); expect(planPrint(s, { ...defaultPrint, mode: 'selection' }, id)).toEqual(a); });
    it('splits extraordinary text into continuation cards without losing lines', () => { const s = activeSheet(newWorkbook()); s.nodes[s.rootId].text = '印刷文字'.repeat(2000); const plan = planPrint(s, { ...defaultPrint, mode: 'outline' }); expect(plan.pages.length).toBeGreaterThan(1); const text = plan.pages.flatMap(p => p.scene.nodes.flatMap(n => n.lines)).join(''); expect(text).toBe(s.nodes[s.rootId].text); for (const p of plan.pages)
        for (const n of p.scene.nodes)
            expect(n.y + n.height).toBeLessThanOrEqual(plan.contentHeight); });
    it('keeps print calls independent and renders black and white without colored fills', () => { const s = activeSheet(fixture(10)); const a = planPrint(s, { ...defaultPrint, mode: 'outline', monochrome: true }); const first = pageSVG(a, 0); planPrint(activeSheet(fixture(50)), { ...defaultPrint, mode: 'outline' }); expect(pageSVG(a, 0)).toBe(first); expect(first).not.toContain('fill="#244f9e"'); expect(first).toContain('fill="#111111"'); });
    it.each([{ margin: 200 }, { customWidth: 20, paper: 'Custom' as const }, { minPt: NaN }, { overlap: 100 }])('rejects invalid geometry %j', settings => { expect(() => planPrint(activeSheet(fixture(10)), { ...defaultPrint, ...settings })).toThrow(); });
});
