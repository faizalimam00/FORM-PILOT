import { describe, it, expect } from 'vitest';
import { trustedSender } from '../../apps/extension/src/trust';
describe('browser-supplied message identity', () => {
  const base = 'chrome-extension://exampleid/';
  it('accepts an allowlisted extension page, including an extension tab with a query', () =>
    expect(
      trustedSender(
        { id: 'exampleid', url: base + 'review.html?tab=4', frameId: 0 },
        'exampleid',
        base,
        ['/review.html'],
      ),
    ).toBe(true));
  it.each([
    'https://example.com/review.html',
    'chrome-extension://other/review.html',
    base + 'unlisted.html',
    base + 'review.html.evil',
  ])('rejects untrusted sender %s', (url) =>
    expect(
      trustedSender({ id: 'exampleid', url, frameId: 0 }, 'exampleid', base, ['/review.html']),
    ).toBe(false),
  );
  it('rejects wrong extension ID and nested frames', () => {
    expect(
      trustedSender({ id: 'other', url: base + 'review.html' }, 'exampleid', base, [
        '/review.html',
      ]),
    ).toBe(false);
    expect(
      trustedSender({ id: 'exampleid', url: base + 'review.html', frameId: 2 }, 'exampleid', base, [
        '/review.html',
      ]),
    ).toBe(false);
  });
});
