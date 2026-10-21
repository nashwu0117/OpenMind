# 測試計畫與實際結果 — 0.3.0 歷史範圍

以下表格保留 0.3.0 的基線測試範圍；0.3.1 RC 的最終實際結果、37 項 E2E、PDF 檢查、效能量測及發布判定，以[發布準備報告](RELEASE_READINESS.md)為準。驗收日期 2026-10-20，macOS arm64／Node 24／Chromium 與 Electron。資料均為合成測例，原生使用隔離設定檔。格式或分頁修改需重產 PDF，不能由檔案存在推定成功。

| 測試來源 | 驗收內容 | 本次結果 |
|---|---|---|
| core、regressions | 樹與參照、history、格式與既有回歸 | 通過 |
| audit-core | pending、拒存、清連結、完整複製、特殊文字、大小、重複ID、附件bytes | 通過 |
| parity、equations | 保源遷移、插父、進階欄位、DST排程循環、九幾何、簡報任務計畫、真向量公式 | 通過 |
| layout-print、print-next | 長高寬密集樹、圖註邊界、六模式、各紙張方向、續頁與索引 | 以上共101單元、7檔 |
| e2e/editor | 真鍵盤拖曳多選、樣式檔案輸出、唯讀離線 | 通過 |
| e2e/audit | 草稿IME Tab、8MB復原、拒存、唯讀搜尋、延遲圖片、對話框、框選、分批查詢 | 通過 |
| e2e/parity | 九結構可視、摘要公式附件、主題範本、真任務、簡報、FreeMind及嵌字型圖 | 通過 |
| e2e/print-focus、save-draft、workspace | 兩種專注、跨頁PDF、草稿保存、建表Undo | 以上共34 E2E |
| audit-release.mjs | 36組規模結構、v2原生往返、三類browser/native PDF與真UI預覽 | 通過 |
| verify-audit.py | 六PDF內容、字型程式、頁面邊界與vector、真預覽raster | 11/13/3頁，各兩份通過 |
| desktop-smoke.mjs | 封裝橋接、鍵盤、外連、原子存開、不同目的地 | 通過 |
| verify-print-ui、desktop-print-phase2 | 真預覽、80/1000原生PDF、索引、故障與清理 | 15/135頁通過 |
| verify-phase2、verify-bulk | 字型400/700、雙向頁碼與PDF連結、79/999編號與主字pt | 通過，最低10.2675pt |
| print-fixtures、verify-fixtures、compare-preview | 六模式7測例183頁、內容圖片黑白尺寸與raster | 通過 |
| compare-print-ui.py | 真UI中央、來源、目的及索引四頁對照PDF | 通過，均差0.10–0.73/255 |

## 復現

```sh
npm ci
npx playwright install chromium
npm test
npm run build
npm run dev
```

保持5187 dev server執行，另一終端：

```sh
PLAYWRIGHT_JSON_OUTPUT_NAME=artifacts/audit/e2e-full.json npx playwright test --reporter=list,json
node scripts/audit-release.mjs
node scripts/print-fixtures.mjs
node scripts/verify-print-ui.mjs
npm run licenses
npm run package
OPENMIND_EXECUTABLE=release/0.3.0/darwin-arm64/OpenMind.app/Contents/MacOS/OpenMind node scripts/audit-release.mjs
OPENMIND_EXECUTABLE=release/0.3.0/darwin-arm64/OpenMind.app/Contents/MacOS/OpenMind node scripts/desktop-smoke.mjs
OPENMIND_EXECUTABLE=release/0.3.0/darwin-arm64/OpenMind.app/Contents/MacOS/OpenMind node scripts/desktop-print-phase2.mjs
```

封裝不覆寫既有成品，請先保留或另存。PDF QA依賴不加入產品runtime：

```sh
QA_VENV="$(mktemp -d)/venv"
python3 -m venv "$QA_VENV"
"$QA_VENV/bin/pip" install pymupdf pillow
"$QA_VENV/bin/python" scripts/verify-audit.py
"$QA_VENV/bin/python" scripts/verify-pdf.py
"$QA_VENV/bin/python" scripts/verify-fixtures.py
"$QA_VENV/bin/python" scripts/compare-preview.py
"$QA_VENV/bin/python" scripts/verify-phase2.py
"$QA_VENV/bin/python" scripts/verify-phase2.py desktop-branches.pdf
"$QA_VENV/bin/python" scripts/verify-bulk.py
"$QA_VENV/bin/python" scripts/compare-print-ui.py
```

原生PDF要等包含確切新檔名的成功狀態，避免舊通知假成功。逐頁核對MediaBox、Type0字型bytes、文字與邊界；海報接縫單獨處理。raster門檻均差<3/255且>30色差像素<3%。

artifacts/audit/含最新PDF、JSON、截圖；artifacts/phase2/本輪重新生成既有策略回歸，不拿舊報告冒充新證據。產物和trace不提交Git。

仍需真硬體列印、正式公證與乾淨機、Windows/Linux、全讀屏觸控、原生磁碟滿與多窗衝突驗收，見[發布準備](RELEASE_READINESS.md)。
