# Changelog

All notable changes to the Janata Bank LHN Portal are documented in this file in reverse chronological order.

## [Unreleased] - 2026-10-25

### Added
- **PM2 & Production Deployment**: Added `ecosystem.config.cjs` configured for single-instance fork mode on RHEL with 1GB memory limit. Added runbooks `deploy.md`, `rollback.md`, `backup-restore-drill.md`, and `incident.md`.
- **Database Integrity**: Added `scripts/check-duplicates.sql` for read-only duplicate duty and bankId detection. Added proposed migrations in `docs/migrations-proposed/` for unique index, partial bankId index, and numeric(12,2) monetary columns. Added race condition analysis in `duty-conflict-race-condition.md` and migration runbook in `docs/runbooks/migrations.md`.
- **Canonical Print Spec**: Extracted `OFFICE_ORDER_SPEC` and `BILL_MEMO_SPEC` in `src/lib/print-spec.ts`. Aligned `OfficeOrderPrintModal`, `api/office-orders/raw`, `documents/generate-office-order`, and `documents/generate-bill-memo` with reference templates.
- **Security Hardening**: Enforced fail-closed `NEXTAUTH_SECRET` in production, proxy header trust configuration (`TRUST_PROXY_HEADERS`), generic error messages for sensitive routes, and CSP Report-Only testing headers.
- **Reliability Enhancements**: Added 5xx tolerance in AuthGuard, stale response guards (`useLatestRequest`), and popup-safe print windows (`window.open('', '_blank')`).

### Changed
- Removed legacy `Dockerfile` and `docker-compose.yml` to reflect bare-metal/VM RHEL + PM2 + nginx architecture.
- Updated `package.json` scripts with `typecheck` and `verify`.
- Cleaned `.env.example` by removing dead Supabase references and adding required production keys (`CRON_SECRET`, `TRUST_PROXY_HEADERS`, `ALLOW_SEED`, `BACKUP_ENCRYPTION_KEY`, `ERROR_WEBHOOK_URL`).

---

## [0.1.0] - 2026-08-24

### Initial Release
- Automated Duty Roster Management for Late-Sitting, Holiday, and Night Duties.
- Budget splitting engine for ৳7,500 boundary compliance.
- Universal live document editor and DOCX/PDF generators.
- NextAuth session authentication with password lazy-migration.
