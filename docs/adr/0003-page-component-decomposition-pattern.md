# 3. Component Decomposition Pattern (Page.tsx -> components/ + hooks/)

## Status
Accepted

## Context
As pages expanded with extensive interactive workflows (billing ledger, rosters, leave applications, executive directory), single `page.tsx` files exceeded 1,200+ lines, making maintenance, code reviews, and testing challenging.

## Decision
We established a strict Architectural Refactoring Standard:
1. `src/app/{feature}/page.tsx`: Serves exclusively as a lightweight composition layer (kept strictly under 800 lines, target 150-350 lines).
2. `src/app/{feature}/hooks/`: Encapsulates all data fetching, state management, and async operations in typed custom hooks.
3. `src/app/{feature}/components/`: Houses modular, single-responsibility UI subcomponents.
4. `src/app/{feature}/types.ts`: Localizes data models and interfaces.

## Consequences
- **Positive:**
  - High cohesion, clear separation of concerns.
  - Granular re-rendering and easy unit testability.
- **Negative:**
  - Slightly more files per feature directory.
