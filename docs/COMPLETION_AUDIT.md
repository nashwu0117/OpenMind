# OpenMind 0.3.0 完整度稽核

驗收日期：2026-10-20（Pacific/Auckland）。可交付離線 macOS arm64 開發版與桌面瀏覽器版本；**正式公開發布尚未就緒**，不宣稱完整 XMind 功能對等。

## 檢查點與基線

- 起始 HEAD：`425f887e453e3599b2872a0ce44942c2af3c13c2`，起始目錄乾淨。
- 備份分支：`backup/print-focus-0.2-2026-10-20`；開發分支：`feature/openmind-completion-audit`。
- 原有0.2套件保留；最終成品為 `release/0.3.0/darwin-arm64/OpenMind.app`。初次0.3 QA套件另存 `OpenMind.pre-ui-QA.app`。未發布／推送或使用日常設定檔測試。
- 基線69單元及建置成功。初次E2E缺少Chromium headless shell 1248；安裝後未修改的16項基線通過，未計為產品缺陷。

## 稽核與修正

追蹤模型、history、儲存、格式、版面、SVG、分頁與原生IPC，並真實操作瀏覽器／封裝版。[功能矩陣](FEATURE_PARITY_MATRIX.md)記錄F01–F50共50個驗收單位：43 VERIFIED、1 TESTED、5 NOT STARTED、1 BLOCKED。一列可包含列出的相關能力，受限實作的VERIFIED不代表完整對標能力。

下表D01–D22為22組缺陷／可靠性問題。D01–D11有新增案例先失敗再通過證據；其餘包含操作發現及新功能邊界保護，不冒稱全部在舊版完成紅綠測試。

| ID | 問題及修正 | 主要位置 | 驗證 |
|---|---|---|---|
| D01 | 新pending被舊主檔蓋過；優先復原pending | core/storage | audit-core |
| D02 | Storage拒絕造成啟動失敗；捕捉並使用可用資料庫 | storage/library | U/E |
| D03 | 刪節點留下內部連結；清理目標參照 | core/model | audit-core |
| D04 | 跨表貼上留下無效連結；清理不可解析外部參照 | core/model | audit-core |
| D05 | copyBranch遺失關係／外框與連結重編；共用完整複製命令 | core/model | audit-core |
| D06 | Markdown字面br／實體／斜線改變；單層編解碼 | io/formats | audit-core |
| D07 | 原生輸出超過自己20MB匯入上限；壓縮後仍超限即拒絕 | formats/App | U |
| D08 | 標註ID重複使目標不明；跨類型唯一驗證 | core/model | audit-core |
| D09 | 草稿寫入切換後節點；先提交原欄位並以即時history交易 | App/Fields | E |
| D10 | 中文組字Enter提早提交；尊重composing／229 | Fields | E |
| D11 | 工具列Tab意外新增；保留按鈕鍵盤導航 | App | E |
| D12 | 大附件超過Web Storage；IndexedDB原子交易及previous副本 | core/library | 8MB附件reload逐筆比對 |
| D13 | 結構共用不適當幾何；專用時間軸／魚骨／矩陣／樹表／括號策略 | layout/svg | U/E/L |
| D14 | 獨立圖缺繁中字型、專注展開未全匯出；共用嵌字型及可見範圍 | visualExport/App | 實際SVG/PNG下載 |
| D15 | 唯讀搜尋無法定位摺疊節點；僅視圖展開 | App | E比對文件不變 |
| D16 | 延遲圖片套至切換後同ID文件；驗證文件／表／節點身分 | App | 延遲FileReader E |
| D17 | 新增／說明對話框焦點到背景、Escape無效；焦點圈限與返回 | useModalFocus/App | E |
| D18 | 搜尋截斷100筆、丟查詢；完整計數、更多、篩選與保留查詢 | App | 200節點E |
| D19 | 中央剪下未刪卻宣稱成功；拒絕並提示 | App | E |
| D20 | 新自由主題固定座標重疊；依邊界安排並定位 | App | 框選及兩自由主題E |
| D21 | 切換結構視野不合；重新適應畫布 | Canvas | 九種結構可視範圍E |
| D22 | 資源上限／拒絕交易後UI不一致；附件解碼bytes、交換UTF8限額、成功後才切選取 | model/formats/App | U及完整回歸 |

新增插入父主題、錨定摘要、內部連結選擇、進階樣式／間距／連線、貼圖、二進位附件、離線向量公式、自訂主題與文件範本。原生v2在記憶體遷移v1並保留來源。

任務是真實日期、含首尾日持續時間、依賴、循環檢查與單步Undo排程；甘特圖依日期畫條。簡報有保存順序、導航、自動播放、全螢幕及16:9 PDF。FreeMind提供明示損失警告的子集。全部操作同一Workbook，無假AI／協作控制項。

## 實際結果

| 檢查 | 結果與證據 |
|---|---|
| U：單元 | 101項、7檔通過 |
| E：瀏覽器 | 34項通過；artifacts/audit/e2e-full.json |
| 建置／封裝 | strict TypeScript、Vite、macOS arm64與ad-hoc簽章驗證通過；package.log |
| L：九版面 | 10/50/200/1000節點各九種，共36組；節點齊全、有限座標、無自動節點重疊 |
| 大圖效能 | 本機單次1000節點layout約5.2–43.2ms，矩陣最慢；非跨裝置基準／全部互動保證 |
| P：六份PDF | browser/native各：豐富標註11頁、任務13頁、簡報3頁；中文字型／內容／尺寸／邊界通過 |
| 真預覽比對 | 直接取UI SVG與PDF raster：豐富內容均差0.5314/255，>30色階差異像素0.5251%；外部字型請求0 |
| 80節點原生 | 15頁、79編號全找到、26字型程式、30PDF連結；頁4/6雙向關係與頁15索引 |
| 1000節點原生 | 135頁、999編號全找到；最小主題文字實測10.2675pt，邊界通過 |
| 六列印策略 | 7份共183頁，圖片／任務／外框／關係／黑白、尺寸內容及7組raster比較通過 |
| N：原生可靠性 | v2逐欄位往返、隔離橋接、外連、不同文件目的地、故障與暫存／隱藏視窗清理通過 |
| 依賴／授權 | 當次audit 0已知漏洞；MathJax4.1.3；全部runtime與字型授權收錄 |

人工查看矩陣、任務、簡報、專注預覽，以及公式／甘特圖PDF raster。海報刻意切頁；選取fit可低於10pt並警告，50節點測例為6.57pt，未宣稱每模式保證10pt。

## 判定

本輪完成本機能力補齊、22組可靠性修正、50項矩陣及實際驗收。公開穩定版尚需實體列印、跨平台、完整輔助科技、正式簽署／公證等證據；進階格式、混合結構、完整日曆、AI及協作仍缺。見[限制](BUGS_AND_LIMITATIONS.md)、[復現命令](TEST_PLAN.md)與[發布準備](RELEASE_READINESS.md)。
