import {describe,expect,it} from 'vitest';
import {activeSheet,clone,fixture,newWorkbook,removeTopics,structures,validateWorkbook,uid} from '../src/core/model';
import {addSummary,insertParent,scheduleDependencies,taskDuration,applyTheme,themes} from '../src/core/commands';
import {nativeJSON,parseNative} from '../src/io/formats';
import {layout} from '../src/engine/layout';
import {renderSVG} from '../src/engine/svg';
import {commit,historyOf,undo,redo} from '../src/core/history';
import {ganttScene,presentationPlan,slideOrder,taskPlan} from '../src/engine/viewPlans';
describe('versioned local parity data',()=>{
  it('migrates v1 in memory without changing its source or losing original fields',()=>{
    const current=newWorkbook(),legacy=clone(current) as unknown as Record<string,unknown>;legacy.version=1;
    const s=(legacy.sheets as Record<string,unknown>[])[0];for(const key of ['summaries','spacing','connector','slides'])delete s[key];
    for(const n of Object.values(s.nodes as Record<string,Record<string,unknown>>)){for(const key of ['sticker','equation','attachments'])delete n[key];for(const key of ['align','font','opacity','strokeWidth','dashed'])delete (n.style as Record<string,unknown>)[key];}
    const bytes=JSON.stringify(legacy),round=parseNative(bytes);expect(round.version).toBe(2);expect(round.id).toBe(current.id);expect(round.sheets[0].nodes).toEqual(current.sheets[0].nodes);expect(JSON.stringify(legacy)).toBe(bytes);
  });
  it('inserts a parent above ordinary, central and floating topics with exact undo/redo',()=>{
    const original=fixture(10);let h=historyOf(original);const s=activeSheet(original),child=s.nodes[s.rootId].children[0];
    h=commit(h,b=>{insertParent(activeSheet(b),child);});expect(Object.keys(activeSheet(h.present).nodes)).toHaveLength(11);expect(undo(h).present).toEqual(original);expect(redo(undo(h)).present).toEqual(h.present);
    const b=clone(original),sheet=activeSheet(b),oldRoot=sheet.rootId;const root=insertParent(sheet,oldRoot);expect(sheet.nodes[root].children).toEqual([oldRoot]);validateWorkbook(b);
    const floating=uid();sheet.nodes[floating]={...clone(sheet.nodes[oldRoot]),id:floating,children:[],position:{x:900,y:400}};sheet.floating.push(floating);const parent=insertParent(sheet,floating);expect(sheet.floating).toContain(parent);expect(sheet.nodes[parent].position).toEqual({x:900,y:400});validateWorkbook(b);
  });
  it('roundtrips summaries, full style, sticker, attachments, slides and task dependencies',()=>{
    const book=fixture(10),s=activeSheet(book),ids=Object.keys(s.nodes),n=s.nodes[ids[1]];
    n.style={...n.style,align:'right',font:'mono',opacity:.6,strokeWidth:3,dashed:true};n.sticker='🌱';n.equation='x^2+1';n.attachments=[{id:uid(),name:'附件.txt',mime:'text/plain',data:'data:application/octet-stream;base64,aGVsbG8='}];
    n.task={status:'doing',start:'2026-10-20',due:'2026-10-22'};s.nodes[ids[2]].task={status:'todo',start:'2026-10-21',due:'2026-10-22',dependencies:[n.id]};addSummary(s,[ids[1],ids[2]],'彙整');s.slides=[ids[2],ids[1]];
    expect(parseNative(nativeJSON(book))).toEqual(book);removeTopics(s,[n.id]);expect(s.summaries[0].topicIds).toEqual([ids[2]]);expect(s.slides).toEqual([ids[2]]);expect(s.nodes[ids[2]].task?.dependencies).toEqual([]);validateWorkbook(book);
  });
  it('schedules real dependent tasks by UTC calendar days while retaining duration',()=>{
    const book=fixture(10),s=activeSheet(book),ids=Object.keys(s.nodes);s.nodes[ids[1]].task={status:'todo',start:'2026-09-25',due:'2026-09-27'};s.nodes[ids[2]].task={status:'todo',start:'2026-09-26',due:'2026-09-28',dependencies:[ids[1]]};scheduleDependencies(s);
    expect(s.nodes[ids[2]].task?.start).toBe('2026-09-28');expect(s.nodes[ids[2]].task?.due).toBe('2026-09-30');expect(taskDuration(s.nodes[ids[2]].task!)).toBe(3);
    s.nodes[ids[1]].task!.dependencies=[ids[2]];expect(()=>validateWorkbook(book)).toThrow(/循環/);
  });
  it('applies real saved styles and background to the same nodes',()=>{const s=activeSheet(fixture(10)),ids=Object.keys(s.nodes);applyTheme(s,themes[2]);expect(Object.keys(s.nodes)).toEqual(ids);expect(s.background).toBe('#162332');expect(s.nodes[ids[1]].style.fill).toBe('#24374c');});
});
describe('real presentation and task plans',()=>{
  it('preserves customized slide order and emits real 16:9 vector pages',()=>{const s=activeSheet(fixture(50)),ids=Object.keys(s.nodes);s.slides=[ids[7],ids[2],s.rootId];const before=JSON.stringify(s),plan=presentationPlan(s,'簡報驗收');expect(slideOrder(s)).toEqual(s.slides);expect(plan.pages).toHaveLength(3);expect(plan.widthMM/plan.heightMM).toBeCloseTo(16/9,3);expect(plan.pages[0].scene.nodes[0].id).toBe(ids[7]);expect(JSON.stringify(s)).toBe(before);});
  it('uses actual dates for bars and paginates task coverage with dependency references',()=>{const s=activeSheet(fixture(50)),ids=Object.keys(s.nodes);ids.forEach((id,i)=>{s.nodes[id].task={status:'todo',start:'2026-10-20',due:i===1?'2026-10-25':'2026-10-22',dependencies:i===49?[ids[0]]:[]};});const before=JSON.stringify(s),scene=ganttScene(s,ids),plan=taskPlan(s,ids,'任務驗收');expect(scene.extraMarkup).toContain('2026-10-25');expect(scene.extraMarkup?.match(/data-task-bar=/g)).toHaveLength(50);expect(new Set(plan.pages.flatMap(p=>p.topicIds)).size).toBe(50);expect(plan.estimatedPt).toBeGreaterThanOrEqual(10);expect(plan.indexPages.length).toBeGreaterThan(0);expect(JSON.stringify(s)).toBe(before);});
});
describe('nine real diagram structures',()=>{
  it.each(Object.keys(structures) as (keyof typeof structures)[])('%s retains all 200 topics without node overlap or invalid geometry',structure=>{
    const s=activeSheet(fixture(200));s.structure=structure;const scene=layout(s);expect(scene.nodes).toHaveLength(200);for(let i=0;i<scene.nodes.length;i++){const a=scene.nodes[i];expect(Number.isFinite(a.x+a.y+a.width+a.height)).toBe(true);for(const b of scene.nodes.slice(i+1))expect(a.x+1<b.x+b.width&&a.x+a.width>b.x+1&&a.y+1<b.y+b.height&&a.y+a.height>b.y+1,[a.id,b.id].join()).toBe(false);}
    expect(renderSVG(scene)).not.toContain('undefined');
  });
  it('timeline, matrix, fishbone and tree table each have distinct geometry from organization charts',()=>{const s=activeSheet(fixture(10));const geometry=(structure:typeof s.structure)=>{s.structure=structure;return layout(s).nodes.map(n=>[n.x,n.y,n.width,n.height]);};const org=geometry('org');for(const structure of ['timeline','matrix','fishbone','treetable'] as const)expect(geometry(structure)).not.toEqual(org);});
});
