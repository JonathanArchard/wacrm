import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const branch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
const config = readFileSync(new URL('../cloudflare.config.ts', import.meta.url), 'utf8');
const checks = [
  [branch === 'staging', 'Deployment requires the staging branch'],
  [/name:\s*"wacrm-staging"/.test(config), 'Expected staging Worker'],
  [config.includes('https://wa-staging.ftta.in'), 'Expected staging site URL'],
  [config.includes('https://wufgihqppsmbhflbwtcc.supabase.co'), 'Expected staging Supabase project'],
  [/APP_ENV:\s*bindings\.text\("staging"\)/.test(config), 'Expected staging environment'],
  [/WHATSAPP_ENABLED:\s*bindings\.text\("false"\)/.test(config), 'WhatsApp must be disabled'],
  [!config.includes('mimjmzjjsfteiwsztypk') && !config.includes('https://wa.ftta.in'), 'Production targets must be absent'],
];
for (const [ok, message] of checks) {
  if (!ok) { console.error(message); process.exitCode = 1; }
}
if (!process.exitCode) console.log('Staging configuration checks passed. No deployment performed by validator.');
