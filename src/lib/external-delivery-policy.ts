/** Block external messaging and webhook delivery in staging, even if a flag is accidentally enabled. */
export function externalDeliveryDisabled(): boolean {
  return process.env.APP_ENV === 'staging' ||
    process.env.NEXT_PUBLIC_SITE_URL === 'https://wa-staging.ftta.in' ||
    process.env.WHATSAPP_ENABLED === 'false';
}
