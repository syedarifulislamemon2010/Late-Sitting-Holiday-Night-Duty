# 1. Monolithic Next.js Architecture

## Status
Accepted

## Context
The Janata Bank PLC. Online Banking Department needed an automated portal for managing employee late sitting, holiday, night duties, leave applications, legal sheet generation, and multi-tier bill preparations. We needed high maintainability, rapid deployment, strict type safety, and minimal deployment overhead in an enterprise environment.

## Decision
We chose a unified Next.js App Router monolithic full-stack architecture with React 19, TypeScript, Tailwind CSS, and Drizzle ORM over a distributed microservices architecture.

## Consequences
- **Positive:**
  - Single repository, unified type contracts shared between API routes and UI components.
  - Simplified CI/CD pipeline and single-container Docker deployment.
  - Zero network hop latency between SSR/Server Components and business logic.
- **Negative:**
  - Independent scaling of specific sub-modules is tied to the main web process.
