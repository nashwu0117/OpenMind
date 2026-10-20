import { validateWorkbook, type Workbook } from './model';
const KEY = 'openmind.recovery.v1';
export type Recovery = {
    book: Workbook;
    savedAt: string;
};
export function saveRecovery(storage: Storage, book: Workbook) { const json = JSON.stringify({ book, savedAt: new Date().toISOString() }); const previous = storage.getItem(KEY); storage.setItem(`${KEY}.pending`, json); if (previous)
    storage.setItem(`${KEY}.previous`, previous); storage.setItem(KEY, json); storage.removeItem(`${KEY}.pending`); }
export function loadRecovery(storage: Storage): {
    book?: Workbook;
    savedAt?: string;
    warning?: string;
} { let bad = false; for (const key of [`${KEY}.pending`, KEY, `${KEY}.previous`]) {
    let value: string | null;
    try {value = storage.getItem(key);} catch {return {warning: '無法存取本機復原空間；請保留原生檔案備份。'};}
    if (!value)
        continue;
    try {
        const data = JSON.parse(value) as Recovery;
        return { book: validateWorkbook(data.book), savedAt: typeof data.savedAt==='string'&&Number.isFinite(Date.parse(data.savedAt))?data.savedAt:undefined, warning: bad ? '主要復原檔損毀，已從安全副本復原。' : undefined };
    }
    catch {
        bad = true;
    }
} return { warning: bad ? '復原資料損毀；原始資料已保留，請開啟先前儲存的 .openmind 檔案。' : undefined }; }
