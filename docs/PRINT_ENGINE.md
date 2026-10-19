# Print engine

Shared data flow: versioned sheet → deterministic scene → physical print plan → page SVG → preview and HTML → Chromium PDF/print. Canvas zoom/pan is never an input to export. 96 CSS px/in; PDF 72 pt/in; 25.4mm/in. Paper page CSS controls output dimensions.

## Strategies
- Single fit: scale full scene to content bounds, center it. Main-topic minimum point estimate is actual SVG font size × scale × .75. Below target produces an explicit computed warning; user can override by exporting.
- Readable: depth-first semantic reflow into indented cards with parent context. Main topic text is at least the requested point size. No topic box crosses a page. Exceptionally long text continues as multiple cards. Does not preserve map geometry, relationships or boundaries; warnings explain omitted annotation geometry.
- Poster: row-major tiles of the original map, scale at least 1 and sufficient for minimum topic font. Overlap 0–30mm, dashed assembly boundary, row/column labels and cut-node IDs. Crossing a node is intentional here. Assemble left-to-right then top-to-bottom using the overlap.
- Main branches: separate center page then each main/floating subtree. Each subtree fits independently and may trigger the same readability warning.
- Selection: the selected topic and every descendant, including collapsed topics.
- Outline: same no-clipping pagination with text hierarchy, no original spatial connectors.

A4/A3/A2/Letter/Legal and 60–1200mm custom paper; orientation, margins, header/footer, page count, background and monochrome (including raster images). Preview shows actual scale, count, physical dimensions, warning, printable-area guides and current page. Guides are preview-only. Minimum refers to primary topic text: footer/header, parenthetical metadata and labels may be smaller. Print resource cap 500 pages. Large poster jobs may need smaller scope.

## Fonts and geometry
Unicode text uses local PingFang TC → Noto Sans CJK TC → Microsoft JhengHei → system fallback. No font binaries are redistributed. On this macOS/Chromium build, CJK appears as embedded Type3 vector glyph programs with ToUnicode mapping. QA checks those programs and extracts the actual Chinese text; a Type3 font does not expose a normal FontFile/TTF embedding flag. Cross-platform font consistency and archival PDF/A are not guaranteed. A bundled OFL CJK font is a valuable next improvement.

Text wrapping uses conservative Unicode width estimation, not pixel-perfect shaping. Node geometry and text wrapping are shared by editor/exports. Font fallback, complex scripts, ligatures and custom font behavior require more testing. Whole-image/long-rich annotation PDF regression coverage should be expanded before production release. Physical printer feeding/margins and color accuracy require real hardware QA.
