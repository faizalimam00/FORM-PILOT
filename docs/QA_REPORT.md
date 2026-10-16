# FormPilot 0.1 verification report

Verified locally on 2026-10-16. This is evidence from the implementation workspace, not a claim of a published release, successful hosted CI run, universal browser support or an independent security audit.

## Environment

- macOS / Darwin 25.4.0, arm64, Apple M1 Pro.
- npm scripts use the pinned Node 22.22.0 runtime.
- Real Chromium extension tests: Chrome for Testing **153.0.8010.12**, Playwright 1.64.1.
- An existing Chromium executable was selected through the ignored `.env.test.local` file. CI is configured to install Playwright's matching bundled Chromium; a hosted CI run has not occurred.
- Tests and captures use fictional Alex Morgan details only. No external form submission, publication or account operation was performed.

## Commands and observed results

| Command / check                                                             | Observed result                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci` in a separate source copy without dependencies or generated builds | Installed 738 packages; audited 746; zero vulnerabilities. The host Node 25 emitted an engine warning; subsequent scripts use pinned Node 22.22.0. Use the documented LTS runtime for your checkout.                                                           |
| `npm run check`                                                             | Passed in both the main workspace and the separate clean installation: ESLint, root/extension strict TypeScript, Astro diagnostics, 70 unit/DOM integration tests, and production extension and website builds. Astro reported zero errors, warnings or hints. |
| `npm run test:e2e`                                                          | **15 passed**, 37.9 seconds. Includes production-extension, website, accessibility and actual screenshot capture tests.                                                                                                                                        |
| `npm run benchmark`                                                         | Generated the checked-in 100-case evaluation and 56-case development results; see the measurements below.                                                                                                                                                      |
| `npm audit --audit-level=high`                                              | Zero vulnerabilities in the installed dependency tree.                                                                                                                                                                                                         |
| `npm run format:check`                                                      | Passed; all matched files use Prettier formatting.                                                                                                                                                                                                             |

A separate website build with the reserved test origin `https://formpilot.example` passed metadata checks across all 19 HTML pages: canonical URLs, Open Graph URLs/images, sitemap and robots used the configured origin. The original workspace remained unconfigured and noindex, without a sitemap. This was a local configuration test, not a deployment. Package metadata and lockfile consistency were also checked. The screenshot-only test passed again after correcting its TypeScript DOM narrowing and recording the actual native popup size.

The production extension output is `apps/extension/.output/chrome-mv3/`. The static website output is `apps/website/dist/`, containing 19 HTML pages plus robots and assets. Rollup emitted upstream Zod comment-annotation warnings during bundling; it removed those comments and completed successfully. They are not runtime errors.

A general project-gate helper passed its format/lint/type/test/build checks but its nested dependency audit could not resolve the registry in the restricted shell. The separately executed npm audit and clean install succeeded. Optional gitleaks, Trivy, ShellCheck and hadolint were unavailable; Python checks did not apply. Do not interpret this report as a completed specialist security audit.

## What the tests exercise

The 70 Vitest cases cover versioned schemas and import/export, deterministic matches and intentional abstentions, sensitive-field exclusions, origin/fingerprint memory isolation, DOM detection, native select compatibility, existing-value protection, React-compatible setter/events, stale targets, safe partial undo, expiry and trusted-message boundaries. A regression test ensures excluded control values are never read.

The browser suite loads the unchanged production MV3 manifest, triggers the actual toolbar action using Chromium's extension debugging protocol, opens the real launcher and review window, and injects the production detector. It does not broaden the manifest's host permissions. The debugging flag belongs to the test browser, not the installed extension.

Ten extension behavior cases verify:

1. Only `activeTab`, `scripting` and `storage` permissions; no persistent hosts, automatic content scripts or web-accessible resources; isolated scripts cannot read trusted storage.
2. Explicit scan without value changes, explained suggestions, selected fill, no submission and partial undo preserving later edits.
3. Job application professional links and bio.
4. React-controlled SaaS inputs and conditionally rendered fields.
5. Shipping/billing review and country-driven state replacement requiring rescan.
6. Ambiguous-field abstention, exclusions, existing values, corrections and removable remembered mappings.
7. Profile creation, switching, import/export and deletion.
8. Missing temporary access and browser-restricted pages.
9. Field semantic changes after scan.
10. Closing review clears detector state; malformed messages are rejected.

Four website cases verify the actual-engine playground, responsive/accessibility behavior, extension options/review accessibility, and all 18 public content routes with unique titles, descriptions, one H1, working internal links and honest unconfigured SEO. A fifteenth case captures the real product.

Automated axe WCAG A/AA checks reported no violations in the tested states. Desktop 1440px and mobile 375px layouts were checked in light and dark modes with reduced motion, and a scanned review was checked at 430px. This is not a complete screen-reader or keyboard audit.

## Visual inspection

The captured launcher, 470 × 790 review, 1280 × 900 profile editor, 1440px desktop site and 375px mobile site were inspected. Light/dark captures use the real UI and fictional data. Compact headers, mapping rows and action bars were adjusted to keep the first suggestion readable; horizontal overflow and insufficient link distinction were fixed.

See [review](assets/product-review.png), [dark review](assets/review-dark.png), [launcher](assets/launcher.png), [profiles](assets/profile-desktop.png), [desktop website](assets/website-desktop.png), [mobile website](assets/website-mobile.png) and [dark mobile website](assets/website-mobile-dark.png). [Capture metadata](assets/capture-info.json) records the browser, timestamp and dimensions. The homepage and README use this real review capture.

Direct browser launch from the restricted shell was blocked by the environment. The Playwright test command successfully launched Chromium, exercised the extension and generated the captures. No mock screenshots replace that verification.

## Benchmark findings

The fixed evaluation split contains 100 synthetic English cases: 81 eligible fields and 19 expected exclusions. There were 59 proposals, 58 correct, for **98.3% precision**, **72.8% coverage** and **27.2% abstention**. All 21 intentional abstentions were respected, all exclusions were classified correctly, and there were **zero incorrect high-confidence matches**.

Two misses remain visible in the generated JSON: an empty middle-name profile value yields no proposal, and contradictory autocomplete/label metadata produces an incorrect first-name suggestion marked **Needs review**, which is not automatically selected. Median matching time was 0.0093 ms and p95 0.0153 ms across 10,000 timed calls after 2,000 warm-ups. These measurements exclude DOM work and browser messaging.

Read the [full results](benchmarks/results.md) and [methodology](benchmarks/methodology.md), including denominators, initial-run retention and development changes after evaluation. This is not an independently authored blind benchmark or a representative sample of the web.

## Manual verification for a new browser or release

1. Use Node 22.22.x or 24 LTS. Run `npm ci`, `npm run check`, `npm run test:browsers` and `npm run test:e2e`. Start the site with `npm run dev`.
2. Load `apps/extension/.output/chrome-mv3/` at `chrome://extensions` using Developer mode → Load unpacked. Pin FormPilot. Create/save the fictional sample in settings.
3. Open `/forms/event/`, invoke the toolbar, then Scan page. Confirm the form remains empty; inspect an explanation and Show on page. Fill selected fields, edit one manually, then undo: the edited value must stay while other changed values return.
4. Try `/forms/job/`, `/forms/shipping/`, `/forms/saas/` and `/forms/difficult/`. Select review-level address fields explicitly. Fill country, then rescan the new state dropdown. Verify SaaS state feedback, conditional controls and difficult-form abstentions/exclusions. Existing values require replacement opt-in and selection. Complete/reset each demo locally.
5. Change a mapping, opt into remembering it, fill, rescan, then inspect/delete the mapping in settings. It must not apply on a different origin or changed form fingerprint.
6. Create and switch a work profile. Test unsaved changes, custom fields, export, import preview, merge and replace. Verify profile deletion and all-data deletion. Delete the fictional export afterward.
7. Rescan after changing the page; verify stale targets are skipped. Close review and reopen: old scan/undo must be unavailable. Try a browser settings page and confirm the friendly unsupported state.
8. Check the popup and review at compact sizes, options, keyboard focus, light/dark mode and reduced-motion behavior. Check desktop/mobile website routes and the playground without assuming it can access another tab.

## Remaining limits and external gates

The Chrome 120 API minimum is declared, but the minimum version, Edge, Firefox and a broad real-site matrix were not tested. All iframes, shadow-root controls, rich text, custom dropdowns and unsupported native types are outside v1. Matching primarily understands English and a limited country/region alias set. Browser scheduling and asynchronous website changes can affect results. No Lighthouse score, Web Vitals benchmark or full assistive-technology audit is claimed.

Publication still requires the supplied new GitHub identity, a repository and real HTTPS domain, a private reporting route, hosting log disclosures and optional browser-store account/review. Hosted CI must run after repository publication. No site, store listing, profile README or promotional content has been published. See [deployment](launch/deployment.md).
