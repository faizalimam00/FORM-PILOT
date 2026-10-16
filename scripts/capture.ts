import { expect } from '@playwright/test';
import { mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { launch, sample, reviewPage, trigger } from '../tests/extension/helpers';
try {
  process.loadEnvFile('.env.test.local');
} catch {
  /* Default Playwright browser otherwise. */
}
export async function captureProduct() {
  mkdirSync('docs/assets', { recursive: true });
  const { context, id } = await launch();
  try {
    const options = await sample(context, id);
    await options.emulateMedia({ reducedMotion: 'reduce' });
    await options.setViewportSize({ width: 1280, height: 900 });
    await options.evaluate(() => scrollTo(0, 0));
    await options.screenshot({ path: 'docs/assets/profile-desktop.png' });
    const form = await context.newPage();
    const response = await form.goto('http://127.0.0.1:4321/forms/event/');
    expect(response?.status()).toBe(200);
    await expect(form.locator('#event-first')).toBeVisible();
    const review = await reviewPage(context, form, id);
    await review.emulateMedia({ reducedMotion: 'reduce' });
    await review.setViewportSize({ width: 470, height: 790 });
    await review.getByRole('button', { name: 'Scan page', exact: true }).click();
    await review.getByText('Scan complete. No form values were changed.').waitFor();
    await review.locator('.field-card details summary').first().click();
    await review.evaluate(() => scrollTo(0, 0));
    await review.screenshot({ path: 'apps/website/public/product-review.png' });
    copyFileSync('apps/website/public/product-review.png', 'docs/assets/product-review.png');
    copyFileSync('apps/website/public/product-review.png', 'apps/website/dist/product-review.png');
    await review.getByRole('button', { name: 'Toggle color theme' }).click();
    await review.screenshot({ path: 'docs/assets/review-dark.png' });
    await review.getByRole('button', { name: 'Toggle color theme' }).click();
    await review.close();
    const popup = await trigger(context, form, id);
    const captured = await popup.request('Page.captureScreenshot', { format: 'png' });
    const popupBytes = Buffer.from(String(captured.data), 'base64');
    const popupDimensions = `${popupBytes.readUInt32BE(16)}x${popupBytes.readUInt32BE(20)}`;
    writeFileSync('docs/assets/launcher.png', popupBytes);
    await popup.close();
    const site = await context.newPage();
    await site.emulateMedia({ reducedMotion: 'reduce' });
    await site.setViewportSize({ width: 1440, height: 1000 });
    await site.goto('http://127.0.0.1:4321/');
    await site
      .locator('img')
      .evaluateAll((images) =>
        Promise.all(
          images.map((img) => (img instanceof HTMLImageElement ? img.decode() : Promise.resolve())),
        ),
      );
    await site.screenshot({ path: 'docs/assets/website-desktop.png', fullPage: true });
    await site.setViewportSize({ width: 375, height: 812 });
    await site.screenshot({ path: 'docs/assets/website-mobile.png', fullPage: true });
    await site.getByRole('button', { name: 'Toggle color theme' }).click();
    await site.screenshot({ path: 'docs/assets/website-mobile-dark.png', fullPage: true });
    await site.goto('http://127.0.0.1:4321/demo/');
    await site.setViewportSize({ width: 1440, height: 1000 });
    await site.getByRole('button', { name: 'Inspect this demo' }).click();
    await site.screenshot({ path: 'docs/assets/playground.png', fullPage: true });
    writeFileSync(
      'docs/assets/capture-info.json',
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          browser: context.browser()?.version() ?? 'persistent Chromium',
          source: 'Production extension and Astro static preview',
          profile: 'Fictional Alex Morgan only',
          viewports: {
            review: '470x790',
            popup: popupDimensions,
            options: '1280x900',
            desktop: '1440x1000',
            mobile: '375x812',
          },
        },
        null,
        2,
      ) + '\n',
    );
    console.log(
      'Captured production extension, profiles, launcher, playground and responsive website using fictional data.',
    );
  } finally {
    await context.close();
  }
}
if (process.argv[1]?.endsWith('/capture.ts')) await captureProduct();
