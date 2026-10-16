import {
  getProperties,
  getValue,
  normalize,
  sensitivePattern,
  type Profile,
  type PropertyKey,
} from '@formpilot/profile-schema';
export { normalize } from '@formpilot/profile-schema';
export interface FieldDescriptor {
  token: string;
  tag: 'input' | 'select' | 'textarea';
  type: string;
  label: string;
  ariaLabel: string;
  labelledBy: string;
  name: string;
  id: string;
  placeholder: string;
  autocomplete: string;
  section: string;
  form: string;
  options: { label: string; value: string; disabled?: boolean }[];
  hasValue: boolean;
  disabled: boolean;
  readOnly: boolean;
  hidden: boolean;
  fingerprint: string;
}
export interface RememberedMapping {
  id: string;
  origin: string;
  fingerprint: string;
  property: PropertyKey;
  label: string;
  createdAt: string;
}
export type Confidence = 'high' | 'review' | 'none';
export interface Match {
  field: FieldDescriptor;
  property: PropertyKey | null;
  value: string;
  confidence: Confidence;
  explanation: string;
  warnings: string[];
  excluded: string | null;
  remembered: boolean;
}
export const autocompleteKeys: Record<string, PropertyKey> = {
  'given-name': 'firstName',
  'additional-name': 'middleName',
  'family-name': 'lastName',
  nickname: 'preferredName',
  name: 'fullName',
  email: 'email',
  tel: 'phone',
  'tel-national': 'phone',
  'tel-country-code': 'callingCode',
  'street-address': 'address1',
  'address-line1': 'address1',
  'address-line2': 'address2',
  'address-level2': 'city',
  'address-level1': 'region',
  'postal-code': 'postalCode',
  country: 'country',
  'country-name': 'country',
  organization: 'company',
  'organization-title': 'jobTitle',
  url: 'portfolio',
};
const aliases: Record<string, string[]> = {
  firstName: ['first name', 'given name', 'forename'],
  middleName: ['middle name', 'additional name'],
  lastName: ['last name', 'family name', 'surname'],
  preferredName: ['preferred name', 'nickname', 'what should we call you'],
  fullName: ['full name', 'your name', 'applicant name', 'legal name'],
  email: [
    'email',
    'email address',
    'e mail',
    'e mail address',
    'work email',
    'company email',
    'business email',
    'contact email',
  ],
  phone: [
    'phone',
    'phone number',
    'telephone',
    'telephone number',
    'mobile',
    'mobile number',
    'contact number',
  ],
  callingCode: ['country calling code', 'calling code', 'dial code'],
  address1: ['street address', 'address line 1', 'address 1', 'street and number', 'street'],
  address2: ['address line 2', 'address 2', 'apartment', 'apartment suite', 'suite'],
  city: ['city', 'town', 'town city', 'locality'],
  region: ['state', 'region', 'state province', 'state or region', 'province'],
  postalCode: ['postal code', 'zip code', 'zip', 'postcode', 'pin code'],
  country: ['country', 'country name', 'country region'],
  jobTitle: ['job title', 'occupation', 'professional title', 'role at company'],
  company: ['company', 'company name', 'organization', 'organisation', 'employer', 'employer name'],
  portfolio: ['portfolio', 'portfolio url', 'personal website', 'website', 'website url'],
  github: ['github', 'github url', 'github profile'],
  linkedin: ['linkedin', 'linkedin url', 'linkedin profile'],
  bio: [
    'bio',
    'short bio',
    'professional bio',
    'short professional bio',
    'about you',
    'tell us about yourself',
  ],
};
export function exclusion(field: FieldDescriptor): string | null {
  if (field.hidden) return 'Hidden field';
  if (field.tag === 'select' && field.type === 'select-multiple')
    return 'Unsupported control: multiple-select list';
  if (field.disabled || field.readOnly)
    return field.disabled ? 'Disabled field' : 'Read-only field';
  if (field.tag === 'input' && !['text', 'email', 'tel', 'url'].includes(field.type))
    return ['password', 'file', 'hidden'].includes(field.type)
      ? 'Sensitive or unsupported input type'
      : 'Unsupported control (including consent and buttons)';
  const metadata = normalize(
    [
      field.label,
      field.ariaLabel,
      field.labelledBy,
      field.name,
      field.id,
      field.placeholder,
      field.autocomplete,
      field.section,
    ].join(' '),
  );
  if (
    sensitivePattern.test(metadata) ||
    /\b(cc |ccnumber|ccnum|ccexp|creditcard|debitcard|one time code|new password|current password|verificationcode|authcode|securitycode|card no|card details|cardholder|date of birth|birth date|dob|routing|iban|iban number)\b/.test(
      metadata,
    )
  )
    return 'Potentially sensitive field; excluded conservatively';
  if (/\b(consent|agree|accept terms|marketing opt|newsletter opt)\b/.test(metadata))
    return 'Consent or agreement field';
  return null;
}
export function fingerprint(
  field: Omit<
    FieldDescriptor,
    'token' | 'hasValue' | 'fingerprint' | 'disabled' | 'hidden' | 'readOnly'
  >,
): string {
  // Full canonical metadata, not a lossy hash. Never contains entered values.
  return JSON.stringify([
    field.form,
    field.tag,
    field.type,
    field.name,
    field.id,
    field.autocomplete,
    field.label,
    field.ariaLabel,
    field.labelledBy,
    field.placeholder,
    field.section,
    field.options,
  ]);
}
export function memoryFor(
  field: FieldDescriptor,
  origin: string,
  property: PropertyKey,
): RememberedMapping {
  return {
    id: crypto.randomUUID(),
    origin: new URL(origin).origin,
    fingerprint: field.fingerprint,
    property,
    label: field.label || field.ariaLabel || field.name || 'Unlabelled field',
    createdAt: new Date().toISOString(),
  };
}
function compatible(field: FieldDescriptor, key: PropertyKey, profile: Profile): boolean {
  const custom = key.startsWith('custom:')
    ? profile.custom.find((c) => `custom:${c.id}` === key)
    : undefined;
  if (field.type === 'email') return key === 'email' || custom?.type === 'email';
  if (field.type === 'tel') return ['phone', 'callingCode'].includes(key) || custom?.type === 'tel';
  if (field.type === 'url')
    return ['portfolio', 'github', 'linkedin'].includes(key) || custom?.type === 'url';
  return true;
}
function signalCandidates(text: string, profile: Profile): PropertyKey[] {
  const n = normalize(text);
  if (!n) return [];
  const options = [
    ...Object.entries(aliases),
    ...profile.custom.map((f) => [`custom:${f.id}`, [normalize(f.label)]] as [string, string[]]),
  ];
  const found = options.flatMap(([key, list]) =>
    list
      .filter((a) => n === a || ` ${n} `.includes(` ${a} `))
      .map((a) => ({ key: key as PropertyKey, len: a.length, exact: n === a })),
  );
  if (found.some((f) => f.key === 'email')) return ['email']; // “Company email” is email, never company.
  if (found.some((f) => f.exact))
    return [...new Set(found.filter((f) => f.exact).map((f) => f.key))];
  const max = Math.max(0, ...found.map((f) => f.len));
  return [...new Set(found.filter((f) => f.len === max).map((f) => f.key))];
}
export function matchField(
  field: FieldDescriptor,
  profile: Profile,
  origin = '',
  memories: RememberedMapping[] = [],
): Match {
  const base: Match = {
    field,
    property: null,
    value: '',
    confidence: 'none',
    explanation: 'No reliable match. Choose a property only if you know what this field expects.',
    warnings: [],
    excluded: exclusion(field),
    remembered: false,
  };
  if (base.excluded) return { ...base, explanation: base.excluded };
  const tokens = field.autocomplete.toLowerCase().split(/\s+/);
  const auto = tokens.map((t) => autocompleteKeys[t]).find(Boolean);
  const strong = [field.label, field.ariaLabel, field.labelledBy].flatMap((s) =>
    signalCandidates(s, profile),
  );
  const weak = [field.name, field.id, field.placeholder].flatMap((s) =>
    signalCandidates(s, profile),
  );
  const uniqueStrong = [...new Set(strong)];
  const memory = memories.find(
    (m) =>
      m.origin === origin &&
      m.fingerprint === field.fingerprint &&
      getProperties(profile).some((p) => p.key === m.property) &&
      compatible(field, m.property, profile),
  );
  let property: PropertyKey | undefined;
  let high = false;
  let explanation = '';
  if (memory) {
    property = memory.property;
    high = true;
    explanation =
      'Using your remembered mapping for this exact origin and matching form, field and section metadata.';
  } else if (auto) {
    property = auto;
    high = true;
    explanation = `Matched ${getProperties(profile).find((p) => p.key === auto)?.label ?? auto} because this field uses autocomplete=${tokens.find((t) => autocompleteKeys[t] === auto)}${field.label ? ` and its label is “${field.label}”` : ''}.`;
  } else if (uniqueStrong.length === 1) {
    property = uniqueStrong[0];
    high = true;
    explanation = `Matched the label or accessibility text “${field.label || field.ariaLabel || field.labelledBy}”.`;
  } else if (uniqueStrong.length > 1) {
    return {
      ...base,
      explanation: 'The visible and accessibility labels disagree. No automatic mapping.',
      warnings: ['Conflicting label signals'],
    };
  } else {
    const hints = [...new Set(weak)];
    if (hints.length === 1) {
      property = hints[0];
      explanation =
        'Only a name, ID or placeholder suggests this property. Check it before selecting.';
    }
  }
  if (!property) return base;
  if (!compatible(field, property, profile))
    return {
      ...base,
      explanation: 'The suggested property conflicts with the input type.',
      warnings: ['Incompatible input type'],
    };
  if (uniqueStrong.some((k) => k !== property)) {
    high = false;
    base.warnings.push('The label disagrees with the proposed mapping. Review carefully.');
  }
  const context = normalize(`${field.section} ${field.label} ${field.autocomplete}`);
  if (
    /\b(billing|shipping)\b/.test(context) &&
    [
      'address1',
      'address2',
      'city',
      'region',
      'postalCode',
      'country',
      'fullName',
      'firstName',
      'lastName',
      'phone',
    ].includes(property)
  ) {
    high = false;
    base.warnings.push(
      'This is a billing or shipping section. Confirm this profile is the intended address.',
    );
  }
  if (
    /\b(emergency|spouse|partner|parent|manager|supervisor|reference|recipient)\b/.test(context)
  ) {
    high = false;
    base.warnings.push('This field may describe someone else. Confirm whose details are required.');
  }
  const value = getValue(profile, property);
  if (!value)
    return {
      ...base,
      property,
      explanation: `${explanation} The selected profile has no value for this property.`,
      warnings: base.warnings,
    };
  if (
    field.tag === 'select' &&
    selectValue(value, field.options, property, profile.country) === null
  )
    base.warnings.push('No compatible dropdown option.');
  return {
    ...base,
    property,
    value,
    confidence: high ? 'high' : 'review',
    explanation,
    warnings: base.warnings,
    remembered: !!memory,
  };
}
export function matchFields(
  fields: FieldDescriptor[],
  profile: Profile,
  origin = '',
  memories: RememberedMapping[] = [],
): Match[] {
  const counts = new Map<string, number>();
  fields.forEach((f) => counts.set(f.fingerprint, (counts.get(f.fingerprint) ?? 0) + 1));
  return fields.map((f) => {
    const duplicate = (counts.get(f.fingerprint) ?? 0) > 1;
    const result = matchField(f, profile, origin, duplicate ? [] : memories);
    if (duplicate && !result.excluded && result.property) {
      result.confidence = 'review';
      result.warnings.push(
        'Indistinguishable duplicate fields. Remembering this mapping is disabled.',
      );
    }
    return result;
  });
}
const countryGroups = [
  ['us', 'usa', 'united states', 'united states of america'],
  ['gb', 'uk', 'united kingdom', 'great britain'],
  ['in', 'ind', 'india'],
  ['ca', 'can', 'canada'],
  ['au', 'aus', 'australia'],
  ['de', 'deu', 'germany'],
  ['fr', 'fra', 'france'],
  ['jp', 'jpn', 'japan'],
  ['nz', 'nzl', 'new zealand'],
];
const regionGroups: Record<string, string[][]> = {
  us: [
    ['or', 'oregon'],
    ['ca', 'california'],
    ['ny', 'new york'],
    ['wa', 'washington'],
    ['tx', 'texas'],
  ],
  in: [
    ['mh', 'maharashtra'],
    ['ka', 'karnataka'],
    ['dl', 'delhi'],
    ['tn', 'tamil nadu'],
  ],
  ca: [
    ['on', 'ontario'],
    ['bc', 'british columbia'],
    ['qc', 'quebec'],
  ],
};
export function selectValue(
  value: string,
  options: FieldDescriptor['options'],
  property: string,
  country = '',
): string | null {
  const n = normalize(value);
  if (!n) return null;
  const countryKey =
    countryGroups.find((g) => g.includes(normalize(country)))?.[0] ?? normalize(country);
  const groups =
    property === 'country'
      ? countryGroups
      : property === 'region'
        ? (regionGroups[countryKey] ?? [])
        : [];
  const group = groups.find((g) => g.includes(n)) ?? [n];
  const matches = options.filter(
    (o) =>
      !o.disabled &&
      o.value !== '' &&
      [normalize(o.value), normalize(o.label)].some((v) => group.includes(v)),
  );
  return matches.length === 1 ? matches[0]!.value : null;
}
