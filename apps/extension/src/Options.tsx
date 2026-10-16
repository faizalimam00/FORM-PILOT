import { useEffect, useState } from 'react';
import { Logo, ThemeToggle, Notice } from '@formpilot/ui';
import {
  emptyProfile,
  sampleProfile,
  profileSchema,
  getValue,
  parseImport,
  applyImport,
  exportProfiles,
  propertyLabels,
  type Profile,
  type ProfileExport,
} from '@formpilot/profile-schema';
import { readState, saveState, clearState, type State } from './storage';
type Editable = Exclude<keyof Profile, 'id' | 'custom'>;
const groups: [string, Editable[]][] = [
  ['Identity', ['firstName', 'middleName', 'lastName', 'preferredName', 'fullNameOverride']],
  ['Contact', ['email', 'phone', 'callingCode']],
  ['Address', ['address1', 'address2', 'city', 'region', 'postalCode', 'country']],
  ['Professional', ['jobTitle', 'company', 'portfolio', 'github', 'linkedin', 'bio']],
];
export function Options() {
  const [state, setState] = useState<State>();
  const [draft, setDraft] = useState<Profile>();
  const [saved, setSaved] = useState('');
  const [tab, setTab] = useState<'profiles' | 'data' | 'memories'>('profiles');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [incoming, setIncoming] = useState<ProfileExport>();
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const dirty = !!draft && JSON.stringify(draft) !== saved;
  useEffect(() => {
    readState()
      .then((next) => {
        setState(next);
        const p =
          next.data.profiles.find((p) => p.id === next.data.activeProfileId) ??
          next.data.profiles[0];
        setDraft(p);
        setSaved(JSON.stringify(p));
      })
      .catch(() =>
        setError(
          'Local data is invalid or unavailable. Try reloading. Your stored data has not been overwritten.',
        ),
      );
  }, []);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  function switchDraft(next: Profile) {
    if (dirty && !confirm('Discard your unsaved profile changes?')) return;
    setDraft(structuredClone(next));
    setSaved(JSON.stringify(next));
    setTab('profiles');
    setError('');
    setMessage('');
  }
  function create(kind: Profile['kind'], sample = false) {
    if (!state || busy) return;
    if (dirty && !confirm('Discard your unsaved profile changes?')) return;
    setDraft(
      sample ? { ...structuredClone(sampleProfile), id: crypto.randomUUID() } : emptyProfile(kind),
    );
    setSaved('');
    setTab('profiles');
    setMessage('');
    setError('');
  }
  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setDraft((p) => (p ? { ...p, [key]: value } : p));
    setMessage('');
  }
  async function commit(next: State, success: string) {
    setBusy(true);
    setError('');
    try {
      const stored = await saveState(next);
      setState(stored);
      setMessage(success);
      return stored;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
      return undefined;
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!state || !draft) return;
    const valid = profileSchema.safeParse(draft);
    if (!valid.success) {
      setError(
        valid.error.issues
          .slice(0, 6)
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join(' · '),
      );
      return;
    }
    const profiles = state.data.profiles.filter((p) => p.id !== draft.id).concat(valid.data);
    if (profiles.length > 20) {
      setError('You can save up to 20 profiles.');
      return;
    }
    const stored = await commit(
      { ...state, data: exportProfiles(profiles, state.data.activeProfileId ?? draft.id) },
      'Profile saved on this device.',
    );
    if (stored) {
      setDraft(valid.data);
      setSaved(JSON.stringify(valid.data));
    }
  }
  async function remove() {
    if (
      !state ||
      !draft ||
      !confirm(`Delete “${draft.name}” from this device? Export it first if you want a backup.`)
    )
      return;
    const profiles = state.data.profiles.filter((p) => p.id !== draft.id);
    const active =
      state.data.activeProfileId === draft.id
        ? (profiles[0]?.id ?? null)
        : state.data.activeProfileId;
    const stored = await commit(
      { ...state, data: exportProfiles(profiles, active) },
      'Profile deleted.',
    );
    if (stored) {
      setDraft(profiles[0]);
      setSaved(JSON.stringify(profiles[0]));
    }
  }
  function download() {
    if (!state) return;
    const blob = new Blob(
      [JSON.stringify(exportProfiles(state.data.profiles, state.data.activeProfileId), null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'formpilot-profiles-v1.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('Export created. Keep this personal-information file private.');
  }
  async function importFile(file?: File) {
    setIncoming(undefined);
    setError('');
    if (!file) return;
    if (file.size > 512_000) {
      setError('Import is too large. The limit is 500 KB.');
      return;
    }
    try {
      setIncoming(parseImport(await file.text()));
    } catch {
      setError(
        'This file is not a valid FormPilot v1 profile export. Check its schema, IDs, emails, URLs and custom fields. Nothing was imported.',
      );
    }
  }
  async function importProfiles() {
    if (!state || !incoming) return;
    if (
      dirty &&
      !confirm('Importing will replace the open editor with saved data. Discard unsaved changes?')
    )
      return;
    try {
      const data = applyImport(state.data, incoming, mode);
      const stored = await commit(
        { ...state, data },
        `Profiles ${mode === 'merge' ? 'merged' : 'replaced'} on this device.`,
      );
      if (stored) {
        const next = data.profiles.find((p) => p.id === data.activeProfileId) ?? data.profiles[0];
        setDraft(next);
        setSaved(JSON.stringify(next));
        setIncoming(undefined);
      }
    } catch {
      setError('Import could not be applied. The merged collection may exceed 20 profiles.');
    }
  }
  async function deleteAll() {
    if (
      !state ||
      !confirm(
        'Delete ALL FormPilot profiles and remembered mappings on this device? This cannot be undone. Export profiles first if needed.',
      )
    )
      return;
    setBusy(true);
    try {
      setState(await clearState(state.revision));
      setDraft(undefined);
      setSaved('');
      setIncoming(undefined);
      setMessage('All saved FormPilot data was deleted.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete data.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header className="extension-header">
        <Logo />
        <div className="row">
          <span className="small muted">Your details. Your device.</span>
          <ThemeToggle />
        </div>
      </header>
      <div className="options-layout">
        <aside className="options-nav">
          <p className="small muted" style={{ margin: '0 0 12px 16px' }}>
            Your profiles
          </p>
          <div className="profile-buttons">
            {state?.data.profiles.map((p) => (
              <button
                key={p.id}
                aria-pressed={tab === 'profiles' && draft?.id === p.id}
                onClick={() => switchDraft(p)}
              >
                {p.name}
                {p.id === state.data.activeProfileId && (
                  <span className="pill" style={{ marginLeft: 8 }}>
                    Active
                  </span>
                )}
              </button>
            ))}
          </div>
          <button disabled={!state || busy} onClick={() => create('personal')}>
            + New personal profile
          </button>
          <button disabled={!state || busy} onClick={() => create('work')}>
            + New work profile
          </button>
          <hr />
          <button aria-pressed={tab === 'data'} onClick={() => setTab('data')}>
            Import, export & privacy
          </button>
          <button aria-pressed={tab === 'memories'} onClick={() => setTab('memories')}>
            Remembered mappings
          </button>
          <p className="small muted" style={{ padding: 16 }}>
            Stored locally in this browser.
            <br />
            No account. No cloud sync.
          </p>
        </aside>
        <main className="options-main" id="main">
          <div className="stack">
            {error && <Notice tone="error">{error}</Notice>}
            {message && <Notice tone="success">{message}</Notice>}
            {!state && !error && <p role="status">Loading your local profiles…</p>}
            {tab === 'profiles' && state && (
              <>
                {draft ? (
                  <>
                    <div className="row between">
                      <div>
                        <h1>Your reusable details.</h1>
                        <p className="muted" style={{ marginTop: 10 }}>
                          A little setup now. Less typing next time.
                        </p>
                      </div>
                      <span className={`pill ${dirty ? 'review' : ''}`}>
                        {dirty ? 'Unsaved changes' : 'Saved locally'}
                      </span>
                    </div>
                    <div className="grid-2">
                      <label>
                        Profile name
                        <input
                          value={draft.name}
                          maxLength={60}
                          onChange={(e) => update('name', e.target.value)}
                        />
                      </label>
                      <label>
                        Profile type
                        <select
                          value={draft.kind}
                          onChange={(e) => update('kind', e.target.value as Profile['kind'])}
                        >
                          <option value="personal">Personal</option>
                          <option value="work">Work</option>
                        </select>
                      </label>
                    </div>
                    {state?.data.profiles.some((p) => p.id === draft.id) && (
                      <div className="row">
                        <span className="small muted">
                          {state.data.activeProfileId === draft.id
                            ? 'This profile is active for new reviews.'
                            : 'Choose this profile explicitly before filling.'}
                        </span>
                        {state.data.activeProfileId !== draft.id && (
                          <button
                            className="secondary"
                            disabled={busy}
                            onClick={() =>
                              commit(
                                { ...state, data: { ...state.data, activeProfileId: draft.id } },
                                'Active profile changed.',
                              )
                            }
                          >
                            Make active profile
                          </button>
                        )}
                      </div>
                    )}
                    {groups.map(([heading, keys]) => (
                      <fieldset className="profile-group" key={heading}>
                        <legend>{heading}</legend>
                        <div className="grid-2">
                          {keys.map((key) => (
                            <label
                              key={key}
                              className={['bio', 'fullNameOverride'].includes(key) ? 'wide' : ''}
                            >
                              {key === 'fullNameOverride'
                                ? 'Full name override (optional)'
                                : propertyLabels[key as keyof typeof propertyLabels]}
                              {key === 'bio' ? (
                                <textarea
                                  value={String(draft[key])}
                                  maxLength={2000}
                                  onChange={(e) => update(key, e.target.value)}
                                />
                              ) : (
                                <input
                                  type={
                                    key === 'email'
                                      ? 'email'
                                      : ['portfolio', 'github', 'linkedin'].includes(key)
                                        ? 'url'
                                        : ['phone', 'callingCode'].includes(key)
                                          ? 'tel'
                                          : 'text'
                                  }
                                  value={String(draft[key])}
                                  maxLength={500}
                                  onChange={(e) => update(key, e.target.value)}
                                />
                              )}
                              {key === 'fullNameOverride' && (
                                <span className="small muted">
                                  Full name used:{' '}
                                  {getValue(draft, 'fullName') || 'Add name components above'}
                                </span>
                              )}
                              {key === 'callingCode' && (
                                <span className="small muted">
                                  Stored separately, for example +1. Put a complete number in Phone
                                  when a form expects one.
                                </span>
                              )}
                              {key === 'country' && (
                                <span className="small muted">
                                  Country name or two-letter code. Matching supports a documented
                                  set of aliases.
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ))}
                    <section className="profile-group">
                      <h2 style={{ fontSize: 22 }}>Additional fields</h2>
                      <p className="small muted" style={{ marginTop: 12 }}>
                        Useful details you choose. Never store passwords, payment details,
                        government IDs or authentication tokens.
                      </p>
                      {draft.custom.map((f, index) => (
                        <div className="custom-row grid-2" key={f.id}>
                          <label>
                            Field label
                            <input
                              value={f.label}
                              onChange={(e) =>
                                update(
                                  'custom',
                                  draft.custom.map((c, i) =>
                                    i === index ? { ...c, label: e.target.value } : c,
                                  ),
                                )
                              }
                            />
                          </label>
                          <label>
                            Type
                            <select
                              value={f.type}
                              onChange={(e) =>
                                update(
                                  'custom',
                                  draft.custom.map((c, i) =>
                                    i === index
                                      ? { ...c, type: e.target.value as typeof f.type }
                                      : c,
                                  ),
                                )
                              }
                            >
                              {['text', 'email', 'tel', 'url', 'textarea'].map((t) => (
                                <option key={t}>{t}</option>
                              ))}
                            </select>
                          </label>
                          <label className="wide">
                            Value
                            <textarea
                              value={f.value}
                              maxLength={2000}
                              onChange={(e) =>
                                update(
                                  'custom',
                                  draft.custom.map((c, i) =>
                                    i === index ? { ...c, value: e.target.value } : c,
                                  ),
                                )
                              }
                            />
                          </label>
                          <button
                            className="text-button danger"
                            onClick={() =>
                              update(
                                'custom',
                                draft.custom.filter((c) => c.id !== f.id),
                              )
                            }
                          >
                            Remove field
                          </button>
                        </div>
                      ))}
                      <button
                        className="secondary"
                        style={{ marginTop: 18 }}
                        disabled={draft.custom.length >= 30}
                        onClick={() =>
                          update('custom', [
                            ...draft.custom,
                            { id: crypto.randomUUID(), label: '', type: 'text', value: '' },
                          ])
                        }
                      >
                        Add a field
                      </button>
                    </section>
                    <div className="save-bar row between">
                      <button className="primary" disabled={busy || !dirty} onClick={save}>
                        {busy ? 'Saving…' : 'Save profile'}
                      </button>
                      <button className="text-button danger" disabled={busy} onClick={remove}>
                        Delete profile
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="panel stack">
                    <h1>Make yourself at home.</h1>
                    <p className="muted">
                      Save your details once, then fill matching fields with one click. You can
                      review and correct individual matches whenever you need to.
                    </p>
                    <div className="row">
                      <button className="primary" onClick={() => create('personal')}>
                        Create personal profile
                      </button>
                      <button className="secondary" onClick={() => create('personal', true)}>
                        Try a fictional sample
                      </button>
                    </div>
                    <Notice>
                      Your details are stored in this browser’s extension-local storage. It is not
                      encrypted by FormPilot or protected against someone with device access.
                    </Notice>
                  </div>
                )}
              </>
            )}
            {tab === 'data' && (
              <>
                <h1>Keep control of your data.</h1>
                <p className="muted">
                  FormPilot stores profiles and remembered property mappings locally. Once filled,
                  values can be read by the website. Matching makes no network requests.
                </p>
                <section className="panel stack">
                  <h2 style={{ fontSize: 22 }}>Export a backup</h2>
                  <p className="small muted">
                    Exports contain personal information in readable JSON. Store them privately.
                    Export includes all saved profiles and the active selection; remembered mappings
                    are not exported.
                  </p>
                  <button
                    className="secondary"
                    onClick={download}
                    disabled={!state?.data.profiles.length}
                  >
                    Export profiles
                  </button>
                </section>
                <section className="panel stack">
                  <h2 style={{ fontSize: 22 }}>Import profiles</h2>
                  <label>
                    Choose a FormPilot JSON export
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={(e) => void importFile(e.target.files?.[0])}
                    />
                  </label>
                  {incoming && (
                    <div className="import-preview stack">
                      <h3>Preview: {incoming.profiles.length} profiles</h3>
                      <p className="small">
                        Schema version {incoming.schemaVersion}. Exported{' '}
                        {new Date(incoming.exportedAt).toLocaleDateString()}.
                      </p>
                      <ul>
                        {incoming.profiles.map((p) => (
                          <li key={p.id}>
                            {p.name} ({p.kind}) · {p.custom.length} custom fields
                          </li>
                        ))}
                      </ul>
                      <label>
                        Import behavior
                        <select
                          value={mode}
                          onChange={(e) => setMode(e.target.value as typeof mode)}
                        >
                          <option value="merge">Merge with saved profiles</option>
                          <option value="replace">Replace all saved profiles</option>
                        </select>
                      </label>
                      <p className="small">
                        {mode === 'merge'
                          ? 'Profiles with the same ID are updated. New IDs are added. Your current active profile stays active.'
                          : 'Every saved profile will be replaced by this file. Remembered mappings stay; missing properties are ignored.'}
                      </p>
                      <button className="primary" disabled={busy} onClick={importProfiles}>
                        Confirm {mode} import
                      </button>
                    </div>
                  )}
                </section>
                <section className="panel stack">
                  <h2 style={{ fontSize: 22 }}>Delete all local data</h2>
                  <p className="small muted">
                    Removes every saved profile and remembered mapping. Export first if you want a
                    backup. This cannot be undone.
                  </p>
                  <button className="secondary danger" disabled={busy} onClick={deleteAll}>
                    Delete all FormPilot data
                  </button>
                </section>
              </>
            )}
            {tab === 'memories' && (
              <>
                <h1>A few familiar forms.</h1>
                <p className="muted">
                  Corrections remembered only when you opt in. Each mapping belongs to one exact
                  origin, form and field. Values stay in your profile.
                </p>
                {!state?.memories.length ? (
                  <div className="empty-state">
                    <h3>No remembered mappings yet.</h3>
                    <p className="small muted">
                      Change a suggestion during review and opt in to remembering it when filled.
                    </p>
                  </div>
                ) : (
                  state.memories.map((m) => (
                    <article className="memory-row" key={m.id}>
                      <strong>{m.label}</strong>
                      <p className="small muted">{m.origin}</p>
                      <p className="small">
                        Mapped to{' '}
                        {propertyLabels[m.property as keyof typeof propertyLabels] ??
                          'Custom field'}
                      </p>
                      <details>
                        <summary className="small">Inspect scope</summary>
                        <pre className="small">{m.fingerprint}</pre>
                      </details>
                      <button
                        className="text-button danger small"
                        disabled={busy}
                        onClick={() =>
                          commit(
                            { ...state, memories: state.memories.filter((x) => x.id !== m.id) },
                            'Remembered mapping removed.',
                          )
                        }
                      >
                        Forget mapping
                      </button>
                    </article>
                  ))
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
