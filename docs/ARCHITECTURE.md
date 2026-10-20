# Architecture — 0.3.0

React19、strict TypeScript、Vite8、SVG scene、Electron44；桌面核心及列印封裝後不需外部runtime。Electron內建Chromium產生向量／可搜尋繁中PDF，代價是較大套件。

| Boundary | Responsibility |
|---|---|
| core/model | v2 schema、保源v1 migration、嚴格驗證、樹與參照清理 |
| core/commands、tasks | 插父、摘要、主題、UTC日曆日排程與依賴驗證 |
| core/history | 最多80次immutable文件交易、Redo失效 |
| core/storage、library | 小檔legacy recovery；IDB books/state/presets、working/previous交易與八份近期 |
| engine/layout、svg | 九種確定性版面、量字／標註邊界、共用安全SVG |
| engine/equations | MathJax4 Base/AMS、離線self-contained paths、有界快取與錯誤 |
| engine/print、pagination | 物理單位、六種分頁、最小主字pt、pageSVG及HTML |
| engine/pageReferences | 關係／摘要／續頁歸屬、雙向頁碼與完整索引 |
| engine/fontEmbedding | 本機靜態Noto400/700子集、Unicode覆蓋、PDF/SVG嵌入 |
| engine/viewPlans | 16:9簡報與真日期甘特圖／任務PDF |
| io/formats、freemind、binary | 格式信任邊界、大小限制、明示損失與二進位附件 |
| io/printing、visualExport | 共用browser/native輸出、可見展開及嵌字型圖 |
| ui | 編輯／大綱／任務同一Workbook；進階Inspector、簡報、焦點管理與兩種預覽 |
| electron | sandbox/contextIsolation橋接、native dialogs、原子存檔、PDF／print |

文件修改才進history，選取／viewport／暫時展開不進文件。文字在blur／確認時提交，先提交原欄位再切節點；命令以即時historyRef避免stale draft。非同步媒體檢查文件身分。結構切換重新fit，普通內容編輯保留視野。

App等restoreLocal完成才開放編輯。IDB transaction先完成才顯示儲存；大文件不依賴localStorage，儲存失敗會提示另存。pagehide做best effort，非保證永久備份；多視窗衝突協定未實作。

原生列印將mode0600 HTML放私人暫存目錄，避免data URL長度上限，成功失敗都清理檔案與隱藏視窗。renderer無Node、禁止遠端導航新窗；IPC有界、路徑只由原生dialog取得。內嵌raster／octet-stream附件不執行；文字XMLescape，DTD/ENTITY拒絕，連結限定http/https/mailto/openmind。

AI／雲端協作adapter未實作，沒有假服務、預設上傳或遙測。未聲稱此架構已通過全面安全或各平台認證。
