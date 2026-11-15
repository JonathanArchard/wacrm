import { afterEach, expect, it, vi } from 'vitest';
import { externalEmailDisabled } from './email-policy';
afterEach(() => vi.unstubAllEnvs());
it.each([undefined, '', 'false', 'TRUE', '1'])('denies flag %s', (flag) => {
  vi.stubEnv('EMAIL_ENABLED', flag);
  expect(externalEmailDisabled()).toBe(true);
});
it.each([undefined, '', 'staging', 'development'])('denies environment %s', (env) => {
  vi.stubEnv('APP_ENV', env);
  expect(externalEmailDisabled()).toBe(true);
});
it('denies staging targets', () => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://wa-staging.ftta.in');
  expect(externalEmailDisabled()).toBe(true);
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://test.example.invalid');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://wufgihqppsmbhflbwtcc.supabase.co');
  expect(externalEmailDisabled()).toBe(true);
});
it('allows independent production opt-in', () => {
  vi.stubEnv('WHATSAPP_ENABLED', 'false');
  vi.stubEnv('AI_ENABLED', 'false');
  vi.stubEnv('OUTBOUND_WEBHOOKS_ENABLED', 'false');
  expect(externalEmailDisabled()).toBe(false);
});
