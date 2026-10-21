# OpenMind 0.3.1 RC — Release Readiness

Acceptance date: 2026-10-20. Target: local macOS arm64 candidate and public source snapshot. Local Git history, work branches, and generated artifacts are excluded from the public source snapshot.

## Release decision: NOT READY

Core editing, offline storage, import/export, and print acceptance passed in the recorded RC checks. The security source review covered document validation/storage, import/export, Electron IPC, printing, updater, and release automation; it was not a full repository security audit. A `v*` tag ruleset is enabled and Actions defaults to read-only permissions. The signing job's `release` Environment prevents self-review, but currently has only one reviewer; a second trusted maintainer is needed. Apple credentials are absent, and the signed/notarized macOS release runner, notarized download, and real update round trip have not been verified. Physical printers, Windows, Linux, and architectures other than arm64/x64 have not been tested.

## Feature status

| Capability | Status | Evidence and limits |
|---|---|---|
| Create, edit, move, delete, multi-select, clipboard, undo/redo | VERIFIED | Latest run: 104 unit tests and 40 Chromium E2E checks, including IME, drag/drop, corrupt imports, and recovery. |
| Local storage, IndexedDB recovery, native-file round trip | VERIFIED | Reload at 1,000 topics, browser E2E open/save round trip, and a packaged Electron install smoke test. Browser recovery remains subject to storage quota and clearing browser data. |
| Nine structures, tasks, presentation, SVG/PNG, Markdown/OPML/FreeMind subset | VERIFIED | Direct E2E use and round-trip checks; see the format compatibility matrix for FreeMind limits. |
| Multiple-window data protection | VERIFIED | Chromium confirms waiting tabs are read-only and reload the latest document on handoff. Environments without Web Locks fail closed to read-only. Electron focuses its existing window on a second launch. |
| FreeMind hostile-structure limits | VERIFIED | Browser regression rejects 50,001 rich-content elements; the separate topic-count limit remains active. |
| Traditional Chinese fonts and searchable PDF text | VERIFIED | Browser and native PDFs extract Traditional Chinese. Noto Sans TC is embedded as Type0/TrueType and glyph boxes stay inside the page. |
| Fit-to-page, readable, branch, poster, selected, outline, and monochrome printing | VERIFIED | Seven generated PDFs / 183 pages checked for page count, paper, labels, fonts, and glyph bounds. Selected-branch fit-to-page measured 6.57 pt and displays a warning. |
| Preview/PDF agreement | VERIFIED | Fifteen-page browser sample checked on pages 1, 4, 6, and 15; maximum average pixel difference was 0.73/255 and changed pixels stayed under 0.6%. Seven fixture comparisons also passed. |
| Large-map printing | VERIFIED | A 1,000-topic browser outline produced 100 pages; packaged Electron main-branch print produced 135. Both contained all 999 labels; minimum body text measured 10.49 pt and 10.27 pt, with glyphs within page bounds. |
| 1,000-topic performance | VERIFIED | One local Chromium sample: layout median 5.1 ms / p95 16.9 ms; import plus first render 111 ms; IndexedDB restore 12.8 ms; reload/render 135 ms; 100-page PDF 64 ms. Zoom was about 58 ms, pan about 72 ms across two frames, and one renderer heap sample was 86.4 MB. These measurements do not predict other hardware or long-running peaks. |
| macOS arm64 bundle and icon | VERIFIED | A 322 MB arm64 `OpenMind.app` with a 1024×1024 ICNS was copied to an isolated OS temporary folder and launched there; save, print, and relaunch passed. Signature is ad hoc. |
| Dependency advisories and license notices | VERIFIED | At the recorded query, `npm audit` found zero advisories across 103 packages. `npm run licenses` generated 103 package entries and 23 runtime license texts. Registry results can change. |
| Security source review and FreeMind fix | TESTED | A standard scan of the immutable baseline found one LOW / MEDIUM-confidence CWE-400 candidate. A bounded traversal and limits of 50,000 elements / 256 levels were added; the 50,001-element E2E regression passed. Coverage was partial (40/92 baseline files plus three focused areas), not a full audit. |
| GitHub quality workflow | VERIFIED | [Run 39386630070](https://github.com/nashwu0117/OpenMind/actions/runs/39386630070) on commit `d2d494d` completed successfully: npm audit, Vitest, updater tests, production build, and Chromium E2E. GitHub Actions reported a Node.js 20 deprecation warning; the run succeeded. |
| Bilingual interface and public guides | VERIFIED | Traditional Chinese and English UI, local preference, macOS menu and updater status, localized print pages, and paired user/contributor/security/release guides passed unit, Chromium, and Electron checks. User-authored map data remains unchanged. |
| Signed macOS Release workflow | IMPLEMENTED | `.github/workflows/release-macos.yml` creates a draft only and requires Apple secrets plus real GitHub-runner artifact acceptance. |
| In-app manual updater | IMPLEMENTED | Four updater state unit tests, one Chromium UI E2E, and Electron smoke checks for English status/menu passed. A packaged app correctly reports an unconfigured source. No published ZIP update round trip has been tested. |
| Screen readers, full assistive-tech support, touch, full high-contrast mode | IN PROGRESS | Keyboard and dark mode have E2E coverage; complete screen-reader and device tests remain open. |
| Developer ID, notarization, DMG, clean-machine install/update | BLOCKED | Release scripts are prepared, but signing identity, Notary secrets, and a clean-user test environment are missing. The local build is ad hoc signed. |
| Physical printers, Windows, Linux, other architectures | BLOCKED | No matching hardware or OS acceptance environment is available; do not claim release support. |
| XMind, Office, AI, collaboration, full work calendar, permanent version history | NOT STARTED or subset only | Outside this RC. Do not claim full feature parity or complete format compatibility. |

## Recorded commands and artifacts

| Check | Recorded result |
|---|---|
| `npm test -- --reporter=dot` | 8 files, 104/104 tests passed, including UI/print translation coverage and English PDF index labels. |
| `OPENMIND_TEST_PORT=5203 npm run test:e2e -- --reporter=line` | 40/40 Chromium E2E passed, including locale persistence, English print output, and the search shortcut regression. |
| `npm run package` | Produced a local ad-hoc-signed macOS arm64 app; not a notarized installer. |
| `npm run test:updater` | 4/4 passed, covering architecture feed, manual check, download state, install gate, and error privacy. |
| `npm run test:desktop` | Electron sandbox/IPC, English native update menu/status, native file round trip, print preview, and PDF export passed in an isolated QA directory. |
| `npm run build` | Passed; Vite reports a 1.77 MB main JavaScript chunk (about 619 KB gzip) warning. |
| `npm audit --audit-level=high` | Zero vulnerabilities at the recorded registry query. |
| Packaged desktop and print smoke | Sandboxed Electron launch, single-instance guard, native open/save, real PDF output, 15-page cross-page PDF, 135-page / 1,000-topic PDF, error feedback, and temporary-file cleanup passed. |
| DMG/ZIP structure check | A temporary ad-hoc DMG mounted read-only with the app and Applications link; ZIP contained the app bundle. This does not validate Gatekeeper or notarization. |

The 1.77 MB main JS bundle remains a known Vite chunk warning. The recorded 1,000-topic measurements did not show an editing bottleneck, so no code-splitting tradeoff was made in that RC pass.

PDFs, comparison images, performance JSON, and test traces are local generated artifacts and are excluded from the public repository. This report keeps only acceptance summaries, not test documents or local paths.

## Candidate and required release work

The local app uses an ad-hoc signature, not a notarized public installer. GitHub Releases has no generally downloadable installer yet. Before release:

1. Add a second trusted maintainer to the `release` Environment. Keep signing/notary credentials in that Environment and preserve the `v*` tag ruleset.
2. Configure Developer ID and Notary secrets, push a version tag, inspect both arm64 and x64 draft artifacts, and test Gatekeeper, download, install, real update, uninstall, and recovery on a clean Mac before manually publishing.
3. Inspect trim, color, and poster joins on physical A4 and poster printers, and test installation/PDF acceptance on each promised platform.
4. Complete screen-reader, full keyboard, high-contrast, touch, full-disk, and storage-denial tests.

This report does not claim full XMind compatibility or support for every platform. Historical 0.3.0 evidence is in the [completion audit](COMPLETION_AUDIT.md) and [feature matrix](FEATURE_PARITY_MATRIX.md); see [bugs and limitations](BUGS_AND_LIMITATIONS.md).
