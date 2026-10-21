# macOS 發布與應用程式內更新

[繁體中文](RELEASING.md) · [English](RELEASING.en.md)

目前提供 [0.3.2 Apple Silicon 預覽版](https://github.com/nashwu0117/OpenMind/releases/tag/preview-0.3.2)：DMG 拖移安裝檔、app ZIP 與 `SHA256SUMS.txt`。這是經本機驗收的 ad-hoc 簽署版本，尚未經 Apple 公證；首次開啟可能需要在「系統設定 → 隱私權與安全性 → 仍要打開」個別允許 OpenMind。不要整體停用 Gatekeeper。

## 手動預覽版

預覽版使用 `preview-<版號>` tag，並在 GitHub 標記為 prerelease；不會進入下方的 Developer ID `v*` 發行流程，也不會由應用程式內更新服務自動安裝。0.3.2 只驗收 macOS arm64，沒有 Intel 或通用版本。

在 macOS arm64 上執行 `OPENMIND_UPDATE_REPOSITORY=nashwu0117/OpenMind npm run package`，再執行 `node scripts/make-dmg.mjs`。腳本不會覆寫既有輸出。發布前必須對封裝 app 執行桌面冒煙測試、驗證巢狀簽章、掛載 DMG 並測試安裝副本；為 DMG 與 ZIP 產生 SHA-256 清單，將同一批檔案附加到預覽 Release。簽章完整性不代表 Apple 已驗證開發者身分或公證通過。

下方是未來正式發行的設定。正式版目標為 Apple Silicon (`arm64`) 與 Intel (`x64`) Mac，各提供 Developer ID 簽署且已公證的 DMG 和更新 ZIP。

## 一次性 GitHub 與 Apple 設定

1. 將程式碼放在**公開 GitHub repository**。Electron 的公開更新服務只會讀取公開 repository 中已發布的 GitHub Release。
2. 在 GitHub repository 建立名為 `release` 的 **Environment**，要求至少一位 maintainer 審核部署，並將 `v*` tag ruleset 限制為可信任的發布維護者。把 Actions 的預設 `GITHUB_TOKEN` 權限設為唯讀。
3. 在 Apple Developer 帳號建立 `Developer ID Application` 憑證，匯出為含私鑰的 `.p12`；在 App Store Connect 建立可呼叫 Notary API 的 API key，下載 `.p8`。憑證只放入 `release` Environment 的 secrets，絕不提交至 repository 或一般 repository secrets。
4. 在 repository 的 **Settings → Environments → release** 設定以下 environment secrets：

   - `APPLE_CERTIFICATE_P12_BASE64`：Developer ID `.p12` 檔案的 Base64 內容。
   - `APPLE_CERTIFICATE_PASSWORD`：匯出 `.p12` 時設定的密碼。
   - `APPLE_SIGN_IDENTITY`：完整 `Developer ID Application: 名稱 (TEAMID)` 憑證名稱。
   - `APPLE_API_KEY_P8_BASE64`：Apple Notary API `.p8` 檔案的 Base64 內容。
   - `APPLE_API_KEY_ID` 及 `APPLE_API_ISSUER`：App Store Connect 顯示的 API key ID 與 issuer ID。

5. 確認 Actions 可執行 repository workflows。建置 job 只取得 `contents: read`；僅建立草稿 Release 的 job 取得 `contents: write`。不要把秘密寫進 workflow、日誌或版本控制。

## 建立並發布版本

1. 在 `package.json` 更新 SemVer 版號並提交變更；Git tag 必須精確使用 `v<package.json 版號>`，例如 `v0.3.2`。
2. 推送該 tag。`macos-14` arm64 與 `macos-15-intel` x64 兩個工作會各自執行 npm audit、單元／更新狀態／Chromium E2E 測試、建置、Developer ID 簽署、公證與 Gatekeeper 驗證。
3. 成功後，工作流程會把兩個架構的 DMG、更新 ZIP 及 SHA-256 清單放入 **draft Release**。先檢查日誌與下載產物；首次公開前，應在乾淨 Mac 實際安裝並確認 Gatekeeper、開啟、儲存、列印，再按 GitHub 的 **Publish release**。
4. 更新服務會忽略 draft 和 prerelease。發布第一版後，新使用者可從 Releases 下載；之後發布較新版本時，舊版使用者開啟 app 按「更新」，下載完成後按「重新啟動並安裝」。正式宣稱更新功能已驗收前，須用已發布的測試版本完成一次真實更新往返。

工作流程只建立草稿，不會把未人工檢查的版本自動公開。必需 secrets 缺漏、repository 非公開、tag 版號不符、測試失敗或 Apple 拒絕公證時，發行工作會失敗，不會建立可公開下載的完成版。

## 隱私與目前限制

應用程式只在使用者主動檢查時連線 Electron 公開更新服務，服務再查詢 GitHub Releases。更新請求包含目前版號與架構，伺服器會收到一般網路連線資訊；心智圖文件、附件及本機路徑不會送出。離線時編輯和列印仍可使用，但無法檢查或下載更新。

公開原始碼 repository 與 Apple Silicon 預覽版下載可用，GitHub 私下漏洞回報功能已啟用。Apple Developer 憑證、Notary API key 和乾淨 Mac 測試環境仍未設定；簽署與公證發行 workflow 尚未完成，也沒有已公證的安裝器或真實版本更新往返驗收。預覽版的本機安裝測試不能代表乾淨 Mac 的 Gatekeeper 驗收。詳見[發布準備報告](RELEASE_READINESS.md)。
