import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { createController, commandSchema, type Scan } from '../../packages/dom-adapter/src/index';
let controller: ReturnType<typeof createController>;
beforeEach(() => {
  vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([
    { width: 100, height: 30 },
  ] as unknown as DOMRectList);
  document.body.innerHTML = '';
  controller = createController();
});
afterEach(() => controller.dispose());
const scan = async () => (await controller.execute({ type: 'scan' })) as Scan;
const input = () => document.querySelector('input')!;
const fill = async (s: Scan, value = 'Alex', replace = false) =>
  controller.execute({
    type: 'fill',
    session: s.session,
    items: [{ token: s.fields[0]!.token, value, replace }],
  });
describe('DOM inspection and mutation boundary', () => {
  it('scans explicit, wrapping and aria labels without changing values or leaking them', async () => {
    document.body.innerHTML =
      '<form><label for="a">Full name</label><input id="a" value="Fictional existing"><label>Email<input type="email"></label><span id="label">Company</span><input aria-labelledby="label"></form>';
    const s = await scan();
    expect(s.fields.map((f) => f.label || f.labelledBy)).toEqual(['Full name', 'Email', 'Company']);
    expect(input().value).toBe('Fictional existing');
    expect(JSON.stringify(s)).not.toContain('Fictional existing');
  });
  it('excludes ancestors hidden and disabled fieldsets', async () => {
    document.body.innerHTML = '<fieldset disabled><input></fieldset><div hidden><input></div>';
    const s = await scan();
    expect(s.fields[0]?.disabled).toBe(true);
    expect(s.fields[1]?.hidden).toBe(true);
  });
  it('fills with input/change events but never submits', async () => {
    document.body.innerHTML = '<form><input aria-label="First name"></form>';
    const events: string[] = [];
    input().addEventListener('input', () => events.push('input'));
    input().addEventListener('change', () => events.push('change'));
    const submit = vi.fn();
    document.querySelector('form')!.addEventListener('submit', submit);
    const s = await scan();
    expect(await fill(s)).toMatchObject({ results: [{ status: 'Filled' }] });
    expect(events).toEqual(['input', 'change']);
    expect(submit).not.toHaveBeenCalled();
  });
  it('preserves existing values unless replacement explicitly selected', async () => {
    document.body.innerHTML = '<input value="Existing">';
    const s = await scan();
    expect(await fill(s)).toMatchObject({
      results: [{ status: 'Skipped because it already contains a value' }],
    });
    expect(input().value).toBe('Existing');
    expect(await fill(s, 'Alex', true)).toMatchObject({ results: [{ status: 'Filled' }] });
  });
  it('rejects a field edited since scanning even when replace was checked', async () => {
    document.body.innerHTML = '<input>';
    const s = await scan();
    input().value = 'New edit';
    expect(await fill(s, 'Alex', true)).toMatchObject({
      results: [{ status: 'Field changed since scan' }],
    });
  });
  it('rejects stale element replacements and changed semantics', async () => {
    document.body.innerHTML = '<input aria-label="First name">';
    let s = await scan();
    input().setAttribute('aria-label', 'Last name');
    expect(await fill(s)).toMatchObject({ results: [{ status: 'Field changed since scan' }] });
    s = await scan();
    input().outerHTML = '<input aria-label="Last name">';
    expect(await fill(s)).toMatchObject({
      results: [{ status: 'Field changed since scan: missing' }],
    });
  });
  it('rechecks exclusion immediately before fill', async () => {
    document.body.innerHTML = '<input>';
    const s = await scan();
    input().type = 'password';
    expect(await fill(s)).toMatchObject({
      results: [{ status: 'Unsupported control or excluded field' }],
    });
  });
  it('detects select options that changed after scan', async () => {
    document.body.innerHTML =
      '<select><option value="">Choose</option><option value="US">USA</option></select>';
    const s = await scan();
    document.querySelector('select')!.insertAdjacentHTML('beforeend', '<option>Canada</option>');
    expect(await fill(s, 'US')).toMatchObject({
      results: [{ status: 'Field changed since scan' }],
    });
  });
  it('reports incompatible select options', async () => {
    document.body.innerHTML =
      '<select><option value="">Choose</option><option value="US">USA</option></select>';
    expect(await fill(await scan(), 'CA')).toMatchObject({
      results: [{ status: 'No compatible dropdown option' }],
    });
  });
  it('undo restores only changes made by this fill', async () => {
    document.body.innerHTML = '<input>';
    const s = await scan();
    await fill(s);
    expect(await controller.execute({ type: 'undo', session: s.session })).toMatchObject({
      results: [{ status: 'Restored' }],
    });
    expect(input().value).toBe('');
  });
  it('undo skips subsequent user edits even when the value is changed back', async () => {
    document.body.innerHTML = '<input>';
    const s = await scan();
    await fill(s);
    input().value = 'Edit';
    input().dispatchEvent(new Event('input', { bubbles: true }));
    input().value = 'Alex';
    input().dispatchEvent(new Event('input', { bubbles: true }));
    expect(await controller.execute({ type: 'undo', session: s.session })).toMatchObject({
      results: [{ status: 'Undo skipped: edited after filling' }],
    });
    expect(input().value).toBe('Alex');
  });
  it('undo reports removed fields without overwriting replacements', async () => {
    document.body.innerHTML = '<input>';
    const s = await scan();
    await fill(s);
    input().remove();
    expect(await controller.execute({ type: 'undo', session: s.session })).toMatchObject({
      results: [{ status: 'Undo skipped: field disappeared or changed' }],
    });
  });
  it('new scans detect inserted fields and invalidate old tokens', async () => {
    document.body.innerHTML = '<input>';
    const s = await scan();
    document.body.insertAdjacentHTML('beforeend', '<input aria-label="Email">');
    expect((await scan()).fields).toHaveLength(2);
    await expect(fill(s)).rejects.toThrow('expired');
  });
  it('clears temporary state explicitly', async () => {
    document.body.innerHTML = '<input>';
    const s = await scan();
    await controller.execute({ type: 'clear' });
    await expect(fill(s)).rejects.toThrow('expired');
  });
  it('rejects malformed and oversized messages', () => {
    expect(commandSchema.safeParse({ type: 'fill', session: 'bad', items: [] }).success).toBe(
      false,
    );
    expect(commandSchema.safeParse({ type: 'scan', profile: {} }).success).toBe(false);
  });
});

describe('temporary-data minimization', () => {
  it('never reads a sensitive excluded input value', async () => {
    document.body.innerHTML = '<input type="password" aria-label="Password">';
    const getter = vi.fn(() => {
      throw new Error('Sensitive value was read');
    });
    Object.defineProperty(input(), 'value', { get: getter, configurable: true });
    expect((await scan()).fields[0]?.hasValue).toBe(false);
    expect(getter).not.toHaveBeenCalled();
  });
  it('expires undo and then the scan session', async () => {
    vi.useFakeTimers();
    try {
      document.body.innerHTML = '<input>';
      const s = await scan();
      const filling = fill(s);
      await vi.advanceTimersByTimeAsync(0);
      await filling;
      await vi.advanceTimersByTimeAsync(5 * 60_000);
      expect(await controller.execute({ type: 'undo', session: s.session })).toEqual({
        results: [],
      });
      expect(input().value).toBe('Alex');
      await vi.advanceTimersByTimeAsync(10 * 60_000);
      await expect(fill(s)).rejects.toThrow('expired');
    } finally {
      vi.useRealTimers();
    }
  });
});
