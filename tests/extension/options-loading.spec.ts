import { test, expect } from '@playwright/test';
import { launch } from './helpers';

test('profile creation waits for local storage before accepting edits or saving', async () => {
  const { context, id } = await launch();
  try {
    const options = await context.newPage();
    // Hold the first storage read so this reproduces slow extension startup deterministically.
    await options.addInitScript({
      content: `
      const originalGet = chrome.storage.local.get.bind(chrome.storage.local);
      const ready = new Promise(resolve => { window.releaseProfileRead = resolve; });
      chrome.storage.local.get = async (...args) => {
        await ready;
        return originalGet(...args);
      };
    `,
    });
    await options.goto(`chrome-extension://${id}/options.html`);
    await expect(options.getByRole('status')).toHaveText('Loading your local profiles…');
    await expect(
      options.getByRole('button', { name: '+ New personal profile', exact: true }),
    ).toBeDisabled();
    await expect(
      options.getByRole('button', { name: '+ New work profile', exact: true }),
    ).toBeDisabled();
    await expect(options.getByRole('button', { name: 'Try a fictional sample' })).toHaveCount(0);
    await options.evaluate('window.releaseProfileRead()');
    await options.getByRole('button', { name: 'Try a fictional sample' }).click();
    await options.getByRole('button', { name: 'Save profile', exact: true }).click();
    await expect(options.getByText('Profile saved on this device.')).toBeVisible();
    const stored = await options.evaluate(
      'chrome.storage.local.get("formpilot").then(result => result.formpilot.data.profiles[0].firstName)',
    );
    expect(stored).toBe('Alex');
  } finally {
    await context.close();
  }
});
