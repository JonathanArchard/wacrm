const STAGING_SUPABASE = 'https://wufgihqppsmbhflbwtcc.supabase.co';
const STAGING_SITE = 'https://wa-staging.ftta.in';

export function externalNetworkDisabled(): boolean {
  return process.env.APP_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_SITE_URL === STAGING_SITE ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('wufgihqppsmbhflbwtcc') === true ||
    process.env.EXTERNAL_NETWORK_ENABLED !== 'true';
}

export function isStagingNetworkDestination(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.username || url.password || url.protocol !== 'https:') return false;
    return url.origin === STAGING_SUPABASE &&
      /^\/(?:rest|auth|storage|realtime)\/v1(?:\/|$)/.test(url.pathname) ||
      url.origin === STAGING_SITE;
  } catch { return false; }
}

/** Explicit transport boundary; does not modify the global fetch. */
export async function guardedNetworkFetch(input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]): Promise<Response> {
  const restricted = externalNetworkDisabled();
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (restricted && !isStagingNetworkDestination(raw)) {
    throw new Error('External network destination is disabled in this environment');
  }
  // A redirect must never escape the staging origin allowlist.
  return fetch(input, restricted ? { ...init, redirect: 'error' } : init);
}
