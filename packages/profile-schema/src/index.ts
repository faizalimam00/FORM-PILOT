import { z } from 'zod';

// MV3 forbids dynamic code. Disable Zod's optional JIT before constructing any schemas.
z.config({ jitless: true });

export const propertyLabels = {
  firstName: 'First name',
  middleName: 'Middle name',
  lastName: 'Last name',
  preferredName: 'Preferred name',
  fullName: 'Full name',
  email: 'Email',
  phone: 'Phone',
  callingCode: 'Country calling code',
  address1: 'Address line 1',
  address2: 'Address line 2',
  city: 'City',
  region: 'State or region',
  postalCode: 'Postal code',
  country: 'Country',
  jobTitle: 'Job title',
  company: 'Company',
  portfolio: 'Portfolio URL',
  github: 'GitHub URL',
  linkedin: 'LinkedIn URL',
  bio: 'Short professional bio',
} as const;
export type BuiltinKey = keyof typeof propertyLabels;
export type PropertyKey = BuiltinKey | `custom:${string}`;
export const sensitivePattern =
  /\b(password|passcode|otp|one time|verification|security code|credit card|debit card|card number|cardholder|cvv|cvc|iban|bank account|routing number|social security|ssn|passport|government|national id|tax id|aadhaar|aadhar|pan number|authentication|auth token|access token|api key|secret|captcha|payment|expiry|expiration|pin code for login)\b/i;
export const normalize = (value: string): string =>
  value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\bgit hub\b/g, 'github')
    .replace(/\blinked in\b/g, 'linkedin');
const text = z.string().max(500).default('');
const optionalEmail = z.union([z.literal(''), z.email().max(254)]).default('');
const optionalUrl = z
  .union([
    z.literal(''),
    z
      .url()
      .max(500)
      .refine((v) => /^https?:\/\//i.test(v), 'Use an http or https URL.'),
  ])
  .default('');
export const customFieldSchema = z
  .object({
    id: z.string().uuid(),
    label: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .refine(
        (v) => !sensitivePattern.test(normalize(v)),
        'Do not store passwords, payment details, government IDs or tokens.',
      ),
    type: z.enum(['text', 'email', 'tel', 'url', 'textarea']),
    value: z.string().max(2000),
  })
  .strict()
  .superRefine((f, ctx) => {
    if (f.value && f.type === 'email' && !optionalEmail.safeParse(f.value).success)
      ctx.addIssue({ code: 'custom', message: 'Enter a valid email.', path: ['value'] });
    if (f.value && f.type === 'url' && !optionalUrl.safeParse(f.value).success)
      ctx.addIssue({ code: 'custom', message: 'Enter an http or https URL.', path: ['value'] });
  });
export const profileSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(60),
    kind: z.enum(['personal', 'work']),
    firstName: text,
    middleName: text,
    lastName: text,
    preferredName: text,
    fullNameOverride: text,
    email: optionalEmail,
    phone: z
      .string()
      .max(40)
      .regex(/^[+\d\s().x-]*$/, 'Use digits, spaces, +, parentheses, x or hyphens.')
      .default(''),
    callingCode: z
      .string()
      .regex(/^(\+\d{1,4})?$/, 'Use + followed by a calling code.')
      .default(''),
    address1: text,
    address2: text,
    city: text,
    region: text,
    postalCode: text,
    country: text,
    jobTitle: text,
    company: text,
    portfolio: optionalUrl,
    github: optionalUrl,
    linkedin: optionalUrl,
    bio: z.string().max(2000).default(''),
    custom: z.array(customFieldSchema).max(30).default([]),
  })
  .strict()
  .superRefine((p, ctx) => {
    if (new Set(p.custom.map((f) => f.id)).size !== p.custom.length)
      ctx.addIssue({
        code: 'custom',
        message: 'Custom field IDs must be unique.',
        path: ['custom'],
      });
  });
export type Profile = z.infer<typeof profileSchema>;
export const exportSchema = z
  .object({
    schemaVersion: z.literal(1),
    exportedAt: z.iso.datetime(),
    profiles: z.array(profileSchema).max(20),
    activeProfileId: z.string().uuid().nullable(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (new Set(data.profiles.map((p) => p.id)).size !== data.profiles.length)
      ctx.addIssue({ code: 'custom', message: 'Duplicate profile IDs.' });
    if (data.activeProfileId && !data.profiles.some((p) => p.id === data.activeProfileId))
      ctx.addIssue({ code: 'custom', message: 'The active profile is missing.' });
  });
export type ProfileExport = z.infer<typeof exportSchema>;
export function emptyProfile(kind: Profile['kind'] = 'personal'): Profile {
  return profileSchema.parse({
    id: crypto.randomUUID(),
    name: kind === 'personal' ? 'Personal' : 'Work',
    kind,
  });
}
export function getValue(profile: Profile, key: string): string {
  if (key === 'fullName')
    return (
      profile.fullNameOverride ||
      [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ')
    );
  if (key.startsWith('custom:'))
    return profile.custom.find((f) => `custom:${f.id}` === key)?.value ?? '';
  return Object.hasOwn(propertyLabels, key) ? profile[key as Exclude<BuiltinKey, 'fullName'>] : '';
}
export function getProperties(
  profile: Profile,
): { key: PropertyKey; label: string; value: string }[] {
  return [
    ...Object.entries(propertyLabels).map(([key, label]) => ({
      key: key as PropertyKey,
      label,
      value: getValue(profile, key),
    })),
    ...profile.custom.map((f) => ({
      key: `custom:${f.id}` as PropertyKey,
      label: f.label,
      value: f.value,
    })),
  ];
}
export function exportProfiles(profiles: Profile[], activeProfileId: string | null): ProfileExport {
  return exportSchema.parse({
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    profiles,
    activeProfileId,
  });
}
export function parseImport(raw: string): ProfileExport {
  if (new TextEncoder().encode(raw).length > 512_000)
    throw new Error('Import is too large. The limit is 500 KB.');
  return exportSchema.parse(JSON.parse(raw));
}
export function applyImport(
  current: ProfileExport,
  incoming: ProfileExport,
  mode: 'merge' | 'replace',
): ProfileExport {
  const valid = exportSchema.parse(incoming);
  if (mode === 'replace') return valid;
  const profiles = new Map(current.profiles.map((p) => [p.id, p]));
  valid.profiles.forEach((p) => profiles.set(p.id, p));
  return exportProfiles([...profiles.values()], current.activeProfileId ?? valid.activeProfileId);
}
export const sampleProfile: Profile = profileSchema.parse({
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Alex Morgan · sample',
  kind: 'personal',
  firstName: 'Alex',
  lastName: 'Morgan',
  preferredName: 'Alex',
  email: 'alex.morgan@example.com',
  phone: '202-555-0147',
  callingCode: '+1',
  address1: '42 Example Lane',
  address2: 'Suite 3',
  city: 'Portland',
  region: 'Oregon',
  postalCode: '97205',
  country: 'United States',
  jobTitle: 'Product designer',
  company: 'Example Studio',
  portfolio: 'https://example.com/alex',
  github: 'https://github.com/example',
  linkedin: 'https://www.linkedin.com/in/example',
  bio: 'Fictional product designer who enjoys making everyday tools easier to use.',
});
