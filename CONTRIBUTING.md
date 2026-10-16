# Contributing to FormPilot

Thank you for helping make repetitive forms less tedious. Start with a reproducible fictional form and the user-visible behavior you want to improve.

## Setup and verification

Use Node 22.22.x or 24 LTS and npm >=10. Run `npm ci`, `npm run build`, and `npm run dev`. Load `apps/extension/.output/chrome-mv3` unpacked in Chromium. Use the fictional sample on the five local demo forms.

Before opening a pull request:

```sh
npm run format
npm run lint
npm run typecheck
npm test
npm run benchmark
npm run build
npm run test:browsers
npm run test:e2e
```

Do not commit `.env`, local browser overrides, node_modules, builds, traces or personal data. If a browser check cannot run, say which command failed and why. Do not label playground coverage as extension coverage.

## Matching changes

Add a development fixture showing the failure and a meaningful regression assertion. Keep the pure matcher independent of React, browser APIs and network access. Prefer abstention to a weak automatic match. Preserve explanations, type compatibility, section warnings and sensitive exclusions. Do not adjust expected labels to hide an error. The fixed evaluation set is not training material; append a separately labelled next-version evaluation when expanding it and document provenance.

Runtime results vary by machine. Generate the report; never hand-edit performance numbers. Discuss changes to precision, coverage, intentional abstentions and high-confidence errors together. Keep the baseline and failures visible.

## DOM and permission changes

Test existing-value protection, changed/replaced elements, controlled inputs and guarded undo. Keep actual selected values out of logs. Never request a wider permission only to make a test easier. A new control or browser requires real integration evidence and an updated limitations page.

## UI and documentation

Check compact extension dimensions, desktop and mobile, light and dark themes, keyboard focus and reduced motion. Add labels and useful failure states. Keep product copy accurate to code. Use real fictional-data captures; do not invent screenshots, testimonials, ratings or compatibility claims.

## Review expectations

Explain the problem, resulting behavior, test evidence and remaining limits. Avoid unrelated refactors. Security findings use the private reporting process in SECURITY.md. All contributions are licensed under the repository’s MIT license. Follow CODE_OF_CONDUCT.md.
