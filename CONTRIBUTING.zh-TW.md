# 貢獻指南

[English](CONTRIBUTING.md) · [繁體中文](CONTRIBUTING.zh-TW.md)

使用 Node.js 24 LTS 或相容的新版本，執行 `npm ci`，再用 `npm run dev` 或 `npm run desktop` 啟動。文件資料應獨立於 React，保留既有 ID 和原生欄位，並以交易方式修改。遇到不支援的匯入格式時，應提供可採取行動的錯誤訊息，不可靜默丟棄資料。

提交前請執行 `npm audit`、`npm test`、`npm run test:updater`、`npm run build`、`npm run test:e2e` 和 `npm run test:desktop`，並用 `scripts/` 下的工具檢查產生的 PDF。列印或版面變更須涵蓋繁中、深／寬型態及 1000 節點案例。若修改本機儲存，請測試多個分頁及鎖定交接。功能狀態須附上實際證據、相容性及已知限制；未測試的能力不可標為已驗證。

`OpenMind quality` 工作流程會在推送與 Pull Request 執行。macOS 發布流程會建立草稿，必須提供 Developer ID 與 Apple Notary API 機密，且不會自動公開。請參閱[macOS 發布設定](docs/RELEASING.md)。

請使用獨立原創的插圖與版面，不得複製 XMind 專有程式碼、品牌或付費素材。貢獻內容採 Apache-2.0 授權。保留上游授權，修改依賴後執行 `npm run licenses`。不可提交 `node_modules`、私人心智圖或產生的 QA 使用者資料。
