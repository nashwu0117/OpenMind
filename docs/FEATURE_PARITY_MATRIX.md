# Feature parity matrix

Research baseline: 2026-10-20 Pacific/Auckland. Official XMind sources fetched via Agent Reach/Jina, not inferred from memory:
[Features](https://xmind.com/features/), [User guide](https://xmind.com/user-guide/), [Files](https://xmind.com/user-guide/working-with-files), [Topic editing](https://xmind.com/user-guide/topic-editing-new), [Export](https://xmind.com/user-guide/export-new), [Advanced](https://xmind.com/user-guide/advanced-features), [Platform differences](https://xmind.com/help/feature-differences-across-platforms).

The official platform matrix distinguishes desktop customization/merging/Map Shot/SVG/Pitch PowerPoint/TextBundle, web comments and several web/mobile AI functions. Parity targets are cross-platform product capabilities, not a claim that XMind exposes every feature everywhere.

Allowed status: NOT STARTED / IN PROGRESS / IMPLEMENTED / TESTED / VERIFIED / BLOCKED. VERIFIED requires actual acceptance evidence. Final statuses reflect executed checks in VERIFICATION.md. VERIFIED applies to the stated OpenMind target and tested macOS/browser scope, not complete XMind parity. P0=core, P1=professional, P2=advanced. Test code references will be added when executed.

| Category | Feature | XMind public behavior | OpenMind target | Priority | Dependencies | Status | Automated test | Manual acceptance | Remaining gap |
|---|---|---|---|---|---|---|---|---|---|
| Editing | Root/child/sibling | Topic hierarchy | Stable IDs and reversible mutations | P0 | Model | VERIFIED | tests/core.test.ts; docs/VERIFICATION.md | Keyboard and reopen | Insert-parent command remains NOT STARTED |
| Editing | Insert parent | Insert parent topic | Reparent under a new inserted parent | P1 | Tree commands | NOT STARTED | — | Insert above selected topic | Command not implemented |
| Editing | Multiline/CJK text | Topic text formatting | Safe Unicode wrapped SVG text | P0 | Layout | VERIFIED | layout/e2e; docs/VERIFICATION.md | Mixed CJK PDF | See KNOWN_LIMITATIONS.md; acceptance scope in VERIFICATION.md |
| Editing | Copy/cut/paste/delete | Branch editing | Preserve subtree/styles | P0 | Model/history | VERIFIED | core/e2e; docs/VERIFICATION.md | Duplicate then undo | System clipboard rich data later |
| Editing | Drag/reorder/reparent | Adjust hierarchy | Cycle-safe drag and sibling order | P0 | Model | VERIFIED | core/e2e; docs/VERIFICATION.md | Drag to parent | See KNOWN_LIMITATIONS.md; acceptance scope in VERIFICATION.md |
| Editing | Multi-select/batch | Select topics | Shift selection, batch style/delete | P0 | Selection | VERIFIED | core/e2e; docs/VERIFICATION.md | Select and style | See KNOWN_LIMITATIONS.md; acceptance scope in VERIFICATION.md |
| Editing | Floating topics | Freely placed root topics | Movable detached subtrees | P1 | Layout | TESTED | tests/layout-print.test.ts | Drag floating topic | See KNOWN_LIMITATIONS.md; acceptance scope in VERIFICATION.md |
| Canvas | Pan/zoom/fit/center | Navigation | Bounded cursor zoom and fit | P0 | Scene | VERIFIED | e2e; docs/VERIFICATION.md | Pan and recover map | Touch gestures later |
| Canvas | Marquee/grid/smart guides | Alignment helpers | Marquee and alignment assistance | P1 | Selection | NOT STARTED | — | Marquee known nodes | No smart guidelines |
| Canvas | Read/Zen modes | Platform-specific modes | Read-only/focused view | P1 | UI | TESTED | e2e | Editing disabled | Zen later |
| History | Undo/redo | Reversible edits | Transaction snapshots | P0 | Model | VERIFIED | tests/core.test.ts; docs/VERIFICATION.md | Edit then undo/redo | See KNOWN_LIMITATIONS.md; acceptance scope in VERIFICATION.md |
| History | Autosave/recovery | File cache | Previous-copy recovery, honest errors | P0 | Storage | VERIFIED | storage/e2e; docs/VERIFICATION.md | Refresh and restore | See KNOWN_LIMITATIONS.md; acceptance scope in VERIFICATION.md |
| History | Version history/change tracking | Version workflows | Durable revisions | P2 | Persistence | NOT STARTED | — | Restore older revision | Undo is not version history |
| Files | New/open/save/save as | Local files | Native dialogs/atomic save | P0 | Desktop | VERIFIED | desktop/e2e; docs/VERIFICATION.md | Reopen exact document | See KNOWN_LIMITATIONS.md; acceptance scope in VERIFICATION.md |
| Files | Recent/multiple documents | Workspace | Local library of eight documents | P1 | Storage | TESTED | Browser workspace flow + persistence | Reopen older document | No durable version archive |
| Files | Multiple sheets/rename/duplicate | Sheet management | Lossless multi-sheet workbook | P1 | Model | VERIFIED | core/e2e; docs/VERIFICATION.md | Duplicate and reopen | See KNOWN_LIMITATIONS.md; acceptance scope in VERIFICATION.md |
| Files | Merge/save sheet as | Desktop merge/export sheet | Explicit merge with IDs remapped | P1 | Import | NOT STARTED | — | Merge overlapping IDs | Pending |
| Structure | Mind map | Two-sided branches | Balanced two-sided layout | P0 | Layout | VERIFIED | tests/layout-print.test.ts; docs/VERIFICATION.md | No overlap | See KNOWN_LIMITATIONS.md; acceptance scope in VERIFICATION.md |
| Structure | Logic chart | Directional hierarchy | Rightward tree | P1 | Layout | TESTED | tests/layout-print.test.ts | Deep/wide tree | Left orientation later |
| Structure | Tree chart | Hierarchical chart | Orthogonal horizontal tree | P1 | Layout | TESTED | tests/layout-print.test.ts | Correct connectors | Mixed structure later |
| Structure | Organization chart | Org hierarchy | Top-down layout | P1 | Layout | TESTED | tests/layout-print.test.ts | Sibling spacing | See KNOWN_LIMITATIONS.md; acceptance scope in VERIFICATION.md |
| Structure | Timeline | Sequential chart | Ordered main branch spine | P1 | Layout | TESTED | tests/layout-print.test.ts | Chronological ordering by topic | Date scale later |
| Structure | Brace map | Brace hierarchy | Dedicated brace geometry | P1 | Layout | NOT STARTED | — | Brace encompasses descendants | Pending |
| Structure | Fishbone | Cause/effect diagram | Alternating angled causes | P1 | Layout | NOT STARTED | — | Branch angle/labels | Pending |
| Structure | Matrix | Grid information | Real row/column semantics | P1 | Model/layout | NOT STARTED | — | Resize matrix | Pending |
| Structure | Tree table | Hierarchical table | Hierarchy with aligned columns | P1 | Model/layout | NOT STARTED | — | Table cells and export | Pending |
| Structure | Mixed structures | Desktop branch structure | Per-branch strategy | P2 | Layout | NOT STARTED | — | Move between strategies | Pending |
| Annotation | Relationship | Labeled connection | Directed/dashed labeled line | P1 | Scene | TESTED | core/layout | Move/delete endpoints | Label/arrow/line properties persisted; editing direction/curve controls pending |
| Annotation | Boundary | Enclose branch | Anchored descendant bounds | P1 | Scene | TESTED | tests/layout-print.test.ts | Collapse/move/delete | Multi-sibling groups later |
| Annotation | Summary/callout | Anchored summaries | Summary tied to selected range | P1 | Scene | NOT STARTED | — | Reorder retains anchor | Pending |
| Annotation | Notes/labels | Enrich topics | Persist searchable text | P1 | Model | VERIFIED | formats/e2e; docs/VERIFICATION.md | Save/reopen | Rich text later |
| Annotation | Topic/web links | Navigate resource/topic | Safe URLs and internal links | P1 | Model | VERIFIED | tests/core.test.ts; docs/VERIFICATION.md | Navigate link | Local file links later |
| Annotation | Markers/icons/stickers | Visual identification | Unicode markers | P1 | Fonts | TESTED | formats | SVG/PDF | Sticker catalog later |
| Annotation | Local images | Embed image | Inline raster image | P1 | Scene | TESTED | formats/print | Reopen/export image | Captions/cropping later |
| Annotation | Attachments/audio notes | Embedded files/recording | Safe embedded media | P2 | Storage | NOT STARTED | — | Save/open file safely | Pending |
| Annotation | Equations | LaTeX math/chemistry | Accessible vector math | P2 | Renderer | NOT STARTED | — | CJK/math PDF | Pending |
| Style | Shapes/fills/borders/fonts | Topic formatting | Persist shape/color/size/emphasis | P0 | Model/scene | TESTED | formats/e2e | Roundtrip and PDF | Fixed system font family; opacity/alignment not implemented |
| Style | Theme palettes/background | Color theme | Built-in palettes and canvas color | P1 | Style | TESTED | formats | Theme undo and export | Custom theme library later |
| Style | Line/spacing/direction | Branch formatting | Adjustable line geometry/spacing | P1 | Layout | NOT STARTED | — | Dense tree print | Pending |
| Style | Light/dark | App appearance | Theme toggle | P1 | UI | TESTED | e2e | Contrast and focus | Full accessibility audit later |
| Templates | Built-in/personal | Reuse maps | Built-in editable starter maps | P1 | Files | TESTED | tests/core.test.ts | Create and edit template | Personal templates later |
| Productivity | Outliner | Same map as outline | Editable shared hierarchy | P0 | Model | VERIFIED | e2e; docs/VERIFICATION.md | Edit and switch views | See KNOWN_LIMITATIONS.md; acceptance scope in VERIFICATION.md |
| Productivity | Search/find/replace | Text search | Text/notes/label search and locate | P0 | Model | VERIFIED | e2e; docs/VERIFICATION.md | Hidden branch search | Replace/filter markers later |
| Productivity | Focus/fold | Drill-down/navigation | Focus branch and return | P0 | Layout | VERIFIED | e2e; docs/VERIFICATION.md | Focus and print scope | See KNOWN_LIMITATIONS.md; acceptance scope in VERIFICATION.md |
| Productivity | Pitch/presentation | Slides from map | Sequential presentation | P1 | Model | NOT STARTED | — | Play/navigate/export | Pending |
| Tasks | To-do/status/dates | Track tasks | Status/start/due fields | P1 | Model | VERIFIED | core/formats; docs/VERIFICATION.md | Reopen dates | Dependencies later |
| Tasks | Gantt/work calendar | Date scheduling | Timezone/calendar-aware scheduling | P2 | Task graph | NOT STARTED | — | DST/holiday/dependency | Pending |
| Capture | Map Shot | Desktop share image | Whole/focus SVG/PNG | P1 | Scene | TESTED | e2e | Image pixels/content | Arbitrary region later |
| Import | Native | Native workbook | Lossless strict v1 JSON | P0 | Validation | VERIFIED | formats; docs/VERIFICATION.md | Reopen all fields | Future-version migration later |
| Import | Markdown/OPML | Structured import | Hierarchy conversion with warnings | P1 | Validation | VERIFIED | formats; docs/VERIFICATION.md | CJK/special chars | Nonhierarchical fields not converted |
| Import | XMind/FreeMind | External formats | Tested format-version conversion | P1 | ZIP/XML | NOT STARTED | — | Corpus and loss reports | No compatibility claim |
| Import | TextBundle/DOCX/other | Document import | Explicit tested converters | P2 | Parsers | NOT STARTED | — | Embedded-media corpus | Pending |
| Export | Native/SVG/PNG | Local/vector/raster | Real document/vector/raster | P0 | Scene | VERIFIED | formats/e2e; docs/VERIFICATION.md | Reopen and inspect | Raster size cap |
| Export | Markdown/OPML | Hierarchy export | Honest lossy conversion | P1 | Formats | VERIFIED | formats; docs/VERIFICATION.md | Warning then reimport | Notes/styles not preserved |
| Export | PDF | Map/outliner/pitch PDF | Vector text and physical geometry | P0 | Print/desktop | VERIFIED | desktop/pdf; docs/PHASE2_VERIFICATION.md | Embedded TC TrueType/text/pages | Pitch later; uncommon glyph fallback |
| Export | DOCX/XLSX/PPTX/TextBundle | Office/bundle export | Real interoperable files | P2 | Converters | NOT STARTED | — | Open in target apps | Pending |
| Print | Preview/paper/orientation | Print UI | Actual page layout preview | P0 | Print | VERIFIED | print/e2e; docs/VERIFICATION.md | Change settings | Printer hardware untested |
| Print | Single page | Fit map | Computed minimum text warning | P0 | Print | VERIFIED | print; docs/VERIFICATION.md | Large map warning | User may override |
| Print | Readable multi-page | Product target | Reflow cards at minimum pt | P0 | Print | VERIFIED | print; docs/VERIFICATION.md | No clipped text | Map geometry intentionally reflowed |
| Print | Poster | Product target | Overlap/cut marks/assembly grid | P0 | Print | VERIFIED | print; docs/VERIFICATION.md | Page order and joins | Node cuts intentional in poster |
| Print | Branch/selection/outline | Scoped output | Explicit subtree/outline pages | P0 | Print | VERIFIED | print/e2e; docs/PHASE2_VERIFICATION.md | Every selected descendant | Selection fit may warn |
| Print | Main-branch automatic pagination | OpenMind target | Connected partitions at minimum topic size, ancestor context and continuations | P0 | Pagination | VERIFIED | print-next/e2e; docs/PHASE2_VERIFICATION.md | 10/50/200/1000-node coverage and geometry | Oversized paths use explicit readable reflow |
| Print | Cross-page relationships | OpenMind target | Bidirectional page hints, clickable destinations and complete label index | P0 | Page references | VERIFIED | print-next/e2e/PDF; docs/PHASE2_VERIFICATION.md | Both endpoints and PDF link destinations | Names abbreviated in index; labels retained |
| Print | Offline Traditional Chinese fonts | OpenMind target | OFL static 400/700 fonts embedded as Type0/TrueType | P0 | Font subsets | VERIFIED | actual PDF font programs; docs/PHASE2_VERIFICATION.md | Font bytes/OS2 weights/searchable CJK | Rare glyph fallback; standalone SVG/PNG pending |
| Focus | Expandable editor/print preview | OpenMind target | Preview branch then focused editing; focused zoomable paper preview | P1 | View state | VERIFIED | print-focus E2E; docs/PHASE2_VERIFICATION.md | Collapsed branch, no document mutation, Escape, zoom/navigation | Focus state is session-local |
| Print | Margins/header/footer/BW | Paper controls | Physical settings and page numbering | P0 | Print | VERIFIED | print/pdf; docs/VERIFICATION.md | Compare preview/PDF | See KNOWN_LIMITATIONS.md; acceptance scope in VERIFICATION.md |
| AI | Text/prompt/expand/summarize | Create/Grow AI | Optional replaceable provider | P2 | Consent/provider | NOT STARTED | — | Actual inference | No configured model |
| AI | Reorganize/explain/work breakdown | Web/AI tools | Previewable document operations | P2 | Provider | NOT STARTED | — | Accept/undo changes | Pending |
| AI | Image/document/record/draw to map | Platform-specific multimodal | Explicit consent pipeline | P2 | Media/provider | NOT STARTED | — | Real source extraction | Pending |
| AI | Pitch video/make image/remove BG | Web/mobile features | Optional media adapters | P2 | Provider | NOT STARTED | — | Actual generated media | Pending |
| Collaboration | Share/comment/live editing | Web collaboration | Opt-in authenticated CRDT | P2 | Server/auth | NOT STARTED | — | Concurrent edits and ACL | No server deployed |
| Collaboration | Self-host/conflicts/history | Product target | Consistent versioned synchronization | P2 | Protocol | NOT STARTED | — | Offline/rejoin conflicts | Pending |
| Integrations | Web clip/MCP/CLI/ChatGPT | Official integrations | Optional import adapters | P2 | Stable API | NOT STARTED | — | Import provenance | Pending |
| Platform | macOS/Windows/Linux/mobile/web | Platform differences | Desktop first, browser companion | P1 | Packaging | TESTED | desktop | Run packaged app | Windows/Linux/mobile unverified |
| Advanced | Password/numbering/quick entry | Additional guide features | Encrypted files/numbering/OS capture | P2 | Files/OS | NOT STARTED | — | Recovery and platform checks | Pending |
