<p align="center">
  <img src="assets/openmind-icon.svg" width="148" alt="OpenMind 圖示">
</p>

<h1 align="center">OpenMind</h1>

<p align="center">
  <strong>自由思考，清晰呈現。</strong><br>
  免費、開源、離線優先的心智圖編輯器，為清楚整理想法與可讀列印而設計。
</p>

<p align="center">
  <a href="README.en.md">English</a> ·
  <a href="https://github.com/nashwu0117/OpenMind/releases">下載 macOS 版本</a>
</p>

<p align="center">
  <img src="docs/images/openmind-zh-TW.jpg" alt="OpenMind 繁體中文介面與心智圖範例" width="100%">
</p>

OpenMind 是專注於內容清晰度與列印品質的桌面心智圖工具。繁體中文和英文介面都可在應用程式內切換；語言偏好保存在本機，不會翻譯或改寫你的節點內容。

## 下載與安裝

[下載 0.3.3 DMG（Apple Silicon／M 系列 Mac）](https://github.com/nashwu0117/OpenMind/releases/download/preview-0.3.3/OpenMind-darwin-arm64-0.3.3.dmg) · [ZIP 與版本說明](https://github.com/nashwu0117/OpenMind/releases/tag/preview-0.3.3)。本次預覽版僅提供 `arm64`，不適用於 Intel Mac。打開 DMG，將 OpenMind 拖到「Applications／應用程式」資料夾，再從應用程式資料夾開啟。

目前的 macOS 預覽版使用 ad-hoc 簽章，尚未經 Apple 公證；不需要 Apple Developer ID 憑證。首次開啟時系統可能會阻擋。確認下載來源是本專案的 GitHub Release 後，可在「系統設定 → 隱私權與安全性 → 仍要打開」為 OpenMind 個別允許；不需要整體停用 Gatekeeper。

## 為什麼使用 OpenMind

- **專注整理想法：** 九種圖表結構、自由主題、多層分支、同步大綱、搜尋、任務時間軸與簡報模式。
- **資料夾分類：** 從資料庫管理心智圖，按右鍵或點選卡片的 ⋯ 可重新命名、建立副本與移動資料夾；開啟後進入獨立編輯頁。
- **列印後仍然可讀：** 六種分頁策略、繁中字型內嵌 PDF、跨頁關係提示與列印前預覽。
- **資料留在本機：** 不需要帳號；文件以本機檔案或瀏覽器本機儲存管理。應用程式不含廣告或遙測。
- **方便攜出：** 支援 `.openmind` 原生文件，並提供 Markdown、OPML 與 FreeMind 子集匯入匯出，以及 SVG／PNG 圖片輸出。
- **中英文介面：** 切換介面語言不會改寫文件文字或列印內容。

## 更新

本次預覽版請從 [GitHub Releases](https://github.com/nashwu0117/OpenMind/releases) 手動下載更新；升級前先另存 `.openmind` 備份。0.3.3 的「更新」視窗會說明手動更新方式，並提供開啟下載頁面的按鈕。0.3.2 仍可能顯示誤導的「網路失敗」，請直接使用上方下載連結。下載、簽署驗證、安裝與重新啟動的自動更新流程，仍須在 Developer ID 簽署的公開版本完成端對端驗收。

## 從原始碼執行

需要 Node.js 24 LTS（或符合 Vite 8 要求的較新版本）與 npm。第一次安裝相依套件和 Electron 執行環境需要網路；完成後，編輯與列印可離線使用。

```sh
npm ci
npm run dev
```

瀏覽器開啟 `http://127.0.0.1:5187`。要執行桌面版：

```sh
npm run desktop
```

## 測試

```sh
npm test
npm run test:updater
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:desktop
```

列印 PDF、字型與版面驗收方式見[測試計畫](docs/TEST_PLAN.md)及[列印引擎說明](docs/PRINT_ENGINE.md)。

## 文件與限制

[產品規格](docs/PRODUCT_SPEC.md) · [架構](docs/ARCHITECTURE.md) · [格式相容性](docs/FORMAT_COMPATIBILITY.md) · [發布準備報告](docs/RELEASE_READINESS.md) · [已知限制](docs/KNOWN_LIMITATIONS.md) · [貢獻指南](CONTRIBUTING.md) · [安全政策](SECURITY.md) · [更新與 macOS 發布設定](docs/RELEASING.md)

OpenMind 目前不支援 `.xmind`、Office 文件、多人協作或 AI 服務；FreeMind 僅支援文件列出的子集。請查看[格式相容性](docs/FORMAT_COMPATIBILITY.md)與[已知限制](docs/KNOWN_LIMITATIONS.md)，確認工作流程所需的功能。
