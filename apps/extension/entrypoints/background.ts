import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import { trustedSender } from '../src/trust';
import { readState, writeSchema, clearSchema, emptyState } from '../src/storage';
export default defineBackground(() => {
  const ready = browser.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
  let queue: Promise<unknown> = Promise.resolve();
  browser.runtime.onMessage.addListener((raw, sender, sendResponse) => {
    if (
      !trustedSender(sender, browser.runtime.id, browser.runtime.getURL('/'), [
        '/options.html',
        '/review.html',
        '/popup.html',
      ])
    )
      return false;
    const write = writeSchema.safeParse(raw);
    const clear = clearSchema.safeParse(raw);
    if (!write.success && !clear.success) {
      sendResponse({ ok: false, error: 'Invalid extension message.' });
      return false;
    }
    queue = queue
      .catch(() => undefined)
      .then(async () => {
        await ready;
        const current = await readState();
        const expected = write.success ? write.data.expectedRevision : clear.data!.expectedRevision;
        if (current.revision !== expected)
          throw new Error('Data changed in another window. Reload this page before saving.');
        const state = write.success ? write.data.state : emptyState();
        state.revision = current.revision + 1;
        if (clear.success) await browser.storage.local.clear();
        await browser.storage.local.set({ formpilot: state });
        return { ok: true, state };
      });
    queue.then(sendResponse, (error) =>
      sendResponse({
        ok: false,
        error:
          error instanceof Error && error.message.includes('changed in another')
            ? error.message
            : 'Local storage could not be updated. Check available disk space and retry.',
      }),
    );
    return true;
  });
});
