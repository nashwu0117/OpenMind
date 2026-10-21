import {afterEach,describe,expect,it,vi} from 'vitest';
import {archiveLocal,persistLocal,restoreLocal,saveLibraryOrganization,type LibraryOrganization} from '../src/core/library';
import {clone,newWorkbook} from '../src/core/model';

class MemoryStorage implements Storage {
  data=new Map<string,string>();
  get length(){return this.data.size;}
  clear(){this.data.clear();}
  key(index:number){return [...this.data.keys()][index]??null;}
  getItem(key:string){return this.data.get(key)??null;}
  removeItem(key:string){this.data.delete(key);}
  setItem(key:string,value:string){this.data.set(key,value);}
}

// Keep these tests independent of browser globals and optional IDB dependencies.
class MemoryIndexedDB {
  stores=new Map<string,Map<unknown,unknown>>([['state',new Map()],['books',new Map()],['presets',new Map()]]);
  failWrites=false;
  private request<T>(read:()=>T):IDBRequest<T>{
    const request={result:undefined as T|undefined,onsuccess:null as (()=>void)|null,onerror:null as (()=>void)|null};
    queueMicrotask(()=>{request.result=read();request.onsuccess?.();});
    return request as unknown as IDBRequest<T>;
  }
  open(){
    return this.request(()=>({
      close(){},
      transaction:(names:string|string[],mode:IDBTransactionMode)=>{
        const selected=Array.isArray(names)?names:[names],staged=new Map(selected.map(name=>[name,new Map(this.stores.get(name))]));
        const fail=mode==='readwrite'&&this.failWrites;
        const transaction={
          error:fail?new Error('IndexedDB write failed'):null,
          oncomplete:null as (()=>void)|null,onabort:null as (()=>void)|null,onerror:null as (()=>void)|null,
          objectStore:(name:string)=>{
            const rows=staged.get(name)!;
            return {
              get:(key:unknown)=>this.request(()=>structuredClone(rows.get(key))),
              getAll:()=>this.request(()=>structuredClone([...rows.values()])),
              put:(record:unknown,key?:unknown)=>this.request(()=>{const id=key??(record as {id:string}).id;rows.set(id,structuredClone(record));return id;}),
              delete:()=>{throw new Error('Saving a library must not delete workbooks');},
            };
          },
        };
        setTimeout(()=>{if(fail){transaction.onabort?.();return;}if(mode==='readwrite')for(const [name,rows] of staged)this.stores.set(name,rows);transaction.oncomplete?.();},0);
        return transaction;
      },
    }));
  }
}

const organization:LibraryOrganization={folders:[{id:'projects',name:'專案'}],assignments:{'map-a':'projects'}};
afterEach(()=>vi.unstubAllGlobals());

describe('library organization',()=>{
  it('always restores an empty organization when no saved metadata exists',async()=>{
    vi.stubGlobal('indexedDB',undefined);
    expect((await restoreLocal(new MemoryStorage())).organization).toEqual({folders:[],assignments:{}});
  });
  it('keeps valid folders and assignments while discarding malformed metadata',async()=>{
    vi.stubGlobal('indexedDB',undefined);
    const cache=new MemoryStorage();
    cache.setItem('openmind.organization.v1',JSON.stringify({folders:[{id:' projects ',name:' 專案 '},{id:'projects',name:'重複'},{id:'empty',name:'  '},{id:'',name:'沒有 ID'},null,{id:3,name:'錯誤型別'}],assignments:{'map-a':'projects','map-b':'missing','map-c':3,' ':'projects'}}));
    expect((await restoreLocal(cache)).organization).toEqual(organization);
    cache.setItem('openmind.organization.v1','broken');
    expect((await restoreLocal(cache)).organization).toEqual({folders:[],assignments:{}});
  });
  it('commits metadata to the existing state store and mirrors it for fallback restore',async()=>{
    const idb=new MemoryIndexedDB(),cache=new MemoryStorage();vi.stubGlobal('indexedDB',idb);
    await saveLibraryOrganization(organization,cache);
    expect(idb.stores.get('state')?.get('libraryOrganization')).toEqual({organization,updatedAt:expect.any(Number)});
    expect((await restoreLocal(cache)).organization).toEqual(organization);
    vi.stubGlobal('indexedDB',undefined);
    expect((await restoreLocal(cache)).organization).toEqual(organization);
  });
  it('uses the cache when IndexedDB metadata is malformed',async()=>{
    const idb=new MemoryIndexedDB(),cache=new MemoryStorage();vi.stubGlobal('indexedDB',idb);
    idb.stores.get('state')!.set('libraryOrganization',{folders:'corrupt'});
    cache.setItem('openmind.organization.v1',JSON.stringify(organization));
    expect((await restoreLocal(cache)).organization).toEqual(organization);
  });
  it('restores the latest fallback save after a module reload and IndexedDB recovery',async()=>{
    const idb=new MemoryIndexedDB(),cache=new MemoryStorage();vi.stubGlobal('indexedDB',idb);
    await saveLibraryOrganization(organization,cache);
    idb.failWrites=true;
    const newer={folders:[{id:'ideas',name:'靈感'}],assignments:{'map-a':'ideas'}};
    await saveLibraryOrganization(newer,cache);
    expect(idb.stores.get('state')?.get('libraryOrganization')).toEqual({organization,updatedAt:expect.any(Number)});
    idb.failWrites=false;
    vi.resetModules();
    const reloaded=await import('../src/core/library');
    expect((await reloaded.restoreLocal(cache)).organization).toEqual(newer);
    await reloaded.saveLibraryOrganization(organization,cache);
    expect((await reloaded.restoreLocal(cache)).organization).toEqual(organization);
  });
  it('rejects a save if neither storage backend can commit it',async()=>{
    vi.stubGlobal('indexedDB',undefined);
    const cache=new MemoryStorage();cache.setItem=()=>{throw new Error('QuotaExceeded');};
    await expect(saveLibraryOrganization(organization,cache)).rejects.toThrow('QuotaExceeded');
  });
  it('restores a newer primary save after reload even when the fallback mirror cannot be updated',async()=>{
    const idb=new MemoryIndexedDB(),cache=new MemoryStorage();vi.stubGlobal('indexedDB',idb);
    idb.failWrites=true;
    await saveLibraryOrganization({folders:[{id:'old',name:'舊分類'}],assignments:{}},cache);
    idb.failWrites=false;
    cache.setItem=()=>{throw new Error('QuotaExceeded');};
    await expect(saveLibraryOrganization(organization,cache)).resolves.toBeUndefined();
    vi.resetModules();
    const reloaded=await import('../src/core/library');
    expect((await reloaded.restoreLocal(cache)).organization).toEqual(organization);
  });
});

describe('complete local library',()=>{
  it('preserves the previous working copy when the primary recovery row is corrupt',async()=>{
    const idb=new MemoryIndexedDB(),cache=new MemoryStorage();vi.stubGlobal('indexedDB',idb);
    const original=newWorkbook(),changed=clone(original);changed.title='新版本';
    await persistLocal(original,cache);await persistLocal(changed,cache);
    expect((idb.stores.get('state')?.get('previous') as {book:unknown}).book).toEqual(original);
    idb.stores.get('state')!.set('working',{book:'corrupt',date:new Date().toISOString()});
    cache.clear();
    const restored=await restoreLocal(cache);
    expect(restored.book).toEqual(original);
    expect(restored.warning).toContain('安全副本');
    expect(restored.recents[0].book).toEqual(changed);
  });
  it('retains every unique workbook in IndexedDB after saving more than eight maps',async()=>{
    const idb=new MemoryIndexedDB(),cache=new MemoryStorage();vi.stubGlobal('indexedDB',idb);
    const books=Array.from({length:11},()=>newWorkbook());
    for(const book of books)await archiveLocal(book);
    const changed=clone(books[0]);changed.title='更新後的名稱';
    const saved=await persistLocal(changed,cache),restored=await restoreLocal(cache);
    expect(saved.recents).toHaveLength(11);
    expect(idb.stores.get('books')?.size).toBe(11);
    expect(restored.recents).toHaveLength(11);
    expect(restored.recents.find(row=>row.book.id===changed.id)?.book.title).toBe('更新後的名稱');
    expect(restored.book).toEqual(changed);
  });
  it('preserves more than eight maps and keeps the latest version in fallback storage',async()=>{
    vi.stubGlobal('indexedDB',undefined);
    const cache=new MemoryStorage(),books=Array.from({length:11},()=>newWorkbook());
    for(const book of books)await persistLocal(book,cache);
    const changed=clone(books[0]);changed.title='備用快取中的更新';
    const saved=await persistLocal(changed,cache),restored=await restoreLocal(cache);
    expect(saved.recents).toHaveLength(11);
    expect(restored.recents).toHaveLength(11);
    expect(restored.recents.find(row=>row.book.id===changed.id)?.book.title).toBe(changed.title);
    expect(restored.book).toEqual(changed);
  });
});
