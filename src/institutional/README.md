# Institutional extension boundary

This directory is owned by the TFS +FTTA extension, not upstream WACRM. See [architecture](../../docs/institutional/architecture.md).

Keep domain rules independent of Next.js, WhatsApp transport and database clients wherever possible. Feature modules own their domain contracts, validation, services, UI and tests. Framework routes and upstream components should call thin adapters rather than duplicate institutional business rules.

Folders are reserved for brands, campuses, contacts, admissions, students, guardians, inbox, audiences, communications, automations, permissions, reporting, integrations, shared and tests. Create actual feature files as their contracts are reviewed; empty directories are intentionally not tracked.

No feature is active yet. All authorization and outbound messaging paths must be reviewed before exposing new features. Do not treat UI filters as access control. No production migration or live send without approval.
