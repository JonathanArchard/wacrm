// Test-only defaults; never import this module into application code.
// Assign before test modules load, including when the shell contains staging values.
const testEnv: Record<string, string> = {
  APP_ENV: 'production',
  WHATSAPP_ENABLED: 'true',
  AI_ENABLED: 'true',
  EMAIL_ENABLED: 'true',
  OUTBOUND_WEBHOOKS_ENABLED: 'true',
  NEXT_PUBLIC_SITE_URL: 'https://test.example.invalid',
  NEXT_PUBLIC_SUPABASE_URL: 'https://ci.example.invalid',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'ci-dummy-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'ci-dummy-service-role-key',
  ENCRYPTION_KEY: '0'.repeat(64),
  META_APP_SECRET: 'test-meta-app-secret',
  AUTOMATION_CRON_SECRET: '',
};
Object.assign(process.env, testEnv);

// Default deny for global fetch. Individual tests may replace this with
// their own mock. Direct assignment avoids vi.unstubAllGlobals restoring
// a real fetch instead of this baseline. This is not an OS network sandbox.
globalThis.fetch = async () => {
  throw new Error('Unmocked fetch is forbidden in automated tests');
};
