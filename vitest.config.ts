import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: { "@app-messages": new URL("./messages/en.json", import.meta.url).pathname },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Dummy secrets — encryption.ts / webhook-signature.ts read these
    // at module load. Tests never hit a real Meta/Supabase service, so
    // any 32-byte hex / non-empty string will do; keep them lexically
    // identical to the CI build env so behaviour matches.
    env: {
      // Existing transport tests use mocked fetch and explicitly opt in.
      APP_ENV: "production",
      WHATSAPP_ENABLED: "true",
      AI_ENABLED: "true",
      OUTBOUND_WEBHOOKS_ENABLED: "true",
      NEXT_PUBLIC_SITE_URL: "https://test.example.invalid",
      NEXT_PUBLIC_SUPABASE_URL: "https://ci.example.invalid",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "ci-dummy-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "ci-dummy-service-role-key",
      ENCRYPTION_KEY:
        "0000000000000000000000000000000000000000000000000000000000000000",
      META_APP_SECRET: "test-meta-app-secret",
    },
    setupFiles: ["./tests/setup-isolated-env.ts"],
    clearMocks: true,
  },
});
