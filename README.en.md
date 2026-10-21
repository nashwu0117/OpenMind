<p align="center">
  <img src="assets/openmind-icon.svg" width="148" alt="OpenMind icon">
</p>

<h1 align="center">OpenMind</h1>

<p align="center">
  <strong>Think freely, expand clearly.</strong><br>
  A free, open-source, offline-first mind-mapping app for clear thinking and readable print.
</p>

<p align="center">
  <a href="README.md">繁體中文</a> ·
  <a href="https://github.com/nashwu0117/OpenMind/releases">Download for macOS</a>
</p>

<p align="center">
  <img src="docs/images/openmind-en.jpg" alt="OpenMind English interface with a sample mind map" width="100%">
</p>

OpenMind is a desktop mind-mapping app built around clarity and print quality. Switch between Traditional Chinese and English in the app; the language preference stays on this device and never translates or rewrites your map content.

## Download and install

[Download the 0.3.2 DMG for Apple Silicon Macs](https://github.com/nashwu0117/OpenMind/releases/download/preview-0.3.2/OpenMind-darwin-arm64-0.3.2.dmg) · [ZIP and release notes](https://github.com/nashwu0117/OpenMind/releases/tag/preview-0.3.2). This preview is `arm64` only and does not run on Intel Macs. Open the DMG, drag OpenMind to Applications, and launch it from Applications.

The current macOS preview uses an ad-hoc signature and is not notarized by Apple; no Apple Developer ID certificate is needed. macOS may block it on first launch. After confirming that the download came from this project's GitHub Release, allow OpenMind in **System Settings → Privacy & Security → Open Anyway**. You do not need to disable Gatekeeper globally.

## Why OpenMind

- **Focused thinking:** Nine map structures, freeform topics, deep branches, a synchronized outline, search, task timelines, and presentation mode.
- **Readable print:** Six pagination strategies, embedded Traditional Chinese fonts in PDF, cross-page relationship hints, and print preview.
- **Local by default:** No account is required. Documents stay in local files or browser storage. The app has no ads or telemetry.
- **Portable output:** Native `.openmind` files, Markdown, OPML, a documented FreeMind subset, and SVG/PNG image export.
- **Bilingual interface:** Switching the interface language does not change document text or printed content.

## Updates

Download updates to this preview manually from [GitHub Releases](https://github.com/nashwu0117/OpenMind/releases), and save a separate `.openmind` backup before upgrading. The desktop app includes a manual update check, but the update service ignores prereleases. The full download, signature verification, installation, and restart flow still needs end-to-end validation on a Developer ID-signed public release.

## Run from source

Requires Node.js 24 LTS (or a newer version compatible with Vite 8) and npm. Installing dependencies and the Electron runtime for the first time requires a network connection; editing and printing work offline afterward.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5187` in your browser. To run the desktop app:

```sh
npm run desktop
```

## Tests

```sh
npm test
npm run test:updater
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:desktop
```

See the [test plan](docs/TEST_PLAN.md) and [print engine notes](docs/PRINT_ENGINE.md) for PDF, font, and layout verification.

## Documentation and limits

[Product spec](docs/PRODUCT_SPEC.md) · [Architecture](docs/ARCHITECTURE.md) · [Format compatibility](docs/FORMAT_COMPATIBILITY.md) · [Release readiness](docs/RELEASE_READINESS.en.md) · [Known limitations](docs/KNOWN_LIMITATIONS.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [macOS release and updates](docs/RELEASING.en.md)

OpenMind does not currently support `.xmind`, Office documents, collaboration, or AI services. FreeMind support is limited to the subset documented in the [format compatibility notes](docs/FORMAT_COMPATIBILITY.md). Review the [known limitations](docs/KNOWN_LIMITATIONS.md) before relying on a specific workflow.
