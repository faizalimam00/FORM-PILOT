# Official API references consulted

- [Chrome activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab): temporary access after user invocation, revoked on cross-origin navigation.
- [Chrome scripting](https://developer.chrome.com/docs/extensions/reference/api/scripting): isolated-world programmatic injection.
- [Chrome storage](https://developer.chrome.com/docs/extensions/reference/api/storage): local storage and trusted-context access level.
- [WXT entrypoints](https://wxt.dev/guide/essentials/entrypoints.html): unlisted scripts, options, popup and background entrypoints.
- [Playwright extension testing](https://playwright.dev/docs/chrome-extensions): persistent Chromium contexts and headless Chromium channel.
- [React input](https://react.dev/reference/react-dom/components/input): controlled input value and synchronous onChange behavior.
- [Astro React integration](https://docs.astro.build/en/guides/integrations-guide/react/): React islands.
- [Chrome unpacked installation](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked): extract and select the folder containing the manifest.
- [Edge sideloading](https://learn.microsoft.com/en-us/microsoft-edge/extensions/getting-started/extension-sideloading): Developer mode and Load unpacked.
- [Chrome distribution](https://developer.chrome.com/docs/extensions/how-to/distribute/install-extensions): store and external-installation restrictions.
- [WXT publishing and ZIP artifacts](https://wxt.dev/guide/essentials/publishing): local production ZIP generation; publishing is a separate action.

These inform the implementation; automated integration tests remain the compatibility evidence.
