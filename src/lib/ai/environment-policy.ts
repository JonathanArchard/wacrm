import { AiError } from './types'

// Independent of WhatsApp. Only an explicitly enabled production runtime may contact AI providers.
export function externalAiDisabled(): boolean {
  return process.env.APP_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_SITE_URL === 'https://wa-staging.ftta.in' ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('wufgihqppsmbhflbwtcc') === true ||
    process.env.AI_ENABLED !== 'true'
}

export function assertExternalAiAllowed(): void {
  if (externalAiDisabled()) {
    throw new AiError('External AI is disabled in this environment', {
      code: 'ai_environment_disabled', status: 403,
    })
  }
}
