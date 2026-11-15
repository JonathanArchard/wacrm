import { expect, it, vi } from 'vitest';
import { guardedAuthFetch } from './email-fetch';

const base = 'https://example.invalid/auth/v1/';
it.each(['signup', 'recover', 'otp', 'resend', 'magiclink', 'invite', 'reauthenticate', 'admin/invite'])('blocks %s without transport', async (route) => {
  const transport = vi.fn<typeof fetch>();
  const request = guardedAuthFetch(() => false, transport);
  expect((await request(base + route, { method: 'POST' })).status).toBe(403);
  expect(transport).not.toHaveBeenCalled();
});
it('blocks email change, preserves password update and login', async () => {
  const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}'));
  const request = guardedAuthFetch(() => false, transport);
  expect((await request(base + 'user', { method: 'PUT', body: JSON.stringify({email:'test@example.invalid'}) })).status).toBe(403);
  expect(transport).not.toHaveBeenCalled();
  await request(base + 'user', { method: 'PUT', body: JSON.stringify({password:'dummy'}) });
  await request(base + 'token?grant_type=password', { method: 'POST' });
  expect(transport).toHaveBeenCalledTimes(2);
});
it('fails closed when policy lookup throws', async () => {
  const transport = vi.fn<typeof fetch>();
  const request = guardedAuthFetch(async () => { throw new Error('offline'); }, transport);
  expect((await request(base + 'recover', { method: 'POST' })).status).toBe(403);
  expect(transport).not.toHaveBeenCalled();
});
it('allows explicit opt-in', async () => {
  const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}'));
  await guardedAuthFetch(() => true, transport)(base + 'recover', { method: 'POST' });
  expect(transport).toHaveBeenCalledOnce();
});
