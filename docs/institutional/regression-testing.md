# Regression gates

Planned coverage; not executed by creating this file.

- Authentication, owner role, staff authorization and direct API access.
- Contact identity, dual-brand membership, unassigned contacts, CRUD/import/search and persistence.
- Campus scoping, pipeline/deal association, stage updates and enrolment conversion idempotency.
- Guardian relationships, multiple children, transfers and student lifecycle.
- Inbox routing and mixed-brand authorization.
- Audience preview, consent/opt-outs, active enrolments, campus isolation, recipient deduplication and send-time eligibility.
- Scheduled jobs and automation must not expand audience scope or send on staging.
- Database fresh install and upgrade; upstream tests, typecheck and Cloudflare build.
- Recovery/rollback compatibility.

Use synthetic fixtures only. A required negative test: a Koramangala-only active student campaign must exclude guardians whose children attend only another campus; shared guardians receive at most one message per broadcast. Withdrawn students no longer qualify through that enrolment.
