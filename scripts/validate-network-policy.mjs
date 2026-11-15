import ts from 'typescript';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const approved = new Map([
  ['src/lib/network-policy.ts', new Set(['fetch'])],
  ['src/lib/browser-network-policy.ts', new Set(['fetch'])],
  ['src/lib/auth/email-fetch.ts', new Set(['fetch'])],
  ['src/lib/webhooks/ssrf.ts', new Set(['node:dns/promises', 'node:net'])],
  ['mcp-server/src/network-policy.ts', new Set(['fetch'])],
  ['scripts/validate-staging-deployment.mjs', new Set(['node:child_process'])],
]);
const transports = /^(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)$/;
const modules = /^(?:node:)?(?:http|https|net|tls|dgram|dns|child_process)(?:\/|$)|^(?:undici|axios|ws|node-fetch|cloudflare:sockets)(?:\/|$)/;
const mcp = /^@modelcontextprotocol\/sdk\//;
const browserFiles = new Set([
  'src/lib/account/members.ts', 'src/lib/contacts/tag-api.ts',
]);
function isRelativeApi(arg) {
  if (!arg) return false;
  if (ts.isParenthesizedExpression(arg)) return isRelativeApi(arg.expression);
  if (ts.isConditionalExpression(arg)) return isRelativeApi(arg.whenTrue) && isRelativeApi(arg.whenFalse);
  if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) return arg.text.startsWith('/api/');
  if (ts.isTemplateExpression(arg)) return arg.head.text.startsWith('/api/');
  return false;
}
export function inspectSource(file, sourceText) {
  const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true);
  const errors = [];
  const permit = approved.get(file) ?? new Set();
  const browser = file.endsWith('.tsx') || file.startsWith('src/hooks/') || browserFiles.has(file);
  function report(node, name) {
    if (!permit.has(name)) errors.push(file + ':' + (source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1) + ' unreviewed ' + name);
  }
  function checkModule(node, name) {
    if (modules.test(name)) report(node, name);
    if (mcp.test(name)) {
      const stdio = file === 'mcp-server/src/index.ts' && name === '@modelcontextprotocol/sdk/server/stdio.js';
      const server = file.startsWith('mcp-server/src/') && ['@modelcontextprotocol/sdk/server/mcp.js', '@modelcontextprotocol/sdk/types.js'].includes(name);
      if (!stdio && !server) report(node, name);
    }
  }
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) checkModule(node, node.moduleSpecifier.text);
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      const expr = node.expression;
      const name = ts.isIdentifier(expr) ? expr.text : ts.isPropertyAccessExpression(expr) ? expr.name.text : ts.isElementAccessExpression(expr) && ts.isStringLiteral(expr.argumentExpression) ? expr.argumentExpression.text : '';
      if (transports.test(name)) {
        const arg = node.arguments?.[0];
        const relative = isRelativeApi(arg);
        // Narrow existing dynamic same-origin fetch exception; inspect its source separately.
        const dynamic = file === 'src/components/settings/template-manager.tsx' && arg && ts.isIdentifier(arg) && arg.text === 'url';
        if (!(name === 'fetch' && browser && (relative || dynamic))) report(node, name);
      }
      if ((name === 'require' || expr.kind === ts.SyntaxKind.ImportKeyword) && node.arguments?.[0] && ts.isStringLiteral(node.arguments[0])) checkModule(node, node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return errors;
}
function walk(dir, errors) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name).replaceAll('\\', '/');
    if (entry.isDirectory()) walk(file, errors);
    else if (/\.[cm]?[jt]sx?$/.test(file) && !/\.(test|spec)\.[cm]?[jt]sx?$/.test(file)) errors.push(...inspectSource(file, readFileSync(file, 'utf8')));
  }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const errors = [];
  for (const dir of ['src', 'mcp-server/src', 'scripts']) walk(dir, errors);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('Network source regression check passed');
}
