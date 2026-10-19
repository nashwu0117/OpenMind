# Contributing

Use Node.js 24 LTS or a compatible current runtime, `npm ci`, then `npm run dev` or `npm run desktop`. Keep document data independent of React, preserve IDs and existing native fields, and make changes transactional. Reject unsupported imports with an actionable error instead of discarding data.

Run `npm test`, `npm run build`, `npm run test:e2e`, `npm run test:desktop`; inspect generated PDFs with `scripts/verify-pdf.py`. Print/layout changes need CJK, deep/wide and 1000-node fixtures. Update feature statuses with evidence, compatibility docs and known limitations. Never label an untested capability VERIFIED.

Use independent artwork and layouts; do not copy proprietary XMind code, branding or paid assets. Contributions are under Apache-2.0. Preserve upstream licenses and run `npm run licenses` after changing dependencies. Do not commit node_modules, private maps or generated QA user profiles.
