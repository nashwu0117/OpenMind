# 未解問題與限制 — 0.3.0

日期2026-10-20。D01–D22修正見[稽核](COMPLETION_AUDIT.md)。執行範圍內無剩餘已重現未修復的資料毀損P0，並非沒有未知缺陷的保證。

| ID | 優先度／狀態 | 問題、影響與替代 | 完成條件 |
|---|---|---|---|
| B01 | P1 BLOCKED | 無實體印表機；預覽與PDF已驗，真紙邊界色彩拼接未驗 | A4與海報實印留證 |
| B02 | P1 BLOCKED | 僅ad-hoc，無Developer ID／公證／安裝器／更新；Gatekeeper可限制 | 正式身分、乾淨機安裝升級 |
| B03 | P1 BLOCKED | Windows/Linux／其他架構／手機未驗，shell目標桌面≥820px | 各平台原生存檔字型PDF |
| B04 | P2 NOT STARTED | 無.xmind／Office／TextBundle，不以文字轉換冒稱全相容 | 格式評估、合法corpus、目標程式 |
| B05 | P2 NOT STARTED | 無分支混合結構與全部方向；時間軸非日期比例 | 分支策略與輸出一致 |
| B06 | P2 IN PROGRESS | 矩陣樹表是真階層幾何，非任意資料欄／拖寬／試算表；外框僅子樹 | 明確欄群語意與轉換驗收 |
| B07 | P2 NOT STARTED | UTC日曆日、finish-to-start依賴；無假日工時資源或關鍵路徑 | 工作日曆及真排程案例 |
| B08 | P2 IN PROGRESS | Base/AMS TeX子集、禁外部套件；非完整TeX化學；Unicode貼圖、無錄音 | 擴充範圍及離線corpus |
| B09 | P1 IN PROGRESS | 有IME鍵盤及部分焦點圈限；全讀屏對比觸控未驗；全螢幕依環境許可 | 輔助科技及多尺寸人工驗收 |
| B10 | P1 IN PROGRESS | IDB受清資料／容量影響；八近期、80Undo非永久版本；多窗無衝突協定 | 多窗鎖／合併與版本封存；目前單窗並另存原生 |
| B11 | P2 IN PROGRESS | PDF筆記圖示不含全文；主字最低pt非metadata；fit可覆寫、海報刻意切頁；分頁不保證最省紙 | 若增全文列印或最少頁最佳化，另定驗收 |
| B12 | P2 IN PROGRESS | MathJax使主JS約1.72MB/gzip602KB，有chunk提示；本機矩陣1000節點單次約43ms | 拆載入與低階機profiling |
| B13 | P2 NOT STARTED | 無混檔、獨立另存工作表、加密、OS快擷取、自動編號 | 各自資料格式與復原測試 |
| B14 | P2 IN PROGRESS | Noto400/700已嵌，罕字emoji與serif/mono拉丁可能系統回退；量字非完整shaping | 擴語系驗收，不散布未授權字型 |
| B15 | P2 NOT STARTED | 無AI、雲端分享協作評論同步，無外部呼叫 | provider同意、CRDT權限及離線重連 |

原生上限20,000,000 UTF8 bytes、10,000節點、128層、50表。附件每主題10個、每檔2,000,000解碼bytes。交換文字各2,000,000 UTF8 bytes。PNG最長12,000px／4,000萬像素。

Markdown/OPML只保留文字階層；FreeMind另有基本樣式筆記連結與箭頭，但圖示／箭頭標題／外觀簡化，進階欄位及其他表不含。介面先警告；保留.openmind備份。未知原生欄位／未來版本拒絕，不改來源檔。
