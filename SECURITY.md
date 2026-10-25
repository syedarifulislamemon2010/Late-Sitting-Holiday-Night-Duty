# Security Policy & Vulnerability Disclosure

## 1. Supported Environments & Scope

This project is deployed exclusively for internal banking infrastructure on Red Hat Enterprise Linux (RHEL) with PM2 process supervision and an Nginx reverse proxy.

| Component | Status | Version / Scope |
| :--- | :--- | :--- |
| **Next.js Full-Stack App** | Supported | `>= 16.4.3` |
| **React Runtime** | Supported | `19.3.1` |
| **Node.js Runtime** | Supported | `>= 20.9.0` (LTS) |
| **Database Engine** | Supported | PostgreSQL 16+ |

---

## 2. Security Boundaries & Threat Model

### Cryptographic Authentication
- **Session Tokens**: Handled via standard NextAuth JWT cookies.
- **Password Hashes**: Standard 60-character bcrypt salted hashes.
- **Brute-Force Protection**: Tracked in-memory in single-instance mode (`instances: 1` in `ecosystem.config.cjs`). Accounts are locked out for 15 minutes after 5 consecutive failed attempts.

### Access Control Boundaries
1. **Admin Role**: Full system configuration, user provisioning, database backup/restore, audit logs, and trash bin purging.
2. **User Role**: Strictly restricted to assigned cells. Cross-cell duty assignment, document modification, or order deletion is rejected with `403 Forbidden` (see `src/services/duty.service.ts`). Cell 9 designates central administration.

### Header & Network Security
- All incoming requests pass through `src/proxy.ts`:
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - Content Security Policy (CSP) with local font isolation and restricted framing.
  - Proxy IP sanitization: Forwarded IP headers (`X-Forwarded-For`, `X-Real-IP`) are strictly ignored unless `TRUST_PROXY_HEADERS=true` is explicitly configured.

---

## 3. Reporting a Vulnerability

If you discover a potential security vulnerability within this banking portal, please report it responsibly:

1. **Do NOT open a public issue or discussion in GitHub.**
2. Send detailed reproduction steps, payload samples, and impact analysis directly to the Online Banking Department security team:
   - **Internal Security Contact**: `it.security@janatabank-bd.com`
   - **Lead Architect**: `emon.tarzan@gmail.com`
3. We acknowledge reports within 24 hours and issue high-priority patches following our incident runbook (`docs/runbooks/incident.md`).
