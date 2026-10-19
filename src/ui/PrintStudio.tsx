import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Printer, FileDown, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { defaultPrint, papers, planPrint, pageSVG, printHTML, type PrintSettings, type PrintMode } from '../engine/print';
import type { Sheet } from '../core/model';
type Props = {
    sheet: Sheet;
    selected: string;
    title: string;
    onClose: () => void;
    notify: (text: string) => void;
};
const modes: [
    PrintMode,
    string,
    string
][] = [['fit', '單頁完整', '保留整張心智圖的空間關係'], ['readable', '可讀分頁', '重排階層，維持最低文字大小'], ['poster', '海報拼接', '保留原圖比例，多頁接合'], ['branches', '主要分支分頁', '每個主要分支獨立呈現'], ['selection', '選取分支', '只列印選取節點及其子樹'], ['outline', '大綱列印', '階層式文字，適合長篇內容']];
export function PrintStudio(p: Props) {
    const [settings, setSettings] = useState<PrintSettings>({ ...defaultPrint, header: p.title });
    const [index, setIndex] = useState(0);
    const [busy, setBusy] = useState(false);
    const result = useMemo(() => { try {
        return { plan: planPrint(p.sheet, settings, p.selected), error: '' };
    }
    catch (e) {
        return { plan: undefined, error: (e as Error).message };
    } }, [p.sheet, settings, p.selected]);
    const plan = result.plan;
    const current = Math.min(index, (plan?.pages.length ?? 1) - 1);
    const set = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => { setSettings(s => ({ ...s, [key]: value })); setIndex(0); };
    useEffect(() => { if (!plan)
        return; const svg = document.querySelector('[data-testid="print-page"] svg'); if (!svg)
        return; const guide = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); const attrs = { x: plan.margin, y: plan.margin + 22, width: plan.contentWidth, height: plan.contentHeight, fill: 'none', stroke: '#a9bcd5', 'stroke-width': 0.6, 'stroke-dasharray': '4 5', 'pointer-events': 'none', 'data-preview-guide': 'printable-area' }; for (const [k, v] of Object.entries(attrs))
        guide.setAttribute(k, String(v)); svg.append(guide); return () => guide.remove(); }, [plan, current]);
    async function output(pdf: boolean) { if (!plan)
        return; setBusy(true); try {
        const html = printHTML(plan);
        if (window.openmind) {
            if (pdf) {
                const r = await window.openmind.pdf({ html, name: p.title });
                if (r)
                    p.notify(`已輸出 PDF：${r.name}`);
            }
            else {
                if (await window.openmind.print({ html }))
                    p.notify('已送出列印工作。');
            }
        }
        else {
            const frame = document.createElement('iframe');
            frame.className = 'print-frame';
            frame.title = '列印文件';
            document.body.appendChild(frame);
            frame.srcdoc = html;
            await new Promise<void>(resolve => { frame.onload = () => resolve(); });
            await frame.contentDocument!.fonts.ready;
            await Promise.all([...frame.contentDocument!.images].map(i => i.decode().catch(() => { })));
            frame.contentWindow!.focus();
            frame.contentWindow!.print();
            setTimeout(() => frame.remove(), 60000);
            p.notify('已開啟瀏覽器列印；可選擇「儲存為 PDF」。請關閉瀏覽器頁首頁尾，並保留預覽紙張設定。');
        }
    }
    catch (e) {
        p.notify(`輸出失敗：${(e as Error).message}`);
    }
    finally {
        setBusy(false);
    } }
    return <div className="print-studio" role="dialog" aria-label="列印工作室"><header className="print-top"><button className="text-button" onClick={p.onClose}><ArrowLeft size={18}/>返回編輯</button><div><strong>列印工作室</strong><span>每一個好想法，都值得被看清楚。</span></div><div className="top-actions"><button onClick={() => output(false)} disabled={!plan || busy}><Printer size={16}/>列印</button><button className="primary" onClick={() => output(true)} disabled={!plan || busy}><FileDown size={16}/>{busy ? '正在輸出…' : window.openmind ? '輸出 PDF' : '列印／另存 PDF'}</button></div></header>
  <aside className="print-settings"><div className="section-label">列印策略</div><div className="mode-list">{modes.map(([key, title, description]) => <button key={key} className={settings.mode === key ? 'chosen' : ''} onClick={() => set('mode', key)}><span className="radio-dot"/><span><strong>{title}</strong><small>{description}</small></span></button>)}</div><div className="section-label">紙張與版面</div><div className="form-grid"><label>紙張尺寸<select aria-label="紙張尺寸" value={settings.paper} onChange={e => set('paper', e.target.value as PrintSettings['paper'])}>{Object.keys(papers).map(k => <option key={k}>{k}</option>)}<option value="Custom">自訂</option></select></label><label>方向<select aria-label="列印方向" value={settings.landscape ? 'landscape' : 'portrait'} onChange={e => set('landscape', e.target.value === 'landscape')}><option value="landscape">橫向</option><option value="portrait">直向</option></select></label>{settings.paper === 'Custom' && <><label>寬度 mm<input type="number" value={settings.customWidth} onChange={e => set('customWidth', +e.target.value)}/></label><label>高度 mm<input type="number" value={settings.customHeight} onChange={e => set('customHeight', +e.target.value)}/></label></>}<label>邊界 mm<input aria-label="列印邊界" type="number" min="0" max="100" value={settings.margin} onChange={e => set('margin', +e.target.value)}/></label><label>最低字級 pt<input aria-label="最低字級" type="number" min="6" max="36" value={settings.minPt} onChange={e => set('minPt', +e.target.value)}/></label>{settings.mode === 'poster' && <label>重疊 mm<input type="number" min="0" max="30" value={settings.overlap} onChange={e => set('overlap', +e.target.value)}/></label>}</div><label className="wide-label">頁首<input value={settings.header} maxLength={100} onChange={e => set('header', e.target.value)}/></label><label className="wide-label">頁尾<input value={settings.footer} maxLength={100} onChange={e => set('footer', e.target.value)}/></label><label className="check-label"><input type="checkbox" checked={settings.pageNumbers} onChange={e => set('pageNumbers', e.target.checked)}/>顯示頁碼</label><label className="check-label"><input type="checkbox" checked={settings.background} onChange={e => set('background', e.target.checked)}/>保留畫布背景</label><label className="check-label"><input type="checkbox" checked={settings.monochrome} onChange={e => set('monochrome', e.target.checked)}/>黑白省墨模式</label><p className="muted small">PDF 使用向量與可選取文字。實體印表機的紙張支援、邊界與字型仍需實際確認。</p></aside>
  <main className="print-preview">{result.error ? <div className="warning"><AlertTriangle />{result.error}</div> : plan && <><div className="print-metrics"><span><b>{plan.pages.length}</b> 頁</span><span><b>{plan.widthMM} × {plan.heightMM}</b> mm</span><span><b>{plan.estimatedPt.toFixed(1)}</b> pt 最小節點字級</span><span>{plan.nodeCount} 個節點</span></div><div className="print-warnings">{plan.warnings.length ? plan.warnings.map(w => <div className="warning" key={w}><AlertTriangle size={17}/><span>{w}</span></div>) : <div className="success-note"><CheckCircle2 size={17}/>節點文字達到設定字級，內容位於可列印範圍。</div>}</div><div className="paper-stage"><div className="paper" data-testid="print-page" style={{ aspectRatio: `${plan.widthMM}/${plan.heightMM}` }} dangerouslySetInnerHTML={{ __html: pageSVG(plan, current) }}/></div><div className="page-nav"><button aria-label="上一頁" disabled={current === 0} onClick={() => setIndex(current - 1)}><ChevronLeft size={18}/></button><span>{current + 1} / {plan.pages.length} · {plan.pages[current].label} · 比例 {Math.round(plan.pages[current].scale * 100)}%</span><button aria-label="下一頁" disabled={current === plan.pages.length - 1} onClick={() => setIndex(current + 1)}><ChevronRight size={18}/></button></div>{settings.mode === 'poster' && <div className="poster-grid" aria-label="海報排列預覽">{plan.pages.map((page, i) => <button className={i === current ? 'active' : ''} key={i} onClick={() => setIndex(i)}>{page.row}-{page.col}<small>第 {i + 1} 頁</small></button>)}</div>}</>}
  </main></div>;
}
