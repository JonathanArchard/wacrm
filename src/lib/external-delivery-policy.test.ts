import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { externalDeliveryDisabled } from './external-delivery-policy';
import { sendTextMessage, sendTemplateMessage, sendMediaMessage, sendReactionMessage, sendTypingIndicator, sendInteractiveButtons, sendInteractiveList } from './whatsapp/meta-api';

const base = { phoneNumberId: 'fake', accessToken: 'fake', to: '1234567890' };
beforeEach(() => {
  vi.stubEnv('APP_ENV', '');
  vi.stubEnv('WHATSAPP_ENABLED', '');
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ messages: [{ id: 'mock' }] }))));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('external delivery isolation', () => {
  it.each([
    ['staging', 'true', ''],
    ['', 'true', 'https://wa-staging.ftta.in'],
    ['production', 'false', ''],
  ])('blocks environment %s / flag %s / site %s', async (env, flag, site) => {
    vi.stubEnv('APP_ENV', env);
    vi.stubEnv('WHATSAPP_ENABLED', flag);
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', site);
    expect(externalDeliveryDisabled()).toBe(true);
    const sends = [
      () => sendTextMessage({ ...base, text: 'test' }),
      () => sendTemplateMessage({ ...base, templateName: 'test' }),
      () => sendMediaMessage({ ...base, kind: 'image', link: 'https://example.invalid/test' }),
      () => sendReactionMessage({ ...base, targetMessageId: 'fake', emoji: 'x' }),
      () => sendTypingIndicator({ ...base, messageId: 'fake' }),
      () => sendInteractiveButtons({ ...base, bodyText: 'test', buttons: [{ id: 'a', title: 'A' }] }),
      () => sendInteractiveList({ ...base, bodyText: 'test', buttonLabel: 'Open', sections: [{ rows: [{ id: 'a', title: 'A' }] }] }),
    ];
    for (const send of sends) await expect(send()).rejects.toThrow('disabled in this environment');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('denies missing runtime bindings', async () => {
    expect(externalDeliveryDisabled()).toBe(true);
    await expect(sendTextMessage({ ...base, text: 'test' })).rejects.toThrow('disabled in this environment');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('denies staging database even with production flags', () => {
    vi.stubEnv('APP_ENV', 'production');
    vi.stubEnv('WHATSAPP_ENABLED', 'true');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://wufgihqppsmbhflbwtcc.supabase.co');
    expect(externalDeliveryDisabled()).toBe(true);
  });
  it('allows explicitly enabled production with a mocked transport', async () => {
    vi.stubEnv('APP_ENV', 'production');
    vi.stubEnv('WHATSAPP_ENABLED', 'true');
    expect(externalDeliveryDisabled()).toBe(false);
    await expect(sendTextMessage({ ...base, text: 'test' })).resolves.toEqual({ messageId: 'mock' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
