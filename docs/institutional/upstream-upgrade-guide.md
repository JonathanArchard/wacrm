# Upstream upgrade procedure

1. Fetch upstream and compare the candidate revision against the recorded upstream baseline. Review release notes, security fixes, framework compatibility and migration ordering.
2. Fast-forward upstream-sync to the selected upstream revision without introducing fork changes.
3. Create a dedicated upgrade branch from develop; merge the selected upstream revision there. Review conflicts individually, retaining institutional features and required security changes.
4. Audit every integration point and migration identifier. Test clean database install and upgrade from the deployed migration history; never renumber applied migrations casually.
5. Run upstream and institutional regression suites, build and typecheck. Deploy only to isolated staging with synthetic data and no live messaging.
6. Review results, backup/recovery readiness and approval before promoting to main. Record exact upstream and fork revisions and migration inventory.
7. Verify production after rollout. If needed, use the prior compatible application deployment and an independently reviewed database recovery plan.

No automatic upstream-to-main sync. No guarantee of conflict-free merges. Actual promotion commands and enforcement will be finalized with deployment protections.
