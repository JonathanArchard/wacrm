import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const admin = vi.hoisted(() => vi.fn(() => { throw new Error('Unexpected database access'); }));
vi.mock('./admin-client', () => ({ supabaseAdmin: admin }));

import { runAutomationsForTrigger, resumePendingExecution, resumeAwaitingReply, claimPendingExecution } from './engine';

beforeEach(() => {
  vi.stubEnv('APP_ENV', 'staging');
  vi.stubEnv('WHATSAPP_ENABLED', 'true');
});
afterEach(() => vi.unstubAllEnvs());

it('blocks contact-triggered automation before creating a database client', async () => {
  await runAutomationsForTrigger({ accountId: 'test', contactId: 'test', triggerType: 'new_contact_created' });
  await runAutomationsForTrigger({ accountId: 'test', contactId: 'test', triggerType: 'tag_added' });
  expect(admin).not.toHaveBeenCalled();
});

it('blocks resuming pending automation before accessing the database', async () => {
  await resumePendingExecution({ id: 'test', automation_id: 'test', account_id: 'test', user_id: 'test', contact_id: null, log_id: null, parent_step_id: null, branch: null, next_step_position: 0, context: {} });
  expect(admin).not.toHaveBeenCalled();
});

it('blocks automation reply resumption and pending claims', async () => {
  expect(await resumeAwaitingReply({ accountId: 'test', contactId: 'test' } as Parameters<typeof resumeAwaitingReply>[0])).toBe(false);
  expect(await claimPendingExecution('test')).toBe(false);
  expect(admin).not.toHaveBeenCalled();
});
