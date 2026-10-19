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
Hand off the verified 0.2 app and phase-2 report. Further parity work is a separate phase; physical-printer and cross-platform validation remain explicit limits.

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
