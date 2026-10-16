import { test, expect, type BrowserContext } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { launch, sample, reviewPage } from './helpers';
let context: BrowserContext;
test.afterEach(async () => {
  await context?.close();
});
test('playground uses the real matcher, fills fictional details, resets and completes locally', async () => {
  ({ context } = await launch());
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4321/demo/');
  await page.getByRole('button', { name: 'Inspect this demo', exact: true }).click();
  await expect(page.locator('.field-card')).toHaveCount(10);
  await expect(page.locator('#event-first')).toHaveValue('');
  await page.getByRole('button', { name: 'Fill selected sample details' }).click();
  await expect(page.locator('#event-first')).toHaveValue('Alex');
  await page.getByRole('button', { name: 'Undo last demo fill' }).click();
  await expect(page.locator('#event-first')).toHaveValue('');
  await page.getByRole('button', { name: 'Complete demo locally' }).click();
  await expect(
    page.getByText('Demo completed locally. No details were sent anywhere.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Reset form' }).click();
  await expect(page.locator('#event-first')).toHaveValue('');
  expect(errors).toEqual([]);
});
test('desktop, mobile and dark mode are accessible without horizontal overflow', async () => {
  ({ context } = await launch());
  const page = await context.newPage();
  for (const width of [1440, 375])
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.goto('http://127.0.0.1:4321/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    }
  await page.goto('http://127.0.0.1:4321/demo/');
  await page.getByRole('button', { name: 'Inspect this demo' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
});
test('extension options and compact review pass automated accessibility checks', async () => {
  const app = await launch();
  context = app.context;
  const options = await sample(context, app.id);
  await options.setViewportSize({ width: 1280, height: 900 });
  expect(
    (await new AxeBuilder({ page: options }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  const form = await context.newPage();
  await form.goto('http://127.0.0.1:4321/forms/event/');
  const review = await reviewPage(context, form, app.id);
  await review.setViewportSize({ width: 430, height: 840 });
  await review.getByRole('button', { name: 'Scan page', exact: true }).click();
  await expect(review.locator('.field-card')).toHaveCount(10);
  expect(await review.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
    true,
  );
  expect(
    (await new AxeBuilder({ page: review }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
});
test('static routes have unique titles and honest unconfigured SEO; internal links resolve', async () => {
  ({ context } = await launch());
  const page = await context.newPage();
  const paths = [
    '/',
    '/demo/',
    '/install/',
    '/how-it-works/',
    '/privacy/',
    '/docs/',
    '/benchmarks/',
    '/about/',
    '/limitations/',
    '/articles/',
    '/articles/reuse-your-details/',
    '/articles/autofill-privacy/',
    '/articles/uncertain-matches/',
    '/forms/event/',
    '/forms/job/',
    '/forms/shipping/',
    '/forms/saas/',
    '/forms/difficult/',
  ];
  const titles = new Set<string>();
  const links = new Set<string>();
  for (const path of paths) {
    const response = await page.goto(`http://127.0.0.1:4321${path}`);
    expect(response?.status()).toBe(200);
    const title = await page.title();
    expect(titles.has(title)).toBe(false);
    titles.add(title);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[name=description]')).toHaveAttribute('content', /.{40,}/);
    await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex, nofollow');
    expect(await page.locator('link[rel=canonical]').count()).toBe(0);
    (
      await page
        .locator('a[href^="/"]')
        .evaluateAll((els) => els.map((el) => el.getAttribute('href')!))
    ).forEach((h) => links.add(h));
  }
  for (const link of links)
    expect((await context.request.get(`http://127.0.0.1:4321${link}`)).status()).toBe(200);
  expect(await (await context.request.get('http://127.0.0.1:4321/robots.txt')).text()).toContain(
    'Disallow: /',
  );
});
