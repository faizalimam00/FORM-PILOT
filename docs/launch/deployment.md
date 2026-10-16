# Deployment and publication checklist

The public repository is [faizalimam00/FORM-PILOT](https://github.com/faizalimam00/FORM-PILOT), maintained by [Faizal Imam](https://github.com/faizalimam00). The extension and website build locally. A website deployment, browser-store listing and public release assets are not yet configured.

## Remaining publication configuration

- Enable GitHub private vulnerability reporting before a wider launch; it was verified disabled on 2026-10-16. The current contact-request procedure is in SECURITY.md.
- Actual HTTPS website origin and chosen static host.
- Private security/conduct contact, or verified repository reporting route.
- Hosting log/retention details for the privacy policy.
- Browser-store developer account and listing details if a store release is desired.

## Local release gate

1. Install with `npm ci` on Node 22.22.x or 24 LTS.
2. Run format, lint, strict type checks, unit/DOM tests, benchmark, production builds, dependency audit and packaged-extension browser tests.
3. Inspect actual light/dark review, popup, options, desktop and mobile captures with fictional data.
4. Load the unpacked production directory manually and perform the checklist in `docs/QA_REPORT.md`.
5. Review the measured benchmark and all retained failures. Do not promise universal compatibility.

## Static website

The GitHub identity and repository links already default to faizalimam00/FORM-PILOT. Copy `.env.example` to `.env`, set the actual website origin when hosting is chosen, then run `npm run build`. Publish only `apps/website/dist/` to the authorized host. Verify canonical/OG URLs, sitemap-index.xml and robots.txt against that actual domain. Local/unconfigured builds deliberately block indexing.

No adapter or backend is required. Configure standard host security headers (Content-Type, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin and an appropriate frame policy). A site CSP must permit the bundled Astro island bootstrapping; test it on a preview instead of copying the extension’s different CSP. Disable unnecessary host analytics. Document any unavoidable host access logs.

Rollback is redeploying the preceding static artifact. No database migrations exist. Saved browser profiles are unaffected by website deployment.

## Downloadable browser package

Run `npm run package:extension` to generate `dist/releases/formpilot-0.1.0-chrome.zip`, `SHA256SUMS.txt`, `INSTALL.txt` and `release.json`. `npm run build` includes this step automatically and copies the package into the static site's `/downloads/` directory. The installation page offers the current archive without requiring users to compile source. A source-only `npm run dev` without a generated package shows build instructions rather than a broken download link.

The ZIP has `manifest.json` at its root. End users extract it into a permanent folder, enable Developer mode, and load that folder. Chrome/Chromium is tested; Edge/Brave use the same package but are not independently verified. This archive does not support Firefox, Safari or mobile browsers. It is not a signed CRX or a substitute for browser-store review. For updates, retain the installation folder and reload; do not promise automatic updates or cross-folder storage migration.

The package includes only compiled extension files, installation text and license notices, with a SHA-256 integrity checksum beside it. The browser suite downloads the actual website archive, verifies its checksum and compiled file contents, extracts it and performs a reviewed fill. The configured CI workflow retains `dist/releases/` as a downloadable artifact for 30 days after a successful run. It does not create or publish a release. Public hosting or release attachment still requires authorization.

## Repository and extension publication

Use the existing [FORM-PILOT repository](https://github.com/faizalimam00/FORM-PILOT). When authorized, apply the description/topics from repository-metadata.md, enable private reporting, verify issue templates and configure branch protection. Check the actual [CI runs](https://github.com/faizalimam00/FORM-PILOT/actions/workflows/ci.yml) before distributing a build; local verification does not establish a successful hosted run.

Review the MV3 manifest, permission rationale and plain-language privacy policy. Build with `npm run build --workspace @formpilot/extension`; package using `npm run zip --workspace @formpilot/extension` if preparing a store upload. Submit only after explicit authorization and after filling the store’s privacy disclosures accurately. Store acceptance is external and not guaranteed.

Use screenshots captured from the working product with fictional details. Do not list the extension as store-available before approval. Keep unpacked installation instructions until then. Do not automatically upload the user’s profile, change accounts, register a domain or buy a service.

## Creator profile

`profile-README.md` is prepared for [@faizalimam00](https://github.com/faizalimam00), with real repository, documentation and local-demo links. Preview it before writing to the separate GitHub profile repository. That write requires authorization.
