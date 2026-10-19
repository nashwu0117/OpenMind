import { describe, it, expect } from 'vitest';
import { activeSheet, addTopic, clone, copyBranch, demoWorkbook, descendants, fixture, moveTopic, newWorkbook, parentId, removeTopics, uid, validateWorkbook } from '../src/core/model';
import { commit, historyOf, redo, undo } from '../src/core/history';
import { loadRecovery, saveRecovery } from '../src/core/storage';
import { markdown, nativeJSON, parseMarkdown, parseNative, opml } from '../src/io/formats';
describe('document model and history', () => {
    it('reparents and reorders without allowing cycles or moving the root', () => { const s = activeSheet(newWorkbook()), a = addTopic(s, s.rootId, 'a'), b = addTopic(s, a, 'b'), c = addTopic(s, s.rootId, 'c'); expect(moveTopic(s, a, b)).toBe(false); expect(moveTopic(s, s.rootId, c)).toBe(false); expect(moveTopic(s, b, c)).toBe(true); expect(parentId(s, b)).toBe(c); expect(moveTopic(s, c, s.rootId, 0)).toBe(true); expect(s.nodes[s.rootId].children).toEqual([c, a]); });
    it('copies a deep subtree with independent stable IDs and styles', () => { const s = activeSheet(demoWorkbook()), id = s.nodes[s.rootId].children[0]; const pasted = copyBranch(s, id, s.rootId); expect(descendants(s, pasted)).toHaveLength(descendants(s, id).length); expect(s.nodes[pasted].style).toEqual(s.nodes[id].style); s.nodes[pasted].text = 'changed'; expect(s.nodes[id].text).not.toBe('changed'); validateWorkbook({ ...newWorkbook(), sheets: [s], activeSheetId: s.id }); });
    it('deletes subtrees and anchored references but protects the root', () => { const b = newWorkbook(), s = activeSheet(b), a = addTopic(s, s.rootId), c = addTopic(s, a); s.relationships.push({ id: uid(), from: a, to: c, text: '關係', directed: true, dashed: false }); s.boundaries.push({ id: uid(), topicId: a, text: '外框' }); removeTopics(s, [s.rootId, a]); expect(Object.keys(s.nodes)).toEqual([s.rootId]); expect(s.relationships).toEqual([]); expect(s.boundaries).toEqual([]); expect(validateWorkbook(b)).toEqual(b); });
    it('undo/redo restores exact documents and invalidates redo on a new transaction', () => { const base = demoWorkbook(); let h = historyOf(base); h = commit(h, b => { activeSheet(b).nodes[activeSheet(b).rootId].text = '一次完整編輯'; }); const edited = clone(h.present); h = undo(h); expect(h.present).toEqual(base); h = redo(h); expect(h.present).toEqual(edited); h = commit(undo(h), b => b.title = '另一條路'); expect(h.future).toHaveLength(0); expect(commit(h, () => { })).toBe(h); });
    it('caps undo snapshots', () => { let h = historyOf(newWorkbook()); for (let i = 0; i < 100; i++)
        h = commit(h, b => b.title = `${i}`); expect(h.past).toHaveLength(80); });
});
describe('trust boundary and lossless files', () => {
    it('roundtrips Unicode, styles, links, tasks, images, annotations and sheets', () => { const b = demoWorkbook(), s = activeSheet(b), id = s.nodes[s.rootId].children[0]; Object.assign(s.nodes[id], { text: '繁體中文\nEnglish & <特殊> 🔎', notes: '私密筆記', labels: ['專案', '研究'], link: 'https://example.com', marker: '★', task: { status: 'doing', start: '2026-10-20', due: '2026-10-22' }, image: 'data:image/png;base64,iVBORw0KGgo=' }); s.relationships.push({ id: uid(), from: id, to: s.rootId, text: '關係', directed: true, dashed: true }); s.boundaries.push({ id: uid(), topicId: id, text: '範圍' }); const other = clone(s); other.id = uid(); b.sheets.push(other); expect(parseNative(nativeJSON(b))).toEqual(b); });
    it.each(['cycle', 'orphan', 'missing', 'version', 'unknown', 'unsafe-link', 'NaN', 'duplicate-child', 'bad-date'])('rejects %s without changing the source', kind => { const b = demoWorkbook(), original = nativeJSON(b), s = activeSheet(b), id = s.nodes[s.rootId].children[0]; if (kind === 'cycle')
        s.nodes[id].children.push(s.rootId); if (kind === 'orphan')
        s.nodes.orphan = { ...clone(s.nodes[id]), id: 'orphan' }; if (kind === 'missing')
        s.nodes[id].children.push('gone'); if (kind === 'version')
        (b as unknown as {
            version: number;
        }).version = 2; if (kind === 'unknown')
        (s.nodes[id] as unknown as Record<string, unknown>).secret = 'unknown'; if (kind === 'unsafe-link')
        s.nodes[id].link = 'javascript:alert(1)'; if (kind === 'NaN')
        s.nodes[id].style.fontSize = NaN; if (kind === 'duplicate-child')
        s.nodes[s.rootId].children.push(id); if (kind === 'bad-date')
        s.nodes[id].task = { status: 'todo', start: '2026-02-30', due: '' }; expect(() => validateWorkbook(b)).toThrow(); expect(parseNative(original).format).toBe('openmind'); });
    it('rejects deep trees rather than overflowing the call stack', () => { const b = newWorkbook(), s = activeSheet(b); let p = s.rootId; for (let i = 0; i < 130; i++)
        p = addTopic(s, p); expect(() => validateWorkbook(b)).toThrow(/128/); });
    it('Markdown preserves supported hierarchy and multiline CJK text', () => { const b = fixture(50), s = activeSheet(b); s.nodes[s.rootId].text = '繁體中文\n第二行'; const m = markdown(s), round = activeSheet(parseMarkdown(m)); expect(Object.keys(round.nodes)).toHaveLength(50); const texts = (sheet: typeof s) => descendants(sheet, sheet.rootId).map(id => sheet.nodes[id].text); expect(texts(round)).toEqual(texts(s)); expect(() => parseMarkdown('unstructured paragraph')).toThrow(); });
    it('escapes OPML attributes and multiline topic text', () => { const s = activeSheet(newWorkbook()); s.nodes[s.rootId].text = '繁體中文\n<&"'; const xml = opml(s); expect(xml).toContain('&#10;'); expect(xml).toContain('&lt;&amp;&quot;'); expect(xml).not.toContain('text="繁體中文\n'); });
});
class MemoryStorage implements Storage {
    data = new Map<string, string>();
    get length() { return this.data.size; }
    clear() { this.data.clear(); }
    key(i: number) { return [...this.data.keys()][i] ?? null; }
    getItem(k: string) { return this.data.get(k) ?? null; }
    removeItem(k: string) { this.data.delete(k); }
    setItem(k: string, v: string) { this.data.set(k, v); }
}
describe('recovery', () => {
    it('restores exact document and falls back when primary data is corrupt', () => { const storage = new MemoryStorage(), b = demoWorkbook(); saveRecovery(storage, b); const next = clone(b); next.title = '新版本'; saveRecovery(storage, next); expect(loadRecovery(storage).book).toEqual(next); storage.setItem('openmind.recovery.v1', 'broken'); const r = loadRecovery(storage); expect(r.book).toEqual(b); expect(r.warning).toContain('安全副本'); });
    it('reports corruption without deleting original bytes, propagates quota failures', () => { const storage = new MemoryStorage(); storage.setItem('openmind.recovery.v1', 'broken'); expect(loadRecovery(storage).warning).toContain('損毀'); expect(storage.getItem('openmind.recovery.v1')).toBe('broken'); storage.setItem = () => { throw new Error('QuotaExceeded'); }; expect(() => saveRecovery(storage, newWorkbook())).toThrow('QuotaExceeded'); });
});
