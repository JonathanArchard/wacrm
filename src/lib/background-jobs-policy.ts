/** Background business processing is explicitly opt-in, production only. */
export function backgroundJobsDisabled(): boolean {
  return process.env.APP_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_SITE_URL === 'https://wa-staging.ftta.in' ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('wufgihqppsmbhflbwtcc') === true ||
    process.env.BACKGROUND_JOBS_ENABLED !== 'true';
}
