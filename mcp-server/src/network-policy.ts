// Independent policy for the separate MCP process. Never enabled in staging.
export function assertMcpOrigin(raw: string): URL {
  if (process.env.APP_ENV !== 'production' || process.env.MCP_ENABLED !== 'true' ||
      process.env.MCP_EXTERNAL_NETWORK_ENABLED !== 'true') {
    throw new Error('MCP runtime disabled in this environment');
  }
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error('Invalid MCP destination'); }
  if (url.protocol !== 'https:' || url.username || url.password ||
      url.origin === 'https://wa-staging.ftta.in' ||
      url.origin !== process.env.MCP_ALLOWED_ORIGIN ||
      !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z][a-z0-9-]*$/i.test(url.hostname) ||
      url.hostname.endsWith('.localhost') || url.hostname.endsWith('.local')) {
    throw new Error('MCP destination denied');
  }
  return url;
}

export async function guardedMcpFetch(url: URL, init: RequestInit): Promise<Response> {
  assertMcpOrigin(url.href);
  if (!url.pathname.startsWith('/api/v1/')) throw new Error('MCP API path denied');
  return fetch(url, { ...init, redirect: 'error' });
}
