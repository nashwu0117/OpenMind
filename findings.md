# Findings

## Completion audit findings — 2026-10-20
Fresh baseline 425f887: 69 unit + 16 browser tests and strict build pass after restoring missing Playwright Chromium. Current official XMind feature/editing/advanced/platform pages were fetched again via Agent Reach/Jina on 2026-10-20.

Added failing tests proving 11 defects before repair: interrupted pending recovery loses the newest state; denied storage crashes startup; deleted/cross-sheet-pasted internal links dangle; copyBranch omits annotations/remapping; literal Markdown `<br>` corrupts text; native exporter can produce files its importer rejects (>20MB); duplicate annotation IDs are accepted; inspector drafts persist under another selection; IME Enter blurs during composition; toolbar Tab creates a topic. All 8 new unit cases and 3 E2E cases fail on the unchanged implementation.

Code gaps: Logic/Tree share geometry (different connector shape); Timeline/Org share both geometry and connectors. Brace/Fishbone/Matrix/Tree Table are absent. Current SVG/PNG omit embedded fonts; export also ignores temporary focused expansion. New local parity capabilities need schema-safe persistence and acceptance evidence, not only controls.

2026-10-20 (Pacific/Auckland): project directory empty; no applicable project AGENTS.md found, no original Git HEAD. Node 24.16.0/npm 11.13.0 available. Rust toolchain unavailable. No existing license to preserve.

Research sources and implementation evidence will be added as obtained.

Initial checkpoint: 146ef6e9dcb2fc6c3966148f7fd0336e95d77dd8 on main; backup/initial-2026-10-20; implementation feature/openmind-core. Original HEAD did not exist.

Official XMind features/user guide/topic editing/export/advanced/platform pages fetched through Agent Reach Jina on 2026-10-20. Nine structures; desktop mixed structures; Office/TextBundle exports; Gantt/Pitch/Outliner; web comments and several multimodal AI functions; official guide also lists callouts, audio notes, password, numbering, MCP/CLI/integrations. Recorded all groups in parity matrix.

Core + layout unit tests: initial 56 passed after NaN regression repair. Browser first pass 7/8; one test timing correction. Desktop smoke passed actual isolated bridge/native file roundtrip/keyboard editing/vector PDF. PDF content QA and package acceptance pending. Bundle built ~297 kB JS / 95 kB gzip; current small fixture is legible in rendered preview.

Packaging decision revised: remove electron-builder (known vulnerable transitive build dependencies); package the installed Electron runtime using project-owned Node fs + native ad-hoc signing, no network during packaging. This produces a host development app, not a notarized installer.

Phase 2 (2026-10-20): Fontsource Noto Sans TC 5.3.1 static 400/700 is unmodified OFL-1.1, matched against Google Fonts official metadata/OFL. Variable fonts loaded but still generated Type3 in Chromium; static fonts produce extractable Type0/TrueType bytes, OS/2 weights 400/700, and searchable Traditional Chinese. Local subsets are selected by actual used Unicode ranges, no external font requests.

Main-branch minimum readability sometimes requires explicit reflow for a deep ancestor path, so an honest greedy fallback is used rather than shrinking below 10pt. 1000 topics yield 135 branch pages, all 999 numbered descendants retained and actual minimum 10.2675pt. The 15-page relationship fixture resolves pages 4↔6 and index 15, including 30 PDF link annotations.

Chromium rejects a very long native data URL after fonts and 1000-node pages are embedded (ERR_INVALID_URL). Native printing now loads a mode-0600 temporary HTML file under a private directory and disposes files/hidden windows. Browser rendering was unaffected; only actual packaged native testing exposed the problem.
## Completion audit 0.3.0 — final findings
- Original11 red/green defects repaired; additional recovery/editor/resource/viewport issues bring the report to22 groups. The five required docs distinguish verified local subsets from absent full parity.
- IndexedDB solves the demonstrated8MB attachment recovery limit; .openmind v2 is lossless and v1 source-preserving. Browser storage clearing and concurrent windows remain separate risks.
- All nine structures retain10/50/200/1000 topics without automatic node overlap. Dedicated matrix layout is the slowest single sample (~43ms/1000 here); this is not an interaction benchmark.
- Actual native/browser rich11p, task13p and slides3p PDFs match content/page geometry and embed TC fonts. 1000-node branch output remains135p with all999 labels and10.2675pt minimum main topic.
- Physical printers, cross-OS, formal signing/notarization, full assistive-tech coverage, durable conflict/version protocols and unimplemented advanced converters/services prevent a public-stable-release claim.
