import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "wacrm",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-14",
    compatibilityFlags: ["nodejs_compat"],

    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: [
        "/*",
        "!/_next/static/*",
        "!/*/_next/static/*",
      ],
    },

    env: {
      ASSETS: bindings.assets(),
      IMAGES: bindings.images(),

      // Public application configuration
      NEXT_PUBLIC_SUPABASE_URL: bindings.text(
        "https://mimjmzjjsfteiwsztypk.supabase.co"
      ),

      NEXT_PUBLIC_SITE_URL: bindings.text(
        "https://wacrm.billowing-flower-1155.workers.dev"
      ),

      NEXT_PUBLIC_APP_LOCALE: bindings.text("en"),

      // Secrets managed securely through Cloudflare
      NEXT_PUBLIC_SUPABASE_ANON_KEY: bindings.secret(),
      SUPABASE_SERVICE_ROLE_KEY: bindings.secret(),
      ENCRYPTION_KEY: bindings.secret(),
    },
  }),
});