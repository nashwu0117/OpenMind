# Architecture

React 19 + strict TypeScript + Vite, SVG vector scene, Electron 44 desktop shell. Cargo was unavailable at audit; Electron's bundled Chromium also provides vector, searchable CJK PDF. The tradeoff is a larger app than a Tauri shell. No external runtime is needed after packaging.

| Boundary | Responsibility |
|---|---|
| src/core/model.ts | Versioned, UI-independent workbook/sheet/topic/style/annotation/task schema; tree mutations; strict import validation |
| src/core/history.ts | Bounded immutable transaction snapshots, redo invalidation |
| src/core/storage.ts | Local crash recovery with previous/pending copies; failures surfaced |
| src/engine/layout.ts | Deterministic measurement/wrapping, branch layout and global bounds |
| src/engine/svg.ts | Escaped vector scene shared by canvas/SVG/PNG/print |
| src/engine/print.ts | Physical units, pagination, readability, page scenes and HTML |
| src/io/formats.ts | Native, Markdown and OPML trust boundaries and conversion warnings |
| src/ui | Editor interaction, inspector, outliner, workspace and print studio |
| electron | Sandboxed isolated renderer, bounded native dialogs, atomic file replacement, PDF |

Editor state: workbook + selected IDs + viewport + active tool. Only document edits enter undo history. One text edit commits on blur/confirmation rather than each keystroke. Selection is reconciled after undo/delete/sheet changes. Layout is derived; viewport is never serialized into exports.

Security: no remote renderer, nodeIntegration disabled, contextIsolation + sandbox enabled. IPC only accepts bounded typed payloads; file paths come from native dialogs, not documents. Images restricted to embedded raster data. XML/HTML content escaped, OPML doctype rejected, links restricted to http/https/mailto/openmind. New windows/navigation denied. No telemetry.

Planned module boundaries: presentation and task scheduling operate on the same sheet model; AI provider (generate/expand/explain + explicit payload consent), collaboration adapter (CRDT transactions, auth/ACL, encrypted transport) remain unimplemented until proper end-to-end verification. No unused mock service ships.
