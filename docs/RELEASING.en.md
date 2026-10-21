# macOS Release and In-App Updates

[繁體中文](RELEASING.md) · [English](RELEASING.en.md)

The direct-download target is Apple Silicon (`arm64`) and Intel (`x64`) Macs. Each architecture should receive a notarized DMG for drag-to-Applications installation and a signed app ZIP for Electron updates. A local `npm run package` build is only for development validation. Do not distribute an ad-hoc build or ask users to disable Gatekeeper.

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

The source repository is public and private vulnerability reporting is enabled. Apple signing/notarization credentials and clean-user test environments are not configured. The release workflow has not produced verified GitHub artifacts, and there is no notarized installer or real update round trip yet. Source code is available, but a public installer is not. See the [release-readiness report](RELEASE_READINESS.en.md).
