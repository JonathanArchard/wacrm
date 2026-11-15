# Deployment safety baseline

Status: design only; staging infrastructure and enforcement not provisioned.

main is production. develop is custom development. staging is the tested release candidate; upstream-sync contains upstream only. Never deploy develop or staging using the production Worker configuration or credentials.

Before enabling staging deployment:
1. Verify Cloudflare production builds are restricted to main and non-production automatic deployment is disabled or isolated.
2. Establish branch protection or equivalent approval gates for main without breaking CI. Check current repository capabilities.
3. Provision a distinct staging Worker and separate Supabase environment, with synthetic records only.
4. Use distinct environment-specific configuration, public build variables and encrypted runtime credentials. Reject mismatched Worker names, domains and database projects at deployment time.
5. Keep Meta credentials, live SMTP recipients, cron and all outbound messaging disabled or safely isolated in staging. Test through mocks or explicitly approved test recipients only.
6. Protect staging access and verify direct/preview endpoints cannot bypass authorization.
7. Run build, typecheck, existing tests, migration upgrade and institutional regression tests before promotion.

Production migrations require explicit approval and a verified recovery plan. Application rollback does not revert database schema. No credentials belong in GitHub or documentation.

Do not enable a staging build against the currently shared production configuration. No infrastructure changes are authorized by this document alone.
