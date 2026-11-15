# Database design gate

No schema has been finalized or migrated. First inspect the installed schema and upstream migrations for account/contact/deal/conversation identities, phone and WhatsApp account uniqueness, foreign keys, policies, grants, privileged functions and all writers. Prefer additive institutional_* relations rather than changing existing contact identity semantics. Model brand membership many-to-many and enrolments separately from guardian contacts.

Resolve migration naming and ordering against actual installed history and future upstream migration conventions. Review tenant-safe relationships and enforce scoped permissions at the database and service boundaries. Test in isolated staging before explicit production approval.
