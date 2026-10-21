import {validateWorkbook,type Workbook} from './model';
import {loadRecovery,saveRecovery} from './storage';
export type Recent={book:Workbook;date:string};
export type LibraryFolder={id:string;name:string};
export type LibraryOrganization={folders:LibraryFolder[];assignments:Record<string,string>};
export type LocalRestore={book?:Workbook;warning?:string;recents:Recent[];organization:LibraryOrganization};
const DB='openmind.local.v2';
const ORGANIZATION='libraryOrganization',ORGANIZATION_CACHE='openmind.organization.v1';
type OrganizationRecord={organization:LibraryOrganization;updatedAt:number};
let organizationTimestamp=0;
export function localCache():Storage|undefined{try{return globalThis.localStorage;}catch{return undefined;}}
function open():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{
  if(!globalThis.indexedDB){reject(new Error('IndexedDB 無法使用'));return;}
  const request=indexedDB.open(DB,1);request.onupgradeneeded=()=>{const db=request.result;db.createObjectStore('books',{keyPath:'id'});db.createObjectStore('state');db.createObjectStore('presets',{keyPath:'id'});};
  request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('本機資料庫升級被其他視窗阻擋，請先關閉舊視窗。'));request.onsuccess=()=>resolve(request.result);
});}
function done(transaction:IDBTransaction):Promise<void>{return new Promise((resolve,reject)=>{transaction.oncomplete=()=>resolve();transaction.onabort=()=>reject(transaction.error??new Error('本機儲存交易失敗'));transaction.onerror=()=>{};});}
function value<T>(request:IDBRequest<T>):Promise<T>{return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
function recent(raw:unknown):Recent|undefined{try{const record=raw as Recent;return {book:validateWorkbook(record.book),date:record.date};}catch{return undefined;}}
function merge(rows:Recent[]):Recent[]{const seen=new Set<string>();return rows.sort((a,b)=>b.date.localeCompare(a.date)).filter(row=>!seen.has(row.book.id)&&!!seen.add(row.book.id));}
function legacyRecents(cache?:Storage):Recent[]{try{return (JSON.parse(cache?.getItem('openmind.library.v1')??'[]') as unknown[]).map(recent).filter((row):row is Recent=>!!row);}catch{return [];}}
function organization(raw:unknown):LibraryOrganization|undefined{
  if(!raw||typeof raw!=='object'||!Array.isArray((raw as LibraryOrganization).folders))return undefined;
  const source=raw as LibraryOrganization,folders:LibraryFolder[]=[],ids=new Set<string>();
  for(const folder of source.folders){if(!folder||typeof folder.id!=='string'||typeof folder.name!=='string')continue;const id=folder.id.trim(),name=folder.name.trim();if(!id||!name||ids.has(id))continue;ids.add(id);folders.push({id,name});}
  const assignments=source.assignments&&typeof source.assignments==='object'&&!Array.isArray(source.assignments)?Object.fromEntries(Object.entries(source.assignments).filter(([bookId,folderId])=>!!bookId.trim()&&typeof folderId==='string'&&ids.has(folderId))):{};
  return {folders,assignments};
}
function organizationRecord(raw:unknown):OrganizationRecord|undefined{
  if(!raw||typeof raw!=='object')return undefined;
  const record=raw as OrganizationRecord,contained=organization(record.organization);
  if(contained&&typeof record.updatedAt==='number'&&Number.isFinite(record.updatedAt)&&record.updatedAt>=0)return {organization:contained,updatedAt:record.updatedAt};
  const legacy=organization(raw);return legacy?{organization:legacy,updatedAt:0}:undefined;
}
function cachedOrganization(cache?:Storage):OrganizationRecord|undefined{try{return organizationRecord(JSON.parse(cache?.getItem(ORGANIZATION_CACHE)??'null'));}catch{return undefined;}}
function nextOrganizationRecord(next:LibraryOrganization,previous=0):OrganizationRecord{
  organizationTimestamp=Math.max(Date.now(),organizationTimestamp+1,previous+1);return {organization:next,updatedAt:organizationTimestamp};
}
export async function restoreLocal(cache=localCache()):Promise<LocalRestore>{
  const legacy=cache?loadRecovery(cache):{warning:'本機快取無法使用。'},old=legacyRecents(cache),fallback=cachedOrganization(cache),empty={folders:[],assignments:{}};let db:IDBDatabase|undefined;
  try{db=await open();const transaction=db.transaction(['state','books'],'readonly'),finished=done(transaction),state=transaction.objectStore('state');
    const [latest,previous,books,savedOrganization]=await Promise.all([value(state.get('working')),value(state.get('previous')),value(transaction.objectStore('books').getAll()),value(state.get(ORGANIZATION))]);await finished;
    const candidates=[recent(latest),recent(previous),legacy.book?{book:legacy.book,date:legacy.savedAt??legacy.book.updatedAt}:undefined].filter((row):row is Recent=>!!row).sort((a,b)=>b.date.localeCompare(a.date));
    const recovered=!!latest&&!recent(latest)&&!!candidates.length;
    const primary=organizationRecord(savedOrganization),latestOrganization=fallback&&(!primary||fallback.updatedAt>primary.updatedAt)?fallback:primary;
    return {book:candidates[0]?.book,warning:recovered?'主要復原資料損毀，已從安全副本復原。':legacy.warning,recents:merge([...books.map(recent).filter((row):row is Recent=>!!row),...old]),organization:latestOrganization?.organization??empty};
  }catch{return {...legacy,recents:merge(old),organization:fallback?.organization??empty,warning:legacy.warning??'大型文件資料庫無法使用；目前使用容量較小的本機快取，請另存原生檔案。'};}finally{db?.close();}
}
export async function saveLibraryOrganization(next:LibraryOrganization,cache=localCache()):Promise<void>{
  const clean=organization(next)??{folders:[],assignments:{}};let record=nextOrganizationRecord(clean,cachedOrganization(cache)?.updatedAt),db:IDBDatabase|undefined;
  try{db=await open();const transaction=db.transaction('state','readwrite'),finished=done(transaction),state=transaction.objectStore('state'),request=state.get(ORGANIZATION);
    request.onsuccess=()=>{record=nextOrganizationRecord(clean,organizationRecord(request.result)?.updatedAt);state.put(record,ORGANIZATION);};await finished;
    if(cache)try{cache.setItem(ORGANIZATION_CACHE,JSON.stringify(record));}catch{/* IndexedDB transaction already committed. */}
  }catch(error){if(!cache)throw error;cache.setItem(ORGANIZATION_CACHE,JSON.stringify(record));}finally{db?.close();}
}
async function write(book:Workbook,working:boolean):Promise<Recent[]>{
  const db=await open();try{const transaction=db.transaction(['state','books'],'readwrite'),finished=done(transaction),books=transaction.objectStore('books'),date=new Date().toISOString(),record={id:book.id,book,date};books.put(record);
    if(working){const state=transaction.objectStore('state'),request=state.get('working');request.onsuccess=()=>{if(request.result)state.put(request.result,'previous');state.put(record,'working');};}
    const request=books.getAll();let rows:Recent[]=[];request.onsuccess=()=>{rows=merge(request.result.map(recent).filter((row):row is Recent=>!!row));};await finished;return rows;
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
