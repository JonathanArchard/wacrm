import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
  const forbidden = vi.fn(() => { throw new Error('Unexpected business operation'); });
  const supabase = { from: forbidden, rpc: forbidden, storage: { from: forbidden } };
  return { forbidden, supabase, requireRole: vi.fn(async () => ({ supabase, accountId: 'account-test', userId: 'user-test' })), requireApiKey: vi.fn(async () => ({ supabase, accountId: 'account-test', userId: 'user-test' })), after: vi.fn(() => { throw new Error('Unexpected background delivery'); }) };
});

vi.mock('next/server', async (original) => ({
  ...(await original<typeof import('next/server')>()),
  after: h.after,
}));
vi.mock('@/lib/auth/account', async (original) => ({
  ...(await original<typeof import('@/lib/auth/account')>()),
  requireRole: h.requireRole,
}));
vi.mock('@/lib/auth/api-context', async (original) => ({
  ...(await original<typeof import('@/lib/auth/api-context')>()),
  requireApiKey: h.requireApiKey,
}));
vi.mock('@/lib/flows/admin-client', () => ({ supabaseAdmin: h.forbidden }));
vi.mock('@/lib/automations/admin-client', () => ({ supabaseAdmin: h.forbidden }));

import { POST as dashboardSend } from '@/app/api/whatsapp/send/route';
import { POST as publicSend } from '@/app/api/v1/messages/route';
import { POST as dashboardBroadcast } from '@/app/api/whatsapp/broadcast/route';
import { POST as publicBroadcast } from '@/app/api/v1/broadcasts/route';
import { POST as resumeBroadcast } from '@/app/api/whatsapp/broadcast/[id]/resume/route';
import { POST as react } from '@/app/api/whatsapp/react/route';
import { POST as configure } from '@/app/api/whatsapp/config/route';
import { POST as submitTemplate } from '@/app/api/whatsapp/templates/submit/route';
import { POST as syncTemplates } from '@/app/api/whatsapp/templates/sync/route';
import { PATCH as editTemplate, DELETE as deleteTemplate } from '@/app/api/whatsapp/templates/[id]/route';
import { POST as triggerAutomation } from '@/app/api/automations/engine/route';
import { GET as cron } from '@/app/api/automations/cron/route';
import { GET as verifyWebhook, POST as inboundWebhook } from '@/app/api/whatsapp/webhook/route';

const params = { params: Promise.resolve({ id: '123e4567-e89b-42d3-a456-426614174000' }) };
function request(method = 'POST') {
  return new Request('https://wa-staging.ftta.in/api/test?hub.mode=subscribe&hub.challenge=test&hub.verify_token=test', {
    method,
    headers: { 'content-type': 'application/json', 'x-cron-secret': 'test-cron-secret' },
    ...(method === 'GET' ? {} : { body: '{}' }),
  });
}
const cases: Array<[string, () => Promise<Response>]> = [
  ['dashboard send', () => dashboardSend(request())],
  ['public send', () => publicSend(request())],
  ['dashboard broadcast', () => dashboardBroadcast(request())],
  ['public broadcast', () => publicBroadcast(request())],
  ['broadcast resume/retry', () => resumeBroadcast(request(), params)],
  ['reaction', () => react(request())],
  ['configuration', () => configure(request())],
  ['template submission', () => submitTemplate(request())],
  ['template sync', () => syncTemplates()],
  ['template edit', () => editTemplate(request('PATCH'), params)],
  ['template deletion', () => deleteTemplate(request('DELETE'), params)],
  ['manual automation', () => triggerAutomation(request())],
  ['scheduled automation', () => cron(request('GET'))],
  ['webhook verification', () => verifyWebhook(request('GET'))],
  ['inbound webhook', () => inboundWebhook(request())],
];

beforeEach(() => {
  vi.stubEnv('APP_ENV', 'staging');
  vi.stubEnv('WHATSAPP_ENABLED', 'true');
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://wa-staging.ftta.in');
  vi.stubEnv('AUTOMATION_CRON_SECRET', 'test-cron-secret');
  vi.stubGlobal('fetch', h.forbidden);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('early API delivery isolation', () => {
  it.each(cases)('%s rejects before business operations', async (_name, invoke) => {
    const response = await invoke();
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({ code: 'EXTERNAL_DELIVERY_DISABLED' });
    expect(h.forbidden).not.toHaveBeenCalled();
    expect(h.after).not.toHaveBeenCalled();
  });
  it('rejects missing runtime flags at the API boundary', async () => {
    vi.stubEnv('APP_ENV', '');
    vi.stubEnv('WHATSAPP_ENABLED', '');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    expect((await publicSend(request())).status).toBe(503);
    expect(h.forbidden).not.toHaveBeenCalled();
    expect(h.after).not.toHaveBeenCalled();
  });
  it('retains cron authentication before the environment guard', async () => {
    const response = await cron(new Request('https://wa-staging.ftta.in/api/automations/cron'));
    expect(response.status).toBe(401);
    expect(h.forbidden).not.toHaveBeenCalled();
  });
});
