import { z } from 'zod';
import { exclusion, fingerprint, type FieldDescriptor } from '@formpilot/matching-engine';

const short = z.string().max(2000);
export const fieldSchema = z
  .object({
    token: z.string().uuid(),
    tag: z.enum(['input', 'select', 'textarea']),
    type: short,
    label: short,
    ariaLabel: short,
    labelledBy: short,
    name: short,
    id: short,
    placeholder: short,
    autocomplete: short,
    section: short,
    form: short,
    options: z
      .array(z.object({ label: short, value: short, disabled: z.boolean().optional() }).strict())
      .max(1000),
    hasValue: z.boolean(),
    disabled: z.boolean(),
    readOnly: z.boolean(),
    hidden: z.boolean(),
    fingerprint: z.string().max(200_000),
  })
  .strict();
export const scanSchema = z
  .object({
    session: z.string().uuid(),
    origin: z.string().max(2000),
    url: z.string().max(4000),
    fields: z.array(fieldSchema).max(500),
    warnings: z.array(short).max(20),
  })
  .strict();
export type Scan = z.infer<typeof scanSchema>;
export const commandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('scan') }).strict(),
  z
    .object({
      type: z.literal('fill'),
      session: z.string().uuid(),
      items: z
        .array(
          z
            .object({ token: z.string().uuid(), value: z.string().max(2000), replace: z.boolean() })
            .strict(),
        )
        .min(1)
        .max(500),
    })
    .strict(),
  z
    .object({ type: z.literal('highlight'), session: z.string().uuid(), token: z.string().uuid() })
    .strict(),
  z.object({ type: z.literal('undo'), session: z.string().uuid() }).strict(),
  z.object({ type: z.literal('clear') }).strict(),
]);
export type Command = z.infer<typeof commandSchema>;
export interface FieldResult {
  token: string;
  status: string;
}
export const resultsSchema = z
  .object({
    results: z
      .array(z.object({ token: z.string().uuid(), status: z.string().max(300) }).strict())
      .max(500),
  })
  .strict();
type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
const clip = (value: string | null | undefined, max = 2000) => (value ?? '').slice(0, max);
function context(element: Control): string {
  const fieldset = element.closest('fieldset');
  const legend = fieldset?.querySelector(':scope > legend')?.textContent;
  const section = element.closest('section,[role="group"]');
  const heading = section?.querySelector('h1,h2,h3,h4,[role="heading"]')?.textContent;
  return clip([legend, section?.getAttribute('aria-label'), heading].filter(Boolean).join(' / '));
}
function describe(element: Control, token: string): FieldDescriptor {
  const form = element.form;
  const options =
    element instanceof HTMLSelectElement
      ? Array.from(element.options)
          .slice(0, 1000)
          .map((o) => ({
            label: clip(o.label),
            value: clip(o.value),
            disabled: o.disabled || !!o.closest('optgroup')?.disabled,
          }))
      : [];
  const style = getComputedStyle(element);
  const hidden =
    element.type === 'hidden' ||
    element.hidden ||
    !!element.closest('[hidden],[inert],[aria-hidden="true"]') ||
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.visibility === 'collapse' ||
    element.getClientRects().length === 0;
  const formSignature = JSON.stringify([
    location.pathname,
    form?.id,
    form?.getAttribute('name'),
    form?.getAttribute('action'),
    form?.method,
    form?.getAttribute('aria-label'),
    form?.querySelector('h1,h2,h3')?.textContent?.slice(0, 200),
  ]);
  const field: FieldDescriptor = {
    token,
    tag: element.tagName.toLowerCase() as FieldDescriptor['tag'],
    type: element.type,
    label: clip(
      Array.from(element.labels ?? [])
        .map((l) => l.textContent ?? '')
        .join(' ')
        .trim(),
    ),
    ariaLabel: clip(element.getAttribute('aria-label')),
    labelledBy: clip(
      (element.getAttribute('aria-labelledby') ?? '')
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => document.getElementById(id)?.textContent ?? '')
        .join(' '),
    ),
    name: clip(element.name),
    id: clip(element.id),
    placeholder: clip(element.getAttribute('placeholder')),
    autocomplete: clip(element.getAttribute('autocomplete')),
    section: context(element),
    form: formSignature,
    options,
    hasValue: false,
    disabled: element.matches(':disabled'),
    readOnly: 'readOnly' in element && element.readOnly,
    hidden,
    fingerprint: '',
  };
  field.fingerprint = fingerprint(field);
  if (!exclusion(field)) field.hasValue = element.value !== '';
  return field;
}
interface Target {
  element: Control;
  field: FieldDescriptor;
  before: string | null;
}
interface UndoEntry {
  element: Control;
  token: string;
  before: string;
  written: string;
  revision: number;
  fingerprint: string;
}
/** One isolated-world controller per document. No profile or storage access. */
export function createController(root: ParentNode = document) {
  let session = crypto.randomUUID();
  let scannedUrl = '';
  const targets = new Map<string, Target>();
  let undo: UndoEntry[] = [];
  let expires: ReturnType<typeof setTimeout> | undefined;
  let undoExpires: ReturnType<typeof setTimeout> | undefined;
  let applying = false;
  let busy = false;
  const revisions = new WeakMap<EventTarget, number>();
  const edited = (e: Event) => {
    if (!applying && e.target) revisions.set(e.target, (revisions.get(e.target) ?? 0) + 1);
  };
  document.addEventListener('input', edited, true);
  document.addEventListener('change', edited, true);
  const clear = () => {
    targets.clear();
    undo = [];
    scannedUrl = '';
    clearTimeout(expires);
    clearTimeout(undoExpires);
    session = crypto.randomUUID();
  };
  const resetTimer = () => {
    clearTimeout(expires);
    expires = setTimeout(clear, 15 * 60_000);
  };
  const assign = (el: Control, value: string) => {
    const proto =
      el instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : el instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (!setter) throw new Error('Unsupported control');
    applying = true;
    try {
      setter.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    } finally {
      applying = false;
    }
  };
  async function execute(
    raw: unknown,
  ): Promise<Scan | { results: FieldResult[] } | { ok: boolean }> {
    const command = commandSchema.parse(raw);
    if (command.type === 'clear') {
      clear();
      return { ok: true };
    }
    if (busy) throw new Error('A fill or undo is already in progress.');
    if (command.type === 'scan') {
      clear();
      scannedUrl = location.href;
      resetTimer();
      const elements = Array.from(root.querySelectorAll<Control>('input,select,textarea'));
      const fields = elements.slice(0, 500).map((element) => {
        const token = crypto.randomUUID();
        const field = describe(element, token);
        // Excluded controls never have their values read or retained.
        if (!exclusion(field)) targets.set(token, { element, field, before: element.value });
        return field;
      });
      const warnings: string[] = [];
      if (elements.length > 500) warnings.push('Only the first 500 controls were inspected.');
      if (root.querySelector('iframe'))
        warnings.push('Embedded frames are not inspected. Open the form directly if possible.');
      if (root.querySelector('[contenteditable="true"],[role="combobox"]:not(select)'))
        warnings.push('Rich-text editors and custom dropdowns are unsupported.');
      warnings.push(
        'Only the top-level document is inspected. Shadow-root controls are not included. Rescan after the form changes.',
      );
      return { session, origin: location.origin, url: location.href, fields, warnings };
    }
    if (command.session !== session || scannedUrl !== location.href)
      throw new Error('This scan expired or the page changed. Scan the page again.');
    if (command.type === 'highlight') {
      const target = targets.get(command.token);
      if (!target?.element.isConnected) return { ok: false };
      const el = target.element;
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      const rect = el.getBoundingClientRect();
      const overlay = document.createElement('div');
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.cssText = `position:fixed;pointer-events:none;z-index:2147483647;left:${rect.left - 4}px;top:${rect.top - 4}px;width:${rect.width + 8}px;height:${rect.height + 8}px;border:3px solid #087f72;border-radius:7px;box-sizing:border-box;background:transparent;`;
      document.documentElement.append(overlay);
      setTimeout(() => overlay.remove(), 1200);
      return { ok: true };
    }
    busy = true;
    try {
      const results: FieldResult[] = [];
      if (command.type === 'undo') {
        for (const entry of undo) {
          const { element, token } = entry;
          const current = element.isConnected ? describe(element, token) : null;
          if (!current || exclusion(current) || current.fingerprint !== entry.fingerprint) {
            results.push({ token, status: 'Undo skipped: field disappeared or changed' });
            continue;
          }
          if (element.value !== entry.written || (revisions.get(element) ?? 0) !== entry.revision) {
            results.push({ token, status: 'Undo skipped: edited after filling' });
            continue;
          }
          assign(element, entry.before);
          await new Promise((resolve) => setTimeout(resolve, 0));
          results.push({
            token,
            status:
              element.value === entry.before
                ? 'Restored'
                : 'Undo could not be retained by the page',
          });
        }
        undo = [];
        clearTimeout(undoExpires);
        return { results };
      }
      undo = [];
      clearTimeout(undoExpires);
      const seen = new Set<string>();
      for (const item of command.items) {
        const target = targets.get(item.token);
        const report = (status: string) => results.push({ token: item.token, status });
        if (seen.has(item.token)) {
          report('Duplicate selection skipped');
          continue;
        }
        seen.add(item.token);
        if (!target?.element.isConnected) {
          report('Field changed since scan: missing');
          continue;
        }
        const { element, field, before } = target;
        const now = describe(element, item.token);
        if (exclusion(now)) {
          report('Unsupported control or excluded field');
          continue;
        }
        if (before === null || now.fingerprint !== field.fingerprint || element.value !== before) {
          report('Field changed since scan');
          continue;
        }
        if (before !== '' && !item.replace) {
          report('Skipped because it already contains a value');
          continue;
        }
        if (
          element instanceof HTMLSelectElement &&
          !Array.from(element.options).some(
            (o) => o.value === item.value && !o.disabled && !o.closest('optgroup')?.disabled,
          )
        ) {
          report('No compatible dropdown option');
          continue;
        }
        if (
          'maxLength' in element &&
          element.maxLength >= 0 &&
          item.value.length > element.maxLength
        ) {
          report('Value exceeds this field’s length limit');
          continue;
        }
        if (item.value === before) {
          report('Already contains the selected value');
          continue;
        }
        assign(element, item.value);
        await new Promise((resolve) => setTimeout(resolve, 0));
        if (
          !element.isConnected ||
          element.value !== item.value ||
          describe(element, item.token).fingerprint !== field.fingerprint
        ) {
          report('Field changed during fill; rescan and review');
          continue;
        }
        undo.push({
          element,
          token: item.token,
          before,
          written: item.value,
          revision: revisions.get(element) ?? 0,
          fingerprint: describe(element, item.token).fingerprint,
        });
        report('Filled');
      }
      undoExpires = setTimeout(() => {
        undo = [];
      }, 5 * 60_000);
      // Once a fill succeeds, only the bounded undo batch needs original values.
      // Further filling requires a rescan; live references remain usable for highlighting.
      if (undo.length)
        targets.forEach((target) => {
          target.before = null;
        });
      return { results };
    } finally {
      busy = false;
    }
  }
  const dispose = () => {
    clear();
    document.removeEventListener('input', edited, true);
    document.removeEventListener('change', edited, true);
  };
  return { execute, dispose };
}
