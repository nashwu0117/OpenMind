import { useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, Minus, Plus, Scan, MousePointer2, Hand, SquareDashed } from 'lucide-react';
import { FONT, layout, type Scene } from '../engine/layout';
import { sceneMarkup } from '../engine/svg';
import type { Sheet } from '../core/model';
import {t} from './i18n';
type Props = {
    sheet: Sheet;
    focus: string;
    expanded?: ReadonlySet<string>;
    selected: string[];
    onSelect: (ids: string[]) => void;
    onEdit: (id: string) => void;
    onMove: (id: string, parent: string, before: boolean) => void;
    onFloatMove: (id: string, x: number, y: number) => void;
    readOnly: boolean;
    reveal: string;
    revealVersion?: number;
    sceneRef: (scene: Scene) => void;
};
export function Canvas(p: Props) {
    const host = useRef<HTMLDivElement>(null);
    const svg = useRef<SVGSVGElement>(null);
    const [size, setSize] = useState({ width: 900, height: 650 });
    const [view, setView] = useState({ x: -500, y: -300, scale: 1 });
    const [hand, setHand] = useState(false);
    const [marquee,setMarquee]=useState(false);
    const [selectionBox,setSelectionBox]=useState<{x:number;y:number;width:number;height:number}|null>(null);
    const [target, setTarget] = useState('');
    const drag = useRef<{
        id: string;
        x: number;
        y: number;
        vx: number;
        vy: number;
        moving: boolean;
        pan: boolean;
        marquee:boolean;
        seed:string[];
        bx:number;
        by:number;
    } | null>(null);
    const scene = useMemo(() => layout(p.sheet, p.sheet.nodes[p.focus] ? p.focus : p.sheet.rootId, p.expanded ?? false), [p.sheet, p.focus, p.expanded]);
    p.sceneRef(scene);
    const fit = () => { const b = scene.bounds; const scale = Math.min(1.35, (size.width - 100) / b.width, (size.height - 100) / b.height); setView({ x: b.x - (size.width / scale - b.width) / 2, y: b.y - (size.height / scale - b.height) / 2, scale: Math.max(0.05, scale) }); };
    useEffect(() => { const r = new ResizeObserver(entries => { const { width, height } = entries[0].contentRect; setSize({ width, height }); }); if (host.current)
        r.observe(host.current); return () => r.disconnect(); }, []);
    useEffect(() => { fit(); }, [p.sheet.id, p.sheet.structure, p.focus, size.width, size.height]); // ordinary content edits preserve viewport
    useEffect(() => { if (!p.reveal)
        return; const n = scene.nodes.find(n => n.id === p.reveal); if (n)
        setView(v => ({ ...v, x: n.x + n.width / 2 - size.width / v.scale / 2, y: n.y + n.height / 2 - size.height / v.scale / 2 })); }, [p.reveal,p.revealVersion]);
    const zoom = (factor: number, cx = size.width / 2, cy = size.height / 2) => setView(v => { const scale = Math.max(0.05, Math.min(4, v.scale * factor)); return { scale, x: v.x + cx / v.scale - cx / scale, y: v.y + cy / v.scale - cy / scale }; });
    const nodeAt = (target: EventTarget | null) => target instanceof Element ? target.closest('[data-node-id]')?.getAttribute('data-node-id') ?? '' : '';
    const markup = useMemo(() => sceneMarkup(scene, { interactive: true, selected: p.selected }), [scene, p.selected]);
    return <div className={'canvas-host' + (hand ? ' hand' : marquee?' marquee':'')} ref={host}>
  <div className="canvas-caption"><span className="live-dot"/>{t("本機工作空間 ")}<span>／</span> {p.focus === p.sheet.rootId ? t('自由思考，清晰展開') : t('專注分支')}</div>
  <svg ref={svg} className="map-canvas" aria-label={t("心智圖畫布")} data-testid="canvas" style={{ fontFamily: FONT }} viewBox={`${view.x} ${view.y} ${size.width / view.scale} ${size.height / view.scale}`} onWheel={e => { e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); if (e.ctrlKey || e.metaKey)
        zoom(Math.exp(-e.deltaY * 0.006), e.clientX - r.left, e.clientY - r.top);
    else
        setView(v => ({ ...v, x: v.x + e.deltaX / v.scale, y: v.y + e.deltaY / v.scale })); }} onPointerDown={e => { if (e.button !== 0 && e.button !== 1)
        return; const id = nodeAt(e.target),r=e.currentTarget.getBoundingClientRect(),box=marquee&&e.button===0,bx=view.x+(e.clientX-r.left)/view.scale,by=view.y+(e.clientY-r.top)/view.scale; const pan = !box&&(hand || e.button === 1 || !id); if (id && !hand && !box) {
        p.onSelect(e.shiftKey ? p.selected.includes(id) ? p.selected.filter(i => i !== id) : [...p.selected, id] : p.selected.includes(id) ? p.selected : [id]);
    } drag.current = { id, x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moving: false, pan,marquee:box,seed:e.shiftKey?[...p.selected]:[],bx,by };if(box)setSelectionBox({x:bx,y:by,width:0,height:0}); e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => { const d = drag.current; if (!d)
        return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.hypot(dx, dy) > 5)
        d.moving = true; if(d.marquee){const x=d.bx+dx/view.scale,y=d.by+dy/view.scale;setSelectionBox({x:Math.min(d.bx,x),y:Math.min(d.by,y),width:Math.abs(x-d.bx),height:Math.abs(y-d.by)});return;} if (d.pan)
        setView(v => ({ ...v, x: d.vx - dx / v.scale, y: d.vy - dy / v.scale }));
    else if (d.moving && !p.readOnly) {
        const hit = nodeAt(document.elementFromPoint(e.clientX, e.clientY));
        setTarget(hit !== d.id ? hit : '');
    } }} onPointerUp={e => { const d = drag.current; if (!d)
        return; if(d.marquee){const x=d.bx+(e.clientX-d.x)/view.scale,y=d.by+(e.clientY-d.y)/view.scale,left=Math.min(d.bx,x),top=Math.min(d.by,y),right=Math.max(d.bx,x),bottom=Math.max(d.by,y);const ids=scene.nodes.filter(n=>n.x<=right&&n.x+n.width>=left&&n.y<=bottom&&n.y+n.height>=top).map(n=>n.id);p.onSelect([...new Set([...d.seed,...ids])]);drag.current=null;setSelectionBox(null);return;} if (d.moving && !d.pan && !p.readOnly) {
        const to = nodeAt(document.elementFromPoint(e.clientX, e.clientY));
        if (p.sheet.floating.includes(d.id) && !to) {
            const n = scene.nodes.find(n => n.id === d.id)!;
            p.onFloatMove(d.id, n.x + (e.clientX - d.x) / view.scale, n.y + (e.clientY - d.y) / view.scale);
        }
        else if (to && to !== d.id)
            p.onMove(d.id, to, e.altKey);
    } drag.current = null; setTarget(''); }} onPointerCancel={() => { drag.current = null; setTarget('');setSelectionBox(null); }} onDoubleClick={e => { const id = nodeAt(e.target); if (id && !p.readOnly && !hand && !marquee)
        p.onEdit(id); }} onKeyDown={e => { const id = nodeAt(e.target); if ((e.key === 'F2' || e.key === ' ') && id && !p.readOnly) {
        e.preventDefault();
        p.onEdit(id);
    } }}>
   <defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="0" cy="0" r="0.65" fill="#b8c6d9" opacity="0.65"/></pattern></defs><rect x={view.x} y={view.y} width={size.width / view.scale} height={size.height / view.scale} fill={p.sheet.background}/><rect x={view.x} y={view.y} width={size.width / view.scale} height={size.height / view.scale} fill="url(#grid)"/>
   <g dangerouslySetInnerHTML={{ __html: markup }}/>
   {selectionBox&&<rect data-testid="selection-marquee" x={selectionBox.x} y={selectionBox.y} width={selectionBox.width} height={selectionBox.height} fill="#3263ce" fillOpacity=".08" stroke="#3263ce" strokeWidth={1.5/view.scale} pointerEvents="none"/>}
   {target && (() => { const n = scene.nodes.find(n => n.id === target); return n ? <rect x={n.x - 7} y={n.y - 7} width={n.width + 14} height={n.height + 14} rx="14" fill="none" stroke="#11938a" strokeWidth="3" strokeDasharray="5 3" pointerEvents="none"/> : null; })()}
  </svg>
  <div className="canvas-help">{t("Tab 新增子主題 ")}<i /> {t(" Enter 新增同層 ")}<i /> {t(" 雙擊編輯 ")}<i /> {t(" 拖曳改變階層 · ⌥ 拖曳插入同層")}</div>
  <div className="canvas-controls"><button aria-label={t("選取工具")} className={!hand&&!marquee ? 'active' : ''} onClick={() => {setHand(false);setMarquee(false);}}><MousePointer2 size={17}/></button><button aria-label={t("平移工具")} className={hand ? 'active' : ''} onClick={() => {setHand(true);setMarquee(false);}}><Hand size={17}/></button><button aria-label={t("框選工具")} aria-pressed={marquee} className={marquee?'active':''} onClick={()=>{setHand(false);setMarquee(true);}}><SquareDashed size={17}/></button><span className="divider"/><button aria-label={t("縮小")} onClick={() => zoom(1 / 1.2)}><Minus size={17}/></button><span className="zoom-label">{Math.round(view.scale * 100)}%</span><button aria-label={t("放大")} onClick={() => zoom(1.2)}><Plus size={17}/></button><span className="divider"/><button aria-label={t("適應整張心智圖")} title={t("適應整張心智圖")} onClick={fit}><Scan size={17}/></button><button aria-label={t("返回中央")} title={t("返回中央")} onClick={() => { const n = scene.nodes.find(n => n.id === p.focus)!; setView(v => ({ ...v, x: n.x + n.width / 2 - size.width / v.scale / 2, y: n.y + n.height / 2 - size.height / v.scale / 2 })); }}><Crosshair size={17}/></button></div>
 </div>;
}
