# 2. Password Hashing Lazy Migration Strategy

## Status
Accepted

## Context
During legacy system migration, user credentials existed in plaintext/simple formats. Upgrading all users simultaneously could disrupt production access and require risky manual database updates.

## Decision
We implemented a non-blocking lazy migration pattern in the authentication layer (`NextAuth` credential provider):
1. When a user logs in, we verify whether the stored password is an encrypted bcrypt hash (`$2b$` or `$2a$`).
2. If plaintext match is successful, we immediately hash the password with `bcryptjs` (salt rounds: 10) and save the upgraded hash to the database on the fly.

## Consequences
- **Positive:**
  - Zero user friction: No forced password resets required.
  - Zero downtime migration.
  - Safe gradual encryption as users log in.
