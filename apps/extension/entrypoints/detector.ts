import { defineUnlistedScript } from 'wxt/utils/define-unlisted-script';
import { browser } from 'wxt/browser';
import { trustedSender } from '../src/trust';
import { createController, commandSchema } from '@formpilot/dom-adapter';
export default defineUnlistedScript(() => {
  const isolated = globalThis as typeof globalThis & { __formpilotDispose?: () => void };
  isolated.__formpilotDispose?.();
  const controller = createController();
  const listener: Parameters<typeof browser.runtime.onMessage.addListener>[0] = (
    raw,
    sender,
    respond,
  ) => {
    if (
      !trustedSender(sender, browser.runtime.id, browser.runtime.getURL('/'), [
        '/review.html',
        '/popup.html',
      ])
    )
      return false;
    const command = commandSchema.safeParse(raw);
    if (!command.success) {
      respond({ error: 'Invalid request.' });
      return false;
    }
    controller.execute(command.data).then(respond, (error) =>
      respond({
        error: error instanceof Error ? error.message : 'The page could not be inspected.',
      }),
    );
    return true;
  };
  browser.runtime.onMessage.addListener(listener);
  const dispose = () => {
    controller.dispose();
    browser.runtime.onMessage.removeListener(listener);
    window.removeEventListener('pagehide', dispose);
  };
  isolated.__formpilotDispose = dispose;
  window.addEventListener('pagehide', dispose, { once: true });
});
