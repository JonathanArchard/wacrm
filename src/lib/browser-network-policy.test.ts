import { afterEach, expect, it, vi } from 'vitest';
import { assertBrowserSupabaseDestination, browserNetworkRestricted, guardedBrowserFetch, isAllowedBrowserDestination, safeBrowserMediaUrl, stagingContentSecurityPolicy } from './browser-network-policy';
const db = 'https://wufgihqppsmbhflbwtcc.supabase.co';
const site = 'https://wa-staging.ftta.in';
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it.each(['/api/auth/email-policy', db+'/rest/v1/x', db+'/auth/v1/token', db+'/storage/v1/object/x', db+'/realtime/v1/x'])('allows %s', url => {
  expect(isAllowedBrowserDestination(url, false, site)).toBe(true);
});
it.each(['https://wa.ftta.in/x', 'https://graph.facebook.com/x', 'https://other.supabase.co/rest/v1/x', '//evil.invalid/x', db+'.evil.invalid/storage/v1/x', 'http://'+db.slice(8), 'javascript:alert(1)', db+'/functions/v1/x'])('rejects %s', url => {
  expect(isAllowedBrowserDestination(url, false, site)).toBe(false);
});
it('limits media to storage and same origin', () => {
  expect(isAllowedBrowserDestination(db+'/auth/v1/x', true, site)).toBe(false);
  expect(isAllowedBrowserDestination(db+'/storage/v1/object/x', true, site)).toBe(true);
});
it('rejects misconfigured SDK and unsafe media in staging', () => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', site);
  expect(browserNetworkRestricted()).toBe(true);
  expect(() => assertBrowserSupabaseDestination('https://other.supabase.co')).toThrow();
  expect(() => assertBrowserSupabaseDestination(db)).not.toThrow();
  expect(safeBrowserMediaUrl('https://external.invalid/x')).toBeUndefined();
});
it('uses actual staging browser hostname even when public config is wrong', () => {
  vi.stubGlobal('window', {location:{hostname:'wa-staging.ftta.in', origin:site}});
  expect(browserNetworkRestricted()).toBe(true);
});
it('blocks external fetch before transport and denies redirects', async () => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', site);
  const transport = vi.fn().mockResolvedValue(new Response('{}'));
  vi.stubGlobal('fetch', transport);
  await expect(guardedBrowserFetch('https://external.invalid')).rejects.toThrow();
  expect(transport).not.toHaveBeenCalled();
  await guardedBrowserFetch('/api/auth/email-policy', {redirect:'follow'});
  expect(transport).toHaveBeenCalledWith('/api/auth/email-policy', {redirect:'error'});
});
it('CSP uses exact staging origins for resources and websocket', () => {
  const csp = stagingContentSecurityPolicy();
  expect(csp).toContain("connect-src 'self' "+db+" wss://wufgihqppsmbhflbwtcc.supabase.co");
  expect(csp).toContain("frame-src 'none'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).not.toContain('*.supabase.co');
  expect(csp).not.toContain('graph.facebook.com');
});
