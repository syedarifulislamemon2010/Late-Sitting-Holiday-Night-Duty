# 4. In-Memory Rate Limiting and Single-Instance Scope

## Status
Accepted

## Context
To prevent brute-force attacks and abuse against authentication and heavy export routes, a rate-limiting mechanism was needed without introducing heavy external infrastructure dependencies (like Redis) during current deployment phases.

## Decision
We implemented token-bucket / sliding window in-memory rate limiting via Node.js maps in middleware and API route handlers.

## Consequences
- **Positive:**
  - Zero external infrastructure dependency, works out-of-the-box in standalone container deployments.
  - Sub-millisecond latency for rate checks.
- **Negative / Limitations:**
  - In multi-instance clustered or serverless deployments, rate counters are isolated per process rather than globally shared. For multi-replica scale-out, Redis-based distributed rate limiting should be introduced.
