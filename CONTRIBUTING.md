# Contributing

[English](CONTRIBUTING.md) · [繁體中文](CONTRIBUTING.zh-TW.md)

Use Node.js 24 LTS or a compatible current runtime, `npm ci`, then `npm run dev` or `npm run desktop`. Keep document data independent of React, preserve IDs and existing native fields, and make changes transactional. Reject unsupported imports with an actionable error instead of discarding data.

Run `npm audit`, `npm test`, `npm run test:updater`, `npm run build`, `npm run test:e2e`, and `npm run test:desktop`; inspect generated PDFs with the scripts in `scripts/`. Print/layout changes need CJK, deep/wide and 1000-node fixtures. Test multiple open tabs and lock handoff when changing local storage. Update feature statuses with evidence, compatibility docs and known limitations. Never label an untested capability VERIFIED. The `OpenMind quality` workflow runs on pushes and pull requests. The macOS release workflow builds arm64/x64 drafts and requires Developer ID and Apple Notary API secrets; it does not publish releases automatically. Follow [macOS release setup](docs/RELEASING.md).

Use independent artwork and layouts; do not copy proprietary XMind code, branding or paid assets. Contributions are under Apache-2.0. Preserve upstream licenses and run `npm run licenses` after changing dependencies. Do not commit node_modules, private maps or generated QA user profiles.
