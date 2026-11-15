import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateStagingDeployment } from './validate-staging-deployment.mjs';

const config = readFileSync(new URL('../cloudflare.config.ts', import.meta.url), 'utf8');
test('staging config passes with staging branch', () => assert.deepEqual(validateStagingDeployment('staging', config), []));
for (const branch of ['main', '', 'feature/example']) {
  test('rejects branch ' + JSON.stringify(branch), () => assert.ok(validateStagingDeployment(branch, config).includes('Deployment requires the staging branch')));
}
for (const [before, after, message] of [
  ['"wacrm-staging"', '"wacrm"', 'Expected staging Worker'],
  ['https://wa-staging.ftta.in', 'https://example.invalid', 'Expected staging site URL'],
  ['wufgihqppsmbhflbwtcc', 'wrong-project', 'Expected staging Supabase project'],
  ['APP_ENV: bindings.text("staging")', 'APP_ENV: bindings.text("production")', 'Expected staging environment'],
  ['WHATSAPP_ENABLED: bindings.text("false")', 'WHATSAPP_ENABLED: bindings.text("true")', 'WhatsApp must be disabled'],
]) {
  test(message, () => {
    assert.ok(config.includes(before));
    assert.ok(validateStagingDeployment('staging', config.replace(before, after)).includes(message));
  });
}
test('rejects production references', () => {
  for (const ref of ['https://wa.ftta.in', 'mimjmzjjsfteiwsztypk']) {
    assert.ok(validateStagingDeployment('staging', config + '\n// ' + ref).includes('Production targets must be absent'));
  }
});
