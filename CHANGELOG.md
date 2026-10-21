# Changelog

[English](CHANGELOG.md) · [繁體中文](CHANGELOG.zh-TW.md)

## 0.3.3 Preview — 2026-10-21

- Open the local library first, organize mind maps in folders, and use right-click or card menus to rename, duplicate and move maps.
- Open each map on a dedicated editing page with a return action, browser history and durable document URLs.
- Keep all saved maps instead of deleting documents beyond the eight most recent entries; preserve folder assignments across restarts.
- Explain manual preview updates and link to the download page instead of reporting every update error as a network failure. Use native Electron updater event signatures for stable builds.
- Publish Apple Silicon DMG and ZIP installers with SHA-256 checksums. This preview is ad-hoc signed and is not notarized by Apple.

## 0.3.2 Preview — 2026-10-20

- Redesign the OpenMind app icon around a focused idea hub and readable topic cards; regenerate the 1024px PNG and macOS ICNS.
- Publish an Apple Silicon macOS preview with drag-to-Applications DMG, app ZIP, SHA-256 checksums, and bilingual installation notes on 2026-10-21. The preview uses an ad-hoc signature and is not notarized by Apple.
- Render the macOS icon into an explicit 1024-pixel bitmap so Retina display scaling cannot break packaging; show renderer diagnostics on failure.

## 0.3.1 RC — 2026-10-20

- Prevent stale browser tabs from silently replacing local documents: one tab edits at a time, waiting tabs stay read-only and reload the latest saved document when they take over. Electron now focuses its existing window on a second launch.
- Bound FreeMind XML element count and structural depth before workbook conversion; validate rich content in one traversal without repeatedly searching ancestors.
- Add a branded OpenMind macOS app icon and a repeatable ICNS build step.
- Add a CI quality gate for dependency advisories, unit tests, production builds and Chromium end-to-end tests.
- Add release-candidate verification evidence and platform limitations in `docs/RELEASE_READINESS.md`.
