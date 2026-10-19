# Print engine

Shared data flow: versioned sheet → deterministic scene → physical print plan → page SVG → preview and HTML → Chromium PDF/print. Canvas zoom/pan is never an input to export. 96 CSS px/in; PDF 72 pt/in; 25.4mm/in. Paper page CSS controls output dimensions.

## Strategies
- Single fit: scale full scene to content bounds, center it. Main-topic minimum point estimate is actual SVG font size × scale × .75. Below target produces an explicit computed warning; user can override by exporting.
- Readable: depth-first semantic reflow into indented cards with parent context. Main topic text is at least the requested point size. No topic box crosses a page. Exceptionally long text continues as multiple cards. Relationships are preserved as numbered page references and an index; spatial boundary geometry is not preserved.
- Poster: row-major tiles of the original map, scale at least 1 and sufficient for minimum topic font. Overlap 0–30mm, dashed assembly boundary, row/column labels and cut-node IDs. Crossing a node is intentional here. Assemble left-to-right then top-to-bottom using the overlap.
- Main branches: separate center page, then automatically partition each main/floating subtree into connected chunks at the minimum main-topic point size. Ancestors may repeat as tinted context; primary topic ownership remains unique. If one ancestor path or one node cannot fit, explicitly reflow that branch. Per-branch previous/next links retain continuity. This is a greedy readable partition, not a globally minimal-page solution.
- Selection: the selected topic and every descendant, including collapsed topics.
- Outline: same no-clipping pagination with text hierarchy, no original spatial connectors.

A4/A3/A2/Letter/Legal and 60–1200mm custom paper; orientation, margins, header/footer, page count, background and monochrome (including raster images). Preview shows actual scale, count, physical dimensions, warning, printable-area guides and current page. Guides are preview-only. Minimum refers to primary topic text: footer/header, parenthetical metadata and labels may be smaller. Print resource cap 500 pages. Large poster jobs may need smaller scope.

## Fonts and geometry
Preview uses locally bundled Noto Sans TC 400/700 static WOFF2, provided unmodified by Fontsource 5.3.1 under SIL OFL-1.1. Output preparation selects matching Unicode subsets and embeds their font programs once in the HTML head using data URLs. No font service or remote call is required. Verified PDF output is Type0/TrueType, with extractable font bytes and 400/700 OS/2 weight classes; searchable CJK and page geometry are checked in both browser and packaged Electron output. The earlier variable-font experiment still emitted Type3; the shipped static fonts avoid that issue.

Electron loads the complete HTML from a private temporary file rather than putting the document in a data URL. A 1000-node branch plan exceeded Chromium's URL limit before this repair. The native path now exports all 135 pages and removes the temporary file/directory and hidden print window when done; output errors are surfaced and cleaned up too.

Only the font's supported glyph coverage is guaranteed; uncommon characters and emoji can use system fallback. Standalone SVG/PNG do not yet embed the same font payload. Font wrapping remains a conservative Unicode width estimate rather than a full shaping engine. Cross-platform/physical-printer calibration and PDF/A remain separate acceptance work.

## Cross-page references and focus
Every derived page records primary topic IDs, repeated context IDs and actual destination page numbers. Cross-page relationships retain their R number and direction at both endpoints. An appended, paginated index preserves complete relation labels when the page footer cannot hold them. The preview supports direct jumps from these references; generated PDF link annotations target the same pages. Large branches have B-numbered previous/next continuation hints. The reference area is reserved before layout, so hints do not cover node content.

PrintPreview is a separate zoomable viewer. Focus hides settings; fit/100%/zoom/page selection change viewport state only. The printable-area guide is preview-only and omitted from output. QA compares actual UI SVG DOM (with that guide removed) against PDF rendering for center, source, destination and index pages.

Text wrapping uses conservative Unicode width estimation, not pixel-perfect shaping. Node geometry and text wrapping are shared by editor/exports. Font fallback, complex scripts, ligatures and custom font behavior require more testing. Whole-image/long-rich annotation PDF regression coverage should be expanded before production release. Physical printer feeding/margins and color accuracy require real hardware QA.
