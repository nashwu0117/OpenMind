# Format compatibility

| Format | Import | Export | Preserved | Limitations / tests |
|---|---|---|---|---|
| OpenMind v1 JSON | Yes | Yes | All sheets/IDs/text/styles/tasks/images/links/notes/labels/relationships/boundaries | Strict version/unknown-field validation. Unit lossless roundtrip + browser/native file reopen |
| Markdown | Restricted list/headings | Yes | Active/focused sheet hierarchy + multiline text | Explicit warning; no styles, notes, links metadata, tasks, annotations, images or additional sheets. Arbitrary prose rejected. Unit + browser reimport |
| OPML 2 | Restricted outline/text attributes | Yes | Hierarchy + multiline Unicode | Extra elements/attributes and DOCTYPE rejected to avoid silent loss. Same limitations as Markdown. Browser roundtrip |
| SVG | No | Yes | Visible full/focused scene geometry, topic text/style/image, visible relationships/boundaries | Collapsed children excluded from image capture. Notes represented as icon, not full text. No external font embedding; system fallback |
| PNG | No | Yes | Rasterized scene | Max 12,000px edge / 40 million pixels. Uses local font rasterization; not editable |
| PDF | No | Yes | Expanded print scope with selected layout/physical pages/vector text | Native Electron output; browser uses print dialog. CJK searchable acceptance on macOS, Type3 vector glyph programs + Unicode mapping; other systems pending. No PDF import |
| XMind .xmind | No | No | — | No version/ZIP/XML compatibility claim; requires official-format feasibility/corpus/license review |
| FreeMind .mm | No | No | — | Candidate XML converter not implemented |
| TextBundle/DOCX/XLSX/PPTX | No | No | — | No empty/mock Office artifacts; converters not implemented |

Native unsupported versions/fields leave the source untouched; user receives an error. Native limits: 20MB, 10,000 nodes, 128 levels, 50 sheets. Markdown/OPML flatten multiple root topics under one center where needed; Markdown indentation jumps are normalized to the nearest valid parent. This behavior is explicit, not lossless native interchange.
