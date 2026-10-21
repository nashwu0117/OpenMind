# macOS Release and In-App Updates

[繁體中文](RELEASING.md) · [English](RELEASING.en.md)

The [0.3.2 Apple Silicon preview](https://github.com/nashwu0117/OpenMind/releases/tag/preview-0.3.2) provides a drag-to-Applications DMG, app ZIP, and `SHA256SUMS.txt`. It is an ad-hoc-signed build tested locally, without Apple notarization. First launch may require allowing OpenMind under System Settings → Privacy & Security → Open Anyway. Do not disable Gatekeeper globally.

## Manual preview releases

Preview releases use a `preview-<version>` tag and are marked as GitHub prereleases. They do not trigger the Developer ID `v*` workflow below, and the in-app update service ignores them. Version 0.3.2 is tested on macOS arm64 only; there is no Intel or universal build.

On macOS arm64, run `OPENMIND_UPDATE_REPOSITORY=nashwu0117/OpenMind npm run package`, then `node scripts/make-dmg.mjs`. The scripts refuse to overwrite existing outputs. Before publishing, run desktop smoke tests against the packaged app, verify nested signatures, mount the DMG, and test an installed copy. Generate SHA-256 checksums for the DMG and ZIP and attach those exact files to the preview Release. An intact ad-hoc signature does not establish an Apple-verified developer identity or notarization.

The remaining setup is for future stable releases, targeting Apple Silicon (`arm64`) and Intel (`x64`) Macs with Developer ID-signed, notarized DMGs and update ZIPs.

## One-time GitHub and Apple setup

1. Use a **public GitHub repository**. Electron's public update service only reads published Releases in a public repository.
2. Create a GitHub Environment named `release`, require review by a maintainer, and restrict creation of `v*` tags to trusted release maintainers. Set the default Actions `GITHUB_TOKEN` permission to read-only.
3. Create a `Developer ID Application` certificate in the Apple Developer account and export a private-key `.p12`. Create an App Store Connect API key for the Notary API and download its `.p8` file. Store signing material only as secrets in the `release` Environment; never commit it or add it to general repository secrets.
4. Configure these Environment secrets under **Settings → Environments → release**:
   - `APPLE_CERTIFICATE_P12_BASE64`: Base64-encoded Developer ID `.p12` file.
   - `APPLE_CERTIFICATE_PASSWORD`: password used to export the `.p12`.
   - `APPLE_SIGN_IDENTITY`: full `Developer ID Application: Name (TEAMID)` identity.
   - `APPLE_API_KEY_P8_BASE64`: Base64-encoded App Store Connect `.p8` key.
   - `APPLE_API_KEY_ID` and `APPLE_API_ISSUER`: API key and issuer IDs from App Store Connect.
5. Allow repository Actions workflows. Build jobs need only `contents: read`; only the draft-Release job needs `contents: write`. Never put secrets in a workflow, log, or version control.

## Build and publish a version

1. Update the SemVer version in `package.json` and commit it. The Git tag must exactly match `v<package.json version>`, for example `v0.3.2`.
2. Push the tag. The `macos-14` arm64 and `macos-15-intel` x64 jobs run dependency, unit, updater, Chromium E2E, build, Developer ID signing, notarization, and Gatekeeper checks.
3. After success, the workflow puts both DMGs, update ZIPs, and SHA-256 files in a **draft Release**. Inspect the logs and artifacts. Before the first public release, install on a clean Mac and test Gatekeeper, launch, save, print, update, uninstall, and recovery. Then use GitHub's **Publish release** action.
4. The updater ignores drafts and prereleases. After a published version exists, users can download the matching build. For a newer version, users manually check for updates, review progress, then choose **Restart and Install**. Do not claim the updater is verified until an actual update round trip using published versions succeeds.

The workflow never publishes a version without human review. Missing secrets, a private repository, a mismatched tag, failed tests, or Apple notarization rejection stops release automation.

## Privacy and current limitations

The app contacts Electron's public update service only after the user requests a check; that service then queries GitHub Releases. The request contains the current version and architecture and exposes ordinary network connection information. It does not include map data, attachments, or local paths. Editing and printing work offline; checking or downloading updates does not.

The source repository and Apple Silicon preview downloads are public, and private vulnerability reporting is enabled. Apple signing/notarization credentials and clean-Mac test environments are not configured. The signed/notarized release workflow, a notarized installer, and a real update round trip remain unverified. Local installation testing does not establish Gatekeeper behavior on a clean Mac. See the [release-readiness report](RELEASE_READINESS.en.md).
