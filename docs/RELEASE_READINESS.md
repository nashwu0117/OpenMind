# 0.3.0 發布準備

2026-10-20：**可交付本機開發測試版，正式公開發布尚未就緒。** 不宣稱完整XMind相容或全部進階功能。

| 准出項目 | 結果 |
|---|---|
| 保護原成果 | 起點425f887、備份與獨立分支已建 |
| 本輪操作／資料修正 | D01–22修正，101單元／34 E2E通過 |
| 真PDF與預覽 | 六豐富／任務／簡報PDF、183頁測例、15/135頁原生通過 |
| 完整資料與遷移 | v2逐欄、v1保源、8MB附件reload通過 |
| 免費／離線／本機 | 無帳號、付費API、遙測、廣告或預設上傳；PDF無外部字型請求 |
| 建置／授權／依賴 | strict build及封裝成功，Apache-2.0保留，runtime聲明完整，當次audit零已知漏洞 |
| macOS arm64開發包 | ad-hoc及成品真實操作通過，約321MB |
| 正式簽署公證安裝升級 | BLOCKED，需要發行身分及乾淨機 |
| 實體印表機 | BLOCKED，本次無硬體 |
| Windows/Linux／其他架構 | BLOCKED，未在對應平台執行 |
| 全輔助科技／多窗可靠性 | IN PROGRESS，公開穩定版前需補 |
| XMind/Office／混合結構／完整日曆／AI／協作 | 未開始或受限子集，不能假稱完成 |

## 啟動與成品

```sh
npm ci
npm run dev       # http://127.0.0.1:5187/
npm run desktop   # 先build後Electron
npm run licenses
npm run package
```

成品：`release/0.3.0/darwin-arm64/OpenMind.app`，可用`open release/0.3.0/darwin-arm64/OpenMind.app`啟動。這是可執行開發包，非已公證安裝器。腳本拒絕覆寫；0.2及初次0.3 QA包均保留。未改使用者正式程式／文件，測試為獨立設定檔。

首次升級請另存.openmind備份。v1在記憶體升至v2後另存；舊0.2不能讀v2，回退時使用原v1備份。

## 公開穩定版前

1. 正式簽署／公證、乾淨機下載安裝升級卸載、更新與復原政策。
2. 各目標平台原生檔案／字型／PDF，實印A4與海報。
3. 全鍵盤讀屏高對比觸控；多窗同編衝突策略；原生磁碟滿／拒存故障注入。
4. 定義公開版承諾範圍。若承諾完整XMind對等，仍須完成矩陣未開始能力及格式corpus。

未自動發布、上傳或發外部訊息。[完整稽核](COMPLETION_AUDIT.md)／[限制](BUGS_AND_LIMITATIONS.md)／[復現](TEST_PLAN.md)。
