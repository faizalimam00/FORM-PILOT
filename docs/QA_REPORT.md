# FormPilot verification report

This report records checks run against FormPilot 0.1.0 on 2026-10-16. Automated checks cover the supported controls and documented workflows; individual websites may handle form events differently.

## Test environment

- macOS / Darwin 25.4.0, arm64, Apple M1 Pro.
- Node 22.22.0, with dependencies installed from `package-lock.json`.
- Chromium 153.0.8010.12 using the production Manifest V3 extension.
- Website served from the Astro static build on loopback.
- Fictional sample profiles in isolated browser contexts.

## Verification

`npm run check` covers ESLint, strict TypeScript, Astro diagnostics, 70 unit/DOM integration tests, extension packaging and the static website build. `npm run test:e2e` loads the actual extension and exercises its toolbar action, messaging and injected detector. Browser tests retain the production permissions; test-only debugging is confined to the test browser.

The [GitHub Actions workflow](https://github.com/faizalimam00/FORM-PILOT/actions/workflows/ci.yml) runs the checks on Linux. Its run status is recorded independently from the local results below.

Local results for this revision:

| Check                    | Result                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `npm run check`          | Passed: lint, strict types, 70 unit/DOM tests, extension package and 19-page website build |
| `npm run test:e2e`       | 22 passed in 47.0 seconds                                                                  |
| Markdown file-link check | 20 documents checked; no broken file targets                                               |
| Download verification    | Repository ZIP, website download, checksum and extracted Chrome files matched              |

## Coverage

- Profile validation, import previews, merge/replace, deletion and active profile switching.
- Delayed profile loading: creation waits for local storage before editing or saving.
- Matching, abstention, sensitive exclusions and exact-origin remembered mappings.
- Toolbar filling without additional tabs or windows.
- Existing-value protection, native dropdown normalization and stale-control detection.
- React-controlled inputs and newly rendered controls.
- Optional inline review, explicit replacements and remembered corrections.
- Guarded Undo, subsequent edits, expiry and temporary-state cleanup.
- Restricted pages, permission errors, malformed messages and trusted storage boundaries.
- Downloaded ZIP checksums, extracted-file integrity and filling from the extracted extension.
- Playground behavior, navigation, metadata, keyboard labels and responsive layouts.

The shared `review.html` entrypoint is opened explicitly by integration tests for detailed review assertions. The product uses the toolbar popup and does not launch that page.

## Visual and accessibility checks

The toolbar popup is inspected in its initial, filled and review states at its native compact dimensions. Fill and Undo remain visible after filling; longer field lists scroll. The profile editor is checked at 1280px, and the website at 1440px and 375px in light/dark mode with reduced motion.

Axe WCAG A/AA checks cover the toolbar states, profile editor, review controls, install page, homepage and playground. Automated checks complement manual visual inspection; they do not replace a full assistive-technology assessment.

[Toolbar capture](assets/product-review.png) · [Inline review](assets/popup-review.png) · [Dark review](assets/review-dark.png) · [Desktop website](assets/website-desktop.png) · [Mobile website](assets/website-mobile.png) · [Capture metadata](assets/capture-info.json)

## Matching benchmark

The fixed evaluation has 100 synthetic English-language cases: 81 eligible controls and 19 expected exclusions. The measured results are 58 correct proposals out of 59, giving 98.3% precision and 72.8% eligible-field coverage. Abstention is 27.2%, with zero incorrect high-confidence matches. All 21 intentional abstentions and 19 exclusions were handled as expected. One review-level proposal was incorrect.

Median matcher time was 0.0093 ms and p95 was 0.0153 ms on the recorded environment. These figures exclude DOM scanning and browser messaging. See the [generated results](benchmarks/results.md) and [methodology](benchmarks/methodology.md) for denominators, timing procedure and retained failures.

## Manual verification

1. Load the extracted Chrome folder and save a fictional profile.
2. On event registration, invoke FormPilot and click **Fill form**. Confirm the fields fill without another window, submission or navigation. Use Undo before closing the popup.
3. Open **Review fields & corrections**. Check explanations, mapping changes, exclusions and page highlighting.
4. On shipping details, select the address fields explicitly. Fill country, rescan, then fill the newly rendered region control.
5. On SaaS onboarding, verify React state feedback and conditional company fields. On the difficult form, check abstention, sensitive exclusions and existing-value protection.
6. Switch profiles, preview an import, test merge/replace and delete the fictional test data.
7. Close and reopen the popup: old scan and undo state must be unavailable. Verify the unsupported-page message on a browser settings page.

## Platform boundaries

Chrome/Chromium desktop is tested. Edge and Brave use the same package format but have not been independently verified. Firefox, Safari and mobile browsers are unsupported. The [compatibility guide](../apps/website/src/pages/limitations.md) covers frames, custom controls, language support and dynamic-form limits.
