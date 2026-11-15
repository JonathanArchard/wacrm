import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function validateStagingDeployment(branch, config) {
  const checks = [
    [branch === 'staging', 'Deployment requires the staging branch'],
    [/name:\s*"wacrm-staging"/.test(config), 'Expected staging Worker'],
    [/NEXT_PUBLIC_SITE_URL:\s*bindings\.text\(\s*"https:\/\/wa-staging\.ftta\.in"\s*\)/.test(config), 'Expected staging site URL'],
    [/NEXT_PUBLIC_SUPABASE_URL:\s*bindings\.text\(\s*"https:\/\/wufgihqppsmbhflbwtcc\.supabase\.co"\s*\)/.test(config), 'Expected staging Supabase project'],
    [/APP_ENV:\s*bindings\.text\("staging"\)/.test(config), 'Expected staging environment'],
    [/WHATSAPP_ENABLED:\s*bindings\.text\("false"\)/.test(config), 'WhatsApp must be disabled'],
    [!config.includes('mimjmzjjsfteiwsztypk') && !config.includes('https://wa.ftta.in'), 'Production targets must be absent'],
  ];
  return checks.filter(([ok]) => !ok).map(([, message]) => message);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const branch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
  const config = readFileSync(new URL('../cloudflare.config.ts', import.meta.url), 'utf8');
  const errors = validateStagingDeployment(branch, config);
  for (const message of errors) console.error(message);
  if (errors.length) process.exitCode = 1;
  else console.log('Staging configuration checks passed. No deployment performed by validator.');
}
