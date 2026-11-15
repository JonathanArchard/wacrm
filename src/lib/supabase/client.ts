import { browserNetworkRestricted, guardedBrowserFetch, assertBrowserSupabaseDestination } from '@/lib/browser-network-policy';
import { guardedAuthFetch } from '@/lib/auth/email-fetch'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton instance — one client shared across the whole browser session.
// Creating multiple clients causes auth-lock contention ("Lock was released
// because another request stole it") and intermittent fetch failures.
let browserClient: SupabaseClient | undefined

export function createClient() {
  if (browserClient) return browserClient

  assertBrowserSupabaseDestination(process.env.NEXT_PUBLIC_SUPABASE_URL!);
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { fetch: guardedAuthFetch(async () => {
      const response = await guardedBrowserFetch('/api/auth/email-policy', { cache: 'no-store' });
      return response.ok && (await response.json()).enabled === true;
    }, guardedBrowserFetch) } }
  )

  return browserClient
}
