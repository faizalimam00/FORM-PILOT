---
layout: ../layouts/Document.astro
title: Install FormPilot locally
description: Build the open-source extension and load it unpacked in a desktop Chromium browser. No account or API key required.
---

## Before you start

Use Node.js 22.22 or newer, npm 10 or newer, and a desktop Chromium browser. Chrome 120+ is the declared API minimum, while automated compatibility checks use the Chromium version recorded in the repository’s QA report. Firefox and mobile browsers are not supported in version one. There is no published store listing yet.

Download or clone the FormPilot source repository once its URL has been configured by the maintainer. From the repository root:

```sh
npm ci
npm run build
```

The extension build is written to `apps/extension/.output/chrome-mv3/`. The website build is separate at `apps/website/dist/`. Build output is local; the command does not publish anything.

## Load the unpacked extension

1. Open `chrome://extensions` in Chrome, or the corresponding extensions page in another Chromium browser.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select `apps/extension/.output/chrome-mv3/`.
4. Pin FormPilot from your browser’s extensions menu.
5. Open FormPilot and choose **Create your first profile**, or use the fictional sample in profile settings. Save it.

Only load extension code from a source you trust. FormPilot does not download executable code at runtime.

## Try your first reviewed fill

Start the demonstration website:

```sh
npm run dev
```

Open `http://127.0.0.1:4321/forms/event/`. Click the FormPilot toolbar icon, then **Review this page**. In the persistent review window, choose your saved profile and click **Scan page**. Review the matches and click **Fill selected fields**. The form stays unsubmitted.

For this demo, use the fictional sample profile. Do not enter real personal information into screenshots or issue reports. Try editing one filled field, then undo: that edit should remain untouched.

## Updating or removing

After rebuilding, click **Reload** on the extension’s browser settings card and refresh your test tab. Reloading can invalidate an existing review window; reopen it from the target page’s toolbar icon. Saved profiles remain in extension-local storage across normal reloads.

Export a backup before uninstalling. Removing the extension normally removes its saved data. Exported files remain wherever you saved them and contain readable personal information.

See [troubleshooting](/limitations/) if a page cannot be scanned, or [how it works](/how-it-works/) for the review workflow.
