# 版本紀錄

[English](CHANGELOG.md) · [繁體中文](CHANGELOG.zh-TW.md)

## 0.3.2 Preview — 2026-10-20

- 重新設計 OpenMind app 圖示，以聚焦的想法核心連結清楚易讀的主題卡片，並重新產生 1024px PNG 與 macOS ICNS。
- 2026-10-21 發布 Apple Silicon macOS 預覽版，提供拖移安裝 DMG、app ZIP、SHA-256 清單與雙語安裝說明。預覽版使用 ad-hoc 簽章，尚未經 Apple 公證。
- macOS 圖示改用固定 1024 像素的點陣緩衝區，避免 Retina 螢幕倍率造成打包失敗，並保留圖示產生錯誤的診斷輸出。

## 0.3.1 RC — 2026-10-20

- 防止舊的瀏覽器分頁靜默覆蓋本機文件：同一時間只允許一個分頁編輯；等待中的分頁保持唯讀，接手時會載入最新內容。Electron 第二次啟動會聚焦既有視窗。
- 在 FreeMind XML 轉換前限制元素數量與階層深度；以單次有界走訪驗證豐富內容，避免反覆搜尋祖先節點。
- 加入 OpenMind 品牌 macOS 圖示及可重複使用的 ICNS 建置步驟。
- 加入 CI 品質門檻，檢查依賴公告、單元測試、正式建置及 Chromium 端對端測試。
- 加入發布候選版驗收證據與平台限制，詳見 [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md)。
- 加入繁體中文／英文介面、語言偏好本機保存、主要畫面的語言切換驗收，以及雙語安裝、貢獻、安全與發布說明。
- 修正英文介面下搜尋快捷鍵無法定位搜尋欄的回歸問題。
