# TFS +FTTA WhatsApp — institutional architecture v1.0

Status: approved functional baseline; technical schema and integration contracts require review before implementation. This file contains no credentials or personal records.

## Purpose
One shared WhatsApp sender and canonical contact/conversation identity; separate FTTA and TFS operational views and admissions/student lifecycles. A contact may belong to either, both, or neither brand. Unknown contacts remain unassigned. Do not duplicate contact identities merely to segregate brands.

## Functional scope
- FTTA and TFS contact directories, unassigned directory, scoped creation/import/search.
- FTTA Diploma Admissions and TFS Admissions; one TFS pipeline with configurable campus filtering, not a pipeline per campus.
- FTTA Students and TFS Students; TFS campus/programme/academic year and FTTA programme/batch filters.
- Explicit, idempotent admission-to-enrolment conversion preserving the original deal. Parent/guardian contact and child student are distinct entities; multiple children/guardians supported.
- Active, completed, withdrawn and inactive lifecycle states; transfers preserve history. Former students excluded from active-student audiences without deleting history.
- Unified inbox history with All, FTTA, TFS and Unassigned views; conversation routing is independent of contact membership. Use reply context and known associations as suggestions; ambiguous messages require manual triage. Campus, programme, batch, assignment and status filters. Transfers preserve history. Mixed-brand history requires explicit authorization rules before staff rollout.
- Brand/campus scoped staff permissions enforced server-side and in database policies, including direct API access, not just UI filtering.
- Audience builder: brand, leads/students/alumni, campus, programme, batch, academic year, lifecycle and consent. Deduplicate by canonical recipient; show preview/count; recheck eligibility at send time; prevent cross-brand leakage. Shared WhatsApp sender does not imply shared consent.
- Brand-specific templates, broadcasts and automations; communication calendar for weekly/monthly learning themes, campus events and parent announcements. Draft/review/approve/schedule; approved Meta templates and applicable consent/opt-out checks. No live sends or automatic messaging without explicit approval.

## Maintainability
- Upstream: ArnasDon/wacrm; baseline commit c81299d1488aac02fa584f68d97c2524c1e7a661.
- Fork: JonathanArchard/wacrm. upstream-sync remains clean upstream; develop contains institutional work; staging is integration candidate; main is production. Never sync upstream directly into main.
- Prefer src/institutional/ for domain logic, components, services and tests; routes and thin adapters in framework-required locations. Document every upstream touchpoint. Preserve framework and license notices. No assumption of a stable upstream plugin API.
- Prefer additive institutional_* tables linked to existing contact/account/deal identities. Audit constraints, tenant boundaries, RLS and all write/send pathways before schema design. No final schema approved yet. Maintain migration compatibility with upstream numbering/order; test fresh install and upgrade from installed baseline. No production migration without explicit approval.
- Separate staging Worker and database with synthetic data, isolated credentials, and messaging/schedulers disabled. Do not allow staging deployments to target production Worker/domain or database. Environment configuration and deployment guards required before enabling staging builds.
- Integrate upstream in a dedicated review branch from develop, review conflicts and migrations, run upstream and institutional tests, promote to staging, then approved production release. Do not overwrite custom modules or silently discard upstream security changes.
- Record upstream commit, custom release, migration inventory and changed integration points per release. Backup and verify recovery before significant upgrades. Worker rollback does not undo database migrations; use compatible additive migrations and explicit recovery plans.
- Regression gates: auth, account/brand/campus authorization, contact identity and persistence, enrolment conversion/idempotency, guardian relationships, withdrawal, inbox routing, audience isolation and deduplication, consent, send-time eligibility, migration upgrade, no live messaging on staging, build/typecheck and existing upstream tests.
- Production deployment protection and staging infrastructure are not yet configured. No guarantee of conflict-free upgrades; review required.

## Sequence
1. Branches and architecture documentation.
2. Extension boundaries, integration inventory, deployment protections.
3. Isolated staging environment and read-only database/source audit.
4. Additive schema and tests; brand/campus management; contact directories.
5. Admissions filters, student/guardian lifecycle and conversion.
6. Inbox routing and permissions.
7. Audience segmentation, broadcasts, calendar and automations.
8. WhatsApp integration only after explicit approval, security and end-to-end validation.
