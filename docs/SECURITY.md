# Security Design, Regulatory Compliance & Risk Assessment

This document provides a detailed overview of the security architecture, data classifications, threat models, and risk mitigations for the LHN Portal.

---

## 1. Authentication & Cell Permission Boundaries

* **Session Hardening:** All private routes are protected using NextAuth.js JWT authentication. Authentication tokens are decrypted server-side to resolve roles and active cell mappings.
* **Row-Level Cell Boundaries (RBAC):** Users with the `USER` role are blocked from altering records outside their assigned cell boundaries. Database repositories inject user cell maps in SQL queries (e.g., `inArray(employees.cellId, userCellIds)`) to restrict access.

---

## 2. Planned Security Roadmap (Future Implementations)

To satisfy advanced enterprise banking security compliance, the following features are planned and scheduled for future releases:

### A. Multi-Factor Authentication (MFA / TOTP)
* **TOTP Authentication:** Users will configure a time-based one-time password (TOTP) token matching the RFC 6238 standard.
* **Google Authenticator Sync:** Device registration via QR code linking secret key parameters to standard authenticator applications (e.g., Google Authenticator, Microsoft Authenticator).
* **Backup Recovery Codes:** Multi-factor setup will generate 8 immutable recovery codes (hashed via bcrypt in the database).
* **Device Trust Period:** Operators can opt to trust their current browser device for 30 calendar days, bypass-challenging subsequent MFA checks.

### B. Security & Account Lockout Policies
* **Account Lockout:** To mitigate brute-forcing, accounts will lock for 30 minutes after 5 consecutive failed login attempts, registering a high-priority security log.
* **Session Security Controls:**
  - **Idle Session Timeout:** Sessions will automatically invalidate after 15 minutes of operator inactivity.
  - **Absolute Session Timeout:** Active session tokens will possess an absolute validity window of 8 hours.

### C. At-Rest Database Encryption
* **Database Encryption:** PostgreSQL database storage and cold backup dumps will be encrypted at rest using AES-256-CBC.
* **Data Retention:** Under Bangladesh Bank IT Audit guidelines, the immutable audit trail is retained for a minimum of 5 financial years.

---

## 3. OWASP Security Control Table

| Threat | Control | Status |
| :--- | :--- | :--- |
| **SQL Injection** | Drizzle ORM query parameterization | Enforced |
| **XSS** | React output encoding & sanitization | Enforced |
| **CSRF** | NextAuth secure JWT session validation | Enforced |
| **Session Hijacking** | HttpOnly, Secure, SameSite=Strict cookies | Enforced |
| **Brute Force** | Token-bucket rate-limiting middleware | Enforced |
| **Privilege Escalation** | RBAC checks on API routes & database repositories | Enforced |

---

## 4. Audit Event Matrix

| Event | Logged | Target Module |
| :--- | :---: | :--- |
| Login | Yes | Authentication |
| Logout | Yes | Authentication |
| User Create | Yes | Administration |
| Employee Delete | Yes | Employee Registry |
| Leave Approve | Yes | Leave Management |
| Bill Generate | Yes | Billing Compiler |

---

## 5. Data Classification Matrix

| Data Asset / Record | Classification | Description | Access Scopes |
| :--- | :--- | :--- | :--- |
| **Passwords & Keys** | Restricted | Hashed passwords and session validation keys | Server-side validation routines only; never exposed. |
| **Session JWTs & Cookies** | Restricted | Client session identifier cookies | HttpOnly, Secure, SameSite=Strict scope filters. |
| **Allowances & LEDGER** | Confidential | Employee allowance ledgers and billing totals | Scoped cell operators, executives, and administrators. |
| **Employee Directories** | Confidential | Bank IDs, designation codes, and file numbers | Cell-scoped operators and admins. |
| **Audit Logs** | Confidential | Log activity registry | Read-only for system administrators. |
| **System Settings** | Internal | Cell configurations and holiday calendar rules | Scoped operators (Read-only), admins (Read/Write). |
| **Public Assets** | Public | Icons, logos, and stylesheets | Open read access. |

---

## 6. STRIDE Threat Model

* **Spoofing (Authentication Bypass):**
  - *Threat:* An attacker intercepts or hijacks active operator sessions to post false duty logs.
  - *Control:* Enforces NextAuth.js JWT authentication. Cookies are signed, encrypted, and flagged as `HttpOnly`, `Secure`, and `SameSite=Strict`.
* **Tampering (Data Alteration):**
  - *Threat:* An operator manipulates HTTP API request values to elevate duty allowance rates.
  - *Control:* Server-side rate validation routines read rates directly from secure database schemas (`LATE_SITTING` = 300, `HOLIDAY` = 500, `NIGHT_SHIFT` = 1000), ignoring client-side rate injections.
* **Repudiation (Denial of Action):**
  - *Threat:* An operator deletes crucial billing data and denies having made the action.
  - *Control:* Every action is recorded inside an immutable database-backed `AuditLog` table and written to a secure local `audit.log` file on disk.
* **Information Disclosure (Data Leakage):**
  - *Threat:* A Cell Officer reads other cell's employees lists or conveyance ledgers.
  - *Control:* Row-level cell filtering inside Drizzle queries (e.g. `inArray(employees.cellId, userCellIds)`) filters all responses based on verified user session profiles.
* **Denial of Service (Endpoint Flooding):**
  - *Threat:* Attacking scripts flood PDF compilers or login endpoints to deplete server CPU.
  - *Control:* Token-bucket rate-limiting middleware restricts endpoint invocation requests to a maximum of 10 requests per minute per IP.
* **Elevation of Privilege (Scope Escalation):**
  - *Threat:* A regular operator bypasses RBAC to elevate their permissions to `ADMIN`.
  - *Control:* API gateways verify role flags decrypted directly from secure server JWT cookies before executing administrative controllers.

---

## 7. Error Catalog

| Error Code | HTTP Status | Bengali Meaning | Cause & Recovery Resolution |
| :--- | :---: | :--- | :--- |
| `validation_error` | 400 | ইনপুট সঠিক নয়। | The payload format is invalid (e.g., missing designations). Rectify client inputs based on fields highlighted in validation error alerts. |
| `forbidden` | 403 | অনুমতি নেই। | Operator is attempting to write records outside cell boundaries. Contact administration to review cell scope settings. |
| `unauthorized` | 401 | সেশন নিষ্ক্রিয়। | Operator session has expired. Sign out and sign back in to establish a fresh JWT session. |
| `database_error` | 500 | ডাটাবেজ সমস্যা হয়েছে। | SQL constraint violations or database connection timeout. Retry after a few seconds. |
| `internal_server_error` | 500 | সার্ভার সমস্যা হয়েছে। | Unhandled runtime exception in service layer. Developer review is needed. Check Discord/Slack error webhook logs. |
| `duty_collision` | 409 | তারিখ ওভারল্যাপ। | Logging duplicate duties or dates overlapping with approved leaves. De-select overlapping dates or cancel conflicting leaves before rescheduling. |

---

## 8. Risk Assessment

| Risk Description | Impact | Probability | Mitigation Strategy |
| :--- | :---: | :---: | :--- |
| **SQL Injection** | Critical | Low | Prevented by Drizzle ORM's automated query parameterization. |
| **Duplicate Allowance Claims** | High | Medium | Enforced date-uniqueness checks on employee assignments at server API level. |
| **Cross-Cell Data Tampering** | High | Low | NextAuth session verification with cell-mapping filters in the database layer. |
| **Bengali Text Rendering Failure** | Medium | Medium | Unified print stylesheets using 'SolaimanLipi' and 'Nikosh' fonts with letter-spacing normal. |
| **Server Uptime Interruption** | High | Low | PM2 process monitoring and Nginx reverse proxy recovery rules. |
