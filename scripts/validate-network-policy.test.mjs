import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectSource } from './validate-network-policy.mjs';

test('rejects unapproved server transports', () => {
  for (const code of ["fetch('https://example.invalid')", "new WebSocket('wss://example.invalid')", "globalThis['fetch']('https://example.invalid')", "import { request } from 'node:https'", "import('undici')", "import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'"]) {
    assert.equal(inspectSource('src/lib/unapproved.ts', code).length, 1, code);
  }
});
test('allows reviewed policy transports and relative browser API calls', () => {
  assert.deepEqual(inspectSource('src/lib/network-policy.ts', 'fetch(input)'), []);
  assert.deepEqual(inspectSource('src/components/example.tsx', "fetch('/api/contacts')"), []);
  assert.equal(inspectSource('src/components/example.tsx', "fetch('https://example.invalid')").length, 1);
});
