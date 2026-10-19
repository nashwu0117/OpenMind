import { descendants } from '../core/model';
import { FONT, textWidth, union, type Scene, type PlacedNode } from './layout';
export const escapeXML = (s: string) => s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!));
export type RenderOptions = {
    selected?: string[];
    background?: boolean;
    monochrome?: boolean;
    interactive?: boolean;
};
function fitLabel(text: string, width: number): string { if (textWidth(text, 10) <= width)
    return text; let shortened = ''; for (const c of Array.from(text)) {
    if (textWidth(shortened + c + '…', 10) > width)
        break;
    shortened += c;
} return shortened + '…'; }
export function nodeMarkup(scene: Scene, n: PlacedNode, options: RenderOptions = {}): string {
    const node = scene.sheet.nodes[n.id], s = node.style;
    const mono = options.monochrome;
    const fill = mono ? '#ffffff' : s.fill, color = mono ? '#111111' : s.color;
    const selected = options.selected?.includes(n.id);
    const f = n.fontSize;
    const radius = s.shape === 'rect' ? 2 : s.shape === 'pill' ? Math.min(n.height / 2, 32) : 11;
    const textY = n.y + 13 + f;
    const metaY = n.y + n.height - 13;
    const meta = [node.marker, ...node.labels.map(l => `#${l}`), node.task ? ({ todo: '□ 待辦', doing: '◐ 進行中', done: '✓ 完成' }[node.task.status]) : '', node.notes ? '≡' : '', node.link ? '↗' : ''].filter(Boolean).join('  ');
    return `<g data-node-id="${escapeXML(n.id)}"${options.interactive ? ' class="topic" tabindex="0" role="button" aria-label="' + escapeXML(node.text) + '"' : ''}>${selected ? `<rect x="${n.x - 4}" y="${n.y - 4}" width="${n.width + 8}" height="${n.height + 8}" rx="${radius + 4}" fill="none" stroke="#3263ce" stroke-width="2"/>` : ''}<rect x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" rx="${radius}" fill="${fill}" stroke="${mono ? '#333333' : s.stroke}" stroke-width="${n.depth === 0 ? 1.5 : 1.2}"/><text fill="${color}" font-size="${f}" font-weight="${s.bold ? 650 : 400}" font-style="${s.italic ? 'italic' : 'normal'}">${n.lines.map((l, i) => `<tspan x="${n.x + 18}" y="${textY + i * f * 1.45}">${escapeXML(l)}</tspan>`).join('')}</text>${node.image ? `<image href="${node.image}" x="${n.x + 12}" y="${textY + (n.lines.length - 1) * f * 1.45 + 12}" width="${n.width - 24}" height="98" preserveAspectRatio="xMidYMid meet" ${mono ? 'filter="url(#mono-image)"' : ''}/>` : ''}${meta ? `<text x="${n.x + 15}" y="${metaY}" font-size="10" fill="${color}" opacity="0.75">${escapeXML(fitLabel(meta, n.width - 30))}</text>` : ''}${node.collapsed && node.children.length ? `<circle cx="${n.x + n.width}" cy="${n.y + n.height / 2}" r="10" fill="#3263ce"/><text x="${n.x + n.width}" y="${n.y + n.height / 2 + 4}" text-anchor="middle" font-size="10" fill="white">${node.children.length}</text>` : ''}</g>`;
}
export function sceneMarkup(scene: Scene, options: RenderOptions = {}): string {
    const byId = new Map(scene.nodes.map(n => [n.id, n]));
    const mono = options.monochrome;
    let out = `<defs><filter id="mono-image"><feColorMatrix type="saturate" values="0"/></filter><marker id="relation-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="${mono ? '#333' : '#8963b8'}"/></marker></defs>`;
    for (const b of scene.sheet.boundaries) {
        const ids = new Set(descendants(scene.sheet, b.topicId));
        const members = scene.nodes.filter(n => ids.has(n.id));
        if (!members.length)
            continue;
        const box = union(members, 16);
        out += `<rect x="${box.x}" y="${box.y - 24}" width="${box.width}" height="${box.height + 24}" rx="16" fill="${mono ? '#f5f5f5' : '#e8effb'}" fill-opacity="0.5" stroke="${mono ? '#777' : '#8da8da'}" stroke-dasharray="6 4"/><text x="${box.x + 12}" y="${box.y - 7}" font-size="12" fill="${mono ? '#111' : '#466492'}">${escapeXML(b.text)}</text>`;
    }
    for (const e of scene.edges) {
        const a = byId.get(e.from), b = byId.get(e.to);
        if (!a || !b)
            continue;
        let path: string;
        if (scene.sheet.structure === 'org' || scene.sheet.structure === 'timeline') {
            const ax = a.x + a.width / 2, ay = a.y + a.height, bx = b.x + b.width / 2, by = b.y;
            const my = (ay + by) / 2;
            path = `M${ax},${ay} V${my} H${bx} V${by}`;
        }
        else {
            const right = b.x > a.x, ax = right ? a.x + a.width : a.x, ay = a.y + a.height / 2, bx = right ? b.x : b.x + b.width, by = b.y + b.height / 2;
            path = scene.sheet.structure === 'tree' ? `M${ax},${ay} H${(ax + bx) / 2} V${by} H${bx}` : `M${ax},${ay} C${(ax + bx) / 2},${ay} ${(ax + bx) / 2},${by} ${bx},${by}`;
        }
        out += `<path d="${path}" fill="none" stroke="${mono ? '#555' : e.color}" stroke-width="1.7" opacity="0.7"/>`;
    }
    scene.sheet.relationships.forEach((r, i) => { const a = byId.get(r.from), b = byId.get(r.to); if (!a || !b)
        return; const ax = a.x + a.width / 2, ay = a.y, bx = b.x + b.width / 2, by = b.y, mx = (ax + bx) / 2, top = Math.min(...scene.nodes.map(n => n.y)) - 42 - i * 28; out += `<path d="M${ax},${ay} V${top} H${bx} V${by}" fill="none" stroke="${mono ? '#333' : '#8963b8'}" stroke-width="1.5" ${r.dashed ? 'stroke-dasharray="5 4"' : ''} ${r.directed ? 'marker-end="url(#relation-arrow)"' : ''}/><rect x="${mx - textWidth(r.text, 12) / 2 - 3}" y="${top - 23}" width="${textWidth(r.text, 12) + 6}" height="18" fill="white"/><text x="${mx}" y="${top - 9}" text-anchor="middle" font-size="12" fill="${mono ? '#111' : '#7650a4'}">${escapeXML(r.text)}</text>`; });
    return out + scene.nodes.map(n => nodeMarkup(scene, n, options)).join('');
}
export function renderSVG(scene: Scene, options: RenderOptions = {}): string { const b = scene.bounds; return `<svg xmlns="http://www.w3.org/2000/svg" width="${b.width}" height="${b.height}" viewBox="${b.x} ${b.y} ${b.width} ${b.height}" style="font-family:${escapeXML(FONT)}">${options.background ? `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="${options.monochrome ? '#ffffff' : scene.sheet.background}"/>` : ''}${sceneMarkup(scene, options)}</svg>`; }
