import { useCallback, useEffect, useRef, useState } from 'react';
import { browser } from 'wxt/browser';
import { z } from 'zod';
import { Logo, ThemeToggle, Notice, Spinner } from '@formpilot/ui';
import { ReviewFields, makeRows, type ReviewRow } from '@formpilot/ui/review';
import { getValue } from '@formpilot/profile-schema';
import { matchFields, memoryFor, selectValue } from '@formpilot/matching-engine';
import { scanSchema, resultsSchema, type Scan, type Command } from '@formpilot/dom-adapter';
import { readState, saveState, friendlyError, stateSchema, type State } from './storage';
export function Review({ compact = false }: { compact?: boolean }) {
  const targetRef = useRef<number | null>(
    compact ? null : Number(new URLSearchParams(location.search).get('tab')),
  );
  const send = useCallback(async (command: Command): Promise<unknown> => {
    if (!targetRef.current) throw new Error('No target tab');
    const result: unknown = await browser.tabs.sendMessage(targetRef.current, command, {
      frameId: 0,
    });
    const error = z.object({ error: z.string() }).safeParse(result);
    if (error.success) throw new Error(error.data.error);
    return result;
  }, []);
  const [review, setReview] = useState(!compact);
  const [state, setState] = useState<State>();
  const [scan, setScan] = useState<Scan>();
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [canUndo, setCanUndo] = useState(false);
  const scanRef = useRef<Scan | undefined>(undefined);
  const stateRef = useRef<State | undefined>(undefined);
  stateRef.current = state;
  const profile = state?.data.profiles.find((p) => p.id === state.data.activeProfileId);
  useEffect(() => {
    readState()
      .then(setState)
      .catch(() => setError('Local profiles could not be read. Open settings to check your data.'));
    const unload = () => {
      if (scanRef.current) void send({ type: 'clear' }).catch(() => undefined);
    };
    window.addEventListener('pagehide', unload);
    return () => {
      window.removeEventListener('pagehide', unload);
      unload();
    };
  }, [send]);
  useEffect(() => {
    const listener = (changes: Record<string, { newValue?: unknown }>, area: string) => {
      if (area !== 'local' || !changes.formpilot) return;
      const parsed = stateSchema.safeParse(changes.formpilot.newValue);
      if (!parsed.success) return;
      const next = parsed.data;
      const changed = JSON.stringify(stateRef.current?.data) !== JSON.stringify(next.data);
      stateRef.current = next;
      setState(next);
      if (changed) {
        setScan(undefined);
        scanRef.current = undefined;
        setRows([]);
        setCanUndo(false);
        void send({ type: 'clear' }).catch(() => undefined);
        setStatus('Profile data changed. Scan again to use the latest saved details.');
      }
    };
    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }, [send]);
  async function scanPage(autofill = false) {
    if (!profile) return;
    setBusy(true);
    setError('');
    setStatus('');
    setCanUndo(false);
    setScan(undefined);
    setRows([]);
    try {
      if (compact && targetRef.current === null) {
        const [active] = await browser.tabs.query({ active: true, currentWindow: true });
        targetRef.current = active?.id ?? null;
      }
      const tabId = targetRef.current;
      if (!tabId || !Number.isInteger(tabId) || tabId <= 0) throw new Error('No target tab');
      const tab = await browser.tabs.get(tabId);
      if (!/^https?:\/\//.test(tab.url ?? '')) throw new Error('Unsupported page');
      await browser.scripting.executeScript({
        target: { tabId },
        files: ['/detector.js'],
        world: 'ISOLATED',
      });
      const next = scanSchema.parse(await send({ type: 'scan' }));
      setScan(next);
      scanRef.current = next;
      const nextRows = makeRows(matchFields(next.fields, profile, next.origin, state?.memories));
      setRows(nextRows);
      setStatus(
        next.fields.length
          ? 'Scan complete. No form values were changed.'
          : 'No supported form fields found in this document.',
      );
      if (autofill && next.fields.length) await applyFill(next, nextRows);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }
  function update(token: string, patch: Partial<ReviewRow>) {
    setRows((current) =>
      current.map((row) => (row.match.field.token === token ? { ...row, ...patch } : row)),
    );
  }
  async function applyFill(currentScan: Scan, currentRows: ReviewRow[]) {
    if (!profile || !state) return;
    const selected = currentRows.filter((r) => r.selected && r.property && !r.match.excluded);
    const missing: string[] = [];
    const items = selected.flatMap((row) => {
      const raw = getValue(profile, row.property!);
      const value =
        row.match.field.tag === 'select'
          ? selectValue(raw, row.match.field.options, row.property!, profile.country)
          : raw;
      if (value === null) {
        missing.push(row.match.field.token);
        return [];
      }
      return [{ token: row.match.field.token, value, replace: row.replace }];
    });
    const response = items.length
      ? resultsSchema.parse(await send({ type: 'fill', session: currentScan.session, items }))
      : { results: [] };
    missing.forEach((token) =>
      response.results.push({ token, status: 'No compatible dropdown option' }),
    );
    const filled = response.results.filter((r) => r.status === 'Filled');
    setCanUndo(filled.length > 0);
    const memories = selected
      .filter(
        (row) =>
          row.remember &&
          row.changed &&
          row.property &&
          filled.some((r) => r.token === row.match.field.token),
      )
      .map((row) => memoryFor(row.match.field, currentScan.origin, row.property!));
    if (memories.length) {
      const latest = await readState();
      await saveState({
        ...latest,
        memories: [
          ...latest.memories.filter(
            (m) => !memories.some((n) => n.origin === m.origin && n.fingerprint === m.fingerprint),
          ),
          ...memories,
        ],
      });
    }
    setRows(
      currentRows.map((row) => ({
        ...row,
        selected: false,
        status:
          response.results.find((r) => r.token === row.match.field.token)?.status ??
          (row.match.excluded
            ? 'Excluded control'
            : row.match.field.hasValue
              ? 'Skipped because it already contains a value'
              : !row.property
                ? 'No reliable match'
                : !getValue(profile, row.property)
                  ? 'No saved value in this profile'
                  : 'Needs your selection'),
      })),
    );
    setStatus(
      `${filled.length} field${filled.length === 1 ? '' : 's'} filled.${compact && !review ? ` ${currentRows.length - filled.length} left unchanged.` : ' The form has not been submitted. Rescan before another fill.'}${missing.length ? ' Some dropdown options were incompatible.' : ''}`,
    );
  }
  async function fill() {
    if (!scan) return;
    setBusy(true);
    setError('');
    try {
      await applyFill(scan, rows);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }
  async function undo() {
    if (!scan) return;
    setBusy(true);
    setError('');
    try {
      const response = resultsSchema.parse(await send({ type: 'undo', session: scan.session }));
      setRows((current) =>
        current.map((row) => ({
          ...row,
          status:
            response.results.find((r) => r.token === row.match.field.token)?.status ?? row.status,
        })),
      );
      const restored = response.results.filter((r) => r.status === 'Restored').length;
      setStatus(
        `Undo: restored ${restored} of ${response.results.length} fields. Edited, changed or expired fields are left untouched.`,
      );
      setCanUndo(false);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }
  const selected = rows.filter((r) => r.selected).length;
  return (
    <div
      className={`extension-shell ${compact ? 'popup-shell' : ''} ${scan && review ? 'review-scanned' : ''} ${compact && !review ? 'quick-fill' : ''}`}
    >
      <header className="extension-header">
        <Logo />
        <div className="row">
          {compact && review ? (
            <button className="text-button small" disabled={busy} onClick={() => setReview(false)}>
              Back
            </button>
          ) : (
            <button className="text-button small" onClick={() => browser.runtime.openOptionsPage()}>
              Profiles
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>
      <main className="extension-main">
        <div className="stack">
          {!scan && review && (
            <div className="eyeline">
              <span className="dot" />
              Your details stay on this device
            </div>
          )}
          <div className={`review-intro ${!review && scan ? 'quick-complete' : ''}`}>
            <h1>
              {!review
                ? 'Your details. One click.'
                : scan
                  ? 'Review this form.'
                  : 'A final look. Then fill.'}
            </h1>
            {!review && (
              <p className="muted small">Fill matching fields with your saved profile.</p>
            )}
            {!scan && review && (
              <p className="muted small" style={{ marginTop: 8 }}>
                You decide what goes into this form.
              </p>
            )}
          </div>
          {error && <Notice tone="error">{error}</Notice>}
          {!state && !error && <p>Loading profiles…</p>}
          {state && (
            <label>
              Use profile
              <select
                value={state.data.activeProfileId ?? ''}
                disabled={busy}
                onChange={async (e) => {
                  try {
                    setState(
                      await saveState({
                        ...state,
                        data: { ...state.data, activeProfileId: e.target.value },
                      }),
                    );
                  } catch (err) {
                    setError(friendlyError(err));
                  }
                }}
              >
                <option value="" disabled>
                  Choose a saved profile
                </option>
                {state.data.profiles.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!profile && state && (
            <Notice>
              Create a profile in{' '}
              <button className="text-button" onClick={() => browser.runtime.openOptionsPage()}>
                profile settings
              </button>{' '}
              to start.
            </Notice>
          )}
          <button
            className="primary scan-button"
            onClick={() => scanPage(!review)}
            disabled={!profile || busy}
          >
            {busy ? (
              <>
                <Spinner />
                Working…
              </>
            ) : !review ? (
              'Fill form'
            ) : scan ? (
              'Rescan page'
            ) : (
              'Scan page'
            )}
          </button>
          {!review && !scan && (
            <p className="small muted">
              Fills all high-confidence matches. Existing values and uncertain fields stay
              untouched.
            </p>
          )}
          {scan && <p className="target-origin">{scan.origin}</p>}
          {status &&
            (status.startsWith('Scan complete') ? (
              <p className="scan-confirmation" role="status">
                {status}
              </p>
            ) : (
              <Notice tone="success">{status}</Notice>
            ))}
          {!review && canUndo && (
            <button className="secondary" onClick={undo} disabled={busy}>
              Undo last fill
            </button>
          )}
          {!review && (
            <button
              className="text-button small"
              disabled={!profile || busy}
              onClick={() => {
                setReview(true);
                void scanPage();
              }}
            >
              Review fields & corrections
            </button>
          )}
          {!review && rows.length > 0 && (
            <details className="fill-results">
              <summary>Field results ({rows.length})</summary>
              <ul>
                {rows.map((row) => (
                  <li key={row.match.field.token}>
                    <strong>
                      {row.match.field.label ||
                        row.match.field.ariaLabel ||
                        row.match.field.labelledBy ||
                        row.match.field.name ||
                        row.match.field.id ||
                        'Unlabelled field'}
                    </strong>
                    <span>{row.status ?? 'Not filled'}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
          {!review && !scan && (
            <p className="small muted">
              Never submits. Websites can read filled values. Undo is available here for up to 5
              minutes; closing this popup or scanning again clears it.
            </p>
          )}
        </div>
        {review && scan && profile && (
          <>
            <div className="review-summary">
              <div>
                <strong>{rows.length}</strong>
                <span>detected</span>
              </div>
              <div>
                <strong>{rows.filter((r) => r.match.confidence === 'high').length}</strong>
                <span>high confidence</span>
              </div>
              <div>
                <strong>{selected}</strong>
                <span>selected</span>
              </div>
            </div>
            <ReviewFields
              rows={rows}
              profile={profile}
              onChange={update}
              disabled={busy}
              allowRemember
              onHighlight={(token) => {
                void send({ type: 'highlight', session: scan.session, token }).catch((e) =>
                  setError(friendlyError(e)),
                );
              }}
            />
            <details>
              <summary className="small muted">Page support & scan limits</summary>
              {scan.warnings.map((w) => (
                <p className="small muted" key={w}>
                  {w}
                </p>
              ))}
            </details>
          </>
        )}
        {review && !scan && (
          <div className="empty-state" style={{ marginTop: 25 }}>
            <h2>Review comes first.</h2>
            <p className="small muted">
              Scan reads field labels and supported controls. It never fills, submits or moves to
              the next page.
            </p>
          </div>
        )}
      </main>
      {review && (
        <footer className="review-footer">
          {canUndo && (
            <button className="text-button small" onClick={undo} disabled={busy}>
              Undo last fill (up to 5 minutes)
            </button>
          )}
          <button className="button" onClick={fill} disabled={!selected || busy || !scan}>
            Fill{' '}
            {selected
              ? `${selected} selected field${selected === 1 ? '' : 's'}`
              : 'selected fields'}
          </button>
          <p>The website can read the values you choose to fill.</p>
        </footer>
      )}
    </div>
  );
}
