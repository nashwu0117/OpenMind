# Test plan

Unit: tree cycle protection, reorder/delete cleanup, clipboard subtree copy, history transactions, malformed/unknown-version import, CJK/native style/task/image round trip, Markdown/OPML limitations, recovery failure/fallback.

Layout/print: 10/50/200/1000 node fixtures, CJK + long text, deep/wide/tall trees, annotation/image bounds, all supported structures, no node overlap, all supported paper sizes/directions, readable page coverage/minimum point size, branch/selection scopes, outline, poster overlap/order, monochrome, invalid geometry and resource limits. Print output independent of canvas zoom.

E2E: open app, create/edit keyboard topics, drag/reparent, style/history, save/download/reopen, recovery after refresh, sheet management, search/focus/outliner, print settings reflect preview, raster/vector exports, corrupt import preserves document, no console errors. Desktop smoke: packaged renderer, isolated bridge, PDF page count/dimensions/font/text extraction, native save round trip. Tests save evidence under artifacts/ and test-results/ (not committed).

PDF QA uses Chromium-generated PDF, text extraction and media boxes, plus rendered page screenshots. Physical printer output and other OS packages require separate platform acceptance; do not mark them verified based on macOS evidence.
