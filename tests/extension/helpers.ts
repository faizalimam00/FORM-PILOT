import { chromium, expect, type BrowserContext, type Page, type Worker } from '@playwright/test';
import path from 'node:path';
export async function launch() {
  const extension = path.resolve('apps/extension/.output/chrome-mv3');
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    executablePath: process.env.FORMPILOT_CHROMIUM_PATH || undefined,
    viewport: { width: 1280, height: 900 },
    args: [
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`,
      '--enable-unsafe-extension-debugging',
    ],
  });
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  const id = worker.url().split('/')[2]!;
  return { context, worker, id };
}
export async function sample(context: BrowserContext, id: string) {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${id}/options.html`);
  await options.getByRole('button', { name: 'Try a fictional sample' }).click();
  await options.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(options.getByText('Profile saved on this device.')).toBeVisible();
  return options;
}
export async function trigger(context: BrowserContext, page: Page, id: string) {
  await page.bringToFront();
  const browserCdp = await context.browser()!.newBrowserCDPSession();
  const { targetInfos } = await browserCdp.send('Target.getTargets', {
    filter: [{ type: 'tab', exclude: false }],
  });
  const target = targetInfos.find((t) => t.type === 'tab' && t.url === page.url());
  if (!target) throw new Error('The target browser tab was not found.');
  await browserCdp.send('Extensions.triggerAction', { id, targetId: target.targetId });
  let popupTarget = '';
  await expect
    .poll(async () => {
      const { targetInfos } = await browserCdp.send('Target.getTargets', { filter: [{}] });
      popupTarget =
        targetInfos.find((t) => t.url === `chrome-extension://${id}/popup.html`)?.targetId ?? '';
      return !!popupTarget;
    })
    .toBe(true);
  // Chromium exposes action popups as "other", not Playwright Pages. Attach to the real popup.
  const { sessionId } = await browserCdp.send('Target.attachToTarget', {
    targetId: popupTarget,
    flatten: false,
  });
  let sequence = 0;
  async function request(
    method: string,
    params: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    const requestId = ++sequence;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        browserCdp.off('Target.receivedMessageFromTarget', receive);
        reject(new Error(`Popup command timed out: ${method}`));
      }, 8000);
      const receive = (event: { sessionId: string; message: string }) => {
        if (event.sessionId !== sessionId) return;
        const message = JSON.parse(event.message) as {
          id?: number;
          result?: Record<string, unknown>;
          error?: { message: string };
        };
        if (message.id !== requestId) return;
        clearTimeout(timeout);
        browserCdp.off('Target.receivedMessageFromTarget', receive);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result ?? {});
      };
      browserCdp.on('Target.receivedMessageFromTarget', receive);
      void browserCdp
        .send('Target.sendMessageToTarget', {
          sessionId,
          message: JSON.stringify({ id: requestId, method, params }),
        })
        .catch(reject);
    });
  }
  const evaluate = async (expression: string) => {
    const result = await request('Runtime.evaluate', {
      expression,
      returnByValue: true,
      userGesture: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) throw new Error('Popup evaluation failed.');
    return (result.result as { value?: unknown })?.value;
  };
  await expect
    .poll(() => evaluate("document.querySelector('button.primary')?.textContent"))
    .toBe('Review this page');
  return {
    evaluate,
    request,
    close: () => browserCdp.send('Target.closeTarget', { targetId: popupTarget }),
  };
}
export async function reviewPage(context: BrowserContext, page: Page, id: string) {
  const popup = await trigger(context, page, id);
  const opened = context.waitForEvent('page', (p) => p.url().includes('review.html'));
  await popup.evaluate("document.querySelector('button.primary').click()");
  const review = await opened;
  await review.waitForLoadState();
  return review;
}
export async function targetId(worker: Worker, page: Page) {
  await page.bringToFront();
  return worker.evaluate(async () => {
    const api = (globalThis as unknown as { chrome: typeof import('wxt/browser').browser }).chrome;
    const [tab] = await api.tabs.query({ active: true, lastFocusedWindow: true });
    return tab?.id;
  });
}
export const row = (review: Page, label: string) =>
  review
    .locator('.field-card')
    .filter({ has: review.getByLabel(`Select ${label}`, { exact: true }) });
