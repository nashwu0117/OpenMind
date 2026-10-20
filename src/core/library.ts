import {validateWorkbook,type Workbook} from './model';
import {loadRecovery,saveRecovery} from './storage';
export type Recent={book:Workbook;date:string};
export type LocalRestore={book?:Workbook;warning?:string;recents:Recent[]};
const DB='openmind.local.v2';
export function localCache():Storage|undefined{try{return globalThis.localStorage;}catch{return undefined;}}
function open():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{
  if(!globalThis.indexedDB){reject(new Error('IndexedDB 無法使用'));return;}
  const request=indexedDB.open(DB,1);request.onupgradeneeded=()=>{const db=request.result;db.createObjectStore('books',{keyPath:'id'});db.createObjectStore('state');db.createObjectStore('presets',{keyPath:'id'});};
  request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('本機資料庫升級被其他視窗阻擋，請先關閉舊視窗。'));request.onsuccess=()=>resolve(request.result);
});}
function done(transaction:IDBTransaction):Promise<void>{return new Promise((resolve,reject)=>{transaction.oncomplete=()=>resolve();transaction.onabort=()=>reject(transaction.error??new Error('本機儲存交易失敗'));transaction.onerror=()=>{};});}
function value<T>(request:IDBRequest<T>):Promise<T>{return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
function recent(raw:unknown):Recent|undefined{try{const record=raw as Recent;return {book:validateWorkbook(record.book),date:record.date};}catch{return undefined;}}
function merge(rows:Recent[]):Recent[]{const seen=new Set<string>();return rows.sort((a,b)=>b.date.localeCompare(a.date)).filter(row=>!seen.has(row.book.id)&&!!seen.add(row.book.id)).slice(0,8);}
function legacyRecents(cache?:Storage):Recent[]{try{return (JSON.parse(cache?.getItem('openmind.library.v1')??'[]') as unknown[]).map(recent).filter((row):row is Recent=>!!row);}catch{return [];}}
export async function restoreLocal(cache=localCache()):Promise<LocalRestore>{
  const legacy=cache?loadRecovery(cache):{warning:'本機快取無法使用。'},old=legacyRecents(cache);let db:IDBDatabase|undefined;
  try{db=await open();const transaction=db.transaction(['state','books'],'readonly'),finished=done(transaction),state=transaction.objectStore('state');
    const [latest,previous,books]=await Promise.all([value(state.get('working')),value(state.get('previous')),value(transaction.objectStore('books').getAll())]);await finished;
    const candidates=[recent(latest),recent(previous),legacy.book?{book:legacy.book,date:legacy.savedAt??legacy.book.updatedAt}:undefined].filter((row):row is Recent=>!!row).sort((a,b)=>b.date.localeCompare(a.date));
    const recovered=!!latest&&!recent(latest)&&!!candidates.length;
    return {book:candidates[0]?.book,warning:recovered?'主要復原資料損毀，已從安全副本復原。':legacy.warning,recents:merge([...books.map(recent).filter((row):row is Recent=>!!row),...old])};
  }catch{return {...legacy,recents:old,warning:legacy.warning??'大型文件資料庫無法使用；目前使用容量較小的本機快取，請另存原生檔案。'};}finally{db?.close();}
}
async function write(book:Workbook,working:boolean):Promise<Recent[]>{
  const db=await open();try{const transaction=db.transaction(['state','books'],'readwrite'),finished=done(transaction),books=transaction.objectStore('books'),date=new Date().toISOString(),record={id:book.id,book,date};books.put(record);
    if(working){const state=transaction.objectStore('state'),request=state.get('working');request.onsuccess=()=>{if(request.result)state.put(request.result,'previous');state.put(record,'working');};}
    const request=books.getAll();let rows:Recent[]=[];request.onsuccess=()=>{rows=merge(request.result.map(recent).filter((row):row is Recent=>!!row));const keep=new Set(rows.map(row=>row.book.id));for(const item of request.result)if(!keep.has(item.id))books.delete(item.id);};await finished;return rows;
  }finally{db.close();}
}
export async function archiveLocal(book:Workbook):Promise<Recent[]>{return write(book,false);}
export async function persistLocal(book:Workbook,cache=localCache()):Promise<{recents:Recent[];warning?:string}>{
  try{const recents=await write(book,true);
    // Small legacy mirrors preserve recovery with older app versions. Large files stay in IndexedDB.
    if(cache&&JSON.stringify(book).length<300000)try{saveRecovery(cache,book);}catch{/* IndexedDB transaction already committed. */}
    return {recents};
  }catch(error){if(!cache)throw error;saveRecovery(cache,book);const recents=merge([{book,date:new Date().toISOString()},...legacyRecents(cache)]);try{cache.setItem('openmind.library.v1',JSON.stringify(recents));}catch{/* Current recovery is still durable. */}
    return {recents,warning:'本機資料庫無法使用，已儲存至備用快取；請另外下載原生檔案。'};
  }
}
export async function readPresets<T>(kind:string):Promise<T[]>{const db=await open();try{const transaction=db.transaction('presets','readonly'),finished=done(transaction),rows=await value(transaction.objectStore('presets').getAll());await finished;return rows.filter(row=>row.kind===kind).map(row=>row.value as T);}finally{db.close();}}
export async function savePreset(id:string,kind:string,preset:unknown):Promise<void>{const db=await open();try{const transaction=db.transaction('presets','readwrite'),finished=done(transaction);transaction.objectStore('presets').put({id,kind,value:preset});await finished;}finally{db.close();}}
export async function deletePreset(id:string):Promise<void>{const db=await open();try{const transaction=db.transaction('presets','readwrite'),finished=done(transaction);transaction.objectStore('presets').delete(id);await finished;}finally{db.close();}}
