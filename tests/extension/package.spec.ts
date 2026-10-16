import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { unzipSync } from 'fflate';
import { launch, sample, trigger } from './helpers';

test('downloaded ZIP loads in Chromium and fills directly from its toolbar popup', async ({
  request,
}) => {
  const release = (await (await request.get('/downloads/release.json')).json()) as {
    filename: string;
    sha256: string;
    bytes: number;
    version: string;
  };
  expect(release.filename).toMatch(/^formpilot-\d+\.\d+\.\d+-chrome\.zip$/);
  const response = await request.get(`/downloads/${release.filename}`);
  expect(response.ok()).toBe(true);
  const zip = await response.body();
  expect(zip.length).toBe(release.bytes);
  expect(createHash('sha256').update(zip).digest('hex')).toBe(release.sha256);
  expect(await (await request.get('/downloads/SHA256SUMS.txt')).text()).toBe(
    `${release.sha256}  ${release.filename}\n`,
  );
  expect(zip.equals(readFileSync(`dist/releases/${release.filename}`))).toBe(true);
  expect(zip.equals(readFileSync(`downloads/${release.filename}`))).toBe(true);
  const directory = mkdtempSync(join(tmpdir(), 'formpilot-package-'));
  const files = unzipSync(zip);
  for (const [name, data] of Object.entries(files)) {
    expect(name).not.toMatch(/(^\/|\\|(^|\/)\.\.?($|\/))/);
    const destination = join(directory, name);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, data);
    expect(
      Buffer.from(data).equals(
        readFileSync(`dist/releases/${release.filename.replace(/\.zip$/, '')}/${name}`),
      ),
    ).toBe(true);
    if (!['INSTALL.txt', 'LICENSE.txt', 'THIRD-PARTY-NOTICES.txt'].includes(name))
      expect(
        Buffer.from(data).equals(readFileSync(`apps/extension/.output/chrome-mv3/${name}`)),
      ).toBe(true);
  }
  expect(files['manifest.json']).toBeDefined();
  expect(files['INSTALL.txt']).toBeDefined();
  expect(files['LICENSE.txt']).toBeDefined();
  expect(
    Object.keys(files).some((name) => /\.map$|\.env|node_modules|profile.*\.json/.test(name)),
  ).toBe(false);
  const app = await launch(directory);
  try {
    await sample(app.context, app.id);
    const page = await app.context.newPage();
    await page.goto('http://127.0.0.1:4321/install/');
    const download = page.getByRole('link', {
      name: `Download FormPilot v${release.version}`,
      exact: true,
    });
    await expect(download).toHaveAttribute('href', `/downloads/${release.filename}`);
    const [saved] = await Promise.all([page.waitForEvent('download'), download.click()]);
    expect(saved.suggestedFilename()).toBe(release.filename);
    expect(await saved.failure()).toBeNull();
    for (const width of [1440, 375]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
          .violations,
      ).toEqual([]);
      await page.screenshot({ path: `test-results/install-${width}.png`, fullPage: true });
    }
    await page.goto('http://127.0.0.1:4321/forms/event/');
    const popup = await trigger(app.context, page, app.id);
    const pagesBefore = app.context.pages().length;
    await expect(page.locator('#event-first')).toHaveValue('');
    await popup.evaluate("document.querySelector('button.primary').click()");
    await expect.poll(() => popup.evaluate('document.body.innerText')).toContain('fields filled.');
    expect(app.context.pages()).toHaveLength(pagesBefore);
    await expect(page.locator('#event-first')).toHaveValue('Alex');
    await expect(page.locator('#event-email')).toHaveValue('alex.morgan@example.com');
    expect(page.url()).toContain('/forms/event/');
  } finally {
    await app.context.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
