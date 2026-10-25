# 6. Production Security Hardening & Isolation

## Status
Accepted

## Context
Deploying the banking portal on an enterprise Red Hat Enterprise Linux (RHEL) server connected to an internal network requires robust defenses against unauthorized access, session tampering, and brute-force credential stuffing.

## Decision
We implemented a defense-in-depth security model:
1. **Cryptographic Secret Enforcement**: In production runtime, missing `NEXTAUTH_SECRET` triggers a fail-closed hard stop.
2. **Reverse Proxy Header Trust**: Forwarded client IP headers (`X-Forwarded-For`, `X-Real-IP`) are ignored unless `TRUST_PROXY_HEADERS=true` is explicitly set, preventing client-spoofed rate limiter bypass.
3. **Single-Instance Fork Mode**: PM2 runs a single worker process (`instances: 1`) to preserve in-memory brute-force lockout states without needing Redis.
4. **Information Disclosure Prevention**: Error handlers return generic error codes rather than exposing stack traces or database schema details.
5. **Content Security Policy**: Hardened CSP with local font delivery and report-only telemetry.

## Consequences
- **Positive:** High resilience against brute force, spoofing, and privilege escalation.
- **Negative:** Horizontal scaling requires introducing an external distributed cache (e.g., Redis).
