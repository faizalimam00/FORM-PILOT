# Official API references consulted

- [Chrome activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab): temporary access after user invocation, revoked on cross-origin navigation.
- [Chrome scripting](https://developer.chrome.com/docs/extensions/reference/api/scripting): isolated-world programmatic injection.
- [Chrome storage](https://developer.chrome.com/docs/extensions/reference/api/storage): local storage and trusted-context access level.
- [WXT entrypoints](https://wxt.dev/guide/essentials/entrypoints.html): unlisted scripts, options, popup and background entrypoints.
- [Playwright extension testing](https://playwright.dev/docs/chrome-extensions): persistent Chromium contexts and headless Chromium channel.
- [React input](https://react.dev/reference/react-dom/components/input): controlled input value and synchronous onChange behavior.
- [Astro React integration](https://docs.astro.build/en/guides/integrations-guide/react/): React islands.

These inform the implementation; automated integration tests remain the compatibility evidence.
