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
    warning?: string;
} { let bad = false; for (const key of [KEY, `${KEY}.pending`, `${KEY}.previous`]) {
    const value = storage.getItem(key);
    if (!value)
        continue;
    try {
        const data = JSON.parse(value) as Recovery;
        return { book: validateWorkbook(data.book), warning: bad ? '主要復原檔損毀，已從安全副本復原。' : undefined };
    }
    catch {
        bad = true;
    }
} return { warning: bad ? '復原資料損毀；原始資料已保留，請開啟先前儲存的 .openmind 檔案。' : undefined }; }
