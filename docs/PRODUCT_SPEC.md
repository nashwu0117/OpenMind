# OpenMind 0.1 product specification

Baseline: 2026-10-20, Pacific/Auckland. Audience: people who need private, editable mind maps and legible printed documents. Core software is free, offline, without accounts, telemetry, ads, watermarks or remote APIs. Documents belong to their authors.

## Delivery contract
This initial release implements a complete local editing/print slice, not full XMind parity. Each advanced capability has a separate status in FEATURE_PARITY_MATRIX.md. No inactive AI/collaboration buttons are presented as features.

Core acceptance: create/edit/reparent/reorder, multiline Traditional Chinese, style, undo/redo, atomic native save, reopen, recovery, multi-sheet, outliner, search, focus; shared SVG layout; paper preview; computed readability; selectable/searchable Chromium PDF; import/export round trips. Tests must prove the actual shipped behavior.

## Defaults and limits
- Traditional Chinese interface, system UI/CJK fonts, cool-white drafting canvas with blue/teal branch palette. Print studio is a first-class workspace with actual paper geometry.
- Native .openmind JSON v1 is the lossless interchange. Unknown fields/versions are rejected without modifying the source, not silently removed. Markdown/OPML are hierarchy-only with explicit warnings.
- Max native input 20 MB, 10,000 nodes, 128 levels, 50 sheets; per-topic text 20,000 characters; raster image 2 MB. Initial performance target is 1,000 nodes.
- Minimum print size target 10 pt; single-page mode remains available with calculated warning. Poster mode deliberately slices with overlap and visible assembly coordinates. Readability mode reflows into indented cards with parent context.
- No promise of physical printer support for every paper. PDF dimensions are controlled; printer margins and font availability remain platform-dependent.

## Planned optional capabilities
AI requires explicit per-request data consent and replaceable provider, with no network activity by default. Collaboration requires a separate authenticated server and CRDT protocol; no unsafe file-overwrite synchronization. Neither is enabled in this delivery.
