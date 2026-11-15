const STAGING_SITE = 'https://wa-staging.ftta.in';
const STAGING_DB = 'https://wufgihqppsmbhflbwtcc.supabase.co';

// Public identifiers only. The actual browser origin is checked as well as
// build-time public configuration; no private runtime flags are exposed.
export function browserNetworkRestricted(): boolean {
  return (typeof window !== 'undefined' && window.location.hostname === 'wa-staging.ftta.in') ||
    process.env.NEXT_PUBLIC_SITE_URL === STAGING_SITE ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === STAGING_DB;
}

function currentOrigin(): string {
  return typeof window !== 'undefined' ? window.location.origin : STAGING_SITE;
}

export function isAllowedBrowserDestination(raw: string, mediaOnly = false, origin = currentOrigin()): boolean {
  try {
    const url = new URL(raw, origin);
    if (url.username || url.password || url.protocol !== 'https:') return false;
    if (url.origin === origin) return true;
    return url.origin === STAGING_DB && (mediaOnly
      ? /^\/storage\/v1\//.test(url.pathname)
      : /^\/(?:rest|auth|storage|realtime)\/v1(?:\/|$)/.test(url.pathname));
  } catch { return false; }
}

export function safeBrowserMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (!browserNetworkRestricted()) return url;
  return isAllowedBrowserDestination(url, true) ? url : undefined;
}

export function assertBrowserSupabaseDestination(raw: string): void {
  if (browserNetworkRestricted() && raw !== STAGING_DB) {
    throw new Error('Browser Supabase destination is disabled in staging');
  }
}

export async function guardedBrowserFetch(input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]): Promise<Response> {
  if (!browserNetworkRestricted()) return fetch(input, init);
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (!isAllowedBrowserDestination(raw)) throw new Error('Browser network destination is disabled in staging');
  return fetch(input, { ...init, redirect: 'error' });
}

export function stagingContentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: " + STAGING_DB + "/storage/v1/",
    "media-src 'self' blob: " + STAGING_DB + "/storage/v1/",
    "font-src 'self' data:",
    "connect-src 'self' " + STAGING_DB + " wss://wufgihqppsmbhflbwtcc.supabase.co",
    "frame-src 'none'",
    "object-src 'none'",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}
