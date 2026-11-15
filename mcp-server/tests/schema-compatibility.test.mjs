import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import { registerTools } from '../dist/tools/index.js';

const READ_TOOLS = [
  'whoami',
  'list_contacts',
  'get_contact',
  'list_conversations',
  'get_conversation',
  'list_messages',
  'get_broadcast',
];

const WRITE_TOOLS = [
  'send_message',
  'create_contact',
  'update_contact',
];

const BROADCAST_TOOLS = ['send_broadcast'];

const ALL_TOOLS = [
  ...READ_TOOLS,
  ...WRITE_TOOLS,
  ...BROADCAST_TOOLS,
];

const CLIENT_METHODS = [
  'me',
  'listContacts',
  'getContact',
  'listConversations',
  'getConversation',
  'listConversationMessages',
  'getBroadcast',
  'sendMessage',
  'createContact',
  'updateContact',
  'sendBroadcast',
];

async function createHarness(
  t,
  {
    enableWrites = false,
    enableBroadcasts = false,
  } = {},
) {
  const calls = [];

  const config = {
    baseUrl: 'https://crm.example.invalid',
    apiKey: 'synthetic-test-key',
    enableWrites,
    enableBroadcasts,
  };

  const mockClient = Object.fromEntries(
    CLIENT_METHODS.map((method) => [
      method,
      async (...args) => {
        calls.push({ method, args });

        return {
          data: {
            mocked: true,
            method,
          },
        };
      },
    ]),
  );

  // Fail closed if anything unexpectedly attempts
  // to perform an external fetch.
  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error(
      'Unexpected external network request during MCP schema test',
    );
  });

  const server = new McpServer({
    name: 'wacrm-schema-regression',
    version: '1.0.0',
  });

  const enabledGroups = registerTools(
    server,
    mockClient,
    config,
  );

  const protocolClient = new Client({
    name: 'wacrm-test-client',
    version: '1.0.0',
  });

  const [
    clientTransport,
    serverTransport,
  ] = InMemoryTransport.createLinkedPair();

  t.after(async () => {
    await Promise.allSettled([
      protocolClient.close(),
      server.close(),
    ]);
  });

  await server.connect(serverTransport);
  await protocolClient.connect(clientTransport);

  return {
    protocolClient,
    calls,
    enabledGroups,
  };
}

async function listToolNames(client) {
  const result = await client.listTools();

  return result.tools
    .map((tool) => tool.name)
    .sort();
}

async function callTool(client, name, args = {}) {
  return client.callTool({
    name,
    arguments: args,
  });
}

async function expectRejected(
  harness,
  name,
  args,
) {
  const before = harness.calls.length;

  let result;
  let rejected = false;

  try {
    result = await callTool(
      harness.protocolClient,
      name,
      args,
    );
  } catch {
    rejected = true;
  }

  assert.ok(
    rejected || result?.isError === true,
    `${name} should reject invalid or unauthorized input`,
  );

  assert.equal(
    harness.calls.length,
    before,
    `${name} must reject before reaching the CRM client`,
  );
}

async function expectSuccess(
  harness,
  name,
  args,
  expectedMethod,
) {
  const before = harness.calls.length;

  const result = await callTool(
    harness.protocolClient,
    name,
    args,
  );

  assert.notEqual(result.isError, true);

  assert.equal(
    harness.calls.length,
    before + 1,
  );

  const call = harness.calls.at(-1);

  assert.equal(call.method, expectedMethod);

  return call;
}

const broadcastArguments = {
  name: 'Synthetic broadcast',
  template_name: 'test_template',
  template_language: 'en_US',
  recipients: [
    {
      to: '+12025550123',
    },
  ],
  confirm: true,
};

// --------------------------------------------------
// Tool registration and authorization
// --------------------------------------------------

test('read-only configuration exposes exactly seven read tools', async (t) => {
  const h = await createHarness(t);

  assert.deepEqual(
    await listToolNames(h.protocolClient),
    [...READ_TOOLS].sort(),
  );

  assert.deepEqual(h.enabledGroups, ['read']);
});

test('write opt-in exposes ten tools without broadcasts', async (t) => {
  const h = await createHarness(t, {
    enableWrites: true,
  });

  assert.deepEqual(
    await listToolNames(h.protocolClient),
    [...READ_TOOLS, ...WRITE_TOOLS].sort(),
  );

  assert.deepEqual(
    h.enabledGroups,
    ['read', 'write'],
  );
});

test('both opt-ins expose all eleven tools', async (t) => {
  const h = await createHarness(t, {
    enableWrites: true,
    enableBroadcasts: true,
  });

  assert.deepEqual(
    await listToolNames(h.protocolClient),
    [...ALL_TOOLS].sort(),
  );

  assert.deepEqual(
    h.enabledGroups,
    ['read', 'write', 'broadcast'],
  );
});

test('read-only configuration rejects write calls', async (t) => {
  const h = await createHarness(t);

  await expectRejected(h, 'create_contact', {
    phone: '+12025550123',
  });
});

test('write opt-in alone does not authorize broadcasts', async (t) => {
  const h = await createHarness(t, {
    enableWrites: true,
  });

  await expectRejected(
    h,
    'send_broadcast',
    broadcastArguments,
  );
});

// --------------------------------------------------
// JSON Schema compatibility
// --------------------------------------------------

test('all eleven tools expose JSON object input schemas', async (t) => {
  const h = await createHarness(t, {
    enableWrites: true,
    enableBroadcasts: true,
  });

  const { tools } =
    await h.protocolClient.listTools();

  assert.equal(tools.length, 11);

  for (const tool of tools) {
    assert.ok(tool.name);
    assert.ok(tool.inputSchema);

    assert.equal(
      tool.inputSchema.type,
      'object',
      `${tool.name} must expose an object schema`,
    );

    assert.doesNotThrow(() => {
      JSON.stringify(tool.inputSchema);
    });
  }
});

test('pagination schema preserves integer and range constraints', async (t) => {
  const h = await createHarness(t);

  const { tools } =
    await h.protocolClient.listTools();

  const contacts = tools.find(
    (tool) => tool.name === 'list_contacts',
  );

  assert.ok(contacts);

  const limit =
    contacts.inputSchema.properties.limit;

  assert.equal(limit.type, 'integer');
  assert.equal(limit.minimum, 1);
  assert.equal(limit.maximum, 100);
});

test('contact lookup schema preserves required id', async (t) => {
  const h = await createHarness(t);

  const { tools } =
    await h.protocolClient.listTools();

  const contact = tools.find(
    (tool) => tool.name === 'get_contact',
  );

  assert.ok(contact);
  assert.ok(
    contact.inputSchema.required.includes('id'),
  );
});

test('broadcast schema preserves recipient collection limits', async (t) => {
  const h = await createHarness(t, {
    enableWrites: true,
    enableBroadcasts: true,
  });

  const { tools } =
    await h.protocolClient.listTools();

  const broadcast = tools.find(
    (tool) => tool.name === 'send_broadcast',
  );

  assert.ok(broadcast);

  const recipients =
    broadcast.inputSchema.properties.recipients;

  assert.equal(recipients.type, 'array');
  assert.equal(recipients.minItems, 1);
  assert.equal(recipients.maxItems, 1000);
});

// --------------------------------------------------
// Valid and invalid read arguments
// --------------------------------------------------

test('whoami executes without arguments', async (t) => {
  const h = await createHarness(t);

  await expectSuccess(
    h,
    'whoami',
    {},
    'me',
  );
});

test('optional contact filters may be omitted', async (t) => {
  const h = await createHarness(t);

  await expectSuccess(
    h,
    'list_contacts',
    {},
    'listContacts',
  );
});

test('contact lookup accepts a valid string id', async (t) => {
  const h = await createHarness(t);

  await expectSuccess(
    h,
    'get_contact',
    { id: 'synthetic-contact' },
    'getContact',
  );
});

test('contact lookup rejects missing id', async (t) => {
  const h = await createHarness(t);

  await expectRejected(
    h,
    'get_contact',
    {},
  );
});

test('contact lookup rejects numeric id', async (t) => {
  const h = await createHarness(t);

  await expectRejected(
    h,
    'get_contact',
    { id: 123 },
  );
});

test('pagination accepts boundary values 1 and 100', async (t) => {
  const h = await createHarness(t);

  for (const limit of [1, 100]) {
    await expectSuccess(
      h,
      'list_contacts',
      { limit },
      'listContacts',
    );
  }
});

test('pagination rejects invalid limits', async (t) => {
  const h = await createHarness(t);

  for (const limit of [
    0,
    -1,
    101,
    1.5,
    '10',
  ]) {
    await expectRejected(
      h,
      'list_contacts',
      { limit },
    );
  }
});

test('conversation status preserves supported enum values', async (t) => {
  const h = await createHarness(t);

  for (const status of [
    'open',
    'pending',
    'closed',
  ]) {
    await expectSuccess(
      h,
      'list_conversations',
      { status },
      'listConversations',
    );
  }
});

test('conversation status rejects unknown enum values', async (t) => {
  const h = await createHarness(t);

  await expectRejected(
    h,
    'list_conversations',
    { status: 'invalid-status' },
  );
});

test('message list requires a conversation id', async (t) => {
  const h = await createHarness(t);

  await expectRejected(
    h,
    'list_messages',
    {},
  );
});

// --------------------------------------------------
// Write schema compatibility
// --------------------------------------------------

test('message type defaults to text', async (t) => {
  const h = await createHarness(t, {
    enableWrites: true,
  });

  const call = await expectSuccess(
    h,
    'send_message',
    {
      to: '+12025550123',
      text: 'Synthetic test message',
    },
    'sendMessage',
  );

  assert.equal(call.args[0].type, 'text');
});

test('message type rejects unsupported values', async (t) => {
  const h = await createHarness(t, {
    enableWrites: true,
  });

  await expectRejected(
    h,
    'send_message',
    {
      to: '+12025550123',
      type: 'invalid',
    },
  );
});

test('media URL rejects malformed input', async (t) => {
  const h = await createHarness(t, {
    enableWrites: true,
  });

  await expectRejected(
    h,
    'send_message',
    {
      to: '+12025550123',
      type: 'image',
      media_url: 'not-a-url',
    },
  );
});

test('contact creation accepts omitted optional fields', async (t) => {
  const h = await createHarness(t, {
    enableWrites: true,
  });

  await expectSuccess(
    h,
    'create_contact',
    {
      phone: '+12025550123',
    },
    'createContact',
  );
});

test('contact creation rejects invalid email', async (t) => {
  const h = await createHarness(t, {
    enableWrites: true,
  });

  await expectRejected(
    h,
    'create_contact',
    {
      phone: '+12025550123',
      email: 'invalid-email',
    },
  );
});

test('contact creation rejects invalid tag types', async (t) => {
  const h = await createHarness(t, {
    enableWrites: true,
  });

  await expectRejected(
    h,
    'create_contact',
    {
      phone: '+12025550123',
      tags: [123],
    },
  );
});

test('contact update requires id', async (t) => {
  const h = await createHarness(t, {
    enableWrites: true,
  });

  await expectRejected(
    h,
    'update_contact',
    {
      name: 'Synthetic contact',
    },
  );
});

// --------------------------------------------------
// Broadcast validation and constrained arrays
// --------------------------------------------------

test('broadcast rejects missing confirmation', async (t) => {
  const h = await createHarness(t, {
    enableWrites: true,
    enableBroadcasts: true,
  });

  const {
    confirm,
    ...args
  } = broadcastArguments;

  await expectRejected(
    h,
    'send_broadcast',
    args,
  );
});

test('broadcast rejects false confirmation', async (t) => {
  const h = await createHarness(t, {
    enableWrites: true,
    enableBroadcasts: true,
  });

  await expectRejected(
    h,
    'send_broadcast',
    {
      ...broadcastArguments,
      confirm: false,
    },
  );
});

test('broadcast rejects an empty recipient collection', async (t) => {
  const h = await createHarness(t, {
    enableWrites: true,
    enableBroadcasts: true,
  });

  await expectRejected(
    h,
    'send_broadcast',
    {
      ...broadcastArguments,
      recipients: [],
    },
  );
});

test('broadcast rejects more than 1000 recipients', async (t) => {
  const h = await createHarness(t, {
    enableWrites: true,
    enableBroadcasts: true,
  });

  const recipients = Array.from(
    { length: 1001 },
    () => ({
      to: '+12025550123',
    }),
  );

  await expectRejected(
    h,
    'send_broadcast',
    {
      ...broadcastArguments,
      recipients,
    },
  );
});

test('broadcast rejects malformed recipient objects', async (t) => {
  const h = await createHarness(t, {
    enableWrites: true,
    enableBroadcasts: true,
  });

  await expectRejected(
    h,
    'send_broadcast',
    {
      ...broadcastArguments,
      recipients: [{ to: 123 }],
    },
  );
});

test('confirmed broadcast reaches only the mocked client', async (t) => {
  const h = await createHarness(t, {
    enableWrites: true,
    enableBroadcasts: true,
  });

  const call = await expectSuccess(
    h,
    'send_broadcast',
    broadcastArguments,
    'sendBroadcast',
  );

  assert.equal(
    call.args[0].recipients.length,
    1,
  );

  assert.equal(
    Object.hasOwn(call.args[0], 'confirm'),
    false,
  );
});