/** Webhook egress is opt-in, independently of AI and WhatsApp. */
export function outboundWebhooksDisabled(): boolean {
  return process.env.APP_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_SITE_URL === 'https://wa-staging.ftta.in' ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('wufgihqppsmbhflbwtcc') === true ||
    process.env.OUTBOUND_WEBHOOKS_ENABLED !== 'true';
}
