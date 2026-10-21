# Changelog

[English](CHANGELOG.md) · [繁體中文](CHANGELOG.zh-TW.md)

## 0.3.2 Preview — 2026-10-20

- Redesign the OpenMind app icon around a focused idea hub and readable topic cards; regenerate the 1024px PNG and macOS ICNS.

## 0.3.1 RC — 2026-10-20

- Prevent stale browser tabs from silently replacing local documents: one tab edits at a time, waiting tabs stay read-only and reload the latest saved document when they take over. Electron now focuses its existing window on a second launch.
- Bound FreeMind XML element count and structural depth before workbook conversion; validate rich content in one traversal without repeatedly searching ancestors.
- Add a branded OpenMind macOS app icon and a repeatable ICNS build step.
- Add a CI quality gate for dependency advisories, unit tests, production builds and Chromium end-to-end tests.
- Add release-candidate verification evidence and platform limitations in `docs/RELEASE_READINESS.md`.
