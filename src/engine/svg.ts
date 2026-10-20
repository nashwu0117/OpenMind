import { descendants } from '../core/model';
import { FONT, textWidth, union, annotationLayout, type Scene, type PlacedNode } from './layout';
import {equationGraphic} from './equations';
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
    const equation=equationGraphic(node.equation,n.width-36),equationY=textY+(n.lines.length-1)*f*1.45+16+(node.image?112:0);
    const formula=equation?equation.error?`<text x="${n.x+18}" y="${equationY+16}" font-size="12" fill="${color}">公式無法排版，請檢查 TeX 語法</text>`:equation.markup.replace('<svg ',`<svg data-equation="true" x="${n.x+18}" y="${equationY}" style="color:${color}" `).replace(/width="[^"]+"/,`width="${equation.width}"`).replace(/height="[^"]+"/,`height="${equation.height}"`):'';
    const meta = [node.sticker, node.marker, ...node.labels.map(l => `#${l}`), node.task ? ({ todo: '□ 待辦', doing: '◐ 進行中', done: '✓ 完成' }[node.task.status]) : '', node.notes ? '≡' : '', node.attachments.length ? `▤ ${node.attachments.length} 附件` : '', node.link ? '↗' : ''].filter(Boolean).join('  ');
    return `<g data-node-id="${escapeXML(n.id)}"${options.interactive ? ' class="topic" tabindex="0" role="button" aria-label="' + escapeXML(node.text) + '"' : ''}>${selected ? `<rect x="${n.x - 4}" y="${n.y - 4}" width="${n.width + 8}" height="${n.height + 8}" rx="${radius + 4}" fill="none" stroke="#3263ce" stroke-width="2"/>` : ''}<rect x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" rx="${radius}" fill="${fill}" stroke="${mono ? '#333333' : s.stroke}" fill-opacity="${s.opacity}" stroke-width="${s.strokeWidth}" ${s.dashed ? 'stroke-dasharray="5 4"' : ''}/><text fill="${color}" style="font-family:${escapeXML(s.font==='serif'?'Georgia, \"Noto Sans TC\", serif':s.font==='mono'?'Menlo, Consolas, \"Noto Sans TC\", monospace':FONT)}" text-anchor="${s.align==='center'?'middle':s.align==='right'?'end':'start'}" font-size="${f}" font-weight="${s.bold ? 700 : 400}" font-style="${s.italic ? 'italic' : 'normal'}">${n.lines.map((l, i) => `<tspan x="${s.align==='center'?n.x+n.width/2:s.align==='right'?n.x+n.width-18:n.x+18}" y="${textY + i * f * 1.45}">${escapeXML(l)}</tspan>`).join('')}</text>${node.image ? `<image href="${node.image}" x="${n.x + 12}" y="${textY + (n.lines.length - 1) * f * 1.45 + 12}" width="${n.width - 24}" height="98" preserveAspectRatio="xMidYMid meet" ${mono ? 'filter="url(#mono-image)"' : ''}/>` : ''}${formula}${meta ? `<text x="${n.x + 15}" y="${metaY}" font-size="10" fill="${color}" opacity="0.75">${escapeXML(fitLabel(meta, n.width - 30))}</text>` : ''}${node.collapsed && node.children.length && !scene.edges.some(edge=>edge.from===n.id) ? `<circle cx="${n.x + n.width}" cy="${n.y + n.height / 2}" r="10" fill="#3263ce"/><text x="${n.x + n.width}" y="${n.y + n.height / 2 + 4}" text-anchor="middle" font-size="10" fill="white">${node.children.length}</text>` : ''}</g>`;
}
export function sceneMarkup(scene: Scene, options: RenderOptions = {}): string {
    const byId = new Map(scene.nodes.map(n => [n.id, n]));
    const mono = options.monochrome;
    let out = `<defs><filter id="mono-image"><feColorMatrix type="saturate" values="0"/></filter><marker id="relation-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="${mono ? '#333' : '#8963b8'}"/></marker></defs>`;
    const annotations=annotationLayout(scene.sheet,scene.nodes);
    const label=(a:{label:{x:number;y:number;width:number;height:number};lines:string[]},color:string)=>`<rect x="${a.label.x}" y="${a.label.y}" width="${a.label.width}" height="${a.label.height}" rx="5" fill="white"/><text font-size="12" fill="${color}">${a.lines.map((line,i)=>`<tspan x="${a.label.x+12}" y="${a.label.y+17+i*17}">${escapeXML(line)}</tspan>`).join('')}</text>`;
    if(scene.sheet.structure==='matrix')for(const id of scene.sheet.nodes[scene.sheet.rootId]?.children??[]){const ids=new Set(descendants(scene.sheet,id)),members=scene.nodes.filter(n=>ids.has(n.id));if(!members.length)continue;const box=union(members,10);out+=`<rect data-layout="matrix-column" x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="none" stroke="${mono?'#777':'#aabed8'}" stroke-width="1"/>`;}
    for(const a of annotations.frames){out+=`<rect x="${a.box.x}" y="${a.box.y}" width="${a.box.width}" height="${a.box.height}" rx="16" fill="${mono?'#f5f5f5':'#e8effb'}" fill-opacity="0.5" stroke="${mono?'#777':'#8da8da'}" stroke-dasharray="6 4"/><path d="M${a.label.x+12},${a.label.y+a.label.height} L${a.box.x+12},${a.box.y}" fill="none" stroke="${mono?'#777':'#8da8da'}"/>${label(a,mono?'#111':'#466492')}`;}
    if(scene.sheet.structure==='brace')for(const a of scene.nodes){const cs=scene.edges.filter(e=>e.from===a.id).map(e=>byId.get(e.to)).filter((n):n is PlacedNode=>!!n);if(!cs.length)continue;const x=a.x+a.width+26,top=Math.min(...cs.map(n=>n.y)),bottom=Math.max(...cs.map(n=>n.y+n.height)),mid=(top+bottom)/2;out+=`<path data-layout="brace" d="M${a.x+a.width},${a.y+a.height/2} H${x-10} M${x+8},${top} Q${x},${top} ${x},${top+8} V${mid-8} Q${x},${mid} ${x-8},${mid} Q${x},${mid} ${x},${mid+8} V${bottom-8} Q${x},${bottom} ${x+8},${bottom}" fill="none" stroke="${mono?'#555':a.color}" stroke-width="1.7"/>`;}
    for (const e of scene.edges) {
        const a = byId.get(e.from), b = byId.get(e.to);
        if (!a || !b)
            continue;
        if (e.path === '' || scene.sheet.structure === 'brace') continue;
        let path: string;
        if (e.path !== undefined) path=e.path;
        else if (scene.sheet.structure === 'org' || scene.sheet.structure === 'timeline') {
            const ax = a.x + a.width / 2, ay = a.y + a.height, bx = b.x + b.width / 2, by = b.y;
            const my = (ay + by) / 2;
            path = `M${ax},${ay} V${my} H${bx} V${by}`;
        }
        else {
            const right = b.x > a.x, ax = right ? a.x + a.width : a.x, ay = a.y + a.height / 2, bx = right ? b.x : b.x + b.width, by = b.y + b.height / 2;
            path = scene.sheet.connector === 'straight' ? `M${ax},${ay} L${bx},${by}` : scene.sheet.structure === 'tree' || scene.sheet.connector === 'elbow' ? `M${ax},${ay} H${(ax + bx) / 2} V${by} H${bx}` : `M${ax},${ay} C${(ax + bx) / 2},${ay} ${(ax + bx) / 2},${by} ${bx},${by}`;
        }
        out += `<path d="${path}" fill="none" stroke="${mono ? '#555' : e.color}" stroke-width="1.7" opacity="0.7"/>`;
    }
    for(const a of annotations.relations)out+=`<path d="${a.path}" fill="none" stroke="${mono?'#333':'#8963b8'}" stroke-width="1.5" ${a.dashed?'stroke-dasharray="5 4"':''} ${a.directed?'marker-end="url(#relation-arrow)"':''}/>${label(a,mono?'#111':'#7650a4')}`;
    for(const a of annotations.summaries)out+=`<g data-annotation="summary"><path d="${a.path}" fill="none" stroke="${mono?'#555':'#b27b28'}" stroke-width="1.7"/>${label(a,mono?'#111':'#896023')}</g>`;
    return out + scene.nodes.map(n => nodeMarkup(scene, n, options)).join('') + (scene.extraMarkup??'');
}
export function renderSVG(scene: Scene, options: RenderOptions = {}): string { const b = scene.bounds; return `<svg xmlns="http://www.w3.org/2000/svg" width="${b.width}" height="${b.height}" viewBox="${b.x} ${b.y} ${b.width} ${b.height}" style="font-family:${escapeXML(FONT)}">${options.background ? `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="${options.monochrome ? '#ffffff' : scene.sheet.background}"/>` : ''}${sceneMarkup(scene, options)}</svg>`; }
