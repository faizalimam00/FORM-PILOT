import { describe, it, expect } from 'vitest';
import { matchField, matchFields, memoryFor, fingerprint, selectValue, exclusion } from './index';
import { sampleProfile } from '@formpilot/profile-schema';
import { descriptor } from '../../form-fixtures/src/index';
describe('semantic matching', () => {
  it.each([
    ['Company email', 'email'],
    ['First name', 'firstName'],
    ['Full name', 'fullName'],
    ['Family name', 'lastName'],
    ['Current employer', 'company'],
    ['GitHub profile', 'github'],
  ])('maps %s to %s', (label, key) =>
    expect(matchField(descriptor(label), sampleProfile).property).toBe(key),
  );
  it.each(['Name', 'Account name', 'Team name', 'Something', 'Reference number'])(
    'abstains from ambiguous %s',
    (label) => expect(matchField(descriptor(label), sampleProfile).confidence).toBe('none'),
  );
  it('explains autocomplete and flags competing labels', () => {
    const match = matchField(descriptor('Email', { autocomplete: 'given-name' }), sampleProfile);
    expect(match.property).toBe('firstName');
    expect(match.confidence).toBe('review');
    expect(match.explanation).toContain('autocomplete=given-name');
    expect(match.warnings.length).toBeGreaterThan(0);
  });
  it('keeps weak placeholder suggestions for review', () =>
    expect(
      matchField(descriptor('', { placeholder: 'Email address' }), sampleProfile).confidence,
    ).toBe('review'));
  it('requires review for both billing and shipping context', () => {
    for (const section of ['Shipping address', 'Billing address'])
      expect(matchField(descriptor('Street address', { section }), sampleProfile).confidence).toBe(
        'review',
      );
  });
  it('requires review for an emergency contact', () =>
    expect(
      matchField(descriptor('First name', { section: 'Emergency contact' }), sampleProfile)
        .confidence,
    ).toBe('review'));
  it('abstains on incompatible types', () =>
    expect(
      matchField(descriptor('First name', { type: 'email' }), sampleProfile).property,
    ).toBeNull());
  it.each([
    'Password',
    'OTP',
    'Verification code',
    'Card number',
    'CVV',
    'CAPTCHA',
    'SSN',
    'API key',
    'Government ID',
    'Marketing consent',
  ])('excludes %s even with email autocomplete', (label) =>
    expect(exclusion(descriptor(label, { autocomplete: 'email' }))).toBeTruthy(),
  );
  it.each(['password', 'file', 'checkbox', 'radio', 'submit', 'number', 'date'])(
    'excludes unsupported %s inputs',
    (type) => expect(exclusion(descriptor('Name', { type }))).toBeTruthy(),
  );
  it('normalizes supported countries and scoped regions, rejects ambiguous options', () => {
    expect(selectValue('United States', [{ label: 'USA', value: 'US' }], 'country')).toBe('US');
    expect(selectValue('Oregon', [{ label: 'OR', value: 'OR' }], 'region', 'United States')).toBe(
      'OR',
    );
    expect(selectValue('Oregon', [{ label: 'OR', value: 'OR' }], 'region', 'India')).toBeNull();
    expect(
      selectValue(
        'US',
        [
          { label: 'United States', value: 'US' },
          { label: 'USA', value: 'USA' },
        ],
        'country',
      ),
    ).toBeNull();
  });
  it('only applies remembered mappings to the exact origin and semantic fingerprint', () => {
    const field = descriptor('Mystery');
    const memory = memoryFor(field, 'https://one.example', 'company');
    expect(matchField(field, sampleProfile, 'https://one.example', [memory]).remembered).toBe(true);
    expect(matchField(field, sampleProfile, 'https://two.example', [memory]).property).toBeNull();
    const changed = descriptor('Mystery', { section: 'Billing' });
    expect(matchField(changed, sampleProfile, 'https://one.example', [memory]).remembered).toBe(
      false,
    );
  });
  it('ignores memories for missing custom properties or excluded fields', () => {
    const field = descriptor('Mystery');
    const memory = memoryFor(field, 'https://one.example', `custom:${crypto.randomUUID()}`);
    expect(matchField(field, sampleProfile, 'https://one.example', [memory]).remembered).toBe(
      false,
    );
    const sensitive = descriptor('API key');
    expect(
      matchField(sensitive, sampleProfile, 'https://one.example', [
        memoryFor(sensitive, 'https://one.example', 'email'),
      ]).excluded,
    ).toBeTruthy();
  });
  it('does not reuse memories on indistinguishable duplicates', () => {
    const field = descriptor('Full name');
    const memory = memoryFor(field, 'https://one.example', 'company');
    const matches = matchFields(
      [field, { ...field, token: crypto.randomUUID() }],
      sampleProfile,
      'https://one.example',
      [memory],
    );
    expect(matches.every((m) => !m.remembered && m.confidence === 'review')).toBe(true);
  });
  it('fingerprints exclude values but include form and section', () => {
    const f = descriptor('Email');
    const withValue = { ...f, hasValue: true };
    expect(fingerprint(withValue)).toBe(f.fingerprint);
    expect(fingerprint({ ...f, form: 'another' })).not.toBe(f.fingerprint);
  });
});
