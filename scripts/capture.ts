import { expect } from '@playwright/test';
import { mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'node:fs';
import { launch, sample, trigger } from '../tests/extension/helpers';
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
    const popup = await trigger(context, form, id);
    await popup.request('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-color-scheme', value: 'light' },
        { name: 'prefers-reduced-motion', value: 'reduce' },
      ],
    });
    await popup.evaluate(readFileSync('node_modules/axe-core/axe.min.js', 'utf8'));
    const checkPopup = async () => {
      expect(
        await popup.evaluate(
          `axe.run({runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa']}}).then(result => result.violations.map(v => ({id: v.id, nodes: v.nodes.map(n => n.target)})))`,
        ),
      ).toEqual([]);
    };
    await checkPopup();
    const screenshot = async (file: string) => {
      await popup.evaluate(
        'new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
      );
      const captured = await popup.request('Page.captureScreenshot', { format: 'png' });
      const bytes = Buffer.from(String(captured.data), 'base64');
      writeFileSync(file, bytes);
      return `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`;
    };
    const popupDimensions = await screenshot('docs/assets/launcher.png');
    expect(await popup.evaluate('document.documentElement.scrollWidth <= innerWidth')).toBe(true);
    await popup.evaluate("document.querySelector('button.primary').click()");
    await expect.poll(() => popup.evaluate('document.body.innerText')).toContain('fields filled.');
    expect(
      await popup.evaluate(
        `Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Undo last fill').getBoundingClientRect().bottom <= innerHeight`,
      ),
    ).toBe(true);
    await checkPopup();
    const filledDimensions = await screenshot('apps/website/public/product-review.png');
    copyFileSync('apps/website/public/product-review.png', 'docs/assets/product-review.png');
    copyFileSync('apps/website/public/product-review.png', 'apps/website/dist/product-review.png');
    await popup.evaluate(
      `Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Review fields & corrections').click()`,
    );
    await expect.poll(() => popup.evaluate('document.body.innerText')).toContain('Scan complete.');
    expect(await popup.evaluate('document.documentElement.scrollWidth <= innerWidth')).toBe(true);
    await checkPopup();
    const reviewDimensions = await screenshot('docs/assets/popup-review.png');
    await popup.evaluate(
      `document.querySelector('button[aria-label="Toggle color theme"]').click()`,
    );
    await checkPopup();
    await screenshot('docs/assets/review-dark.png');
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
            review: reviewDimensions,
            filled: filledDimensions,
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
