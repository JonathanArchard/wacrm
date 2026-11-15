/** External email is independently opt-in in production only. */
export function externalEmailDisabled(): boolean {
  return process.env.APP_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_SITE_URL === 'https://wa-staging.ftta.in' ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('wufgihqppsmbhflbwtcc') === true ||
    process.env.EMAIL_ENABLED !== 'true';
}
