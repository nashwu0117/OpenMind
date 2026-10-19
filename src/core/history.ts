import { clone, type Workbook } from './model';
export type History = {
    past: Workbook[];
    present: Workbook;
    future: Workbook[];
};
export const historyOf = (book: Workbook): History => ({ past: [], present: book, future: [] });
export function commit(h: History, edit: (book: Workbook) => void): History { const next = clone(h.present); edit(next); if (JSON.stringify(next) === JSON.stringify(h.present))
    return h; next.updatedAt = new Date().toISOString(); return { past: [...h.past.slice(-79), h.present], present: next, future: [] }; }
export function undo(h: History): History { return h.past.length ? { past: h.past.slice(0, -1), present: h.past.at(-1)!, future: [h.present, ...h.future] } : h; }
export function redo(h: History): History { return h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h; }
