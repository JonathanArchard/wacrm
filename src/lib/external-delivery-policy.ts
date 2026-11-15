/** External delivery is opt-in. Missing or invalid runtime bindings deny delivery. */
export function externalDeliveryDisabled(): boolean {
  return process.env.APP_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_SITE_URL === 'https://wa-staging.ftta.in' ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('wufgihqppsmbhflbwtcc') === true ||
    process.env.WHATSAPP_ENABLED !== 'true';
}
