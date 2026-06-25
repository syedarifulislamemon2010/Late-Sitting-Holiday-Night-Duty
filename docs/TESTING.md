# Testing Strategy & Execution Guide

This document describes the testing practices, suites, coverage gates, and execution commands for the LHN Portal.

---

## 1. Test Suites Execution

The portal incorporates multiple tiers of testing to validate codebase robustness.

### A. Vitest Unit Tests
Validates core math, business logic, and date validation functions (leave sandwiching, budget splits, and allowance calculations) in isolation.
```bash
npx vitest run
```
*Continuous Watch Mode:*
```bash
npm run test:watch
```

### B. Integration Tests
Verifies database query mappings, relational integrity, soft-deletion triggers, and mock service integrations under Vitest environment configurations.
```bash
npm run test:integration
```

### C. API Contract Tests
Validates backend REST endpoint responses, status codes, response headers, role-based cell scope filters, and JSON payload structures.
```bash
npm run test:contract
```

### D. TypeScript Type Check
Ensures compile-time type safety across all frontend and backend components.
```bash
npx tsc --noEmit
```

---

## 2. Planned Testing Roadmap (Future Implementations)

The following testing frameworks and gates are planned for future integration into the CI/CD pipeline:

### A. E2E Playwright Tests
* **Objective:** Automate real-world browser paths (operator logins, manual roster scheduling, form overrides, and silent PDF printing) inside headless browsers.
* **Command:** `npx playwright test` (currently not installed).

### B. CI/CD Code Coverage Gates
* **Objective:** Enforce a strict quality gate of **minimum 80% code coverage** on core business logic service classes:
  - `src/services/leave.service.ts` (sandwich rules, holiday overrides, date intervals).
  - `src/services/officeOrder.service.ts` (dynamic ৳7,500 budget limit splitter).
  - `src/services/duty.service.ts` (allowance rate calculations).
* **Command:** `npm run test:coverage` (requires configuration).
