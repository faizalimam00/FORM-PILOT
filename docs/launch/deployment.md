# Deployment and publication checklist

Nothing in this repository has been published by the build. The extension and website work locally. Public account details remain unconfigured.

## Values the maintainer must supply

- New GitHub username: `YOUR_NEW_GITHUB_USERNAME` (do not infer an older account).
- Actual repository HTTPS URL, and whether private vulnerability reporting is enabled.
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

Copy `.env.example` to `.env`, set the real origin and supplied account URLs, then run `npm run build`. Publish only `apps/website/dist/` to the authorized host. Verify canonical/OG URLs, sitemap-index.xml and robots.txt against that actual domain. Local/unconfigured builds deliberately block indexing.

No adapter or backend is required. Configure standard host security headers (Content-Type, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin and an appropriate frame policy). A site CSP must permit the bundled Astro island bootstrapping; test it on a preview instead of copying the extension’s different CSP. Disable unnecessary host analytics. Document any unavoidable host access logs.

Rollback is redeploying the preceding static artifact. No database migrations exist. Saved browser profiles are unaffected by website deployment.

## Repository and extension publication

Create the repository only with explicit authorization. Set description/topics from repository-metadata.md, enable private reporting, verify issue templates and configure branch protection appropriate to the project. CI is configured locally but no successful hosted Actions run is claimed until it actually runs.

Review the MV3 manifest, permission rationale and plain-language privacy policy. Build with `npm run build --workspace @formpilot/extension`; package using `npm run zip --workspace @formpilot/extension` if preparing a store upload. Submit only after explicit authorization and after filling the store’s privacy disclosures accurately. Store acceptance is external and not guaranteed.

Use screenshots captured from the working product with fictional details. Do not list the extension as store-available before approval. Keep unpacked installation instructions until then. Do not automatically upload the user’s profile, change accounts, register a domain or buy a service.

## Creator profile

`profile-README.md` is a proposal only. Replace its {{REPOSITORY_URL}}, {{DEMO_URL}}, {{DOCS_URL}} and username placeholders with actual supplied values. Preview it before writing to the separate GitHub profile repository. That write requires authorization.
