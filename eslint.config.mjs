import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated Cloudflare/Vinext artifacts and test coverage.
    ".cloudflare/**",
    ".wrangler/**",
    ".vinext/**",
    "dist/**",
    "coverage/**",
    // Vendored minified opus-recorder encoder worker (served statically).
    "public/opus/**",
  ]),
]);

export default eslintConfig;
