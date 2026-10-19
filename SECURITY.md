# Security policy

OpenMind 0.2 is a local development release. Do not send private documents, API keys, tokens or attachment contents in public reports. The project does not yet have a published private disclosure address; use your repository host's private vulnerability reporting when enabled, otherwise contact the repository owner privately before sharing a proof of concept.

Threat boundaries: untrusted .openmind/Markdown/OPML text, raster images, hyperlinks, local recovery and sandboxed renderer IPC. Import limits and strict fields prevent silent loss; no document content is executed. All file destinations come from native user dialogs. The app makes no remote calls during editing, export or printing. Package downloads happen only during development setup.

Native printing uses a private temporary directory containing a mode-0600 HTML file, with embedded font/image data and restrictive content policy. The file and hidden print window are removed after output or load failure. A process or OS crash can leave temporary files; avoid using public reports to share their contents.

Run `npm audit`, unit tests, browser workflows and desktop/PDF checks before releases. Keep Electron patched. Code signing/notarization and Windows/Linux verification remain release requirements. No claim of a comprehensive security audit is made.
