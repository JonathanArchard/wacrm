# Background jobs isolation — staging

BACKGROUND_JOBS_ENABLED=false; explicit production opt-in required. Cron routes stop before job scans or claims. Automation dispatch/resume/expiry/requeue, flow dispatch, broadcast delivery/resume, AI auto-reply and outbound webhook dispatch have library-level checks. Broadcast send/resume and inbound Meta webhook entry points also reject execution before job processing. Manual CRM reads/writes and link management remain available. Existing external service policies still apply. Automation send_webhook additionally enforces the independent outbound-webhook policy.

## Repository review
- API automation cron drains pending rows, expires reply waits, and requeues stalled claims.
- Flow cron calls list_timed_out_flow_runs and marks timed-out runs.
- Public broadcast and resume routes use after(); browser wizard uses the batch send route. No separate scheduled broadcast dispatch route identified in the route tree.
- Inbound WhatsApp webhook uses after() for status reconciliation, media, flow/automation/AI and event webhook fan-out. Its entry point is already WhatsApp-gated and now background-gated. Status reconciliation helpers are not standalone schedulers; keep them available for synchronous reconciliation in authorized contexts.
- Public message API can schedule event delivery via after(); delivery library is gated. Contact tag writes remain available; automation engine is gated.
- CI and migrations workflow triggers inspected: push/PR, not business schedules. No scheduled handler or queue consumer identified by path inventory.
- Hosted Supabase pg_cron/pg_net, database webhooks, edge functions, Cloudflare triggers and external scheduler settings are not verified by source inventory. No live provider changes made.

## Deployment hold
Before launch, verify staging-only provider configuration, no enabled scheduled jobs or external webhooks, no cron secret provisioned, no production targets, and no copied pending production executions. Audit SQL and all source callbacks for additional paths; path inventory is not exhaustive proof. Do not apply migrations or create triggers without approval. Production promotion requires BACKGROUND_JOBS_ENABLED=true explicitly.
