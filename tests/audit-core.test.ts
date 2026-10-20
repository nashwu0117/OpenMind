import {describe, expect, it} from 'vitest';
import {activeSheet, addTopic, clone, copyBranch, newWorkbook, pasteBranches, removeTopics, uid, validateWorkbook} from '../src/core/model';
import {loadRecovery, saveRecovery} from '../src/core/storage';
import {markdown, opml, nativeJSON, parseMarkdown} from '../src/io/formats';
class MemoryStorage implements Storage {
  data = new Map<string,string>(); get length(){return this.data.size;} clear(){this.data.clear();}
  key(i:number){return [...this.data.keys()][i]??null;} getItem(k:string){return this.data.get(k)??null;}
  setItem(k:string,v:string){this.data.set(k,v);} removeItem(k:string){this.data.delete(k);}
}
describe('completion audit: data reliability regressions',()=>{
  it('rejects oversized or malformed base64 attachments before accepting a document',()=>{
    const b=newWorkbook(),n=activeSheet(b).nodes[activeSheet(b).rootId];n.attachments=[{id:uid(),name:'large.bin',mime:'application/octet-stream',data:'data:application/octet-stream;base64,'+'A'.repeat(2666668)}];expect(()=>validateWorkbook(b)).toThrow(/2 MB/);
    n.attachments[0].data='data:application/octet-stream;base64,a';expect(()=>validateWorkbook(b)).toThrow();n.attachments[0].data='data:application/octet-stream;base64,aA==';expect(()=>validateWorkbook(b)).not.toThrow();
  });
  it('enforces the same UTF-8 size limit for interchange output and input',()=>{const s=activeSheet(newWorkbook());for(let i=0;i<100;i++){const id=addTopic(s,s.rootId);s.nodes[id].text='繁'.repeat(10000);}expect(()=>markdown(s)).toThrow(/2 MB/);expect(()=>opml(s)).toThrow(/2 MB/);expect(()=>parseMarkdown('- '+'繁'.repeat(700000))).toThrow(/2 MB/);});
  it('recovers an interrupted newer pending write before the older primary',()=>{
    const storage=new MemoryStorage(),book=newWorkbook();saveRecovery(storage,book);
    const next=clone(book);next.title='斷電前的新資料';
    storage.setItem('openmind.recovery.v1.pending',JSON.stringify({book:next,savedAt:new Date().toISOString()}));
    expect(loadRecovery(storage).book?.title).toBe(next.title);
  });
  it('does not crash startup when browser storage access is denied',()=>{
    const storage=new MemoryStorage();storage.getItem=()=>{throw new Error('SecurityError');};
    expect(()=>loadRecovery(storage)).not.toThrow();expect(loadRecovery(storage).warning).toBeTruthy();
  });
  it('cleans internal links when their target is deleted',()=>{
    const book=newWorkbook(),s=activeSheet(book),a=addTopic(s,s.rootId),b=addTopic(s,s.rootId);
    s.nodes[a].link='openmind:'+b;removeTopics(s,[b]);
    expect(s.nodes[a].link).toBe('');expect(validateWorkbook(book)).toEqual(book);
  });
  it('does not leave dangling external topic references when pasting to another sheet',()=>{
    const source=activeSheet(newWorkbook()),destination=activeSheet(newWorkbook());
    const a=addTopic(source,source.rootId),b=addTopic(source,source.rootId);source.nodes[a].link='openmind:'+b;
    const [copy]=pasteBranches(source,[a],destination,destination.rootId);expect(destination.nodes[copy].link).toBe('');
  });
  it('copyBranch remaps internal links and copies attached relationship/boundary data',()=>{
    const s=activeSheet(newWorkbook()),a=addTopic(s,s.rootId),b=addTopic(s,a);s.nodes[a].link='openmind:'+b;
    s.relationships.push({id:uid(),from:a,to:b,text:'依賴',directed:true,dashed:false});s.boundaries.push({id:uid(),topicId:a,text:'範圍'});
    const copy=copyBranch(s,a,s.rootId),child=s.nodes[copy].children[0];
    expect(s.nodes[copy].link).toBe('openmind:'+child);expect(s.relationships).toHaveLength(2);expect(s.boundaries).toHaveLength(2);
  });
  it('preserves literal HTML-like text, ampersands and backslashes in Markdown round trips',()=>{
    const s=activeSheet(newWorkbook());s.nodes[s.rootId].text='字面 <br> &lt; & > \\ \\n\n真正換行';
    const round=activeSheet(parseMarkdown(markdown(s)));expect(round.nodes[round.rootId].text).toBe(s.nodes[s.rootId].text);
  });
  it('rejects native output larger than its own import limit',()=>{
    const book=newWorkbook(),s=activeSheet(book);for(let i=0;i<205;i++){const id=addTopic(s,s.rootId);s.nodes[id].notes='x'.repeat(100000);}
    expect(()=>nativeJSON(book)).toThrow(/20 MB/);
  });
  it('rejects duplicate annotation IDs instead of ambiguous edit/delete targets',()=>{
    const book=newWorkbook(),s=activeSheet(book),a=addTopic(s,s.rootId),id=uid();
    s.relationships.push(...[1,2].map(i=>({id,from:s.rootId,to:a,text:String(i),directed:true,dashed:false})));
    expect(()=>validateWorkbook(book)).toThrow();
  });
});
