import { afterEach, describe, expect, it, vi } from 'vitest'
import { externalAiDisabled } from './environment-policy'
import { generateOpenAi } from './providers/openai'
import { generateAnthropic } from './providers/anthropic'
import { generateOpenAiCompatible } from './providers/openai-compatible'
import { embedTexts } from './embeddings'

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('external AI isolation', () => {
  it.each([undefined, '', 'false', 'TRUE', '1'])('denies AI_ENABLED=%s', (value) => {
    vi.stubEnv('AI_ENABLED', value)
    expect(externalAiDisabled()).toBe(true)
  })
  it.each(['staging', 'development', '', undefined])('denies APP_ENV=%s even when enabled', (value) => {
    vi.stubEnv('APP_ENV', value)
    expect(externalAiDisabled()).toBe(true)
  })
  it('denies staging site and DB independently', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://wa-staging.ftta.in')
    expect(externalAiDisabled()).toBe(true)
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://test.example.invalid')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://wufgihqppsmbhflbwtcc.supabase.co')
    expect(externalAiDisabled()).toBe(true)
  })
  it('allows explicit production AI independently of WhatsApp', () => {
    vi.stubEnv('WHATSAPP_ENABLED', 'false')
    expect(externalAiDisabled()).toBe(false)
  })
  it('blocks all providers and embeddings before fetch', async () => {
    vi.stubEnv('APP_ENV', 'staging')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const args = { apiKey: 'dummy', model: 'dummy', systemPrompt: '', messages: [], timeoutMs: 100, baseUrl: 'https://example.invalid' }
    for (const call of [() => generateOpenAi(args), () => generateAnthropic(args), () => generateOpenAiCompatible(args), () => embedTexts('dummy', ['test'])]) {
      await expect(call()).rejects.toMatchObject({ code: 'ai_environment_disabled', status: 403 })
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
