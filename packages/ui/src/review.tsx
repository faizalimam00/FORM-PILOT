import { useState } from 'react';
import { getProperties, getValue, type Profile, type PropertyKey } from '@formpilot/profile-schema';
import type { Match } from '@formpilot/matching-engine';
export interface ReviewRow {
  match: Match;
  property: PropertyKey | null;
  selected: boolean;
  replace: boolean;
  changed: boolean;
  remember: boolean;
  status: string;
}
export function makeRows(matches: Match[]): ReviewRow[] {
  return matches.map((match) => ({
    match,
    property: match.property,
    selected:
      match.confidence === 'high' &&
      !match.field.hasValue &&
      !match.excluded &&
      !!match.value &&
      !match.warnings.includes('No compatible dropdown option.'),
    replace: false,
    changed: false,
    remember: false,
    status: '',
  }));
}
export function ReviewFields({
  rows,
  profile,
  onChange,
  onHighlight,
  allowRemember = false,
  disabled = false,
}: {
  rows: ReviewRow[];
  profile: Profile;
  onChange: (token: string, patch: Partial<ReviewRow>) => void;
  onHighlight?: (token: string) => void;
  allowRemember?: boolean;
  disabled?: boolean;
}) {
  const [filter, setFilter] = useState('all');
  const labels = [
    ['all', 'All'],
    ['high', 'High confidence'],
    ['review', 'Needs review'],
    ['none', 'Unmatched'],
    ['excluded', 'Excluded'],
  ];
  const counts = rows.reduce<Record<string, number>>(
    (acc, r) => {
      const c = r.match.excluded ? 'excluded' : r.match.confidence;
      acc[c] = (acc[c] ?? 0) + 1;
      return acc;
    },
    { all: rows.length },
  );
  const visible = rows.filter(
    (r) => filter === 'all' || (r.match.excluded ? 'excluded' : r.match.confidence) === filter,
  );
  return (
    <>
      <div className="filters" aria-label="Filter fields">
        {labels.map(([key, label]) => (
          <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key!)}>
            {label} {counts[key!] ?? 0}
          </button>
        ))}
      </div>
      {visible.length === 0 && <p className="muted small">No fields in this group.</p>}
      {visible.map((row) => {
        const { field } = row.match;
        const label =
          field.label ||
          field.ariaLabel ||
          field.labelledBy ||
          field.name ||
          field.placeholder ||
          'Unlabelled field';
        const value = row.property ? getValue(profile, row.property) : '';
        const confidence = row.match.excluded
          ? 'excluded'
          : row.changed
            ? 'review'
            : row.match.confidence;
        const badge =
          confidence === 'high'
            ? 'High confidence'
            : confidence === 'review'
              ? 'Needs review'
              : confidence === 'excluded'
                ? 'Excluded'
                : 'No reliable match';
        const duplicate =
          rows.filter((r) => r.match.field.fingerprint === field.fingerprint).length > 1;
        return (
          <article className="field-card" key={field.token} data-field-label={label}>
            <div className="field-top">
              <label className="check">
                <input
                  type="checkbox"
                  aria-label={`Select ${label}`}
                  checked={row.selected}
                  disabled={
                    disabled || !!row.match.excluded || !value || (field.hasValue && !row.replace)
                  }
                  onChange={(e) => onChange(field.token, { selected: e.target.checked })}
                />
                <span>{label}</span>
              </label>
              <span className={`pill ${confidence}`}>{badge}</span>
            </div>
            {field.section && (
              <p className="small muted" style={{ marginTop: 5 }}>
                {field.section}
              </p>
            )}
            {row.match.excluded ? (
              <p className="small muted" style={{ marginTop: 9 }}>
                {row.match.explanation}
              </p>
            ) : (
              <>
                <div className="field-mapping">
                  <label className="sr-only" htmlFor={`mapping-${field.token}`}>
                    Map {label} to
                  </label>
                  <select
                    id={`mapping-${field.token}`}
                    value={row.property ?? ''}
                    disabled={disabled}
                    onChange={(e) =>
                      onChange(field.token, {
                        property: (e.target.value || null) as PropertyKey | null,
                        selected: false,
                        changed: true,
                        remember: false,
                        status: '',
                      })
                    }
                  >
                    <option value="">No mapping — leave untouched</option>
                    {getProperties(profile).map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                        {p.value ? '' : ' (empty)'}
                      </option>
                    ))}
                  </select>
                  <div className="field-value">
                    {value || <span className="muted">No value to fill</span>}
                  </div>
                </div>
                {field.hasValue && (
                  <label className="check small">
                    <input
                      type="checkbox"
                      checked={row.replace}
                      disabled={disabled}
                      onChange={(e) =>
                        onChange(field.token, { replace: e.target.checked, selected: false })
                      }
                    />
                    Allow replacing this field’s existing value
                  </label>
                )}
                {confidence === 'review' && (
                  <p className="warning-text">
                    Check the field, then select it above to confirm your review.
                  </p>
                )}
                <details>
                  <summary>Why this suggestion?</summary>
                  <p>
                    {row.changed
                      ? 'You chose this property. Check the value and select this field to confirm.'
                      : row.match.explanation}
                  </p>
                  {row.match.warnings.map((w) => (
                    <p key={w}>{w}</p>
                  ))}
                </details>
                {allowRemember && row.changed && row.property && !duplicate && (
                  <label className="check small">
                    <input
                      type="checkbox"
                      checked={row.remember}
                      disabled={disabled}
                      onChange={(e) => onChange(field.token, { remember: e.target.checked })}
                    />
                    Remember this mapping for this website when filled
                  </label>
                )}
                {onHighlight && (
                  <button
                    className="text-button small"
                    disabled={disabled}
                    onClick={() => onHighlight(field.token)}
                  >
                    Show on page
                  </button>
                )}
              </>
            )}
            {row.status && (
              <p className="field-status" role="status">
                {row.status}
              </p>
            )}
          </article>
        );
      })}
    </>
  );
}
