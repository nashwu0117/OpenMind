import { descendants, type Sheet, type Topic, palette } from '../core/model';
export type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};
export type PlacedNode = Rect & {
    id: string;
    lines: string[];
    fontSize: number;
    color: string;
    depth: number;
};
export type Edge = {
    from: string;
    to: string;
    color: string;
};
export type Scene = {
    nodes: PlacedNode[];
    edges: Edge[];
    bounds: Rect;
    sheet: Sheet;
};
export const FONT = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif';
export function textWidth(text: string, size: number): number { return Array.from(text).reduce((sum, c) => sum + size * (/[\u2e80-\uffff]|\p{Extended_Pictographic}/u.test(c) ? 1.06 : /[MW@#%]/.test(c) ? 0.94 : /[il .,!:;'|]/.test(c) ? 0.38 : 0.67), 0); }
export function wrapText(text: string, size: number, width: number): string[] { const out: string[] = []; for (const paragraph of text.split('\n')) {
    let line = '';
    const tokens = paragraph.match(/[A-Za-z0-9_]+(?:[-./][A-Za-z0-9_]+)*|[^\x00-\x7f]|[\s\S]/gu) ?? [];
    for (const token of tokens) {
        const pieces = textWidth(token, size) > width ? Array.from(token) : [token];
        for (const piece of pieces) {
            if (line && textWidth(line + piece, size) > width) {
                out.push(line);
                line = piece;
            }
            else
                line += piece;
        }
    }
    out.push(line);
} return out.length ? out : ['']; }
export function measure(node: Topic): {
    width: number;
    height: number;
    lines: string[];
} { const f = node.style.fontSize; const max = 260; const lines = wrapText(node.text, f, max - 36); const width = Math.max(node.image ? 190 : 90, Math.min(max, Math.max(...lines.map(l => textWidth(l, f)), 50) + 36)); const meta = node.marker || node.labels.length || node.task || node.notes || node.link; return { width, height: Math.max(44, lines.length * f * 1.45 + 24) + (meta ? 23 : 0) + (node.image ? 112 : 0), lines }; }
export function union(rects: Rect[], padding = 0): Rect { if (!rects.length)
    return { x: 0, y: 0, width: 1, height: 1 }; const x = Math.min(...rects.map(r => r.x)) - padding, y = Math.min(...rects.map(r => r.y)) - padding; return { x, y, width: Math.max(...rects.map(r => r.x + r.width)) - x + padding, height: Math.max(...rects.map(r => r.y + r.height)) - y + padding }; }
export function layout(sheet: Sheet, focusId = sheet.rootId, expand: boolean | ReadonlySet<string> = false): Scene {
    const nodes: PlacedNode[] = [], edges: Edge[] = [];
    const sizes = new Map<string, {
        width: number;
        height: number;
        lines: string[];
    }>();
    const spans = new Map<string, {
        w: number;
        h: number;
    }>();
    const children = (id: string) => sheet.nodes[id].collapsed && expand !== true && (expand === false || !expand.has(id)) ? [] : sheet.nodes[id].children;
    const vertical = sheet.structure === 'org' || sheet.structure === 'timeline';
    const calc = (id: string): {
        w: number;
        h: number;
    } => { const m = measure(sheet.nodes[id]); sizes.set(id, m); const cs = children(id).map(calc); const result = vertical ? { w: Math.max(m.width, cs.reduce((a, c) => a + c.w, 0) + Math.max(0, cs.length - 1) * 32), h: m.height + (cs.length ? 70 + Math.max(...cs.map(c => c.h)) : 0) } : { w: m.width + (cs.length ? 74 + Math.max(...cs.map(c => c.w)) : 0), h: Math.max(m.height, cs.reduce((a, c) => a + c.h, 0) + Math.max(0, cs.length - 1) * 24) }; spans.set(id, result); return result; };
    const put = (id: string, x: number, y: number, depth: number, color: string) => { const m = sizes.get(id)!; nodes.push({ id, x, y, ...m, fontSize: sheet.nodes[id].style.fontSize, depth, color }); };
    const horizontal = (id: string, x: number, top: number, dir: number, depth: number, color: string) => { const m = sizes.get(id)!, span = spans.get(id)!; const nx = dir === 1 ? x : x - m.width; put(id, nx, top + (span.h - m.height) / 2, depth, color); const cs = children(id); let y = top + (span.h - (cs.reduce((a, c) => a + spans.get(c)!.h, 0) + Math.max(0, cs.length - 1) * 24)) / 2; for (const c of cs) {
        horizontal(c, dir === 1 ? nx + m.width + 74 : nx - 74, y, dir, depth + 1, color);
        edges.push({ from: id, to: c, color });
        y += spans.get(c)!.h + 24;
    } };
    const down = (id: string, left: number, y: number, depth: number, color: string) => { const span = spans.get(id)!, m = sizes.get(id)!; put(id, left + (span.w - m.width) / 2, y, depth, color); const cs = children(id); let x = left + (span.w - (cs.reduce((a, c) => a + spans.get(c)!.w, 0) + Math.max(0, cs.length - 1) * 32)) / 2; cs.forEach((c, i) => { const col = depth === 0 ? palette[i % palette.length] : color; down(c, x, y + m.height + 70, depth + 1, col); edges.push({ from: id, to: c, color: col }); x += spans.get(c)!.w + 32; }); };
    calc(focusId);
    const rm = sizes.get(focusId)!;
    if (sheet.structure === 'mindmap') {
        put(focusId, -rm.width / 2, -rm.height / 2, 0, palette[0]);
        const cs = children(focusId);
        const half = Math.ceil(cs.length / 2);
        [cs.slice(0, half), cs.slice(half)].forEach((group, side) => { let y = -(group.reduce((a, c) => a + spans.get(c)!.h, 0) + Math.max(0, group.length - 1) * 24) / 2; group.forEach(c => { const color = palette[cs.indexOf(c) % palette.length]; horizontal(c, (rm.width / 2 + 74) * (side === 0 ? 1 : -1), y, side === 0 ? 1 : -1, 1, color); edges.push({ from: focusId, to: c, color }); y += spans.get(c)!.h + 24; }); });
    }
    else if (vertical)
        down(focusId, -spans.get(focusId)!.w / 2, 0, 0, palette[0]);
    else
        horizontal(focusId, 0, -spans.get(focusId)!.h / 2, 1, 0, palette[0]);
    if (focusId === sheet.rootId) {
        for (const id of sheet.floating) {
            calc(id);
            const p = sheet.nodes[id].position ?? { x: 400, y: 400 };
            if (vertical)
                down(id, p.x, p.y, 0, palette[4]);
            else
                horizontal(id, p.x, p.y, 1, 0, palette[4]);
        }
    }
    // Include anchored frames and relationship labels in export/print bounds.
    const extra: Rect[] = [];
    for (const b of sheet.boundaries) {
        const ids = new Set(descendants(sheet, b.topicId));
        const members = nodes.filter(n => ids.has(n.id));
        if (members.length) {
            const box = union(members, 18);
            extra.push({ ...box, y: box.y - 24, height: box.height + 24 });
        }
    }
    sheet.relationships.forEach((r, i) => { const a = nodes.find(n => n.id === r.from), b = nodes.find(n => n.id === r.to); if (a && b)
        extra.push({ x: (a.x + a.width / 2 + b.x + b.width / 2) / 2 - textWidth(r.text, 12) / 2 - 6, y: Math.min(...nodes.map(n => n.y)) - 70 - i * 28, width: textWidth(r.text, 12) + 12, height: 28 }); });
    return { nodes, edges, bounds: union([...nodes, ...extra], 28), sheet };
}
export function branchSheet(sheet: Sheet, id: string): Sheet { const ids = new Set(descendants(sheet, id)); return { ...sheet, rootId: id, floating: [], nodes: Object.fromEntries(Object.entries(sheet.nodes).filter(([key]) => ids.has(key))), relationships: sheet.relationships.filter(r => ids.has(r.from) && ids.has(r.to)), boundaries: sheet.boundaries.filter(b => ids.has(b.topicId)) }; }
