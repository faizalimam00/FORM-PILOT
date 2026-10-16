import { test, expect, type BrowserContext, type Page, type Worker } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { launch, sample, reviewPage, row } from './helpers';
let context: BrowserContext;
let id: string;
let worker: Worker;
let options: Page;
test.beforeEach(async () => {
  ({ context, id, worker } = await launch());
  options = await sample(context, id);
});
test.afterEach(async () => {
  await context?.close();
});
test('production manifest has only user-triggered access and trusted storage', async () => {
  const manifest = JSON.parse(
    readFileSync('apps/extension/.output/chrome-mv3/manifest.json', 'utf8'),
  );
  expect(manifest.permissions.sort()).toEqual(['activeTab', 'scripting', 'storage']);
  expect(manifest.host_permissions).toBeUndefined();
  expect(manifest.content_scripts).toBeUndefined();
  expect(manifest.web_accessible_resources).toBeUndefined();
  expect(manifest.content_security_policy.extension_pages).not.toMatch(/unsafe-eval|https:/);
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/forms/event/');
  const review = await reviewPage(context, page, id);
  await review.getByRole('button', { name: 'Scan page', exact: true }).click();
  await expect(review.getByText('Scan complete. No form values were changed.')).toBeVisible();
  const tab = Number(new URL(review.url()).searchParams.get('tab'));
  const read = await worker.evaluate(async (tabId) => {
    const api = (globalThis as unknown as { chrome: typeof import('wxt/browser').browser }).chrome;
    return api.scripting.executeScript({
      target: { tabId: tabId! },
      func: async () => {
        try {
          const api = (globalThis as unknown as { chrome: typeof import('wxt/browser').browser })
            .chrome;
          await api.storage.local.get('formpilot');
          return 'readable';
        } catch {
          return 'blocked';
        }
      },
    });
  }, tab);
  expect(read[0]?.result).toBe('blocked');
});
test('actual toolbar → scan → reviewed fill → safe partial undo; no submission', async () => {
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/forms/event/');
  const review = await reviewPage(context, page, id);
  await review.getByRole('button', { name: 'Scan page', exact: true }).click();
  await expect(review.locator('.field-card')).toHaveCount(10);
  await expect(page.locator('#event-first')).toHaveValue('');
  await review.getByRole('button', { name: /Fill \d+ selected/ }).click();
  await expect(page.locator('#event-first')).toHaveValue('Alex');
  await expect(page.locator('#event-email')).toHaveValue('alex.morgan@example.com');
  await expect(
    page.getByText('Demo completed locally. No details were sent anywhere.'),
  ).not.toBeVisible();
  await page.locator('#event-first').fill('Edited by user');
  await review.getByRole('button', { name: /Undo last fill/ }).click();
  await expect(page.locator('#event-first')).toHaveValue('Edited by user');
  await expect(page.locator('#event-email')).toHaveValue('');
  await expect(review.getByText('Undo skipped: edited after filling')).toBeVisible();
});
test('professional links and accessible labels work on the job demo', async () => {
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/forms/job/');
  const review = await reviewPage(context, page, id);
  await review.getByRole('button', { name: 'Scan page', exact: true }).click();
  await expect(row(review, 'Your professional superpower').getByRole('combobox')).toHaveValue('');
  await review.getByRole('button', { name: /Fill \d+ selected/ }).click();
  await expect(page.locator('#job-git')).toHaveValue('https://github.com/example');
  await expect(page.locator('#job-link')).toHaveValue('https://www.linkedin.com/in/example');
  await expect(page.locator('#job-about')).toContainText('');
  await expect(page.locator('#job-about')).toHaveValue(/Fictional product designer/);
});
test('React-controlled inputs retain values and conditional company fields appear on rescan', async () => {
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/forms/saas/');
  const review = await reviewPage(context, page, id);
  await review.getByRole('button', { name: 'Scan page', exact: true }).click();
  await review.getByRole('button', { name: /Fill \d+ selected/ }).click();
  await expect(page.getByLabel('React state preview')).toContainText('Alex Morgan');
  await expect(page.getByLabel('React state preview')).toContainText('alex.morgan@example.com');
  await page.locator('#saas-kind').selectOption('work');
  await review.getByRole('button', { name: 'Rescan page', exact: true }).click();
  await expect(row(review, 'Company name')).toBeVisible();
  await review.getByRole('button', { name: /Fill \d+ selected/ }).click();
  await expect(page.locator('#saas-company')).toHaveValue('Example Studio');
  await expect(page.getByLabel('React state preview')).toContainText('Example Studio');
  await expect(page.locator('#saas-pass')).toHaveValue('');
});
test('shipping context requires review and country-dependent state needs a rescan', async () => {
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/forms/shipping/');
  const review = await reviewPage(context, page, id);
  await review.getByRole('button', { name: 'Scan page', exact: true }).click();
  await expect(
    review.getByRole('button', { name: 'Fill selected fields', exact: true }),
  ).toBeDisabled();
  const country = review
    .locator('.field-card')
    .filter({ has: review.getByLabel('Select Country', { exact: true }) })
    .filter({ hasText: 'Shipping address' });
  await country.getByRole('checkbox', { name: 'Select Country', exact: true }).check();
  await row(review, 'State or region')
    .getByRole('checkbox', { name: 'Select State or region', exact: true })
    .check();
  await review.getByRole('button', { name: /Fill \d+ selected/ }).click();
  await expect(page.locator('#ship-country')).toHaveValue('US');
  await expect(page.locator('#ship-state')).toHaveValue('');
  await review.getByRole('button', { name: 'Rescan page', exact: true }).click();
  await row(review, 'State or region')
    .getByRole('checkbox', { name: 'Select State or region', exact: true })
    .check();
  await review.getByRole('button', { name: /Fill \d+ selected/ }).click();
  await expect(page.locator('#ship-state')).toHaveValue('OR');
});
test('difficult demo abstains, protects existing values, excludes secrets, remembers corrections', async () => {
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/forms/difficult/');
  const review = await reviewPage(context, page, id);
  await review.getByRole('button', { name: 'Scan page', exact: true }).click();
  const account = row(review, 'Account name');
  await expect(account.getByRole('combobox')).toHaveValue('');
  await expect(row(review, 'API key').getByRole('checkbox')).toBeDisabled();
  const existing = row(review, 'Email address');
  await expect(
    existing.getByRole('checkbox', { name: 'Select Email address', exact: true }),
  ).toBeDisabled();
  await existing.getByLabel('Allow replacing this field’s existing value').check();
  await existing.getByRole('checkbox', { name: 'Select Email address', exact: true }).check();
  await account.getByRole('combobox').selectOption('company');
  await account.getByLabel('Remember this mapping for this website when filled').check();
  await account.getByRole('checkbox', { name: 'Select Account name', exact: true }).check();
  await review.getByRole('button', { name: /Fill \d+ selected/ }).click();
  await expect(page.locator('#mystery-b')).toHaveValue('Example Studio');
  await expect(page.locator('#existing-mail')).toHaveValue('alex.morgan@example.com');
  await expect(page.locator('#secret')).toHaveValue('');
  await expect(review.getByRole('button', { name: /Undo last fill/ })).toBeVisible();
  await options.reload();
  await options.getByRole('button', { name: 'Remembered mappings', exact: true }).click();
  await expect(options.locator('.memory-row')).toHaveCount(1);
  await expect(options.locator('.memory-row')).toContainText('Account name');
  await page.getByRole('button', { name: 'Reset form' }).click();
  await review.getByRole('button', { name: 'Rescan page', exact: true }).click();
  await expect(row(review, 'Account name').getByRole('combobox')).toHaveValue('company');
  await options.getByRole('button', { name: 'Forget mapping' }).click();
  await expect(options.getByText('No remembered mappings yet.')).toBeVisible();
});
test('profile creation, explicit active switching, import preview, merge and deletion', async () => {
  await options.getByRole('button', { name: '+ New work profile', exact: true }).click();
  await options.getByLabel('Profile name', { exact: true }).fill('Work example');
  await options.getByLabel('First name', { exact: true }).fill('Jamie');
  await options.getByRole('button', { name: 'Save profile', exact: true }).click();
  await options.getByRole('button', { name: 'Make active profile', exact: true }).click();
  await expect(options.getByText('This profile is active for new reviews.')).toBeVisible();
  await options.getByRole('button', { name: 'Import, export & privacy', exact: true }).click();
  const [download] = await Promise.all([
    options.waitForEvent('download'),
    options.getByRole('button', { name: 'Export profiles', exact: true }).click(),
  ]);
  const path = await download.path();
  expect(path).toBeTruthy();
  await options.getByLabel('Choose a FormPilot JSON export').setInputFiles(path!);
  await expect(options.getByText('Preview: 2 profiles')).toBeVisible();
  await options.getByRole('button', { name: 'Confirm merge import' }).click();
  await expect(options.getByText('Profiles merged on this device.')).toBeVisible();
  options.once('dialog', (d) => d.accept());
  await options.getByRole('button', { name: 'Delete all FormPilot data', exact: true }).click();
  await expect(options.getByText('All saved FormPilot data was deleted.')).toBeVisible();
  await options.reload();
  await expect(options.getByRole('button', { name: 'Create personal profile' })).toBeVisible();
});
test('missing activeTab permission and restricted pages show useful errors', async () => {
  const opened = context.waitForEvent('page', (p) => p.url().includes('/forms/event/'));
  const tab = await worker.evaluate(async () => {
    const api = (globalThis as unknown as { chrome: typeof import('wxt/browser').browser }).chrome;
    return (await api.tabs.create({ url: 'http://127.0.0.1:4321/forms/event/' })).id;
  });
  const page = await opened;
  const review = await context.newPage();
  await review.goto(`chrome-extension://${id}/review.html?tab=${tab}`);
  await review.getByRole('button', { name: 'Scan page', exact: true }).click();
  await expect(review.getByRole('alert')).toContainText('Browser-internal pages');
  await page.goto('chrome://version');
  await review.goto(`chrome-extension://${id}/review.html?tab=${tab}`);
  await review.getByRole('button', { name: 'Scan page', exact: true }).click();
  await expect(review.getByRole('alert')).toContainText('cannot be inspected');
});
test('a semantic DOM change after scan is reported, not filled', async () => {
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/forms/event/');
  const review = await reviewPage(context, page, id);
  await review.getByRole('button', { name: 'Scan page', exact: true }).click();
  await expect(row(review, 'First name')).toBeVisible();
  await page
    .locator('#event-first')
    .evaluate((el) => el.setAttribute('autocomplete', 'family-name'));
  await review.getByRole('button', { name: /Fill \d+ selected/ }).click();
  await expect(page.locator('#event-first')).toHaveValue('');
  await expect(row(review, 'First name')).toContainText('Field changed since scan');
});

test('closing review clears temporary detector state; malformed requests are rejected', async () => {
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/forms/event/');
  const review = await reviewPage(context, page, id);
  await review.getByRole('button', { name: 'Scan page', exact: true }).click();
  await expect(row(review, 'First name')).toBeVisible();
  const tab = Number(new URL(review.url()).searchParams.get('tab'));
  const session = await review.evaluate(async (tabId) => {
    const api = (globalThis as unknown as { chrome: typeof import('wxt/browser').browser }).chrome;
    const result = (await api.tabs.sendMessage(tabId, { type: 'scan' }, { frameId: 0 })) as {
      session: string;
    };
    return result.session;
  }, tab);
  await review.close();
  const reopened = await context.newPage();
  await reopened.goto(`chrome-extension://${id}/review.html?tab=${tab}`);
  const result = await reopened.evaluate(
    async ({ tabId, sessionId }) => {
      const api = (globalThis as unknown as { chrome: typeof import('wxt/browser').browser })
        .chrome;
      return api.tabs.sendMessage(tabId, { type: 'undo', session: sessionId }, { frameId: 0 });
    },
    { tabId: tab, sessionId: session },
  );
  expect(result).toMatchObject({ error: expect.stringContaining('expired') });
  const invalid = await reopened.evaluate(async (tabId) => {
    const api = (globalThis as unknown as { chrome: typeof import('wxt/browser').browser }).chrome;
    return api.tabs.sendMessage(tabId, { type: 'scan', profile: 'not allowed' }, { frameId: 0 });
  }, tab);
  expect(invalid).toEqual({ error: 'Invalid request.' });
});
