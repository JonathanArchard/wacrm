import { afterEach, expect, it, vi } from 'vitest';
import { externalNetworkDisabled, guardedNetworkFetch, isStagingNetworkDestination } from './network-policy';
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
const staging = 'https://wufgihqppsmbhflbwtcc.supabase.co';
it.each(['rest','auth','storage','realtime'])('allows exact staging %s endpoint', path => {
  expect(isStagingNetworkDestination(staging + '/' + path + '/v1/test')).toBe(true);
});
it.each(['https://mimjmzjjsfteiwsztypk.supabase.co/rest/v1/x','https://graph.facebook.com/x','https://api.openai.com/v1/x','https://api.anthropic.com/x','https://wufgihqppsmbhflbwtcc.supabase.co.evil.invalid/rest/v1/x','https://wufgihqppsmbhflbwtcc.supabase.co@evil.invalid/rest/v1/x','http://wufgihqppsmbhflbwtcc.supabase.co/rest/v1/x','https://wufgihqppsmbhflbwtcc.supabase.co:444/rest/v1/x','https://127.0.0.1/x','https://wa.ftta.in/x','https://wufgihqppsmbhflbwtcc.supabase.co/functions/v1/x'])('blocks %s before fetch', async url => {
  vi.stubEnv('APP_ENV','staging');
  const transport = vi.fn();
  vi.stubGlobal('fetch',transport);
  await expect(guardedNetworkFetch(url)).rejects.toThrow('External network destination');
  expect(transport).not.toHaveBeenCalled();
});
it('rejects redirects in staging even if caller requests follow', async () => {
  vi.stubEnv('APP_ENV','staging');
  const transport = vi.fn().mockResolvedValue(new Response('{}'));
  vi.stubGlobal('fetch',transport);
  await guardedNetworkFetch(staging+'/rest/v1/x',{redirect:'follow'});
  expect(transport).toHaveBeenCalledWith(staging+'/rest/v1/x',{redirect:'error'});
});
it.each([undefined,'','false','TRUE'])('fails closed on flag %s', flag => {
  vi.stubEnv('EXTERNAL_NETWORK_ENABLED',flag);
  expect(externalNetworkDisabled()).toBe(true);
});
it('production opt-in preserves existing fetch behavior', async () => {
  const transport = vi.fn().mockResolvedValue(new Response('{}'));
  vi.stubGlobal('fetch',transport);
  await guardedNetworkFetch('https://example.invalid',{method:'POST'});
  expect(transport).toHaveBeenCalledWith('https://example.invalid',{method:'POST'});
});
