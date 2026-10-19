# 驗證與交付報告

本文件保留 0.1 驗收基準；目前 0.2 的字型、跨頁關係、自動分頁與專注操作結果見 [第二階段驗證](PHASE2_VERIFICATION.md)。

查核日期：2026-10-20，Pacific/Auckland。此報告描述 **OpenMind 0.1 核心編輯／列印切片**，不代表完整 XMind 功能對等或正式發行認證。

## 原始狀態與安全保護

- 原目錄為空白，沒有 Git repository、原始 HEAD、既有程式、未提交變更或 LICENSE。
- 初始安全檢查點：`146ef6e9dcb2fc6c3966148f7fd0336e95d77dd8`。
- 備份分支：`backup/initial-2026-10-20`；基準分支 `main`；實作分支 `feature/openmind-core`。
- 未執行 reset、clean、強制推送或刪除使用者資料。失敗及前一輪封裝保留於 release 的具名資料夾；未更動其他專案占用的 5173 埠，使用 5187。

## 架構與新增檔案

TypeScript 嚴格型別、React 19、Vite 8、SVG、Electron 44；無伺服器、無帳號、無遙測。因沒有 Rust toolchain，選用 Electron，並利用 Chromium 產生可搜尋向量 PDF。移除引入已知漏洞的 electron-builder，改用可檢查的本機封裝腳本。

| 範圍 | 新增檔案與責任 |
|---|---|
| Core | src/core/model.ts、history.ts、storage.ts：版本化 schema、驗證、樹操作、歷史、復原 |
| Engine | src/engine/layout.ts、svg.ts、print.ts：文字配置、場景、標註、紙張、分頁、向量輸出 |
| Formats | src/io/formats.ts：原生／受限 Markdown／OPML、SVG／PNG、轉換警告 |
| UI | src/ui/App.tsx、Canvas.tsx、PrintStudio.tsx、Fields.tsx、styles.css；src/main.tsx、desktop.d.ts |
| Desktop | electron/main.cjs、preload.cjs：隔離橋接、原生對話框、原子儲存、PDF／列印、安全外部連結 |
| Tests | tests/core.test.ts、layout-print.test.ts、regressions.test.ts、e2e/editor.spec.ts、e2e/save-draft.spec.ts、e2e/workspace.spec.ts |
| QA/build | scripts/package.mjs、desktop-smoke.mjs、print-fixtures.mjs、performance.mjs、verify-pdf.py、verify-fixtures.py、compare-preview.py、licenses.mjs |
| Project | package.json、package-lock.json、tsconfig.json、vite.config.ts、playwright.config.ts、index.html、.gitignore |
| Documents | README、LICENSE、CONTRIBUTING、SECURITY、THIRD_PARTY_NOTICES；docs 的產品／架構／功能矩陣／列印／格式／路線圖／測試／限制／本報告；task_plan、findings、progress |

## 實際完成範圍

可建立／編輯／重排／拖曳／多選／剪貼／刪除、設定樣式、筆記／標籤／連結／標記／圖片／簡單任務、Undo／Redo、自動復原、最近文件、多工作表、搜尋／聚焦／大綱、原生檔案、五種結構、關係線與單分支外框。SVG／PNG 與階層格式是真正檔案輸出，非成功訊息或假圖片。

列印使用獨立引擎：六種策略、實體紙張單位、紙張／方向／邊界／頁首頁尾／頁碼／黑白、實際頁數／比例／主題字級警告。PDF 與預覽共用同一份頁面 SVG。可讀分頁重排內容；海報刻意跨頁並提供接合資訊；此差異清楚顯示在介面。

## 執行證據

| 檢查 | 結果與具體涵蓋 |
|---|---|
| `npm test` | 59 項通過；樹循環、刪除清理、深度限制、未知欄位／版本、Unicode／樣式／任務／圖片／多表 roundtrip、Undo、復原損毀／配額錯誤；10／50／200／1000 節點與五種結構無節點重疊；六種分頁、實體幾何、長文字延續、字級、海報順序、黑白 |
| `npm run build` | 嚴格 TypeScript 與正式 Vite 建置通過；JS 約 298 kB、gzip 約 96 kB |
| `npm run test:e2e` | 13 項通過；鍵盤多層編輯、真實拖曳／循環拒絕、樣式與歷史、檔案下載重開／重新載入復原、剪下貼上／多選批次刪除、工作表／大綱／搜尋／聚焦、壞檔保留原圖、PNG／SVG／Markdown／OPML、唯讀、平移縮放、離線編輯、列印預覽、儲存未離開欄位／編輯視窗的最新草稿、深色介面／最近文件／範本，以及大綱模式撤銷新建工作表 |
| 原始與封裝版 desktop smoke | Electron renderer 無 require；隔離橋接可用；真實鍵盤編輯；原生儲存／開啟逐欄位相等；新文件不覆寫舊文件；安全外部連結透過明確橋接；列印預覽及原生 PDF 匯出 |
| `scripts/verify-pdf.py` | 瀏覽器與桌面 PDF：A4 直向 1 頁，誤差 <1pt；繁體中文可搜尋；主要文字 ≥10pt；文字 bounding boxes 位於頁面內；Type3 向量字形程序及 ToUnicode 存在 |
| 實際 PDF fixtures | 七組共 167 頁；PDF 實際頁數與計畫一致、紙張尺寸一致、預期節點標籤保留、可讀模式主要字級 ≥10pt、圖像與標註存在。海報刻意裁切不計為一般模式裁切錯誤 |
| 首頁預覽／PDF 像素比較 | 七組皆通過；0–255 平均差約 0.08–0.59，超過 30 的差異像素比例 <0.5%。比較頁面 SVG 與 PDF 光柵化首頁，並非所有頁面／所有字型的通用保證 |
| 1000 節點瀏覽器實測 | 20 次排版中位數約 5ms、p95 約 8.7ms；匯入至首次顯示約 75ms；實際 SVG 文字超出節點框 0；搜尋定位節點 999 通過。單機測量，非跨裝置效能保證 |
| `npm audit` | 0 個已知漏洞；不是完整安全稽核 |
| 本機封裝 | macOS arm64 .app，保留 framework 相對符號連結，ad-hoc codesign 與嚴格驗證；直接啟動封裝成品驗收。沒有 notarization／正式安裝器 |

| 實際 PDF | 頁數 | 最小主要主題字級 |
|---|---:|---:|
| 10 節點單頁 | 1 | 約 10.44pt |
| 50 節點主要分支 | 6 | 約 6.65pt，明示警告 |
| 200 節點可讀分頁 | 25 | 10.5pt |
| 1000 節點大綱 | 91 | 10.5pt |
| 200 節點海報 | 42 | 12pt |
| 50 節點的選取子樹 | 1 | 約 6.65pt，明示警告 |
| 含圖片／任務／關係線／外框的 10 節點黑白圖 | 1 | 約 10.28pt |

機器可讀結果、實際 PDF、預覽影像、桌面截圖位於 `artifacts/`；此資料夾含測試專用 profile，不提交版本控制。PDF 數字依本次 fixture 與紙張設定計算，並非固定文案。

## 已修復且有驗證的問題

- 非有限 fontSize 原本可通過驗證：測試失敗後加上有限值驗證。
- 同父層往後拖曳的索引偏移：先建立失敗 regression，再調整移除節點後的索引。
- Escape 取消欄位仍因 blur 提交：取消旗標與瀏覽器驗收。
- 儲存快捷鍵忽略未 blur 的草稿：先以 E2E 重現，再於儲存前提交草稿並讀取最新文件。
- 大綱模式撤銷新建工作表時保留了不存在的焦點：以失敗 E2E 重現，將顯示焦點安全地回退至當前中心節點。
- 跨文件儲存目的地混淆：依文件 ID 管理已確認的路徑；匯入後不自動沿用未驗證路徑。
- 剪貼子樹的內部關係／外框／節點連結：複製時重新映射，避免遺失或指向舊 ID。
- 關係線文字被節點遮住：移到節點上方的專用路徑並擴大匯出範圍。
- Node fs.cp 預設重寫 framework 符號連結為絕對路徑：保留原始相對連結後簽章及封裝啟動通過。

## 限制、尚未完成與下一步

未實作 `.xmind`／FreeMind／Office／TextBundle、brace／fishbone／matrix／tree table／混合結構、摘要／callout、附件／方程式／音訊、Gantt／相依任務、簡報、個人範本、持久版本歷史、AI 推理與多人協作。功能矩陣保留 NOT STARTED，沒有空服務或假成功 UI。

儲存容量、系統字型、保守文字估寬仍有限制。CJK PDF 此環境為內嵌 Type3 向量字形，不是封裝 TTF；其他作業系統、PDF/A、實體印表機、觸控與完整無障礙驗收尚待處理。海報跨頁與可讀模式不保留空間標註都有明示說明。完整限制見 KNOWN_LIMITATIONS.md。

**下一個最有價值的項目**：加入可合法隨程式散布的 CJK 字型，並完成可讀分頁的跨頁關係提示、主要分支自動分割與實體印表機校準，再擴充外部格式及其他結構。

## 啟動與使用

`npm ci` → `npm run desktop`；或 `npm run dev`，開啟 `http://127.0.0.1:5187`。目前封裝位置為 `release/darwin-arm64/OpenMind.app`。`npm run package` 可建立目前平台套件，但拒絕覆寫既有輸出；請先移到備份位置。詳見 README 的操作、測試與封裝指令。
