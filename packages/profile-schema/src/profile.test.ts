import { describe, it, expect } from 'vitest';
import {
  emptyProfile,
  sampleProfile,
  getValue,
  profileSchema,
  parseImport,
  exportProfiles,
  applyImport,
} from './index';
describe('profile data boundaries', () => {
  it('derives and overrides full name', () => {
    expect(getValue(sampleProfile, 'fullName')).toBe('Alex Morgan');
    expect(getValue({ ...sampleProfile, fullNameOverride: 'A. Morgan' }, 'fullName')).toBe(
      'A. Morgan',
    );
  });
  it('roundtrips versioned profile export', () => {
    const data = exportProfiles([sampleProfile], sampleProfile.id);
    expect(parseImport(JSON.stringify(data))).toEqual(data);
  });
  it('rejects unknown versions and unknown properties', () => {
    expect(() =>
      parseImport(JSON.stringify({ ...exportProfiles([], null), schemaVersion: 2 })),
    ).toThrow();
    expect(profileSchema.safeParse({ ...sampleProfile, password: 'nope' }).success).toBe(false);
  });
  it('rejects unsafe URLs, invalid emails, sensitive custom labels', () => {
    expect(
      profileSchema.safeParse({ ...sampleProfile, portfolio: 'javascript:alert(1)' }).success,
    ).toBe(false);
    expect(profileSchema.safeParse({ ...sampleProfile, email: 'not email' }).success).toBe(false);
    expect(
      profileSchema.safeParse({
        ...sampleProfile,
        custom: [
          { id: crypto.randomUUID(), label: 'Passport number', type: 'text', value: 'fictional' },
        ],
      }).success,
    ).toBe(false);
  });
  it('accepts international postal and phone formatting without national assumptions', () => {
    expect(
      profileSchema.parse({
        ...sampleProfile,
        postalCode: 'SW1A 1AA',
        phone: '+44 (20) 7946-0000',
        callingCode: '+44',
      }).postalCode,
    ).toBe('SW1A 1AA');
  });
  it('merge updates same ID and adds new ID, retaining active choice', () => {
    const other = emptyProfile('work');
    const merged = applyImport(
      exportProfiles([sampleProfile], sampleProfile.id),
      exportProfiles([{ ...sampleProfile, company: 'New Example' }, other], other.id),
      'merge',
    );
    expect(merged.profiles).toHaveLength(2);
    expect(merged.profiles[0]?.company).toBe('New Example');
    expect(merged.activeProfileId).toBe(sampleProfile.id);
  });
  it('replace removes old collection', () => {
    expect(
      applyImport(
        exportProfiles([sampleProfile], sampleProfile.id),
        exportProfiles([], null),
        'replace',
      ).profiles,
    ).toEqual([]);
  });
  it('bounds imports and rejects duplicate IDs and orphan active selection', () => {
    expect(() => parseImport(' '.repeat(512001))).toThrow();
    expect(() => exportProfiles([sampleProfile, sampleProfile], sampleProfile.id)).toThrow();
    expect(() => exportProfiles([], sampleProfile.id)).toThrow();
  });
  it('does not read inherited properties as profile values', () => {
    expect(getValue(sampleProfile, 'constructor')).toBe('');
    expect(getValue(sampleProfile, '__proto__')).toBe('');
  });
});
