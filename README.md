# FormPilot

**Fill the familiar. Review the uncertain.**

Save your details once. Open a form, click **Fill form**, and let FormPilot fill the fields it confidently recognizes. Your profile stays on your device, existing values stay untouched, and you stay in control of submission.

[**Download for Chrome**](https://github.com/faizalimam00/FORM-PILOT/raw/refs/heads/main/downloads/formpilot-0.1.0-chrome.zip) · [Installation guide](docs/installation.md) · [Documentation](docs/README.md) · [Report an issue](https://github.com/faizalimam00/FORM-PILOT/issues)

![FormPilot’s toolbar popup showing a sample profile, seven filled fields and Undo](docs/assets/product-review.png)

## Add FormPilot to Chrome

1. Download and extract the ZIP into a permanent folder, such as `Documents/FormPilot`.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the extracted folder containing `manifest.json`.
4. Pin FormPilot, open **Profiles**, and save your details.

Visit a form and click **FormPilot → Fill form**. Matching fields fill on the current page; no additional tab or window opens. No account, subscription or build tools are needed.

**Developer mode is Chrome’s name for installing a ZIP extension manually.** Keep the extracted folder in place. Updates use the same folder and Chrome’s **Reload** button. See [installation and updates](docs/installation.md).

## Your details, ready when you need them

- **Personal and work profiles.** Keep names, contact details, addresses and professional links together. Choose the right profile before filling.
- **One-click filling.** Fill all empty, high-confidence matches at once. FormPilot never submits or advances the form.
- **Optional field review.** Inspect explanations, correct mappings and explicitly select uncertain fields inside the toolbar popup.
- **Existing values stay put.** Replacing a value requires permission and selection in the review controls.
- **Remember useful corrections.** Save a mapping for the exact website and field context. Inspect or delete it in settings.
- **Undo.** Reverse the latest fill while the popup stays open, for up to five minutes. Fields edited afterward are skipped. Closing the popup, rescanning or filling again clears the previous undo.
- **Portable profiles.** Export your profiles, preview imports, merge or replace saved data, and delete local data whenever you choose.
- **Light and dark themes.** Compact controls, keyboard focus and reduced-motion support.

## Privacy built into the workflow

Profiles and remembered mappings use extension-local storage. Matching runs on your device without analytics, cloud sync or external AI services. Page access starts only when you invoke FormPilot and choose to fill or review fields.

Browser storage and exported profile files are **not encrypted by FormPilot**. Websites can read filled values before submission. Passwords, payment details, verification codes and other suspected sensitive fields are excluded.

[Privacy policy](apps/website/src/pages/privacy.md) · [Permissions and architecture](docs/architecture/README.md) · [Security reporting](SECURITY.md)

## Compatibility

| Browser                   | Support                                                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Chrome / Chromium desktop | Tested. Chrome 120+ is required; exact tested versions are recorded in the [verification report](docs/QA_REPORT.md). |
| Edge / Brave desktop      | Use the Chromium package; not independently verified.                                                                |
| Firefox / Safari / mobile | Unsupported.                                                                                                         |

FormPilot supports native text, email, telephone and URL inputs, textareas and single-select dropdowns in the top-level page. Built-in label aliases are primarily English. Custom dropdowns, rich-text editors, embedded frames and shadow-root controls are unsupported.

Uncertain fields remain unchanged until you review them. For changing forms, fill the country first and rescan before filling a newly rendered region field. Check [supported controls and troubleshooting](apps/website/src/pages/limitations.md) for details.

## Measured matching quality

On the fixed 100-case synthetic evaluation set, the measured run produced **98.3% precision** among proposed matches, **72.8% coverage** of eligible fields, **27.2% abstention**, and **zero incorrect high-confidence matches**. All 21 intentional abstentions and 19 exclusions were handled as expected. One review-level proposal was incorrect.

These English-language examples test specific behaviors, not compatibility with every website. [Read the measured results](docs/benchmarks/results.md) and [methodology](docs/benchmarks/methodology.md), including denominators, runtime measurements and retained errors.

## Try it locally

Contributors can run the website, interactive playground and five example forms with Node **22.22.x or 24 LTS** and npm **10+**:

```sh
git clone https://github.com/faizalimam00/FORM-PILOT.git
cd FORM-PILOT
npm ci
npm run build
npm run dev
```

Open **http://127.0.0.1:4321/demo/**. The playground uses the actual matching engine with fictional sample data. It operates only on its own demo forms; it cannot inspect other tabs. Event registration, job applications, shipping, React onboarding and ambiguous forms each have a standalone example.

The unpacked extension is generated at `apps/extension/.output/chrome-mv3/`. Shareable packages and an extracted Chrome folder are generated in `dist/releases/`.

## Contributing

FormPilot uses TypeScript, React, WXT Manifest V3 and an independent deterministic matching engine. The website uses Astro. Read the [contribution guide](CONTRIBUTING.md) for setup, testing and meaningful form fixtures, or explore the [architecture](docs/architecture/README.md).

```sh
npm run check       # Lint, types, unit/DOM tests and production builds
npm run test:e2e    # Packaged extension and website browser tests
npm run benchmark  # Reproduce the matching evaluation
```

Broader international aliases, more framework fixtures and additional browser support are the next areas for improvement. Reproducible reports using fictional data are welcome.

Built by **[Faizal Imam](https://github.com/faizalimam00)**. [MIT license](LICENSE) · [Changelog](CHANGELOG.md) · [Code of conduct](CODE_OF_CONDUCT.md)
