# OpenMind implementation plan

## Completion condition for this delivery
Ship a runnable offline editor with safe native files, transactional history, SVG layout, and a real print planning/preview/PDF path. Verify core workflow, CJK PDF text/page geometry, and 10/50/200/1000-node layout fixtures. Record advanced parity gaps explicitly; this delivery does not claim full XMind parity.

## Phases
1. Audit, empty-repository checkpoint, official feature research — in_progress
2. Specifications, parity matrix, architecture and test strategy — pending
3. Working editor, persistence, imports/exports and desktop wrapper — pending
4. Print planner, preview, readable pagination, poster and PDF — pending
5. Automated tests, real browser/desktop checks, repairs and handoff — pending

## Decisions
- Empty directory, no original HEAD or files. Create Git initial checkpoint and backup branch before implementation.
- Node 24 available; Rust/cargo unavailable. React + strict TypeScript + Vite + SVG + Electron offers offline desktop delivery and Chromium vector PDF without a Rust prerequisite.
- UI language Traditional Chinese. No accounts, analytics, paid API or network requirement for editing.
- Visual direction: quiet cool-white drafting workspace, ink blue, teal branch accents; paper preview is the signature tool.

## Errors encountered
- Initial git status: not a repository; expected for empty project, initialize safely.
- cargo unavailable; choose Electron and document architecture tradeoff.

## Next Step
Initialize checkpoint and record official research before implementation.
