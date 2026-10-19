# Progress

## Phase 2 — 2026-10-20
- User prioritized redistributable TC font embedding, cross-page relationship hints and automatic main-branch pagination, plus an expandable focused preview.
- Inspected clean 0.1 checkpoint and current print layout/preview implementation. Created backup/core-0.1-2026-10-20 and feature/openmind-print-focus.
- Agent Reach Jina requests to GitHub tree pages returned 403; using official raw font metadata/license sources as fallback, without repeating the failed route.
- User requested focused preview for both editor and print. Implemented branch preview→editable focus, F9/Escape, temporary expansion of collapsed descendants, and synchronized outliner; recovery JSON remains unchanged for view-only actions.
- Bundled unmodified OFL Noto Sans TC 5.3.1 static 400/700 fonts, lazy Unicode subset embedding. Actual browser and packaged PDF contain Type0/TrueType programs with confirmed OS/2 weights and searchable CJK.
- Implemented main-branch connected pagination, repeated ancestor context, readable fallback, bidirectional relationship and branch continuation hints, clickable PDF destinations and full relationship index.
- Added focused print viewer with zoom/fit/100%/page controls and keyboard navigation; actual UI SVG/PDF comparisons pass on center/source/target/index pages (mean difference 0.10–0.73/255).
- Fresh final checks: 69 unit tests, 16 browser E2E, strict build and 0.2 versioned macOS arm64 package pass. Packaged app core save/open/link checks and native font/relationship/focus flows pass.
- Actual PDF validation: seven fixtures total 183 pages; 80-node relation sample 15 pages with 26 embedded font programs and 30 internal links; 1000-node main branches 135 pages, all 999 numbered labels, measured minimum main font 10.2675pt, 17 font programs and no text overflow.
- Reproduced large native export ERR_INVALID_URL before repair; switched to private temporary HTML, avoiding Chromium data-URL limits. Verified success and injected output-failure cleanup, including no hidden windows; preserved older packages in backup directories. Full results and remaining limits in docs/PHASE2_VERIFICATION.md.

## 2026-10-20
- Read complete supplied master prompt and global instructions.
- Inspected empty directory, Git state, parent instructions and runtime availability.
- Defined a concrete runnable/core-print completion condition and truthful advanced-feature scope.
- Implemented typed workbook/tree/history/recovery, 5 layouts and shared SVG, desktop/native files, full editor/inspector/outliner/search/workspace and six print strategies.
- Recorded official XMind research in detailed parity matrix and honest format/feature limitations.
- Latest full unit suite: 59 passed; full E2E suite at final handoff: 13 tests. Native packaged smoke checks sandbox bridge, actual edit/save/reopen, external link dispatch, separate-document destinations and PDF.
- Generated and inspected PDF fixtures: 10 fit (1p), 50 branches (6p), 200 readable (25p), 1000 outline (91p), 200 poster (42p), selection (1p), annotation/image/task BW (1p). All page counts and text coverage validated.
- Verified searchable CJK, actual A4 dimensions, main-text size and embedded Type3 vector glyph programs/Unicode mappings. Seven first-page preview/PDF pixel comparisons passed (<0.6 mean difference on 0–255).
- Measured 1000-node browser layout (median ~5ms, p95 ~8.7ms), first import/render ~75ms, 0 text bounding-box overflow, search 999 located.
- Fixed real regressions with failing evidence first: non-finite font size, same-parent reorder index, uncommitted draft save, invalid outline focus after sheet undo. Corrected clipboard references, visible relation labels, native save destinations and framework symlinks.
- Removed electron-builder and its vulnerable toolchain; dependency audit 0 known vulnerabilities. Generated full third-party manifest and runtime license texts.
- macOS arm64 app packaged and ad-hoc signature verified; no notarization or cross-platform/physical-printer certification claimed.
