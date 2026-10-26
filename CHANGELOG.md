# Changelog

All notable changes to the Janata Bank LHN Portal are documented in this file in reverse chronological order.

## [0.2.0] - 2026-10-26

### Added
- **RBAC Audit-Only Logging**: Integrated `auditRbac()` into all authenticated API routes with 1-minute duplicate log suppression cache and safe fail-open error handling. Added `RBAC_MODE` (`audit` | `off`) configuration in `.env.example` and documentation in [`docs/runbooks/rbac-rollout.md`](file:///d:/Late-Sitting-Holiday-Night-Duty/docs/runbooks/rbac-rollout.md).
- **Security Hardening (Generic Errors)**: Generic error responses across all document generation and trash API routes (`generate-bill-memo`, `generate-closing-bill`, `generate-employee-list`, `generate-lunch-bill`, `generate-office-order`, `documents`, and `trash`) to completely eliminate server stack trace, SQL query, or file path leakage.
- **PM2 Production Guidance**: Added IP/lockout operational documentation in [`docs/runbooks/deploy.md`](file:///d:/Late-Sitting-Holiday-Night-Duty/docs/runbooks/deploy.md), commented `HOSTNAME: '127.0.0.1'` binding option in `ecosystem.config.cjs`, and synchronized `office-work` PM2 process name.
- **Durable Login Lockout**: Stored failed attempt state in PostgreSQL database with auto-cleanup and 15-minute temporary lockout threshold.

### Changed
- Synchronized cache performance documentation in `README.md` to accurately reflect indexed query execution in `holiday.repository.ts`.
- Clarified `TRUST_PROXY_HEADERS` security implications in `.env.example` and [`docs/runbooks/deploy.md`](file:///d:/Late-Sitting-Holiday-Night-Duty/docs/runbooks/deploy.md).
- Version incremented to `0.2.0` in `package.json`.

---

## [0.1.0] - 2026-08-24

### Initial Release
- Automated Duty Roster Management for Late-Sitting, Holiday, and Night Duties.
- Budget splitting engine for ৳7,500 boundary compliance.
- Universal live document editor and DOCX/PDF generators.
- NextAuth session authentication with password lazy-migration.
