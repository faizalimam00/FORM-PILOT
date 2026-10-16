# Building and distributing FormPilot

This guide covers the extension package and static website. For browser installation, see the [installation guide](../installation.md).

## Build the release files

Use Node 22.22.x or 24 LTS and npm 10+:

```sh
npm ci
npm run check
npm run test:browsers
npm run test:e2e
```

`npm run check` runs lint, type checks, unit/DOM tests and production builds. For a build without repeating checks, use `npm run build`. To package only the extension, use `npm run package:extension`.

| Output                                     | Contents                                  |
| ------------------------------------------ | ----------------------------------------- |
| `dist/releases/formpilot-0.1.0-chrome.zip` | Installable Chromium package              |
| `dist/releases/formpilot-0.1.0-chrome/`    | Extracted package ready for Load unpacked |
| `dist/releases/SHA256SUMS.txt`             | ZIP integrity checksum                    |
| `downloads/`                               | Repository distribution files             |
| `apps/website/dist/`                       | Static website, including `/downloads/`   |

The package contains compiled extension files, installation instructions and license notices. Profiles and settings remain in browser-local storage and are not included in a package.

## Extension distribution

The repository download links to the ZIP in `downloads/`. Include refreshed distribution files with source changes that affect the extension. The website’s install page serves the same archive. CI also retains verified build artifacts for 30 days.

Users extract the ZIP into a permanent folder and load it through Chrome’s extensions page. Updates replace files in the same folder, followed by **Reload**. The [installation guide](../installation.md) includes exact steps and browser compatibility.

A Chrome Web Store distribution uses the WXT archive from `apps/extension/.output/`. Its listing needs a product description, screenshots, support details and privacy disclosures consistent with the manifest. The ZIP installation remains available independently of store distribution.

## Website hosting

The site is static and requires no backend or database. Copy `.env.example` to `.env` and configure:

| Variable                 | Purpose                                                                     |
| ------------------------ | --------------------------------------------------------------------------- |
| `PUBLIC_SITE_URL`        | HTTPS origin used for canonical URLs, social metadata and sitemap           |
| `PUBLIC_GITHUB_USERNAME` | Creator profile; defaults to `faizalimam00`                                 |
| `PUBLIC_REPOSITORY_URL`  | Source repository; defaults to `https://github.com/faizalimam00/FORM-PILOT` |
| `PUBLIC_DOCS_URL`        | Documentation URL used in shared links                                      |

Run `npm run build` and upload `apps/website/dist/` to the static host. Builds without `PUBLIC_SITE_URL` use noindex and omit the sitemap, so development previews are not indexed. Verify `/install/`, the ZIP download, canonical URLs, social previews, `sitemap-index.xml` and `robots.txt` on the deployed origin.

Configure `X-Content-Type-Options: nosniff`, a suitable `Referrer-Policy`, and a frame policy. Test any Content Security Policy with Astro’s bundled island scripts. The site includes no analytics; describe any hosting access logs and retention in the deployed privacy policy.

To roll back the website, redeploy the previous static artifact. Website releases do not alter saved extension profiles.

## Release verification

Run the packaged-extension browser tests, check the SHA-256 checksum, and inspect the popup, options and website in light/dark mode at compact, desktop and mobile sizes. Keep the [changelog](../../CHANGELOG.md), [compatibility guide](../../apps/website/src/pages/limitations.md) and [privacy policy](../../apps/website/src/pages/privacy.md) aligned with the release.

See [contributing](../../CONTRIBUTING.md) for matching-engine evaluation and regression-test requirements.
