# OpenMind

自由思考，清晰呈現。免費、開源、離線優先的心智圖編輯器，將可讀性與列印品質放在核心。

目前為 **0.3.0 開發版**：補齊九種圖表、摘要／附件／向量公式、個人主題範本、真實任務甘特圖與簡報 PDF；修正資料與操作可靠性，保留繁中嵌字型、主要分支分頁及兩種可展開的專注預覽。101 單元、34 E2E 與實際 PDF 驗收通過。正式公開發布尚未就緒，詳見 [完整稽核](docs/COMPLETION_AUDIT.md)、[功能矩陣](docs/FEATURE_PARITY_MATRIX.md)、[發布準備](docs/RELEASE_READINESS.md)。

## 已實作功能

- 新增／多行編輯／複製／剪下／貼上／刪除節點，拖曳改變階層、同層重排、展開收合與自由主題。
- 多選批次樣式、形狀／文字／色彩、筆記／標籤／安全連結、標記、內嵌圖片、Unicode 貼圖、可下載附件及離線 MathJax 向量公式。
- 縮放／平移／適應視窗、分支聚焦、全文搜尋、同步可編輯大綱、唯讀與深色介面。
- 交易式 Undo／Redo、IndexedDB 本機自動復原、最近八份文件、多工作表、自訂主題及文件範本。
- 版本化 `.openmind` JSON，原生桌面對話框及暫存寫入後原子替換。v1 保源升級至 v2；SVG／PNG 嵌繁中字型，Markdown／OPML／FreeMind 子集匯入匯出明示損失。
- 心智圖、邏輯圖、括號圖、樹狀圖、組織圖、順序時間軸、魚骨圖、矩陣與樹表；關係線、外框及選取摘要。
- 真實任務日期／狀態／持續時間／相依性，循環檢查與日曆日排程、甘特圖和 PDF；簡報排序、播放、導航、全螢幕及 16:9 PDF。
- 六種列印策略：單頁、可讀分頁、海報拼接、主要分支自動分頁、選取子樹、大綱。A4／A3／A2／Letter／Legal／自訂紙張、方向／邊界／頁首尾／頁碼／黑白。實際頁數、比例與字級警告。
- Noto Sans TC 靜態字重隨程式提供，PDF 內嵌 Type0／TrueType 字型程式，繁體中文可搜尋；跨頁關係有雙向頁碼、續頁與完整索引。Electron 原生輸出 PDF，瀏覽器可透過列印另存。
- 選取分支可先預覽再展開成專注編輯；列印預覽可收起設定、放大／縮小與跳頁，並已比對實際 UI 預覽和 PDF。

## 安裝與啟動

需要 Node.js 24 LTS（或符合 Vite 8 要求的較新版本）、npm。初次安裝套件與 Electron 執行環境需要網路；完成封裝後，編輯與列印不需網路或帳號。

```sh
npm ci
npm run dev
```

瀏覽器開啟 `http://127.0.0.1:5187`。桌面版：

```sh
npm run desktop
```

Electron 若尚未下載執行環境，第一次啟動會自動下載。所有文件都只在本機，不含遙測、廣告、登入限制或付費 API。

## 操作

選取節點後，Tab 新增子主題、Enter 新增同層、雙擊或 F2 編輯、Shift+Enter 換行。⌘／Ctrl+Z 復原、Shift+⌘／Ctrl+Z 重做；C／X／V 複製、剪下、貼上分支；S 儲存、Shift+S 另存。Shift 點選多選，拖曳到其他節點改變父層，按住 Option／Alt 拖曳插入該節點同層前方。一般滾輪平移，⌘／Ctrl+滾輪縮放。

「列印與 PDF」顯示實際紙張預覽。大型圖可選「主要分支自動分頁」或「可讀分頁」維持主題字級，或「海報拼接」保留空間配置。後者刻意跨頁，依列／欄與重疊區接合。單頁／選取子樹可能低於最低字級，介面會顯示計算值與建議。最低設定針對主要主題文字，頁首尾和小型中繼資料可能更小。

需要更專注時：選取節點 → 眼睛圖示「預覽選取分支」→「展開此分支」；Escape 返回原工作區。F9 或「專注」可直接收起編輯側欄。列印時按「專注預覽」，以縮放、頁碼選擇或左右鍵檢查；Escape 返回列印設定。這些視圖操作不修改原始文件。

請另存 `.openmind` 作為可靠備份；本機快取會受儲存容量與清除資料影響。桌面版開啟文件後第一次儲存會請你確認目的地，避免誤覆寫其他文件。

## 測試與建置

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:desktop
node scripts/print-fixtures.mjs  # 需要 dev server
```

PDF 內容／字型／尺寸驗收需要 Python + PyMuPDF：

```sh
python3 -m venv /tmp/openmind-qa
/tmp/openmind-qa/bin/pip install pymupdf pillow
/tmp/openmind-qa/bin/python scripts/verify-pdf.py
/tmp/openmind-qa/bin/python scripts/verify-fixtures.py
/tmp/openmind-qa/bin/python scripts/compare-preview.py
node scripts/verify-print-ui.mjs
node scripts/desktop-print-phase2.mjs
/tmp/openmind-qa/bin/python scripts/verify-phase2.py
/tmp/openmind-qa/bin/python scripts/verify-phase2.py desktop-branches.pdf
/tmp/openmind-qa/bin/python scripts/verify-bulk.py
/tmp/openmind-qa/bin/python scripts/compare-print-ui.py
```

驗收產物在 `artifacts/`（不提交），瀏覽器 trace 在 `test-results/`。目前結果見 [0.3 完整稽核](docs/COMPLETION_AUDIT.md) 及 [完整驗收命令](docs/TEST_PLAN.md)；[0.2](docs/PHASE2_VERIFICATION.md)／[0.1](docs/VERIFICATION.md)保留歷史範圍。新增三類 PDF 可用 `node scripts/audit-release.mjs` 生成，並用 `scripts/verify-audit.py` 驗證。原生 PDF 測試可用 `OPENMIND_EXECUTABLE` 指向封裝成品。

## 封裝

```sh
npm run licenses
npm run package
```

使用已安裝的 Electron 執行環境，產生目前平台的開發套件於 `release/<version>/<platform>-<arch>/`，本版為 `release/0.3.0/darwin-arm64/`。macOS 為 `OpenMind.app`，有本機 ad-hoc 簽章；尚無 notarization、DMG／安裝器或自動更新。腳本拒絕覆寫既有套件。Windows／Linux 分支需在對應平台另外驗收。原始碼保持 TypeScript／React／SVG／Electron 分層，無 Rust 前置需求。

## 文件與授權

[產品規格](docs/PRODUCT_SPEC.md) · [架構](docs/ARCHITECTURE.md) · [列印引擎](docs/PRINT_ENGINE.md) · [格式相容性](docs/FORMAT_COMPATIBILITY.md) · [測試計畫](docs/TEST_PLAN.md) · [路線圖](docs/ROADMAP.md) · [貢獻指南](CONTRIBUTING.md) · [安全政策](SECURITY.md)

Apache-2.0，選擇原因是允許自由使用、修改與散布，並包含明確專利授權。原目錄沒有既有 LICENSE。第三方程式碼保留各自授權，見 [第三方聲明](THIRD_PARTY_NOTICES.md)。無 XMind 專有程式碼、圖示、商標素材或付費資產。

尚未支援 `.xmind`、Office／TextBundle、混合分支結構、完整工作日曆、AI 推理、多人協作及永久版本歷史。FreeMind 是受限子集；無正式公證、跨平台或實體印表機驗收，不宣稱完全相容或功能對等。
