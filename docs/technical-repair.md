# Technical repair — 11 October 2026

This branch repairs core account and learner flows against the existing SmartBridge FET Supabase schema. It changes no curriculum and does not certify the whole application as secure or ready for production.

## Repaired

- Shared authentication/profile state replaces independent layout polling. Database profile permissions are authoritative; account metadata and hardcoded email addresses cannot grant administrator access in these core gates.
- Authentication requests time out and profile failures show recovery controls. Password recovery has a dedicated route.
- Initial onboarding uses one transactional database RPC. Tutors remain pending until approved; privacy and tutor agreement records are written together. Unverified parent–student linking is disabled during onboarding.
- Quiz selection requires subject and grade. No unrelated Mathematics fallback is supplied. Result writes include the authenticated student ID; failed writes leave the quiz retryable without duplicating the final answer.
- Premium access queries match the real subscription schema. Entering a payment reference no longer activates a subscription. Payment confirmation still requires an administrator.
- Profile queries use the canonical users table; the existing user_profiles view exposes only session fields. Public tutor discovery uses a limited directory instead of returning private application documents.
- Booking inserts include ownership IDs and the actual amount column. Runtime errors, invalid TypeScript syntax in JavaScript files, missing imports, and component prop contracts were corrected. The lockfile now supports npm ci.

## Validation

Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

Browser checks: `npx playwright install chromium`, then `npm run test:e2e`. They start Vite on port 5173 with fake connection settings and mock all Supabase responses. They cover login → onboarding → home, grade-specific quiz saving and retry, no premium self-activation, learner admin-route denial, and password reset. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can select an installed Chromium binary. These checks do not prove live email delivery, OAuth, payment processing or live account behaviour.

Database security tests in `db/test-core-flows.sql` were run against the connected project with the repair migration in one transaction and **rolled back**. They verify safe signup metadata, first-time student/tutor onboarding, consent validation, quiz ownership, cross-account denial, rejection of self-granted admin/premium privileges, and tutor self-verification denial. Fixtures use reserved example addresses; no customer account was retained or changed.

## Deployment order

The migration is `supabase/migrations/20261011153804_repair_core_flows.sql`. It targets the existing schema, not an empty database: this repository does not contain a complete baseline migration. Review it on a staging copy of that schema. Apply it as the database owner in a transaction before deploying this frontend, because onboarding and tutor discovery depend on its new RPC and view. Preserve a database backup and the previous deployment for rollback. The migration restricts private tutor profile access; any external consumers should switch to the safe directory.

No permanent database migration or production deployment was performed as part of this branch. Supabase authentication redirect settings must allow `/auth/callback` and `/reset-password` on the real deployment; delivery and OAuth need a live smoke test after deployment.

## Remaining launch blockers

1. Payment processing is not end-to-end verified. Implement authenticated provider webhooks, idempotent payment records and server-derived booking prices before automating premium activation or payouts. Existing booking UI prices are not a trustworthy financial boundary.
2. `invoke-llm`, `generate-lesson-plan`, and `send-email` are called by the app but were absent from the deployed function inventory. Several existing calls use camelCase names while deployed slugs use hyphens. Build and test these integrations, or keep dependent features unavailable for the MVP.
3. Legacy progress, chat and admin features contain additional database contract mismatches (for example student_progress uses student_email/student_id, not user_email). Existing activity_logs and system_configurations references do not match the canonical activity_log and system_configuration names. These secondary flows need their own integration tests and repairs.
4. Parent–child linking needs a verified invitation/approval workflow across all screens. A parent should never access a learner's information merely by entering an email address.
5. Eighteen RLS-enabled tables had no policies; their features are blocked for ordinary clients. Add narrowly scoped policies only when the corresponding flows are tested. Review premium resource/storage access on the server, exposed functions, extension placement, and leaked-password protection. A passing client check does not prove database or storage authorization.
6. The connected project currently has no resource, quiz, tutor or subscription records. After technical readiness, approved content and legitimate tutor onboarding are needed for real use. Curriculum authoring is outside this repair.

The broad diff includes removal of unused imports and accurate JSDoc contracts for UI primitives to make the existing lint/type checks useful. Build output still reports sizeable bundles; performance work should follow functional correctness.
