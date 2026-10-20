import { descendants, type Sheet, type Topic, palette } from '../core/model';
import {equationGraphic} from './equations';
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
    path?: string;
};
export type Scene = {
    nodes: PlacedNode[];
    edges: Edge[];
    bounds: Rect;
    sheet: Sheet;
    extraMarkup?: string;
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
} { const f = node.style.fontSize; const max = 260; const lines = wrapText(node.text, f, max - 36); const equation=equationGraphic(node.equation); const width = Math.max(node.image ? 190 : 90, equation ? equation.width + 36 : 0, Math.min(max, Math.max(...lines.map(l => textWidth(l, f)), 50) + 36)); const meta = node.marker || node.sticker || node.attachments.length || node.labels.length || node.task || node.notes || node.link; return { width, height: Math.max(44, lines.length * f * 1.45 + 24) + (meta ? 23 : 0) + (node.image ? 112 : 0) + (equation ? equation.height+16 : 0), lines }; }
export function union(rects: Rect[], padding = 0): Rect { if (!rects.length)
    return { x: 0, y: 0, width: 1, height: 1 }; const x = Math.min(...rects.map(r => r.x)) - padding, y = Math.min(...rects.map(r => r.y)) - padding; return { x, y, width: Math.max(...rects.map(r => r.x + r.width)) - x + padding, height: Math.max(...rects.map(r => r.y + r.height)) - y + padding }; }
export function annotationLayout(sheet:Sheet,nodes:PlacedNode[]) {
    const byId=new Map(nodes.map(n=>[n.id,n])),all=union(nodes),frames: {box:Rect;label:Rect;lines:string[]}[]=[],relations:{path:string;label:Rect;lines:string[];directed:boolean;dashed:boolean}[]=[],summaries:{path:string;label:Rect;lines:string[]}[]=[];
    let lane=all.y-30;
    for(const boundary of sheet.boundaries){const ids=new Set(descendants(sheet,boundary.topicId)),members=nodes.filter(n=>ids.has(n.id));if(!members.length)continue;const box=union(members,16),lines=wrapText(boundary.text,12,276),label={x:box.x,y:lane-lines.length*17-8,width:300,height:lines.length*17+8};frames.push({box,label,lines});lane=label.y-24;}
    for(const relation of sheet.relationships){const a=byId.get(relation.from),b=byId.get(relation.to);if(!a||!b)continue;const ax=a.x+a.width/2,bx=b.x+b.width/2,lines=wrapText(relation.text,12,276),label={x:(ax+bx)/2-150,y:lane-lines.length*17-8,width:300,height:lines.length*17+8};relations.push({path:`M${ax},${a.y} V${lane} H${bx} V${b.y}`,label,lines,directed:relation.directed,dashed:relation.dashed});lane=label.y-24;}
    let labelBottom=-Infinity;
    for(const [i,summary] of sheet.summaries.entries()){if(!summary.topicIds.every(id=>byId.has(id)))continue;const ids=new Set(summary.topicIds.flatMap(id=>descendants(sheet,id))),members=nodes.filter(n=>ids.has(n.id)),box=union(members),x=all.x+all.width+24+i*10,mid=box.y+box.height/2,lines=wrapText(summary.text,12,216),label={x:all.x+all.width+64+i*10,y:Math.max(mid-lines.length*17/2,labelBottom+12),width:240,height:lines.length*17+16};labelBottom=label.y+label.height;
        summaries.push({path:`M${x-8},${box.y} Q${x+4},${box.y} ${x+4},${box.y+12} V${mid-8} Q${x+4},${mid} ${x+12},${mid} Q${x+4},${mid} ${x+4},${mid+8} V${box.y+box.height-12} Q${x+4},${box.y+box.height} ${x-8},${box.y+box.height} M${x+12},${mid} L${label.x},${label.y+label.height/2}`,label,lines});}
    return {frames,relations,summaries};
}
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
    const gapX = sheet.spacing.horizontal, gapY = sheet.spacing.vertical;
    const vertical = sheet.structure === 'org' || sheet.structure === 'timeline';
    const calc = (id: string): {
        w: number;
        h: number;
    } => { const m = measure(sheet.nodes[id]); sizes.set(id, m); const cs = children(id).map(calc); const result = vertical ? { w: Math.max(m.width, cs.reduce((a, c) => a + c.w, 0) + Math.max(0, cs.length - 1) * (gapY + 8)), h: m.height + (cs.length ? 70 + Math.max(...cs.map(c => c.h)) : 0) } : { w: m.width + (cs.length ? gapX + Math.max(...cs.map(c => c.w)) : 0), h: Math.max(m.height, cs.reduce((a, c) => a + c.h, 0) + Math.max(0, cs.length - 1) * gapY) }; spans.set(id, result); return result; };
    const put = (id: string, x: number, y: number, depth: number, color: string) => { const m = sizes.get(id)!; nodes.push({ id, x, y, ...m, fontSize: sheet.nodes[id].style.fontSize, depth, color }); };
    const horizontal = (id: string, x: number, top: number, dir: number, depth: number, color: string) => { const m = sizes.get(id)!, span = spans.get(id)!; const nx = dir === 1 ? x : x - m.width; put(id, nx, top + (span.h - m.height) / 2, depth, color); const cs = children(id); let y = top + (span.h - (cs.reduce((a, c) => a + spans.get(c)!.h, 0) + Math.max(0, cs.length - 1) * gapY)) / 2; for (const c of cs) {
        horizontal(c, dir === 1 ? nx + m.width + gapX : nx - gapX, y, dir, depth + 1, color);
        edges.push({ from: id, to: c, color });
        y += spans.get(c)!.h + gapY;
    } };
    const down = (id: string, left: number, y: number, depth: number, color: string) => { const span = spans.get(id)!, m = sizes.get(id)!; put(id, left + (span.w - m.width) / 2, y, depth, color); const cs = children(id); let x = left + (span.w - (cs.reduce((a, c) => a + spans.get(c)!.w, 0) + Math.max(0, cs.length - 1) * (gapY + 8))) / 2; cs.forEach((c, i) => { const col = depth === 0 ? palette[i % palette.length] : color; down(c, x, y + m.height + (gapX - 4), depth + 1, col); edges.push({ from: id, to: c, color: col }); x += spans.get(c)!.w + gapY + 8; }); };
    calc(focusId);
    const rm = sizes.get(focusId)!;
    if (sheet.structure === 'timeline') {
        put(focusId, -rm.width - gapX, -rm.height / 2, 0, palette[0]);
        let x = 0;
        children(focusId).forEach((id,i)=>{const m=sizes.get(id)!;down(id,x,-m.height/2,1,palette[i%palette.length]);const node=nodes.find(n=>n.id===id)!;edges.push({from:focusId,to:id,color:node.color,path:`M${-gapX},0 H${node.x}`});x+=spans.get(id)!.w+gapX;});
    }
    else if (sheet.structure === 'fishbone') {
        let x=0;const causes: {id:string;anchor:number;node:PlacedNode}[]=[];
        children(focusId).forEach((id,i)=>{const span=spans.get(id)!;const right=x+span.w;horizontal(id,right,i%2===0?-span.h-90:90,-1,1,palette[i%palette.length]);causes.push({id,anchor:right+40,node:nodes.find(n=>n.id===id)!});x+=span.w+gapX+60;});
        put(focusId,x+gapX,-rm.height/2,0,palette[0]);
        for(const cause of causes)edges.push({from:focusId,to:cause.id,color:cause.node.color,path:`M${x+gapX},0 H${cause.anchor} L${cause.node.x+cause.node.width},${cause.node.y+cause.node.height/2}`});
    }
    else if (sheet.structure === 'matrix') {
        let x=0;const columns=children(focusId);
        for(const [i,id] of columns.entries()){
            const visible:{id:string;depth:number}[]=[];const walk=(id:string,depth:number)=>{visible.push({id,depth});children(id).forEach(child=>walk(child,depth+1));};walk(id,0);
            const width=Math.max(...visible.map(v=>sizes.get(v.id)!.width+v.depth*18))+24;
            let y=rm.height+gapX;
            for(const row of visible){put(row.id,x+row.depth*18,y,row.depth+1,palette[i%palette.length]);y+=sizes.get(row.id)!.height+gapY;const parent=parentFor(row.id);edges.push({from:parent??focusId,to:row.id,color:palette[i%palette.length],path:''});}
            x+=width+gapY;
        }
        put(focusId,Math.max(0,(x-gapY-rm.width)/2),0,0,palette[0]);
    }
    else if (sheet.structure === 'treetable') {
        const widths:number[]=[],heights=new Map<string,number>();
        const tableSize=(id:string,depth:number):number=>{const m=sizes.get(id)!;widths[depth]=Math.max(widths[depth]??0,m.width);const cs=children(id);const height=Math.max(m.height,cs.reduce((sum,c)=>sum+tableSize(c,depth+1),0));heights.set(id,height);return height;};tableSize(focusId,0);
        const xs=widths.map((_,depth)=>widths.slice(0,depth).reduce((sum,w)=>sum+w+12,0));
        const tablePut=(id:string,y:number,depth:number,color:string)=>{put(id,xs[depth],y,depth,color);const placed=nodes.at(-1)!;placed.width=widths[depth];placed.height=heights.get(id)!;let top=y;children(id).forEach((child,i)=>{const c=depth===0?palette[i%palette.length]:color;tablePut(child,top,depth+1,c);edges.push({from:id,to:child,color:c,path:''});top+=heights.get(child)!;});};tablePut(focusId,0,0,palette[0]);
    }
    else if (sheet.structure === 'mindmap') {
        put(focusId, -rm.width / 2, -rm.height / 2, 0, palette[0]);
        const cs = children(focusId);
        const half = Math.ceil(cs.length / 2);
        [cs.slice(0, half), cs.slice(half)].forEach((group, side) => { let y = -(group.reduce((a, c) => a + spans.get(c)!.h, 0) + Math.max(0, group.length - 1) * gapY) / 2; group.forEach(c => { const color = palette[cs.indexOf(c) % palette.length]; horizontal(c, (rm.width / 2 + gapX) * (side === 0 ? 1 : -1), y, side === 0 ? 1 : -1, 1, color); edges.push({ from: focusId, to: c, color }); y += spans.get(c)!.h + gapY; }); });
    }
    else if (vertical)
        down(focusId, -spans.get(focusId)!.w / 2, 0, 0, palette[0]);
    else
        horizontal(focusId, 0, -spans.get(focusId)!.h / 2, 1, 0, palette[0]);
    function parentFor(id:string):string|undefined{return Object.values(sheet.nodes).find(n=>n.children.includes(id))?.id;}
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
    const annotations=annotationLayout(sheet,nodes);
    const extra:Rect[]=[...annotations.frames.flatMap(a=>[a.box,a.label]),...annotations.relations.map(a=>a.label),...annotations.summaries.map(a=>a.label)];
    return { nodes, edges, bounds: union([...nodes, ...extra], 28), sheet };
}
export function branchSheet(sheet: Sheet, id: string): Sheet { const ids = new Set(descendants(sheet, id)); return { ...sheet, rootId: id, floating: [], nodes: Object.fromEntries(Object.entries(sheet.nodes).filter(([key]) => ids.has(key))), relationships: sheet.relationships.filter(r => ids.has(r.from) && ids.has(r.to)), boundaries: sheet.boundaries.filter(b => ids.has(b.topicId)),summaries:sheet.summaries.filter(s=>s.topicIds.every(id=>ids.has(id))),slides:sheet.slides.filter(id=>ids.has(id)) }; }
