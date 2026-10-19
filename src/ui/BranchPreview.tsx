import {useMemo} from 'react';
import {ArrowUpRight, X} from 'lucide-react';
import type {Sheet} from '../core/model';
import {branchSheet, layout} from '../engine/layout';
import {renderSVG} from '../engine/svg';

export function BranchPreview(p: {sheet: Sheet; topicId: string; onExpand: () => void; onClose: () => void}) {
  const markup = useMemo(() => p.sheet.nodes[p.topicId] ? renderSVG(layout(branchSheet(p.sheet, p.topicId), p.topicId, true)) : '', [p.sheet, p.topicId]);
  if (!markup) return null;
  return <section className="branch-preview-card" role="region" aria-label="分支預覽">
    <header><div><span className="eyebrow">BRANCH PREVIEW</span><strong>{p.sheet.nodes[p.topicId].text}</strong></div><button aria-label="關閉分支預覽" onClick={p.onClose}><X size={16}/></button></header>
    <div className="branch-preview-scene" dangerouslySetInnerHTML={{__html: markup}}/>
    <footer><span>預覽包含所有子節點</span><button className="primary" onClick={p.onExpand}>展開此分支<ArrowUpRight size={15}/></button></footer>
  </section>;
}
