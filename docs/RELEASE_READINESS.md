# OpenMind 0.3.1 RC — 發布準備與驗收結果

驗收日期：2026-10-20。目標是 macOS arm64 本機候選包及公開原始碼快照。公開 repository 已建立；本機 Git 歷史、工作分支與生成檔案不屬於公開快照。

## 發布判定：NOT READY

目前核心編輯、離線資料、匯入匯出和列印驗收通過。安全來源檢視涵蓋文件驗證／儲存、匯入匯出、Electron IPC、列印、更新與發行自動化，但不是完整的全程式碼安全稽核。`v*` tag 建立 ruleset 已啟用，Actions 預設權限為唯讀，簽章 job 的 `release` Environment 禁止自我審核；目前只有一位審核人，因此要新增另一位可信任維護者後才能放行。Apple 憑證未設定，簽章／公證的 macOS 發行 runner、已公證下載安裝器與真實更新往返尚未驗收。實體印表機、Windows、Linux 與非 arm64/x64 平台也未驗收。

## 功能狀態

| 功能／發布面 | 狀態 | 驗收依據與邊界 |
|---|---|---|
| 新增、編輯、移動、刪除、多選、剪貼、Undo/Redo | VERIFIED | 最新 104 單元測試、40 Chromium E2E；含 IME、拖放、損壞匯入和復原案例 |
| 本機儲存、IndexedDB、自動復原、原生檔案往返 | VERIFIED | 重新載入 1000 節點、E2E 開存往返、Electron 暫存安裝實測；IndexedDB 仍受使用者清除資料與磁碟容量影響 |
| 九種結構、任務、簡報、SVG/PNG、Markdown/OPML/FreeMind 子集 | VERIFIED | E2E 直接操作與往返；FreeMind 不支援範圍見功能相容表 |
| 雙視窗資料保護 | VERIFIED | Chromium 兩頁測試確認等待窗唯讀、接手時載入最新文件；無 Web Locks 時唯讀降級；macOS 第二次啟動確認維持單一視窗 |
| FreeMind 惡意結構上限 | VERIFIED | 50,001 個 rich-content 元素輸入被瀏覽器回歸案例拒絕；節點上限仍另行生效 |
| 繁體中文字型與 PDF 可搜尋文字 | VERIFIED | 瀏覽器和原生 PDF 均抽取到繁中；Noto Sans TC 以 Type0/TrueType 嵌入；字框均在紙張範圍內 |
| 單頁、可讀分頁、主分支分頁、海報、選取、大綱、黑白 | VERIFIED | 7 份實際輸出 PDF 共 183 頁，核對頁數、紙張、節點標籤、字型與字框；選取單頁量得 6.57 pt，介面有警告 |
| 列印預覽與 PDF 對照 | VERIFIED | 瀏覽器 15 頁樣本檢查第 1、4、6、15 頁；像素平均差異最高 0.73/255，變動像素比例低於 0.6%；7 個輸出 fixture 的比較亦通過 |
| 繁體中文／英文介面與主要公開指南 | VERIFIED | 兩語偏好重新載入後保留；涵蓋大綱、任務、簡報、屬性面板、搜尋快捷鍵、列印預覽、PDF 標題／語言、海報導引及跨頁索引；Electron 更新選單與狀態亦切換。主要使用、貢獻、安全與發布指南提供成對文件；歷史工程證據文件仍保留原始語言 |
| 大型圖列印 | VERIFIED | 1000 節點瀏覽器大綱 100 頁；封裝 Electron 主分支 135 頁。兩者均找到 999 個標籤，正文最低量測字級分別 10.49 pt、10.27 pt，且字框未越界 |
| 1000 節點效能 | VERIFIED | 本機 Chromium 合成圖：layout 中位數 5.1 ms、p95 16.9 ms；首次匯入與繪製 111 ms；IndexedDB restore 12.8 ms；reload/繪製 135 ms；100 頁 PDF 64 ms。縮放約 58 ms、平移兩影格約 72 ms；一次 renderer JS heap 量測 86.4 MB。這是單機樣本，不代表其他硬體或長時間峰值 |
| macOS arm64 封裝與圖示 | VERIFIED | `OpenMind.app` 322 MB，Mach-O arm64，ICNS 1024×1024；複製到獨立 OS 暫存目錄後從該位置啟動、儲存、列印及再次啟動測試通過；簽章為 ad-hoc |
| 依賴公告與授權聲明 | VERIFIED | `npm audit` 查詢 103 個套件，資訊／低／中／高／重大皆 0；`npm run licenses` 產生 103 個套件清單與 23 個執行期授權全文。這只是本次查詢結果 |
| 安全來源檢視與 FreeMind 修正 | TESTED | 對不可變基準版完成 Standard Codex Security 掃描：1 項 LOW／MEDIUM-confidence CWE-400；候選版以單次遍歷及 50,000 元素／256 層上限修正，50,001 元素 E2E 回歸通過。審查範圍為 partial（40/92 基線檔案加三個聚焦面向），非完整安全稽核；本機證據見 `artifacts/rc/security-review.md` |
| GitHub CI 品質流程 | VERIFIED | [Run 39386630070](https://github.com/nashwu0117/OpenMind/actions/runs/39386630070) on commit `d2d494d` 已成功完成 npm audit、Vitest、updater tests、production build 與 Chromium E2E。GitHub Actions 有 Node.js 20 棄用提示，但工作成功。 |
| 發行 workflow 權限隔離 | VERIFIED | GitHub 預設 `GITHUB_TOKEN` 權限為 read、PR 核准權停用；`v*` tag creation ruleset 已啟用。Workflow 建置 job 僅有 `contents: read`、checkout 不保留憑證、Actions 固定 SHA；`release` Environment 禁止自我審核，但需第二位可信任審核人後才可執行。尚未配置任何 Apple secrets |
| macOS arm64／x64 簽署、公證與拖移安裝 Release 流程 | IMPLEMENTED | `.github/workflows/release-macos.yml` 只建立草稿；需 Apple secrets 與 GitHub runner 實際產物驗收 |
| 應用程式內手動更新 | IMPLEMENTED | 4/4 updater 狀態單元測試、1 個 Chromium 介面 E2E；Electron 冒煙亦驗證英文狀態與原生選單。尚未接上已發布的公開 ZIP，下載／重啟往返未驗收 |
| 輔助科技、螢幕閱讀器、觸控與全面高對比 | IN PROGRESS | 鍵盤與深色模式有 E2E，但未做完整讀屏與裝置測試 |
| Developer ID／公證／DMG／乾淨機安裝升級 | BLOCKED | 發行腳本已備妥，但目前無簽署身分、公證 secrets 或乾淨使用者測試環境；本機產物仍是 ad-hoc `.app` |
| 私下安全漏洞回報管道 | VERIFIED | GitHub 私下漏洞回報已啟用，REST API 回讀確認 `enabled: true`；尚未送出測試報告 |
| 實體印表機、Windows、Linux、其他架構 | BLOCKED | 沒有對應硬體／作業系統的實際驗收；不宣稱支援可發布 |
| XMind、Office、AI、協作、完整工作日曆、永久版本歷史 | NOT STARTED 或受限子集 | 不是本 RC 的交付範圍；不得宣稱功能對等或完整格式相容 |

## 實際命令與產物

| 檢查 | 結果 |
|---|---|
| `npm test -- --reporter=dot` | 8 個測試檔、104/104 通過；含靜態 UI／列印訊息覆蓋、英文 PDF 頁標籤與跨頁關係索引 |
| `OPENMIND_TEST_PORT=5203 npm run test:e2e -- --reporter=line` | 40/40 Chromium E2E 通過；包含語言偏好、英文跨頁／列印及搜尋快捷鍵回歸 |
| `npm run package` | 曾在本機成功產生 ad-hoc 簽章的 macOS arm64 app；不是公證下載安裝器 |
| `npm run test:updater` | 4/4 通過；涵蓋架構 feed、手動檢查、下載狀態、安裝閘門及錯誤隱私 |
| `npm run test:desktop` | Electron sandbox／IPC、英文原生更新選單與更新狀態、原生檔案往返、列印預覽與 PDF 匯出通過；本次 QA 資料位於獨立 OS 暫存目錄 |
| `npm run build` | 成功；Vite 仍報告主 JS bundle 約 1.77 MB（gzip 約 619 KB）的 chunk 警告 |
| `npm audit --audit-level=high`（新增簽署工具後） | 0 vulnerabilities；查詢透過 npm registry 完成 |
| 隔離輸出目錄下的 `npm run package` | 成功；測試用 ad-hoc app 留在獨立 OS 暫存目錄，未覆寫 RC 的 `release/` 產物 |
| 暫存封裝 app 的更新視窗 | 以本機 macOS UI 開啟 app 並按「檢查更新」；IPC 與視窗正常，因未注入 repository 而正確顯示未設定更新來源 |
| `OPENMIND_EXECUTABLE=<暫存安裝副本> npm run test:desktop` | Electron sandbox、雙啟動鎖、原生存檔／開檔、實際 PDF 通過 |
| `node scripts/make-dmg.mjs <fresh temporary output directory>` | 成功產生 UDZO DMG 與架構更新 ZIP；DMG 以唯讀方式掛載並確認 `OpenMind.app` 和 `Applications` 連結，ZIP 列出 app bundle |
| `node scripts/desktop-print-phase2.mjs`（指向暫存安裝副本） | 原生 15 頁跨頁 PDF、135 頁 1000 節點 PDF、失敗錯誤提示及暫存清理通過 |
| `npm audit --json` | 103 個相依套件，0 項已知弱點（執行當時的 npm registry 結果） |
| `npm run licenses` | 103 個套件聲明、23 份 runtime 授權全文 |

建置另有一項已知限制：主 JS bundle 約 1.77 MB（gzip 約 619 KB），Vite 顯示大 chunk 警告。本輪量測未顯示 1000 節點操作瓶頸，故沒有以拆分程式碼替代資料正確性或字型呈現。

PDF、對照圖、效能 JSON 與測試追蹤是本機生成產物，已排除於公開 repository；此文件只保留驗收摘要，不散佈測試文件或本機路徑。

## 安裝候選包

本機 RC app 使用 ad-hoc 簽章，並非已公證的網路下載安裝器；GitHub Releases 尚無一般使用者安裝包。首次升級前請另存 `.openmind` 備份；舊 0.2 無法讀取 v2，回退時使用舊版原檔。

## 公開發布前必須完成

1. 增加第二位可信任維護者為 `release` Environment 審核人；簽章與公證憑證只存放在該 Environment，並保留限制 `v*` tag 建立權的 ruleset。
2. 設定 Developer ID／Notary secrets，推送版本 tag，檢查 arm64 與 x64 的 GitHub 草稿產物；乾淨 Mac 測試 Gatekeeper、下載、安裝、真實版本更新、移除和復原，再手動發布 Release。
3. 在實體 A4 與海報列印機上檢查裁切、色彩和拼接，並在每個承諾的平台執行安裝及 PDF 驗收。
4. 完成螢幕閱讀器、全鍵盤、高對比、觸控、磁碟滿與儲存拒絕測試。

本報告不表示完整 XMind 相容或所有平台支援。歷史 0.3.0 證據見[完整度稽核](COMPLETION_AUDIT.md)和[功能矩陣](FEATURE_PARITY_MATRIX.md)；限制見[BUGS_AND_LIMITATIONS](BUGS_AND_LIMITATIONS.md)。
