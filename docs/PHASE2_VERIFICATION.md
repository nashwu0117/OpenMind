# OpenMind 0.2：字型、分頁與專注預覽

日期：2026-10-20，Pacific/Auckland。起始 HEAD：`5211d16f86c98d8ab7a4f8259591d2e2c6d3d8c1`，工作目錄乾淨。保護分支 `backup/core-0.1-2026-10-20`，本輪分支 `feature/openmind-print-focus`；原 0.1 封裝與使用者文件均保留。

## 已完成的操作

**編輯專注**：選取節點 → 工具列「預覽選取分支」（眼睛圖示）→ 預覽卡片「展開此分支」。展開後收起側欄與屬性面板，保留可編輯畫布、工具列與儲存入口。按 Escape 或「返回工作區」回到原分支／完整圖。工具列「專注」或 F9 也可直接切換。文字編輯時 Escape 先取消文字編輯，不會誤離開工作區。

即使分支原先已摺疊，預覽與專注工作區也會暫時展開全部後代；離開後還原摺疊顯示。驗收直接比較進出前的 recovery JSON，確定這些視圖操作不產生文件修改；大綱與畫布同步顯示暫時展開的內容。

**列印專注**：「列印與 PDF」→「專注預覽」。收起列印設定，以適合視窗比例呈現頁面；可放大／縮小、100%、適合視窗、左右鍵翻頁與頁碼選擇。Escape 回到設定。縮放只改變檢視，不會改變紙張、字級、分頁與輸出比例。

**主要分支自動分頁**：先嘗試完整分支；放不下時，以連通的祖先／子樹分割成多頁。每個一般節點只有一個主要出現位置，祖先脈絡可重複，並以淡色呈現。每頁維持最低主題字級，提供前／後續頁。若單一節點或完整祖先路徑仍超出紙張，該分支改為明示的可讀重排。原始資料與編輯結構不變。

**跨頁關係**：以穩定 R 編號在來源／目的頁顯示方向、目的頁與節點；關係較多時頁底提示索引位置，完整標籤在可分頁的關係索引保留。預覽可點頁碼提示或「關係索引」跳轉。重排模式也保留關係語意，而不是只顯示不支援訊息。

## 繁體中文字型的實際結果

- 使用 `@fontsource/noto-sans-tc` **5.3.1**，400／700 兩個靜態字重，SIL OFL-1.1；保留完整授權與上游著作權聲明於 THIRD_PARTY_NOTICES.md。字型原檔未修改。
- 預覽使用本機 WOFF2；輸出前僅取文件使用到的 Unicode 字型子集，轉成內嵌 data URL，整份 HTML 只放一份字型定義。Electron 的 file renderer 不需跨來源讀檔或外部字型伺服器。
- 最初測試可變字型：畫面確實載入自訂字型，但 Chromium 仍產生 Type3。改用靜態字重後，**PDF 實際為 Type0／TrueType 字型程式**；不是以字型名稱或檔案存在推定成功。
- 驗收抽取到 26 個 Noto 字型子集，解析 TTF `OS/2` 表確認 400／700 字重，繁體中文「臺灣／繁體／龜／鬱／體積」等可搜尋。所有抽查的 CJK 文字均使用 Noto 字型；不依賴該機器安裝字型。
- 字型來源與授權已查核：[Fontsource 安裝與自架說明](https://fontsource.org/fonts/noto-sans-tc/install)、[Google Fonts 官方 metadata](https://github.com/google/fonts/blob/main/ofl/notosanstc/METADATA.pb)、[官方 OFL](https://github.com/google/fonts/blob/main/ofl/notosanstc/OFL.txt)。不是將系統 PingFang 字型打包散布。

## 執行過的驗收

| 檢查 | 結果 |
|---|---|
| 單元／排版／分頁 | 69 項通過。新增 10／50／200／1000 節點的主要位置完整性、主題字級、無裁切、祖先脈絡、長節點重排、雙向頁碼、超量關係索引與預覽導線檢查 |
| 瀏覽器 E2E | 16 項通過。涵蓋既有操作及分支預覽→展開→編輯→Escape、專注列印／縮放／翻頁、實際字型子集、跨頁提示跳轉與索引 |
| 正式建置 | 嚴格 TypeScript 與 Vite 建置通過；應用 JS 約 313kB（gzip 約 101kB），字型嵌入工具約 273kB；字型二進位按需載入，沒有 5MB 單一 JS 字型區塊 |
| 七組 PDF fixture | 183 頁，實際頁數／紙張／節點標籤／圖片與標註檢查通過；其中 1000 節點大綱 100 頁，50 節點主要分支 9 頁、估計最小主題約 10.44pt |
| 80 節點跨頁 PDF | 15 頁，79 個編號節點與中心文字完整；實際主題字級 ≥10pt；第 4／6 頁的雙向關係與第 15 頁索引吻合；26 個 Type0／TrueType 字型程式可抽取 |
| 1000 節點主要分支原生 PDF | 135 頁，999 個編號節點完整；量測最低主題字級 10.2675pt，17 個 Noto 字型程式可抽取，所有文字框與實體紙張尺寸均通過 |
| 真正 UI 預覽對 PDF | 從列印工作室取得實際 SVG DOM，僅移除預覽導線，以實體大小重繪；比較第 1／4／6／15 頁與 PDF 光柵化結果。平均像素差 0.10–0.73（0–255），高於 30 的差異像素比例 <0.6%，均通過 |
| 其他預覽影像比對 | 七組首頁差異均通過；此為選定頁面的回歸驗證，不宣稱所有字型／印表機通用一致 |
| macOS arm64 封裝 | 0.2 獨立目錄封裝，ad-hoc codesign 與驗證通過；直接啟動封裝成品，驗證原生開檔、專注預覽、15 頁原生 PDF 及關係索引。兩字重 TrueType 嵌入、實體尺寸與繁體文字抽取亦通過 |
| 舊流程 | 原生儲存重開、不同文件不覆寫原檔、安全外部連結、離線核心操作均回歸通過 |
| 套件稽核 | 0 個已知漏洞；不是完整安全稽核 |

## 產物與重跑

- 封裝：`release/0.2.0/darwin-arm64/OpenMind.app`；以版本分目錄保留原 0.1，沒有覆寫既有套件。
- 實際 PDF：`artifacts/phase2/branches-cjk-relations.pdf`、`desktop-branches.pdf`。
- 大型原生 PDF：`artifacts/phase2/desktop-1000-branches.pdf`；逐頁文字／尺寸／字型證據 `bulk-verification.json`。
- 對照、字型／頁碼證據與畫面：`artifacts/phase2/`、`artifacts/phase2/ui-comparison/`。
- 0.1 原生格式仍為 v1；可直接開啟原文件，無 schema 改版或不可逆遷移。

```sh
npm ci
npm test
npm run test:e2e
npm run licenses
npm run package
node scripts/verify-print-ui.mjs              # 需 dev server 5187
node scripts/desktop-print-phase2.mjs          # 可用 OPENMIND_EXECUTABLE 指向封裝
python scripts/verify-phase2.py
python scripts/verify-phase2.py desktop-branches.pdf
python scripts/verify-bulk.py
python scripts/compare-print-ui.py            # Python 需 pymupdf、pillow
```

## 實際限制

實測曾發現大型 HTML 加內嵌字型超過 Chromium data URL 長度限制，桌面原生輸出失敗。現改為私有暫存目錄與 0600 HTML 檔，待字型／圖片完成後輸出；成功或失敗均清理。原生驗收同時確認兩份 PDF 後沒有新增暫存目錄或殘留隱藏列印視窗；另注入不存在的輸出資料夾，驗證顯示失敗訊息與同樣的清理結果。檔案不是永久寫入文件資料夾。程序或系統異常終止仍可能留下作業系統暫存檔。

系統字型仍用於不在 Noto 子集內的罕見字、emoji 或特殊符號，不能保證所有 Unicode 字元都有字形。獨立 SVG／PNG 匯出尚未加入同樣的字型內嵌流程；此輪保證範圍為列印預覽與 PDF。頁首／頁尾／中繼資料小於主題字級；最低設定針對主要主題文字。單頁／選取子樹模式仍可由使用者選擇縮小，會顯示警告。分支分割為可讀性優先的貪婪配置，沒有宣稱是最少頁數的全域最佳解。

可讀重排不保留原空間位置；跨頁外框只在完整包含範圍時繪製，關係由提示與索引保留。來源與目的名稱在索引使用短標題，完整節點內容仍在對應主頁。實體印表機、Windows／Linux、PDF/A、正式簽章與 notarization 仍待各平台／硬體驗收。
