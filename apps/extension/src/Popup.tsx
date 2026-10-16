import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { Logo, ThemeToggle, Notice } from '@formpilot/ui';
import { readState, friendlyError, type State } from './storage';
export function Popup() {
  const [state, setState] = useState<State>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    readState()
      .then(setState)
      .catch(() => setError('Local data could not be read. Open profile settings to inspect it.'));
  }, []);
  const profile = state?.data.profiles.find((p) => p.id === state.data.activeProfileId);
  async function open() {
    setBusy(true);
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || !/^https?:\/\//.test(tab.url ?? '')) throw new Error('Unsupported page');
      await browser.windows.create({
        url: browser.runtime.getURL('/review.html') + `?tab=${tab.id}`,
        type: 'popup',
        width: 470,
        height: 840,
      });
      window.close();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="popup-shell">
      <header className="extension-header">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="extension-main stack">
        <h1>
          Your next form,
          <br />a little less work.
        </h1>
        <p className="muted">Review suggested matches, then choose what to fill.</p>
        {error && <Notice tone="error">{error}</Notice>}
        {profile ? (
          <>
            <div className="panel popup-profile">
              <div className="small muted">Active profile</div>
              <strong>{profile.name}</strong>
            </div>
            <button className="primary" onClick={open} disabled={busy}>
              {busy ? 'Opening review…' : 'Review this page'}
            </button>
          </>
        ) : (
          <button
            className="primary"
            disabled={!state}
            onClick={() => browser.runtime.openOptionsPage()}
          >
            {state ? 'Create your first profile' : 'Loading profiles…'}
          </button>
        )}
        <button className="text-button" onClick={() => browser.runtime.openOptionsPage()}>
          Manage profiles & settings
        </button>
        <p className="small muted">
          Nothing is scanned until you click Scan page in the review window.
        </p>
      </main>
    </div>
  );
}
