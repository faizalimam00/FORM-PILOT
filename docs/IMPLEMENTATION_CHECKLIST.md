# FormPilot implementation checklist

- [x] Document architecture, visual direction, dependencies and browser API references.
- [x] Versioned profile schema, validation, imports, exports, sample profiles.
- [x] Deterministic matcher, exclusions, normalization, scoped memories.
- [x] User-triggered DOM scan, safe fill, highlight, and guarded undo.
- [x] Compact fill/review toolbar popup and full profile editor.
- [x] Five controlled demo forms and shared-engine playground.
- [x] Static website, substantive articles, configurable SEO, dark mode.
- [x] 100+ labelled cases with separate development/evaluation splits.
- [x] Unit, DOM integration, real Chromium extension, and accessibility tests.
- [x] Measured benchmark and genuine screenshots.
- [x] Repository, architecture, privacy, threat model, contribution and launch docs.
- [x] Final clean build, responsive inspection, and evidence report.

Maintained by Faizal Imam in [faizalimam00/FORM-PILOT](https://github.com/faizalimam00/FORM-PILOT).

## Prebuilt distribution follow-up

- [x] Generate a versioned, ready-to-extract Chromium ZIP with installation instructions and checksums.
- [x] Add website download links and accurate browser compatibility instructions.
- [x] Verify the downloaded ZIP by loading its extracted contents in Chromium.
- [x] Include build artifacts in CI without publishing a release.

## Repository identity

- [x] Apply Faizal Imam and faizalimam00/FORM-PILOT across README, website, package metadata and launch drafts.
- [x] Replace incomplete template links with real repository/documentation links and local-demo instructions.
- [x] Confirm actual repository/security status and rebuild the downloadable package.

## Direct toolbar filling

- [x] Replace the separate review-window launcher with Fill form in the toolbar popup.
- [x] Keep profile selection, results, undo and optional corrections inside the popup.
- [x] Verify direct fill, existing-value protection, uncertainty, exclusions, undo and no new windows in Chromium.
- [x] Update instructions and captures; rebuild the installable ZIP.

## Public release presentation

- [x] Replace internal agent instructions with user and maintainer documentation.
- [x] Provide a direct repository ZIP download and a concise installation guide.
- [x] Investigate the hosted profile-save failures and verify the correction.
- [x] Rebuild distribution files, check links, inspect rendered pages and run relevant tests.
