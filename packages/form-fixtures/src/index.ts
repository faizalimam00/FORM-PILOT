import { fingerprint, type FieldDescriptor } from '@formpilot/matching-engine';
import type { PropertyKey } from '@formpilot/profile-schema';
export type Scenario = 'event' | 'job' | 'shipping' | 'saas' | 'difficult';
export interface FixtureField {
  id: string;
  label: string;
  type?: string;
  tag?: 'input' | 'select' | 'textarea';
  autocomplete?: string;
  placeholder?: string;
  section?: string;
  ariaLabel?: string;
  wrapping?: boolean;
  labelledBy?: boolean;
  options?: { label: string; value: string }[];
  initial?: string;
  expected: PropertyKey | null;
  excluded?: boolean;
  dynamic?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
}
export interface ScenarioDefinition {
  id: Scenario;
  name: string;
  title: string;
  description: string;
  fields: FixtureField[];
}
export const countries = [
  { label: 'United States', value: 'US' },
  { label: 'India', value: 'IN' },
  { label: 'Canada', value: 'CA' },
  { label: 'United Kingdom', value: 'GB' },
];
export const regions: Record<string, { label: string; value: string }[]> = {
  US: [
    { label: 'Oregon', value: 'OR' },
    { label: 'California', value: 'CA' },
    { label: 'New York', value: 'NY' },
  ],
  IN: [
    { label: 'Maharashtra', value: 'MH' },
    { label: 'Karnataka', value: 'KA' },
  ],
  CA: [
    { label: 'Ontario', value: 'ON' },
    { label: 'British Columbia', value: 'BC' },
  ],
  GB: [
    { label: 'England', value: 'England' },
    { label: 'Scotland', value: 'Scotland' },
  ],
};
export const scenarios: ScenarioDefinition[] = [
  {
    id: 'event',
    name: 'Event registration',
    title: 'A seat at the table.',
    description:
      'Explicit and wrapping labels, autocomplete metadata, contact fields and an organization. A fictional community design workshop.',
    fields: [
      { id: 'event-first', label: 'First name', autocomplete: 'given-name', expected: 'firstName' },
      { id: 'event-last', label: 'Last name', autocomplete: 'family-name', expected: 'lastName' },
      {
        id: 'event-email',
        label: 'Email address',
        type: 'email',
        autocomplete: 'email',
        expected: 'email',
      },
      {
        id: 'event-phone',
        label: 'Phone number',
        type: 'tel',
        autocomplete: 'tel',
        expected: 'phone',
      },
      {
        id: 'event-company',
        label: 'Organization',
        autocomplete: 'organization',
        wrapping: true,
        expected: 'company',
      },
      { id: 'event-title', label: 'Job title', expected: 'jobTitle' },
      { id: 'event-name', label: 'Preferred name', expected: 'preferredName' },
      { id: 'event-diet', label: 'Dietary preferences', tag: 'textarea', expected: null },
      {
        id: 'event-consent',
        label: 'I agree to the workshop terms',
        type: 'checkbox',
        expected: null,
        excluded: true,
      },
      {
        id: 'event-marketing',
        label: 'Send me marketing updates',
        type: 'checkbox',
        expected: null,
        excluded: true,
      },
    ],
  },
  {
    id: 'job',
    name: 'Job application',
    title: 'Good work starts here.',
    description:
      'Professional details, accessible labels, synonyms, unfamiliar prompts and a textarea. This application goes nowhere.',
    fields: [
      { id: 'job-full', label: 'Applicant name', autocomplete: 'name', expected: 'fullName' },
      { id: 'job-mail', label: 'Your best contact email', type: 'email', expected: 'email' },
      { id: 'job-current', label: 'Current employer', expected: 'company' },
      { id: 'job-role', label: 'Professional title', expected: 'jobTitle' },
      {
        id: 'job-site',
        label: 'Where can we see your work?',
        type: 'url',
        autocomplete: 'url',
        expected: 'portfolio',
      },
      { id: 'job-git', label: 'GitHub profile', type: 'url', expected: 'github' },
      {
        id: 'job-link',
        label: 'LinkedIn URL',
        type: 'url',
        labelledBy: true,
        expected: 'linkedin',
      },
      { id: 'job-about', label: 'Tell us about yourself', tag: 'textarea', expected: 'bio' },
      { id: 'job-superpower', label: 'Your professional superpower', expected: null },
      {
        id: 'job-resume',
        label: 'Resume attachment',
        type: 'file',
        expected: null,
        excluded: true,
      },
    ],
  },
  {
    id: 'shipping',
    name: 'Shipping details',
    title: 'Find the right doorstep.',
    description:
      'Two address sections, native dropdown normalization and a state control that is replaced when the country changes. Select country first, then rescan for state.',
    fields: [
      {
        id: 'ship-name',
        label: 'Full name',
        section: 'Shipping address',
        autocomplete: 'shipping name',
        expected: 'fullName',
      },
      {
        id: 'ship-street',
        label: 'Street address',
        section: 'Shipping address',
        autocomplete: 'shipping address-line1',
        expected: 'address1',
      },
      {
        id: 'ship-apt',
        label: 'Apartment / suite',
        section: 'Shipping address',
        autocomplete: 'shipping address-line2',
        expected: 'address2',
      },
      { id: 'ship-city', label: 'City', section: 'Shipping address', expected: 'city' },
      {
        id: 'ship-country',
        label: 'Country',
        tag: 'select',
        section: 'Shipping address',
        options: countries,
        autocomplete: 'shipping country',
        expected: 'country',
      },
      {
        id: 'ship-state',
        label: 'State or region',
        tag: 'select',
        section: 'Shipping address',
        dynamic: true,
        expected: 'region',
      },
      { id: 'ship-zip', label: 'Postal code', section: 'Shipping address', expected: 'postalCode' },
      {
        id: 'bill-street',
        label: 'Street address',
        section: 'Billing address',
        autocomplete: 'billing address-line1',
        expected: 'address1',
      },
      { id: 'bill-city', label: 'City', section: 'Billing address', expected: 'city' },
      {
        id: 'bill-country',
        label: 'Country',
        tag: 'select',
        section: 'Billing address',
        options: countries,
        expected: 'country',
      },
      { id: 'bill-card', label: 'Card number', section: 'Payment', expected: null, excluded: true },
    ],
  },
  {
    id: 'saas',
    name: 'SaaS onboarding',
    title: 'A workspace of your own.',
    description:
      'React-controlled inputs and a company field revealed by choosing a work account. The live preview reflects React state, not just DOM values.',
    fields: [
      { id: 'saas-full', label: 'Full name', autocomplete: 'name', expected: 'fullName' },
      { id: 'saas-email', label: 'Company email', type: 'email', expected: 'email' },
      {
        id: 'saas-kind',
        label: 'Account type',
        tag: 'select',
        options: [
          { label: 'Personal', value: 'personal' },
          { label: 'Work', value: 'work' },
        ],
        expected: null,
      },
      { id: 'saas-company', label: 'Company name', dynamic: true, expected: 'company' },
      { id: 'saas-role', label: 'Role at company', expected: 'jobTitle' },
      { id: 'saas-site', label: 'Personal website', type: 'url', expected: 'portfolio' },
      { id: 'saas-about', label: 'Short bio', tag: 'textarea', expected: 'bio' },
      {
        id: 'saas-pass',
        label: 'Create password',
        type: 'password',
        expected: null,
        excluded: true,
      },
      {
        id: 'saas-otp',
        label: 'Verification code',
        autocomplete: 'one-time-code',
        expected: null,
        excluded: true,
      },
      {
        id: 'saas-terms',
        label: 'I accept the terms',
        type: 'checkbox',
        expected: null,
        excluded: true,
      },
    ],
  },
  {
    id: 'difficult',
    name: 'Difficult form',
    title: 'Knowing when to pause.',
    description:
      'Ambiguous names, weak hints, existing values, repeated sections and sensitive fields. Leaving a mystery field untouched is the correct outcome.',
    fields: [
      { id: 'mystery-a', label: 'Name', expected: null },
      { id: 'mystery-b', label: 'Account name', expected: null },
      { id: 'mystery-c', label: '', ariaLabel: 'Mystery detail', expected: null },
      { id: 'weak-hint', label: 'Contact detail', placeholder: 'Email address', expected: 'email' },
      {
        id: 'existing-mail',
        label: 'Email address',
        type: 'email',
        initial: 'already.here@example.com',
        expected: 'email',
      },
      { id: 'repeat-first', label: 'First name', section: 'Your details', expected: 'firstName' },
      {
        id: 'other-first',
        label: 'First name',
        section: 'Emergency contact',
        expected: 'firstName',
      },
      { id: 'misleading-company', label: 'Company email', type: 'email', expected: 'email' },
      {
        id: 'protected',
        label: 'Company',
        readOnly: true,
        initial: 'Example Studio',
        expected: null,
        excluded: true,
      },
      { id: 'secret', label: 'API key', expected: null, excluded: true },
      { id: 'card', label: 'Payment card', expected: null, excluded: true },
      { id: 'verification', label: 'Verification code', expected: null, excluded: true },
      { id: 'upload', label: 'Upload a file', type: 'file', expected: null, excluded: true },
      { id: 'hidden-email', label: 'Email', type: 'hidden', expected: null, excluded: true },
      { id: 'disabled-name', label: 'Full name', disabled: true, expected: null, excluded: true },
    ],
  },
];
export function descriptor(label: string, patch: Partial<FieldDescriptor> = {}): FieldDescriptor {
  const field: FieldDescriptor = {
    token: '00000000-0000-4000-8000-000000000099',
    tag: 'input',
    type: 'text',
    label,
    ariaLabel: '',
    labelledBy: '',
    name: '',
    id: '',
    placeholder: '',
    autocomplete: '',
    section: '',
    form: 'fixture',
    options: [],
    hasValue: false,
    disabled: false,
    readOnly: false,
    hidden: false,
    fingerprint: '',
    ...patch,
  };
  field.fingerprint = fingerprint(field);
  return field;
}
export interface BenchmarkCase {
  id: string;
  scenario: Scenario;
  split: 'development' | 'held-out';
  field: FieldDescriptor;
  expected: PropertyKey | null;
  excluded: boolean;
  note: string;
}
export const developmentCases: BenchmarkCase[] = scenarios.flatMap((s) =>
  s.fields.map((f) => ({
    id: `dev-${f.id}`,
    scenario: s.id,
    split: 'development' as const,
    field: descriptor(f.label, {
      id: f.id,
      type: f.type ?? 'text',
      tag: f.tag ?? 'input',
      ariaLabel: f.ariaLabel ?? '',
      placeholder: f.placeholder ?? '',
      autocomplete: f.autocomplete ?? '',
      section: f.section ?? '',
      options: f.options ?? (f.id === 'ship-state' ? regions.US : []) ?? [],
      hasValue: !!f.initial,
      hidden: f.type === 'hidden',
      disabled: !!f.disabled,
      readOnly: !!f.readOnly,
    }),
    expected: f.expected,
    excluded: !!f.excluded,
    note: s.description,
  })),
);
