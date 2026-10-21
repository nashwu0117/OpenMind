# 功能完成度與對標矩陣 — 0.3.1 RC

官方查核：2026-10-20 Pacific/Auckland。[XMind功能](https://xmind.com/features/)、[主題編輯](https://xmind.com/user-guide/topic-editing-new)、[進階功能](https://xmind.com/user-guide/advanced-features)、[平台差異](https://xmind.com/help/feature-differences-across-platforms)。平台能力不同，以公開行為對標，不複製專有資產。

本表保留 0.3 核心功能驗收證據；本 RC 新增的雙視窗、匯入安全、效能、依賴與封裝驗收，以及發布判定，以[0.3.1 RC 發布準備報告](RELEASE_READINESS.md)為準。狀態：NOT STARTED／IN PROGRESS／IMPLEMENTED／TESTED／VERIFIED／BLOCKED。VERIFIED 僅指列出的 OpenMind 條件在 macOS／Chromium 實際驗收，不代表完整 XMind 對等。U=101 單元，E=34 E2E（0.3.0 基線；本 RC 為 37），L=36 版面規模測例，P=實際 PDF，N=封裝原生；命令見[TEST_PLAN](TEST_PLAN.md)，Dxx 見[稽核](COMPLETION_AUDIT.md)，Bxx 見[限制](BUGS_AND_LIMITATIONS.md)。

| ID／類別 | 功能 | 目前實作 | 缺陷／限制 | 預期行為／驗收條件 | 實際結果 | 狀態 |
|---|---|---|---|---|---|---|
| F01 編輯 | 中央／子／同層／多行 | 穩定ID可逆交易 | 中央不可刪剪 | 重開後文字階層一致 | U/E/N，D09/19 | VERIFIED |
| F02 編輯 | 插入父主題 | 普通／中央／自由上插 | 無批次插父 | 順序子樹保留、完整Undo/Redo | U通過；UI接真命令 | TESTED |
| F03 編輯 | 拖曳／重排／複製剪貼刪 | 防循環、ID重編、清參照 | 無富資料系統剪貼簿 | 真拖曳、參照正確及Undo | U/E，D03–05 | VERIFIED |
| F04 編輯 | 多選／框選／批次 | Shift、框選、批次樣式刪除 | 無智慧對齊 | 框選17節點不改內容 | E通過 | VERIFIED |
| F05 編輯 | 自由主題 | 拖曳、邊界安排新位置 | 可手動疊放 | 新增兩個位置不同且保存 | U/E，D20 | VERIFIED |
| F06 輸入 | 繁中／IME／鍵盤 | 組字不提早提交、Tab導航 | 全讀屏／觸控未驗 | 草稿寫原節點、特殊字保存 | E，D09–11 | VERIFIED |
| F07 歷史 | Undo/Redo | 文件交易、Redo失效 | 80次、開檔重設 | 樣式標註排程結構可逆 | U/E通過 | VERIFIED |
| F08 檔案 | 新建／開存／另存 | 原生對話框、原子寫入 | 新文件首次需選位置 | 全欄位原生往返 | E/N通過 | VERIFIED |
| F09 儲存 | 自動儲存／復原 | IndexedDB working/previous | 非永久備份 | 8MB附件reload、拒存提示 | U/E，D01/02/12 | VERIFIED |
| F10 格式 | v1→v2遷移 | 記憶體補預設、保源 | 不支援未來版 | v1 bytes不變、v2往返 | U/E通過 | VERIFIED |
| F11 工作區 | 最近／多表 | 八文件、建表改名複製切換 | 無版本時間線 | 重開及Undo建表安全 | U/E/N通過 | VERIFIED |
| F12 畫布 | 平移縮放適應置中 | 游標縮放、結構變化重新fit | 巨圖仍需導航 | 不改資料、九結構可視 | E/L，D21 | VERIFIED |
| F13 結構 | Mind Map | 左右平衡 | 無分支混搭 | 四規模節點無重疊 | U/E/L/P通過 | VERIFIED |
| F14 結構 | Logic Chart | 右向階層曲線 | 無左向選項 | 有限座標、內容完整 | U/E/L通過 | VERIFIED |
| F15 結構 | Brace Map | 子群括號SVG | 無逐群括號樣式 | 真括號、完整階層 | U/E/L通過 | VERIFIED |
| F16 結構 | Tree Chart | 水平階層直角線 | 無全部方向 | 專用連線、無重疊 | U/E/L通過 | VERIFIED |
| F17 結構 | Organization | 上下階層 | 無各層手調寬度 | 兄弟間距及資料保留 | U/E/L通過 | VERIFIED |
| F18 結構 | Timeline | 主幹順序＋上下子樹 | 非日期比例 | 與組織圖幾何不同 | U/E/L通過 | VERIFIED |
| F19 結構 | Fishbone | 主脊、交錯斜肋 | 無任意角度手調 | 專用幾何、無節點重疊 | U/E/L通過 | VERIFIED |
| F20 結構 | Matrix | 主分支欄、縮排列 | 非任意欄資料表 | 欄群導線、專用座標 | U/E/L，B06 | VERIFIED |
| F21 結構 | Tree Table | 層級欄、父格跨後代列 | 非試算表 | 跨列格、主題可編輯 | U/E/L，B06 | VERIFIED |
| F22 結構 | 混合分支 | 無每分支策略 | B05 | 分支獨立版面與引用 | 未實作 | NOT STARTED |
| F23 標註 | Relationship | 方向虛線文字與索引 | 無曲線控制點 | 刪改清理、PDF雙向跳頁 | U/E/P通過 | VERIFIED |
| F24 標註 | Boundary | 單子樹外框文字 | 無任意跨兄弟群組 | 隨摺疊移刪調整 | U/P通過 | VERIFIED |
| F25 標註 | Summary | ID錨定摘要可編刪 | 摺疊目標可僅在索引 | 保存、清參照、S1跨頁文字 | U/E/P通過 | VERIFIED |
| F26 註記 | Notes/Label | 純文字保存搜尋 | 非富文字、PDF圖示 | 原生往返、篩選定位 | U/E通過 | VERIFIED |
| F27 連結 | Topic/Web | 內部選擇、安全URL | 無檔案連結 | 清參照、原生外連分派 | U/E/N通過 | VERIFIED |
| F28 標記 | Markers/Stickers | Unicode選擇 | 非插畫庫、emoji回退 | 保存顯示匯出 | U/E/P通過 | VERIFIED |
| F29 圖片 | 內嵌raster | 受限內嵌圖 | 無裁圖／說明 | 不套錯文件、PDF真影像 | E/P通過 | VERIFIED |
| F30 附件 | 二進位檔 | 每節點10個、各2MB、下載刪除 | 無錄音、總20MB | bytes相同、reload不丟 | U/E/N通過 | VERIFIED |
| F31 公式 | 離線TeX | MathJax Base/AMS向量 | 非完整TeX／化學 | 真paths、原生往返與PDF | U/E/P通過 | VERIFIED |
| F32 樣式 | 字體／透明／線／間距 | 三字族、對齊、描邊、複製重設 | 系統備字不全嵌 | 欄位保存且真正渲染 | U/E/P通過 | VERIFIED |
| F33 範本 | 自訂主題／範本 | IDB保存套用刪除 | 無主題商店 | 重啟可用、新文件獨立 | U/E通過 | VERIFIED |
| F34 大綱 | 同源Outliner | 編輯新增階層摺疊 | 非另一文件 | 切視圖資料一致 | E通過 | VERIFIED |
| F35 搜尋 | 全文／篩選定位 | 完整計數分批、保留query | 無取代／標記篩選 | 199結果全展開、唯讀可定位 | E，D15/18 | VERIFIED |
| F36 專注 | 兩種預覽再展開 | 分支暫展開、紙張縮放導航 | 視圖狀態不存檔 | Esc返回、原摺疊不變 | E/P通過 | VERIFIED |
| F37 簡報 | 順序播放導航PDF | 保存排序、5秒自播、16:9、全螢幕 | 無PPTX；全螢幕依環境 | 導航不改內容、順序保存、3頁PDF | U/E/N/P；自播與暫停通過 | VERIFIED |
| F38 任務 | 日期依賴甘特圖 | 日曆日、循環拒絕、真排程 | 無假日／資源日曆 | DST正確、單步Undo、13頁PDF | U/E/N/P通過 | VERIFIED |
| F39 交換 | FreeMind .mm子集 | 階層基本樣式筆記連結箭頭 | 明示有損、非全相容 | 匯入存檔匯出再匯入一致 | E通過 | VERIFIED |
| F40 交換 | Markdown/OPML | 階層多行、UTF8限額 | 明示進階欄位不含 | 特殊符號往返、拒絕不覆蓋 | U/E通過 | VERIFIED |
| F41 輸出 | SVG/PNG | 可見展開內容、嵌繁中字型 | PNG像素限額 | 真下載、4節點、WOFF2 data | E通過 | VERIFIED |
| F42 輸出 | PDF | 地圖大綱任務簡報向量 | 非PDF/A、無匯入 | 內容尺寸字型邊界驗證 | N/P通過 | VERIFIED |
| F43 列印 | 六策略／紙張 | fit可讀海報主分支選取大綱 | fit可低於10pt、海報切頁 | 真頁數字級與預覽一致 | U/E/P，183頁 | VERIFIED |
| F44 列印 | 繁中及跨頁R/S | 靜態400/700、索引跳頁 | 罕字回退、最小pt僅主文字 | Type0 bytes、雙向頁碼連結 | N/P，135頁大圖 | VERIFIED |
| F45 硬體 | 實體列印 | 原生／瀏覽器橋接 | B01無硬體 | 真紙邊界色彩拼接 | 未實印 | BLOCKED |
| F46 平台 | macOS arm64開發包 | 真app、ad-hoc | B02/03公證與其他OS | 成品真編輯存檔PDF | N通過 | VERIFIED |
| F47 AI | 生成／擴寫／多模態 | 無假推理控制項 | provider／同意未實作 | 真inference預覽接受Undo | 未實作 | NOT STARTED |
| F48 協作 | 分享評論同步 | 純本機 | 無CRDT/ACL伺服器 | 多人離線重連與權限 | 未實作 | NOT STARTED |
| F49 相容性 | XMind/Office/TextBundle | 不宣稱支援 | 無converter/corpus | 目標程式開啟、損失報告 | 未實作 | NOT STARTED |
| F50 進階 | 混檔／版本／加密／OS | Undo另存內複製不是替代品 | B13 | 獨立規格及復原協定 | 未實作 | NOT STARTED |

受限但已驗證的實作與未開始能力分開記錄；正式發布阻擋不因核心回歸通過而算完成。
