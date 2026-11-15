import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { assertMcpOrigin, guardedMcpFetch } from '../dist/network-policy.js';
import { loadConfig } from '../dist/config.js';
import { WacrmClient } from '../dist/client.js';

const origin = 'https://crm.example.invalid';
const keys = ['APP_ENV', 'MCP_ENABLED', 'MCP_EXTERNAL_NETWORK_ENABLED', 'MCP_ALLOWED_ORIGIN', 'WACRM_BASE_URL', 'WACRM_API_KEY', 'WACRM_ENABLE_WRITES', 'WACRM_ENABLE_BROADCASTS'];
let previous;
let realFetch;
let calls;
let response;
beforeEach(() => {
  previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  realFetch = globalThis.fetch;
  calls = [];
  response = undefined;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (!response) throw new Error('Unmocked network request forbidden');
    return response(url, init);
  };
});
afterEach(() => {
  for (const key of keys) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
  globalThis.fetch = realFetch;
});
function enable() {
  Object.assign(process.env, {
    APP_ENV: 'production', MCP_ENABLED: 'true', MCP_EXTERNAL_NETWORK_ENABLED: 'true',
    MCP_ALLOWED_ORIGIN: origin, WACRM_BASE_URL: origin, WACRM_API_KEY: 'dummy-test-key',
  });
}
test('missing configuration denies startup and transport', async () => {
  assert.throws(loadConfig, /disabled/);
  await assert.rejects(guardedMcpFetch(new URL(origin + '/api/v1/me'), {}), /disabled/);
  assert.equal(calls.length, 0);
});
test('staging cannot be enabled by production opt-ins', async () => {
  enable();
  process.env.APP_ENV = 'staging';
  assert.throws(loadConfig, /disabled/);
  await assert.rejects(guardedMcpFetch(new URL(origin + '/api/v1/me'), {}), /disabled/);
  assert.equal(calls.length, 0);
});
test('each activation flag is mandatory', () => {
  for (const key of ['MCP_ENABLED', 'MCP_EXTERNAL_NETWORK_ENABLED']) {
    enable();
    process.env[key] = 'false';
    assert.throws(loadConfig, /disabled/);
  }
});
test('invalid origins never reach transport', async () => {
  enable();
  for (const raw of ['http://crm.example.invalid', 'https://user:pass@crm.example.invalid', 'https://evil.example.invalid', 'https://crm.example.invalid.evil.invalid']) {
    await assert.rejects(guardedMcpFetch(new URL(raw + '/api/v1/me'), {}), /denied/);
  }
  for (const raw of ['https://127.0.0.1', 'https://10.0.0.1', 'https://[::1]', 'https://anything.local', 'https://wa-staging.ftta.in']) {
    process.env.MCP_ALLOWED_ORIGIN = raw;
    assert.throws(() => assertMcpOrigin(raw), /denied/);
  }
  assert.equal(calls.length, 0);
});
test('base must be an origin; API path required', async () => {
  enable();
  process.env.WACRM_BASE_URL = origin + '/other';
  assert.throws(loadConfig, /origin/);
  await assert.rejects(guardedMcpFetch(new URL(origin + '/other'), {}), /path denied/);
  assert.equal(calls.length, 0);
});
test('approved origin uses mocked fetch and forces redirect error', async () => {
  enable();
  response = () => new Response(JSON.stringify({ data: { id: 'mock' } }));
  const client = new WacrmClient(loadConfig());
  assert.deepEqual(await client.me(), { data: { id: 'mock' }, meta: undefined });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, origin + '/api/v1/me');
  assert.equal(calls[0].init.redirect, 'error');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer dummy-test-key');
  await guardedMcpFetch(new URL(origin + '/api/v1/me'), { redirect: 'follow' });
  assert.equal(calls[1].init.redirect, 'error');
});
test('revocation after client creation denies before fetch', async () => {
  enable();
  const client = new WacrmClient(loadConfig());
  process.env.MCP_ENABLED = 'false';
  await assert.rejects(client.me(), /CRM network request failed/);
  assert.equal(calls.length, 0);
});
test('redirect and unmocked request errors are sanitized', async () => {
  enable();
  const client = new WacrmClient(loadConfig());
  await assert.rejects(client.me(), /CRM network request failed/);
  response = (_url, init) => {
    assert.equal(init.redirect, 'error');
    throw new Error('redirect to https://secret.example.invalid?token=dummy-test-key');
  };
  await assert.rejects(client.me(), err => err.message === 'CRM network request failed' && err.code === 'network_error');
});
test('writes and broadcasts remain explicit opt-ins', () => {
  enable();
  assert.equal(loadConfig().enableWrites, false);
  assert.equal(loadConfig().enableBroadcasts, false);
  process.env.WACRM_ENABLE_BROADCASTS = 'true';
  assert.throws(loadConfig, /requires/);
});
