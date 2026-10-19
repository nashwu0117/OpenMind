# Findings

2026-10-20 (Pacific/Auckland): project directory empty; no applicable project AGENTS.md found, no original Git HEAD. Node 24.16.0/npm 11.13.0 available. Rust toolchain unavailable. No existing license to preserve.

Research sources and implementation evidence will be added as obtained.

Initial checkpoint: 146ef6e9dcb2fc6c3966148f7fd0336e95d77dd8 on main; backup/initial-2026-10-20; implementation feature/openmind-core. Original HEAD did not exist.

Official XMind features/user guide/topic editing/export/advanced/platform pages fetched through Agent Reach Jina on 2026-10-20. Nine structures; desktop mixed structures; Office/TextBundle exports; Gantt/Pitch/Outliner; web comments and several multimodal AI functions; official guide also lists callouts, audio notes, password, numbering, MCP/CLI/integrations. Recorded all groups in parity matrix.

Core + layout unit tests: initial 56 passed after NaN regression repair. Browser first pass 7/8; one test timing correction. Desktop smoke passed actual isolated bridge/native file roundtrip/keyboard editing/vector PDF. PDF content QA and package acceptance pending. Bundle built ~297 kB JS / 95 kB gzip; current small fixture is legible in rendered preview.

Packaging decision revised: remove electron-builder (known vulnerable transitive build dependencies); package the installed Electron runtime using project-owned Node fs + native ad-hoc signing, no network during packaging. This produces a host development app, not a notarized installer.
