# OpenMind implementation plan

## Completion condition for this delivery
Ship a runnable offline editor with safe native files, transactional history, SVG layout, and a real print planning/preview/PDF path. Verify core workflow, CJK PDF text/page geometry, and 10/50/200/1000-node layout fixtures. Record advanced parity gaps explicitly; this delivery does not claim full XMind parity.

## Phases
1. Audit, empty-repository checkpoint, official feature research — complete
2. Specifications, parity matrix, architecture and test strategy — complete
3. Working editor, persistence, imports/exports and desktop wrapper — complete
4. Print planner, preview, readable pagination, poster and PDF — complete
5. Automated tests, real browser/desktop checks, repairs and handoff — complete

## Decisions
- Empty directory, no original HEAD or files. Create Git initial checkpoint and backup branch before implementation.
- Node 24 available; Rust/cargo unavailable. React + strict TypeScript + Vite + SVG + Electron offers offline desktop delivery and Chromium vector PDF without a Rust prerequisite.
- UI language Traditional Chinese. No accounts, analytics, paid API or network requirement for editing.
- Visual direction: quiet cool-white drafting workspace, ink blue, teal branch accents; paper preview is the signature tool.

## Errors encountered
- Initial git status: not a repository; expected for empty project, initialize safely.
- cargo unavailable; choose Electron and document architecture tradeoff.
- Sandbox Git writes/network/process/bind restrictions required approved native tool execution. No user files changed outside the project (QA tools in /tmp).
- Initial npm install stalled; stopped and used approved install. Port 5173 belonged to another project; selected 5187 without touching it.
- TypeScript Vite test config, empty CSS import and non-finite font validation fixed after failing checks.
- Drag E2E initially read recovery before debounce; wait now tolerates absent recovery and verifies actual reparent/cycle guard.
- Added failing regression for same-parent move index; corrected removal-index adjustment.
- electron-builder introduced known vulnerable dependencies (latest: moderate; suggested older: high/critical). Removed entirely; own host-runtime packager; audit returned zero vulnerabilities.
- PDF check initially expected FontFile; actual Chromium CJK is Type3 vector glyph programs. Revised QA to verify actual CharProcs streams + ToUnicode + extracted text; documented platform behavior.
- Packaging initially rewrote framework symlinks to absolute paths. Preserved verbatim relative symlinks; signature and packaged-app native smoke passed.
- Reproduced/fixed uncommitted draft save and outliner focus after undoing sheet creation with failing E2E first.
- Python preview comparison needed Pillow in isolated QA venv; installed there, comparisons passed.

## Next Step
Finish offline MathJax 4 SVG integration and wire the new local capabilities into real editor/task/presentation/format workflows, then exercise full browser and native acceptance.

## Phase 2 — print clarity and focus (2026-10-20)
Starting point: clean 5211d16f86c98d8ab7a4f8259591d2e2c6d3d8c1; backup/core-0.1-2026-10-20; feature/openmind-print-focus.

Completion condition: legally bundled TC font used offline by preview and embedded in PDF; bidirectional page references for relationships across pages; main branches auto-split without reducing main text below minimum; expandable focused print preview with zoom/navigation and editor branch preview-to-focus. Preserve v1 documents and existing workflows. Update screenshots/PDF fixtures, pass regression/build/desktop checks, and document genuine limits.

1. Research font provenance/OFL and inspect current print data flow — complete
2. Font loading/embedding and searchable PDF acceptance — complete
3. Branch-aware automatic pagination and page references — complete
4. Expandable focused editor and print preview with zoom/navigation — complete
5. Actual PDF/preview/desktop verification and handoff — complete

User clarified: both editor and print preview. Both implemented and verified, including temporarily revealing collapsed descendants without changing recovery data.

Phase-2 repairs: Jina 403 → official raw sources; variable Noto produced Type3 → static 400/700 verified Type0/TrueType; Vitest raw-CSS stub → real browser font checks; collapsed focus regression → view-only expansion; 1000-node native data-URL failure → private temporary HTML with cleanup. Final checks: 69 unit tests, 16 E2E, strict build/package, packaged native workflows, 183-page fixture corpus, 15-page relation PDF and 135-page 1000-node branch PDF. Detailed evidence: docs/PHASE2_VERIFICATION.md.

## Completion audit and feature parity — 2026-10-20
User supplied Completion & Feature Parity Master Prompt. Starting HEAD 425f887e453e3599b2872a0ce44942c2af3c13c2, clean; backup/print-focus-0.2-2026-10-20; feature/openmind-completion-audit.

Completion condition: audit real code and UI across all requested categories, repair all reproducible core defects, implement feasible missing local diagram/annotation/productivity capabilities with meaningful acceptance tests, verify persisted full data and supported format round trips, rerun actual PDF/preview/native checks, and produce the five requested audit/readiness documents. Advanced features must retain truthful per-feature statuses; no full-XMind or public-release claim without evidence. Publishing and external messaging are not authorized.

1. Safe checkpoint, current baseline and current official comparison — complete
2. Reproduce data/editor/recovery/layout/format/UI defects and write audit acceptance cases — complete
3. Repair P0/P1, add feasible local parity capabilities and regression tests — complete
4. Browser/native interaction, 10/50/200/1000-node and real PDF acceptance — complete
5. Complete audit matrix, limits, release readiness, versioned package and handoff — complete

Baseline: 69 unit tests and strict build passed. Missing Chromium headless shell 1248 was repaired; unchanged 16 baseline E2E passed. This environment failure was not counted as a product regression.

Final: schema v2 preserves v1 sources; 22 defect/reliability groups resolved. All scoped local capabilities wired and tested: nine structures, summaries, styles, attachments/stickers/vector equations, themes/templates, task/Gantt dependencies, presenter/PDF, FreeMind subset, embedded standalone graphics, view-only search, marquee and floating placement. Fresh 101 unit and 34 E2E pass; 36 layout cases, six rich/task/slide PDFs, 183-page print corpus and final packaged native 15/135-page checks pass. The five requested documents and 0.3.0 app are delivered. Matrix: 43 VERIFIED, 1 TESTED, 5 NOT STARTED, 1 BLOCKED. Full parity and public release remain unachieved for the explicit limitations in docs/RELEASE_READINESS.md; no publishing authorized or performed.

## Phase 3 — Release candidate quality and production readiness (2026-10-20)
Starting point: clean 60551fd01e9a43c6d8e06b32e65bbdb3326159d3; backup/openmind-0.3.0-before-rc-2026-10-20; release/openmind-rc-quality. Generated evidence stays in ignored artifacts/rc.

Completion condition: re-run and extend meaningful unit, browser, packaged desktop, PDF/preview, import/export, storage-recovery, performance/soak, dependency/privacy and install checks; reproduce and fix any data-loss or core workflow defects; build a properly named/iconed macOS RC with an installable artifact; update test/release docs with exact status per claim and platform limitations. Do not publish, claim physical printer/other OS/signing validation, or expand feature scope. Stop after evidence supports an honest release decision.

1. Preserve current source, run baseline suite/build and measure core behavior — complete
2. Review security boundaries and real user workflows; add reproducible edge-case evidence — complete with partial repository-wide security coverage explicitly recorded
3. Fix verified RC defects and measure justified performance changes — complete
4. Verify packaged PDF/preview, macOS candidate app, privacy/dependencies and release docs — complete within available macOS arm64 environment; installer and other platforms remain blocked
5. Run fresh acceptance gate and publish per-feature/platform status — complete; no public release performed

Baseline: 101/101 unit, 34/34 E2E, and production build passed. Final RC: 101/101 unit, 37/37 E2E, production build, packaged macOS arm64 app launch/save/print/second-instance smoke, PDF text/font/page-boundary checks, and 183-page print fixture verification passed. Reproduced and fixed stale multi-tab overwrite and bounded FreeMind rich-content parser complexity. Final 1000-node layout median 5.1 ms / p95 16.9 ms; import + first render 111.5 ms; IndexedDB restore 12.8 ms; 100-page PDF 63.7 ms; renderer JS heap sample 86.4 MB. No performance improvement is claimed over the baseline; these are single-machine samples.

Final security scan: Standard scan of immutable baseline `60551fd01e9a43c6d8e06b32e65bbdb3326159d3` completed with one low-severity CWE-400 FreeMind finding; the Phase 3 RC mitigation has a 50,001-element browser regression. Coverage remains partial (baseline auditor reviewed 40/92 inventoried files plus three focused surfaces). The generated report and limitations are recorded in the local Codex Security scan output and `docs/RELEASE_READINESS.md`.

Overall release decision: NOT READY. macOS candidate is ad-hoc signed without Developer ID/notarization or installer; no private security-report channel or repository remote exists; physical printer, assistive-tech and non-macOS acceptance remain unverified. The clean checkpoint branch preserves the starting source. No commit, push or publication was performed.

## macOS install and update delivery — 2026-10-20
- Implemented: signed/notarized DMG + update ZIP build scripts, arm64/x64 tag workflow (draft-only), manual Electron autoUpdater IPC/UI, targeted unit/E2E/desktop checks, and release credential/setup documentation.
- Verified locally: updater tests 4/4; overall unit tests 101/101; Chromium E2E 38/38; production build; npm audit 0 advisories; temporary macOS app launch/update-dialog/desktop smoke; temporary diskutil DMG mount and ZIP structure.
- Remaining release gate: identify and configure the public GitHub repository, add Apple Developer ID and Notary API secrets, execute a tag build, manually inspect and publish the draft, then test Gatekeeper and a real prior-version-to-current-version update on a clean Mac. Overall remains NOT READY until those external/hardware checks pass.
