# Upstream integration inventory

Status: initial source-path inventory, not a completed code/security audit. Paths observed on develop at 73c1b0f41aad0385cccee782071fb50fe05f8ad9. Review actual implementations and callers before modifying any of them.

| Boundary | Existing paths to inspect | Extension responsibility |
| --- | --- | --- |
| Navigation and branding | src/components/layout/sidebar.tsx; messages/en.json; src/app/layout.tsx; src/app/icon.tsx | Thin menu and branding integration |
| Contacts | src/app/(dashboard)/contacts/page.tsx; src/app/api/v1/contacts/route.ts; src/app/api/v1/contacts/[id]/route.ts; src/app/api/contacts/[id]/tags/route.ts | Brand memberships, scoped CRUD/import/search, canonical identity |
| Admissions | src/app/(dashboard)/pipelines/page.tsx; src/components/pipelines/; src/lib/pipelines/stage-sync.ts | Brand/campus filtering, conversion, existing stage regression |
| Inbox | src/app/(dashboard)/inbox/page.tsx; src/app/api/whatsapp/webhook/route.ts | Routing, shared history and authorization |
| Broadcasts | src/app/(dashboard)/broadcasts/new/page.tsx; src/app/api/v1/broadcasts/route.ts; src/app/api/v1/broadcasts/[id]/route.ts | Eligible audience preview and send-time revalidation |
| Automations | src/app/api/automations/engine/route.ts; src/app/api/automations/cron/route.ts; src/app/(dashboard)/automations/ | Scoped triggers, actions and scheduled sends |
| Authorization | src/lib/auth/account.ts; src/lib/auth/roles.ts; src/lib/supabase/client.ts; src/lib/supabase/server.ts | Tenant/brand/campus enforcement; RLS and privileged paths audit |
| Settings | src/app/(dashboard)/settings/page.tsx | Brand and campus administration |
| Deployment | cloudflare.config.ts; vite.config.ts; tsconfig.json; vitest.config.ts | Isolated environments, deployment guards and test integration |

These are review candidates, not a mandate to alter every file. Inventory all additional direct database calls, imports, RPCs, webhooks, automation actions, public API endpoints and privileged clients during the code audit. Add a record of each actual upstream modification with rationale, tests and upgrade review notes.

## Existing fork changes
The fork already includes Cloudflare/vinext deployment and English branding/admissions label customization. Preserve these through upstream integration; revisit global admissions wording where generic WACRM features need it. Current stage rename persistence issue is known and not yet resolved.

## Rules
No edits to upstream implementation as part of this documentation commit. Institutional modules should own business rules, with minimal documented adapters in existing files. Never assume upstream offers a stable extension API.
