import { browser } from 'wxt/browser';
import { z } from 'zod';
import { exportSchema, propertyLabels, type PropertyKey } from '@formpilot/profile-schema';
export const memorySchema = z
  .object({
    id: z.string().uuid(),
    origin: z
      .string()
      .url()
      .refine((v) => /^https?:/.test(v) && new URL(v).origin === v),
    fingerprint: z.string().max(200_000),
    property: z
      .string()
      .refine((k) => Object.hasOwn(propertyLabels, k) || /^custom:[0-9a-f-]{36}$/.test(k))
      .transform((k) => k as PropertyKey),
    label: z.string().max(2000),
    createdAt: z.iso.datetime(),
  })
  .strict();
export const stateSchema = z
  .object({
    revision: z.number().int().min(0),
    data: exportSchema,
    memories: z.array(memorySchema).max(500),
  })
  .strict();
export type State = z.infer<typeof stateSchema>;
export const emptyState = (): State => ({
  revision: 0,
  data: {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    profiles: [],
    activeProfileId: null,
  },
  memories: [],
});
export const writeSchema = z
  .object({
    type: z.literal('save-state'),
    expectedRevision: z.number().int().min(0),
    state: stateSchema,
  })
  .strict();
export const clearSchema = z
  .object({ type: z.literal('delete-all'), expectedRevision: z.number().int().min(0) })
  .strict();
export async function readState(): Promise<State> {
  const data = await browser.storage.local.get('formpilot');
  return data.formpilot ? stateSchema.parse(data.formpilot) : emptyState();
}
export async function saveState(state: State): Promise<State> {
  const response: unknown = await browser.runtime.sendMessage({
    type: 'save-state',
    expectedRevision: state.revision,
    state: stateSchema.parse(state),
  });
  return parseResponse(response);
}
export async function clearState(revision: number): Promise<State> {
  return parseResponse(
    await browser.runtime.sendMessage({ type: 'delete-all', expectedRevision: revision }),
  );
}
function parseResponse(raw: unknown): State {
  const parsed = z
    .object({ ok: z.boolean(), state: stateSchema.optional(), error: z.string().optional() })
    .safeParse(raw);
  if (!parsed.success)
    throw new Error('The extension could not save data. Reload the extension and try again.');
  const response = parsed.data;
  if (!response.ok || !response.state)
    throw new Error(response.error || 'Could not save local data.');
  return response.state;
}
export function friendlyError(error: unknown): string {
  if (error instanceof Error && /changed in another/.test(error.message)) return error.message;
  if (error instanceof Error && /scan expired|page changed|already in progress/.test(error.message))
    return error.message;
  return 'FormPilot could not complete this action. Reopen it from the website’s toolbar icon and try again. Browser-internal pages, web stores and some protected pages cannot be inspected.';
}
