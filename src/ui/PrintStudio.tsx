import {useCallback, useEffect, useMemo, useState} from 'react';
import {ArrowLeft, Printer, FileDown, AlertTriangle, Maximize2, Minimize2} from 'lucide-react';
import {defaultPrint, papers, planPrint, type PrintSettings, type PrintMode} from '../engine/print';
import {outputPrint} from '../io/printing';
import type {Sheet} from '../core/model';
import {PrintPreview} from './PrintPreview';
import {useI18n, t, tTemplate} from './i18n';

type Props = {sheet: Sheet; selected: string; title: string; onClose: () => void; notify: (text: string) => void};
const modes: [PrintMode, string, string][] = [
  ['fit', t('單頁完整'), t('保留整張心智圖的空間關係')], ['readable', t('可讀分頁'), t('重排階層，維持最低文字大小')],
  ['poster', t('海報拼接'), t('保留原圖比例，多頁接合')], ['branches', t('主要分支分頁'), t('依最低字級自動分頁，保留祖先脈絡')],
  ['selection', t('選取分支'), t('只列印選取節點及其子樹')], ['outline', t('大綱列印'), t('階層式文字，適合長篇內容')],
];
function SettingsPanel(p: {settings: PrintSettings; set: <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => void}) {
  const {settings: s, set} = p;
  return <aside className="print-settings" aria-label={t("列印設定")}>
    <div className="section-label">{t("列印策略")}</div><div className="mode-list">{modes.map(([key, title, description]) =>
      <button key={key} className={s.mode === key ? 'chosen' : ''} onClick={() => set('mode', key)}><span className="radio-dot"/><span><strong>{t(title)}</strong><small>{t(description)}</small></span></button>)}</div>
    <div className="section-label">{t("紙張與版面")}</div><div className="form-grid">
      <label>{t("紙張尺寸")}<select aria-label={t("紙張尺寸")} value={s.paper} onChange={e => set('paper', e.target.value as PrintSettings['paper'])}>{Object.keys(papers).map(k => <option key={k}>{k}</option>)}<option value="Custom">{t("自訂")}</option></select></label>
      <label>{t("方向")}<select aria-label={t("列印方向")} value={s.landscape ? 'landscape' : 'portrait'} onChange={e => set('landscape', e.target.value === 'landscape')}><option value="landscape">{t("橫向")}</option><option value="portrait">{t("直向")}</option></select></label>
      {s.paper === 'Custom' && <><label>{t("寬度 mm")}<input aria-label={t("紙張寬度")} type="number" value={s.customWidth} onChange={e => set('customWidth', +e.target.value)}/></label><label>{t("高度 mm")}<input aria-label={t("紙張高度")} type="number" value={s.customHeight} onChange={e => set('customHeight', +e.target.value)}/></label></>}
      <label>{t("邊界 mm")}<input aria-label={t("列印邊界")} type="number" min="0" max="100" value={s.margin} onChange={e => set('margin', +e.target.value)}/></label>
      <label>{t("最低字級 pt")}<input aria-label={t("最低字級")} type="number" min="6" max="36" value={s.minPt} onChange={e => set('minPt', +e.target.value)}/></label>
      {s.mode === 'poster' && <label>{t("重疊 mm")}<input aria-label={t("海報重疊")} type="number" min="0" max="30" value={s.overlap} onChange={e => set('overlap', +e.target.value)}/></label>}
    </div>
    <label className="wide-label">{t("頁首")}<input value={s.header} maxLength={100} onChange={e => set('header', e.target.value)}/></label>
    <label className="wide-label">{t("頁尾")}<input value={s.footer} maxLength={100} onChange={e => set('footer', e.target.value)}/></label>
    <label className="check-label"><input type="checkbox" checked={s.pageNumbers} onChange={e => set('pageNumbers', e.target.checked)}/>{t("顯示頁碼")}</label>
    <label className="check-label"><input type="checkbox" checked={s.background} onChange={e => set('background', e.target.checked)}/>{t("保留畫布背景")}</label>
    <label className="check-label"><input type="checkbox" checked={s.monochrome} onChange={e => set('monochrome', e.target.checked)}/>{t("黑白省墨模式")}</label>
    <p className="muted small">{t("Noto Sans TC 以 OFL 授權隨程式提供，並嵌入 PDF。部分符號與罕見字可能使用系統回退字型。實體印表機的紙張與邊界仍需實際確認。")}</p>
  </aside>;
}
export function PrintStudio(p: Props) {
  const {locale} = useI18n();
  const translate = useCallback((source: string, values?: Array<string | number>) => values ? tTemplate(source, values) : t(source), [locale]);
  const [settings, setSettings] = useState<PrintSettings>({...defaultPrint, header: p.title, locale});
  const localizedSettings = useMemo(() => ({...settings, locale, translate}), [settings, locale, translate]);
  const [index, setIndex] = useState(0), [busy, setBusy] = useState(false), [focused, setFocused] = useState(false);
  const result = useMemo(() => {try {return {plan: planPrint(p.sheet, localizedSettings, p.selected), error: ''};}
    catch (error) {return {plan: undefined, error: (error as Error).message};}}, [p.sheet, localizedSettings, p.selected]);
  const plan = result.plan, current = Math.min(index, (plan?.pages.length ?? 1) - 1);
  const set = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {setSettings(s => ({...s, [key]: value})); setIndex(0);};
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest('input,textarea,select')) return;
      if (event.key === 'Escape') {event.preventDefault(); focused ? setFocused(false) : p.onClose();}
      if (event.key === 'ArrowRight' && plan) {event.preventDefault(); setIndex(Math.min(plan.pages.length - 1, current + 1));}
      if (event.key === 'ArrowLeft') {event.preventDefault(); setIndex(Math.max(0, current - 1));}
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [focused, plan, current, p.onClose]);
  async function output(pdf: boolean) {
    if (!plan) return; setBusy(true);
    try {
      const message=await outputPrint(plan,p.title,pdf);if(message)p.notify(message);
    } catch (error) {p.notify(tTemplate("輸出失敗：{0}",[(error as Error).message]));} finally {setBusy(false);}
  }
  return <div className={`print-studio${focused ? ' print-focus' : ''}`} role="dialog" aria-label={t("列印工作室")} aria-modal="true">
    <header className="print-top"><button className="text-button" onClick={p.onClose}><ArrowLeft size={18}/>{t("返回編輯")}</button>
      <div><strong>{t("列印工作室")}</strong><span>{focused ? t('專注預覽 · ← → 翻頁 · Esc 返回設定') : t('每一個好想法，都值得被看清楚。')}</span></div>
      <div className="top-actions"><button aria-label={focused ? t('離開專注預覽') : t('展開專注預覽')} aria-pressed={focused} onClick={() => setFocused(!focused)}>{focused ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}<span>{focused ? t('返回設定') : t('專注預覽')}</span></button>
        <button onClick={() => output(false)} disabled={!plan || busy}><Printer size={16}/>{t("列印")}</button>
        <button className="primary" onClick={() => output(true)} disabled={!plan || busy}><FileDown size={16}/>{busy ? t('正在嵌入字型…') : window.openmind ? t('輸出 PDF') : t('列印／另存 PDF')}</button></div>
    </header>
    <SettingsPanel settings={settings} set={set}/>
    {plan ? <PrintPreview plan={plan} index={current} onPage={setIndex} focused={focused}/> : <main className="print-preview"><div className="warning"><AlertTriangle/>{t(result.error)}</div></main>}
  </div>;
}
