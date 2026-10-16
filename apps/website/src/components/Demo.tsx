import { useEffect, useRef, useState } from 'react';
import { scenarios, regions, type Scenario, type FixtureField } from '@formpilot/form-fixtures';
import { sampleProfile, getValue } from '@formpilot/profile-schema';
import { matchFields, selectValue } from '@formpilot/matching-engine';
import { createController, type Scan, type FieldResult } from '@formpilot/dom-adapter';
import { Notice } from '@formpilot/ui';
import { ReviewFields, makeRows, type ReviewRow } from '@formpilot/ui/review';
export function Demo({
  scenario = 'event',
  playground = true,
}: {
  scenario?: Scenario;
  playground?: boolean;
}) {
  const definition = scenarios.find((s) => s.id === scenario)!;
  const [reset, setReset] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [complete, setComplete] = useState(false);
  const [scan, setScan] = useState<Scan>();
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [undoAvailable, setUndoAvailable] = useState(false);
  const root = useRef<HTMLFormElement>(null);
  const controller = useRef<ReturnType<typeof createController> | undefined>(undefined);
  useEffect(() => {
    if (root.current) controller.current = createController(root.current);
    return () => controller.current?.dispose();
  }, [reset, scenario]);
  const country = values['ship-country'] ?? '';
  const fields = definition.fields.filter(
    (f) => f.id !== 'saas-company' || values['saas-kind'] === 'work',
  );
  const sections = [...new Set(fields.map((f) => f.section ?? 'Your details'))];
  function resetForm() {
    setValues({});
    setReset((v) => v + 1);
    setScan(undefined);
    setRows([]);
    setComplete(false);
    setStatus('Form reset. Fictional data only.');
    setUndoAvailable(false);
  }
  async function inspect() {
    if (!controller.current) return;
    setBusy(true);
    const next = (await controller.current.execute({ type: 'scan' })) as Scan;
    setScan(next);
    setRows(makeRows(matchFields(next.fields, sampleProfile)));
    setUndoAvailable(false);
    setStatus('Inspected this demo form. No values changed.');
    setBusy(false);
  }
  function applyResults(results: FieldResult[]) {
    setRows((current) =>
      current.map((row) => ({
        ...row,
        selected: false,
        status: results.find((r) => r.token === row.match.field.token)?.status ?? row.status,
      })),
    );
  }
  async function fill() {
    if (!scan || !controller.current) return;
    setBusy(true);
    try {
      const missing: FieldResult[] = [];
      const items = rows
        .filter((r) => r.selected && r.property)
        .flatMap((r) => {
          const raw = getValue(sampleProfile, r.property!);
          const value =
            r.match.field.tag === 'select'
              ? selectValue(raw, r.match.field.options, r.property!, sampleProfile.country)
              : raw;
          if (value === null) {
            missing.push({ token: r.match.field.token, status: 'No compatible dropdown option' });
            return [];
          }
          return [{ token: r.match.field.token, value, replace: r.replace }];
        });
      const response = items.length
        ? ((await controller.current.execute({ type: 'fill', session: scan.session, items })) as {
            results: FieldResult[];
          })
        : { results: [] };
      applyResults([...response.results, ...missing]);
      const filled = response.results.filter((r) => r.status === 'Filled').length;
      setStatus(`${filled} fields filled with fictional sample details. Nothing submitted.`);
      setUndoAvailable(filled > 0);
    } catch {
      setStatus('The demo changed. Inspect it again before filling.');
    } finally {
      setBusy(false);
    }
  }
  async function undo() {
    if (!scan || !controller.current) return;
    const { results } = (await controller.current.execute({
      type: 'undo',
      session: scan.session,
    })) as { results: FieldResult[] };
    applyResults(results);
    setStatus(
      `Restored ${results.filter((r) => r.status === 'Restored').length} of ${results.length} fields. Later edits are preserved.`,
    );
    setUndoAvailable(false);
  }
  function renderField(f: FixtureField) {
    const controlled = scenario === 'saas';
    const type = f.type ?? 'text';
    const props = {
      id: f.id,
      name: f.id,
      autoComplete: f.autocomplete,
      placeholder: f.placeholder,
      readOnly: f.readOnly,
      disabled: f.disabled,
      'aria-label': f.ariaLabel,
      'aria-labelledby': f.labelledBy ? `${f.id}-label` : undefined,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
      ) => setValues((v) => ({ ...v, [f.id]: e.target.value })),
      ...(controlled && type !== 'checkbox' && type !== 'file'
        ? { value: values[f.id] ?? f.initial ?? '' }
        : { defaultValue: f.initial ?? '' }),
    };
    const control =
      f.tag === 'select' ? (
        <select {...props} key={f.id === 'ship-state' ? country : f.id}>
          <option value="">Choose…</option>
          {(f.dynamic ? (regions[country] ?? []) : (f.options ?? [])).map((o) => (
            <option value={o.value} key={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : f.tag === 'textarea' ? (
        <textarea {...props} />
      ) : (
        <input {...props} type={type} />
      );
    if (type === 'hidden')
      return <input key={f.id} id={f.id} name={f.id} type="hidden" defaultValue="" />;
    if (type === 'checkbox')
      return (
        <label className="check wide" key={f.id}>
          {control}
          <span>{f.label}</span>
        </label>
      );
    if (f.wrapping)
      return (
        <label key={f.id}>
          {f.label}
          {control}
        </label>
      );
    return (
      <div key={f.id} className={f.tag === 'textarea' ? 'wide' : ''}>
        {f.labelledBy ? (
          <span id={`${f.id}-label`} className="small">
            {f.label}
          </span>
        ) : f.label ? (
          <label htmlFor={f.id}>{f.label}</label>
        ) : (
          <span className="small muted">A field with no visible label</span>
        )}
        {control}
      </div>
    );
  }
  return (
    <>
      <div className={playground ? 'demo-layout' : 'stack'}>
        <div>
          <form
            className="demo-form stack"
            ref={root}
            key={reset}
            id={`demo-${scenario}`}
            aria-label={definition.name}
            onSubmit={(e) => {
              e.preventDefault();
              setComplete(true);
            }}
          >
            <div>
              <h2 style={{ fontSize: 25 }}>{definition.title}</h2>
              <p className="small muted" style={{ marginTop: 10 }}>
                Fictional demo. Please use sample details only.
              </p>
            </div>
            {sections.map((section) => (
              <fieldset key={section}>
                <legend>{section}</legend>
                <div className="grid-2">
                  {fields.filter((f) => (f.section ?? 'Your details') === section).map(renderField)}
                </div>
              </fieldset>
            ))}
            {scenario === 'saas' && (
              <output className="notice" aria-label="React state preview">
                React state: {values['saas-full'] || 'No name yet'} ·{' '}
                {values['saas-email'] || 'No email yet'}
                {values['saas-company'] ? ` · ${values['saas-company']}` : ''}
              </output>
            )}
            <div className="row">
              <button className="primary" type="submit">
                Complete demo locally
              </button>
              <button className="secondary" type="button" onClick={resetForm}>
                Reset form
              </button>
            </div>
            {complete && (
              <Notice tone="success">Demo completed locally. No details were sent anywhere.</Notice>
            )}
          </form>
          <details>
            <summary>Known expected mappings</summary>
            <p className="small muted">
              These are the fixture labels used for this controlled example. Empty profile values
              and missing dropdown options may prevent filling.
            </p>
            <ul className="small">
              {definition.fields.map((f) => (
                <li key={f.id}>
                  {f.label || 'Unlabelled field'}:{' '}
                  {f.excluded ? 'excluded' : (f.expected ?? 'intentional abstention')}
                </li>
              ))}
            </ul>
          </details>
        </div>
        {playground && (
          <aside className="playground" aria-label="Matching playground">
            <div className="playground-head stack-sm">
              <span className="pill" style={{ alignSelf: 'start' }}>
                Interactive playground
              </span>
              <h2>Meet the review step.</h2>
              <p className="small muted">
                Uses the real matching engine on this demo only. It cannot inspect other tabs.
              </p>
              <p className="small">
                <strong>Alex Morgan</strong> · fictional sample profile
              </p>
              <button className="primary" onClick={inspect} disabled={busy}>
                {scan ? 'Inspect demo again' : 'Inspect this demo'}
              </button>
            </div>
            <div className="playground-body">
              {status && <Notice>{status}</Notice>}
              {rows.length > 0 ? (
                <div style={{ marginTop: 18 }}>
                  <ReviewFields
                    rows={rows}
                    profile={sampleProfile}
                    disabled={busy}
                    onChange={(token, patch) =>
                      setRows((current) =>
                        current.map((r) =>
                          r.match.field.token === token ? { ...r, ...patch } : r,
                        ),
                      )
                    }
                    onHighlight={(token) => {
                      if (scan)
                        void controller.current?.execute({
                          type: 'highlight',
                          session: scan.session,
                          token,
                        });
                    }}
                  />
                </div>
              ) : (
                <div className="empty-state" style={{ marginTop: 12 }}>
                  <h3>Your review starts here.</h3>
                  <p className="small muted">
                    Inspect the form to see explained suggestions, uncertainty and excluded fields.
                  </p>
                </div>
              )}
            </div>
            <div className="playground-footer stack-sm">
              {undoAvailable && (
                <button className="text-button" onClick={undo}>
                  Undo last demo fill
                </button>
              )}
              <button
                className="button"
                disabled={busy || !rows.some((r) => r.selected)}
                onClick={fill}
              >
                Fill selected sample details
              </button>
              <p className="small muted">Nothing is submitted. Reset whenever you like.</p>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
