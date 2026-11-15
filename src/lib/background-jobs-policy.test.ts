import { afterEach, expect, it, vi } from 'vitest';
import { backgroundJobsDisabled } from './background-jobs-policy';
afterEach(() => vi.unstubAllEnvs());
it.each([undefined, '', 'false', 'TRUE', '1'])('denies flag %s', flag => {
  vi.stubEnv('BACKGROUND_JOBS_ENABLED', flag);
  expect(backgroundJobsDisabled()).toBe(true);
});
it.each([undefined, '', 'development', 'staging'])('denies environment %s', env => {
  vi.stubEnv('APP_ENV', env);
  expect(backgroundJobsDisabled()).toBe(true);
});
it('denies staging targets', () => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://wa-staging.ftta.in');
  expect(backgroundJobsDisabled()).toBe(true);
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://test.example.invalid');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://wufgihqppsmbhflbwtcc.supabase.co');
  expect(backgroundJobsDisabled()).toBe(true);
});
it('allows explicit production independently of external service flags', () => {
  vi.stubEnv('WHATSAPP_ENABLED', 'false');
  vi.stubEnv('AI_ENABLED', 'false');
  vi.stubEnv('EMAIL_ENABLED', 'false');
  vi.stubEnv('OUTBOUND_WEBHOOKS_ENABLED', 'false');
  expect(backgroundJobsDisabled()).toBe(false);
});
