import {useEffect, useMemo, useRef, useState} from 'react';
import {AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Minus, Plus, Scan, ListTree, ArrowUpRight} from 'lucide-react';
import {pageSVG, type PrintPlan} from '../engine/print';
import {pageRange} from '../engine/pageReferences';

export function PrintPreview(p: {plan: PrintPlan; index: number; onPage: (index: number) => void; focused: boolean}) {
  const {plan, index} = p, page = plan.pages[index];
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({width: 800, height: 600});
  const [zoom, setZoom] = useState<number | null>(null);
  const [showWarnings, setShowWarnings] = useState(false);
  const [showReferences, setShowReferences] = useState(false);
  useEffect(() => {const observer = new ResizeObserver(([entry]) => setSize({width: entry.contentRect.width, height: entry.contentRect.height}));
    if (viewport.current) observer.observe(viewport.current); return () => observer.disconnect();}, []);
  useEffect(() => {if (viewport.current) viewport.current.scrollTo({top: 0, left: 0});}, [index]);
  const scale = zoom ?? Math.max(.1, Math.min((size.width - 56) / plan.width, (size.height - 56) / plan.height, 1.5));
  const markup = useMemo(() => pageSVG(plan, index, true), [plan, index]);
  const changeZoom = (factor: number) => setZoom(Math.max(.15, Math.min(3, scale * factor)));
  useEffect(() => {
    const element = viewport.current; if (!element) return;
    const wheel = (event: WheelEvent) => {if (event.ctrlKey || event.metaKey) {event.preventDefault(); changeZoom(Math.exp(-event.deltaY * .004));}};
    element.addEventListener('wheel', wheel, {passive: false}); return () => element.removeEventListener('wheel', wheel);
  }, [scale]);
  return <main className="print-preview viewer">
    <div className="print-metrics"><span><b>{plan.pages.length}</b> 頁</span><span><b>{plan.widthMM} × {plan.heightMM}</b> mm</span><span><b>{plan.estimatedPt.toFixed(1)}</b> pt 最小主題字級</span><span>{plan.nodeCount} 個節點</span></div>
    <div className="viewer-notices">
      {plan.warnings.length ? <><button className="warning-toggle" aria-expanded={!p.focused || showWarnings} onClick={() => setShowWarnings(!showWarnings)}><AlertTriangle size={15}/>{plan.warnings.length} 項列印提醒</button>{(!p.focused || showWarnings) && <div className="print-warnings">{plan.warnings.map(w => <div className="warning" key={w}>{w}</div>)}</div>}</> : <div className="success-note"><CheckCircle2 size={15}/>主題文字達到設定字級 · Noto Sans TC 隨檔嵌入</div>}
    </div>
    <div className="paper-viewport" ref={viewport} aria-label="可縮放列印預覽">
      <div className="paper-stage zoom-stage" style={{width: plan.width * scale + 56, minHeight: plan.height * scale + 56}}>
        <div className="paper" data-testid="print-page" data-page-number={index + 1} style={{width: plan.width * scale, height: plan.height * scale}}
          onClick={event => {const anchor = event.target instanceof Element ? event.target.closest('[data-target-page]') : null;
            if (anchor) {event.preventDefault(); p.onPage(Number(anchor.getAttribute('data-target-page')) - 1);}}}
          dangerouslySetInnerHTML={{__html: markup}}/>
      </div>
    </div>
    <div className="preview-controls"><div className="page-nav">
      <button aria-label="上一頁" disabled={index === 0} onClick={() => p.onPage(index - 1)}><ChevronLeft size={17}/></button>
      <label className="page-picker"><select aria-label="預覽頁碼" value={index} onChange={e => p.onPage(Number(e.target.value))}>{plan.pages.map((page, i) => <option key={i} value={i}>第 {i + 1} 頁 · {page.label.slice(0, 34)}</option>)}</select><span>/ {plan.pages.length}</span></label>
      <button aria-label="下一頁" disabled={index === plan.pages.length - 1} onClick={() => p.onPage(index + 1)}><ChevronRight size={17}/></button>
    </div><span className="toolbar-spacer"/><button aria-label="預覽縮小" onClick={() => changeZoom(1 / 1.25)}><Minus size={16}/></button><button aria-label="預覽原始大小" onClick={() => setZoom(1)}>{Math.round(scale * 100)}%</button><button aria-label="預覽放大" onClick={() => changeZoom(1.25)}><Plus size={16}/></button><button aria-label="預覽適合視窗" onClick={() => setZoom(null)} title="適合視窗"><Scan size={16}/></button>
      {!!plan.indexPages.length && <button onClick={() => p.onPage(plan.indexPages[0] - 1)}><ListTree size={15}/>關係索引</button>}
    </div>
    <div className="preview-details"><span className="muted small">{page.label} · 列印比例 {Math.round(page.scale * 100)}% · 虛線為可印範圍</span>
      {!!page.references.length && <button aria-expanded={showReferences} onClick={() => setShowReferences(!showReferences)}>{page.references.length} 項續頁／關係提示<ArrowUpRight size={14}/></button>}
      {showReferences && !!page.references.length && <div className="reference-list" aria-label="本頁跨頁提示">{page.references.map((ref, i) => <div key={`${ref.key}-${i}`}><strong>{ref.key} · {ref.label}</strong><span>{ref.target}</span><div>{ref.pages.map(number => <button key={number} onClick={() => p.onPage(number - 1)}>前往第 {number} 頁</button>)}</div></div>)}</div>}
    </div>
    {plan.mode === 'poster' && <details className="poster-overview" open={!p.focused}><summary>海報排列預覽 · {plan.pages.filter(page => page.row).length} 張紙</summary><div className="poster-grid" aria-label="海報排列預覽">{plan.pages.filter(page => page.row).map((item, i) => <button className={index === i ? 'active' : ''} key={i} onClick={() => p.onPage(i)}>{item.row}-{item.col}<small>第 {i + 1} 頁</small></button>)}</div></details>}
    {!!plan.indexPages.length && <span className="sr-only">完整跨頁關係索引：第 {pageRange(plan.indexPages)} 頁</span>}
  </main>;
}
