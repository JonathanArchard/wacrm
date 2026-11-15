import { afterEach, expect, it, vi } from 'vitest';
import { GET as automationCron } from '@/app/api/automations/cron/route';
import { GET as flowCron } from '@/app/api/flows/cron/route';
const admin = vi.hoisted(() => vi.fn(() => { throw new Error('DB access forbidden'); }));
vi.mock('@/lib/automations/admin-client', () => ({ supabaseAdmin: admin }));
vi.mock('@/lib/flows/admin-client', () => ({ supabaseAdmin: admin }));
afterEach(() => vi.unstubAllEnvs());
it.each([automationCron, flowCron])('denies cron before DB access even with valid secret', async handler => {
  vi.stubEnv('AUTOMATION_CRON_SECRET', 'test-only');
  vi.stubEnv('BACKGROUND_JOBS_ENABLED', 'false');
  const result = await handler(new Request('https://example.invalid', { headers: {'x-cron-secret':'test-only'} }));
  expect(result.status).toBe(503);
  expect((await result.json()).code).toBe('BACKGROUND_JOBS_DISABLED');
  expect(admin).not.toHaveBeenCalled();
});
