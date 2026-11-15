import { afterEach, expect, it, vi } from 'vitest';
import { outboundWebhooksDisabled } from './environment-policy';

afterEach(() => vi.unstubAllEnvs());

it.each([undefined, '', 'development', 'staging'])('denies environment %s', (env) => {
  vi.stubEnv('APP_ENV', env);
  expect(outboundWebhooksDisabled()).toBe(true);
});

it('denies known staging targets even with production flags', () => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://wa-staging.ftta.in');
  expect(outboundWebhooksDisabled()).toBe(true);
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://test.example.invalid');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://wufgihqppsmbhflbwtcc.supabase.co');
  expect(outboundWebhooksDisabled()).toBe(true);
});

it('allows explicitly opted-in production', () => {
  expect(outboundWebhooksDisabled()).toBe(false);
});
