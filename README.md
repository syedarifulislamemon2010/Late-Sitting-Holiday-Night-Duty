# Janata Bank Late-Sitting, Holiday, and Night Duty Portal (LHN Portal)

An enterprise-grade utility management portal built to automate late-sitting, holiday, and night duty assignments, calculate conveyance and entertainment allowance bill reports, manage executive seniority directories, and handle official leave requests.

---

## 1. Executive Summary & Functional Documentation

The **Janata Bank LHN Portal** is a production-ready administrative utility designed to automate the scheduling, verification, and allowance computation processes for bank employees working non-standard operational shifts. Built primarily for the **Online Banking Department (CBS Integrated Development Cell)** of Janata Bank PLC, the portal's core business objective is to transition manual shift-roster compilation, allowance calculations, and office order generation into a transparent, secure, and audit-compliant digital workflow.

### 1.1 Target User Roles
* **System Administrators:** Who configure security settings, manage operator directories, assign roles, and oversee audit trails.
* **Operators (Cell In-Charges):** Who coordinate rosters for their specific cells, log shift duties, generate billing memos, and input leave entries.
* **Executives (AGM, DGM, GM):** Who review, authorize, and sign off on duty rosters and bill memos.

### 1.2 Core Modules & Functionality
1. **Duty Roster Management:** Dynamic assignment of late-sitting, holiday, and night shift duties. Restricts operator errors (e.g. duplicate duty assignments).
2. **Bill Memo Generator:** Dynamically calculates conveyance and entertainment allowance bills based on validated duty hours and days. Generates official print-ready Legal-size billing memos.
3. **Leave Processing Engine:** Casual, Station, and Special Leave management with sandwich-rule calculations and dates validation to prevent overlapping duty assignments.
4. **Lunch Bill Module:** Generates monthly lunch bill records for employees within specific cells.
5. **Executive Directory:** Seniority-ranked directory of executive members (AGM, DGM) with real-time status visibility.
6. **Soft Deleted Items (Recycle Bin):** An audit-compliant soft-deletion bin that allows administrators to review and recover deleted records without database pollution.
7. **Audit Log:** System-wide immutable logging tracking data modifications (insertions, updates, deletions).

---

## 2. Directory & File Structure

The project follows a modular and clean folder layout separating concerns:

```text
Late-Sitting-Holiday-Night-Duty/
├── docs/                       # Architecture & deployment specifications
│   ├── ARCHITECTURE.md         # Detailed system design
│   └── DEPLOYMENT.md           # Production server configurations
├── public/                     # Static assets (Logos, Vector Icons, PDF Layout Fonts)
├── src/
│   ├── app/                    # Next.js App Router (Pages, Layouts, API Routes)
│   │   ├── api/                # API controllers (endpoint handling)
│   │   ├── billing/            # Conveyance & entertainment billing ledger UI
│   │   ├── closing-bill/       # Half-yearly closing allowances UI
│   │   ├── converter/          # Roster conversion & text processing UI
│   │   ├── documents/          # Official memo templates & document archive UI
│   │   ├── employees/          # Employee directory and profiles UI
│   │   ├── executive/          # Executive directory UI
│   │   ├── leave/              # Leave application manager UI
│   │   ├── roster/             # Duty rosters scheduling UI
│   │   ├── trash/              # Soft-deleted items recovery (Recycle Bin) UI
│   │   └── users/              # Operator directories and access control UI
│   ├── components/             # Reusable UI controls
│   ├── db/                     # Database setup, migrations, and table schemas
│   │   ├── schema.ts           # Drizzle table schemas
│   │   ├── seed.ts             # Initial data seeder script
│   │   └── dump.ts             # Data exporter utility script
│   ├── hooks/                  # Custom React hooks (realtime state, sizing)
│   ├── lib/                    # Shared helper engines (audit logging, errors)
│   ├── permissions/            # RBAC role mapper (ADMIN, USER)
│   ├── repositories/           # Repository data access layers (Drizzle wrappers)
│   ├── services/               # Service layers (Business logic & calculations)
│   └── validations/            # Zod validation schemas
├── drizzle.config.ts           # Drizzle compiler and migration settings
├── next.config.ts              # Next.js build parameters
├── package.json                # Project dependencies
├── postgres_dump.json          # DB restore backup file (Git ignored)
└── tsconfig.json               # TypeScript compiler configurations
```

---

## 3. Technology Stack

* **Core Framework:** Next.js 16.2.6 (App Router, Server Components)
* **Language:** TypeScript 5+
* **Authentication:** NextAuth.js v4 (Session-based custom credentials validation)
* **ORM:** Drizzle ORM v0.45
* **Database:** PostgreSQL (using `postgres` client library)
* **AI Tool Integration:** Google Gemini Generative AI SDK (`@google/generative-ai`) for image-based bulk imports
* **Styling & Layout:** Tailwind CSS v4, Vanilla CSS
* **Icons:** Lucide React

---

## 4. System Architecture

The application adopts a **Tiered Service-Repository Architecture** inside Next.js to cleanly separate data modeling, business rules, and presentation:

```mermaid
graph TD
    Client[Client Browser / Tailwind CSS UI] -->|HTTP Requests| NextJS[Next.js App Router]
    NextJS -->|API Endpoints| APIRoutes[src/app/api/*]
    APIRoutes -->|Service Calls| Services[src/services/* (Business Logic)]
    Services -->|Data Mutations| Repositories[src/repositories/* (Data Access)]
    Repositories -->|Queries/Mutations| Drizzle[Drizzle ORM]
    Drizzle -->|SQL Commands| PostgreSQL[(PostgreSQL Database)]
```

### 4.1 Tier Architecture Breakdown
1. **Presentation Layer (Next.js Pages & Components):** Built using React and styled with Tailwind CSS v4. Includes a simulated print rendering module for A4 (Roster/Office Orders) and Legal-size (Billing Memo) documents using Kalpurush and Noto Sans Bengali typography.
2. **Controller Layer (API Routes):** Exposes JSON endpoints under `src/app/api/` and handles request deserialization, error wrapping, and authentication checks.
3. **Service Layer (Business Logic):** Handles core calculations like sandwich-rule check, allowance calculations (Late Sitting = ৳300, Holiday = ৳500, Night Shift = ৳1000), and PDF template mapping.
4. **Repository Layer (Data Access):** Encapsulates Drizzle database calls to isolate queries, enabling easy modifications of queries without altering business rules.
5. **Database Layer:** A PostgreSQL instance storing tables synchronized using Drizzle migrations.

---

## 5. API Endpoint Documentation

The portal exposes several API routes for asynchronous operations:

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/auth/[...nextauth]` | POST/GET | Handles user credentials validation and session persistence. |
| `/api/cells` | GET/POST | Lists or creates operational cells. |
| `/api/employees` | GET/POST | Manages employee directory records. |
| `/api/duties` | GET/POST | Logs and retrieves duty assignments. |
| `/api/office-orders` | GET/POST | Manages official office orders (Rosters). |
| `/api/executives` | GET/POST | Manages executive lists (GM, DGM, AGM). |
| `/api/holidays` | GET/POST | Manages government holiday calendars. |
| `/api/leaves` | GET/POST | Manages employee leave applications. |
| `/api/lunch-bills` | GET/POST | Manages monthly lunch bills. |
| `/api/trash` | GET/POST | Handles soft-deleted items recovery and permanent deletion. |
| `/api/documents/generate-bill-memo` | POST | Exposes PDF generation payload for billing memos. |
| `/api/documents/generate-office-order` | POST | Exposes PDF generation payload for office orders. |

---

## 6. Design Patterns

The portal employs several proven software design patterns:
* **Repository Pattern:** Implemented in `src/repositories/` to separate the SQL execution logic from the business logic services.
* **Service Layer Pattern:** Encapsulated in `src/services/` where calculations (e.g., duty allowance aggregation) and transaction safety rules are enforced.
* **Schema-Driven Validation:** Implemented using **Zod** to validate both incoming HTTP request payloads and service arguments before they reach repositories.
* **Soft Delete Pattern:** Implemented via a separate `Trash` model and repository to ensure deletion accountability and recovery.
* **Implicit Many-to-Many Association:** Used via `_UserCells` table to map users to multiple cells without database overhead.

---

## 7. Code Quality & Formatting

The portal ensures a high standard of code safety and maintainability:
* **TypeScript Strict Mode:** The project compiles with strict type checks. You can verify compilation safety using:
  ```bash
  npx tsc --noEmit
  ```
* **Linting:** Static analysis is enforced using ESLint to guarantee coding style consistency.
* **Separation of Concerns:** Business logic, database interactions, Zod validations, and styling declarations are strictly separated into distinct modules.

---

## 8. Security Controls

Security is designed into the portal at every layer:
* **Authentication:** Handled through NextAuth.js, utilizing cryptographically secure session cookies.
* **Role-Based Access Control (RBAC):** Users are assigned roles (`ADMIN` or `USER`). The API layer and page navigation enforce strict guards ensuring `USER` role cannot execute admin mutations (e.g. creating/deleting employees or restoring items).
* **SQL Injection Mitigation:** Parameterized queries are automatically generated via **Drizzle ORM** to neutralize SQL injection vulnerabilities.
* **Data Validation:** Zod schemas validate data inputs to block malformed parameters or illegal type casting at runtime.
* **Audit Logging:** System-wide mutations (Insert, Update, and Soft-Deletion) are recorded in an immutable `AuditLog` table containing timestamps, target records, action type, and user session details.

---

## 9. Agile & Scrum Practices

The project has been planned and executed following standard Agile methodologies:
* **Iterative Sprints:** Development is structured into bi-weekly sprints focused on functional deliverables.
* **User Stories:** Requirements are formulated around user scenarios (e.g. "As an Operator, I want to assign holiday duties so that I can automatically calculate entertainment allowances").
* **Continuous Integration:** Regular local compilation checks and database script testing ensure code remains always stable.

---

## 10. Git & Version Control

To maintain repository cleanlines, the following Git guidelines are implemented:
* **Branching Strategy:** 
  * `main` is always stable and ready for production.
  * Feature development occurs in isolated feature branches (`feature/roster-modifications`, `feature/billing-ledger-redesign`).
* **Commit Conventions:** Commits use semantic labels (e.g., `feat:`, `fix:`, `refactor:`, `docs:`) to facilitate quick changelog generation.
* **Workspace Cleanliness:** Temporary scratch files and diagnostic scripts are excluded from repository commits using `.gitignore`.

---

## 11. Testing & Verification

Testing is executed using manual validation and compilation checks:
* **TypeScript Compilation:** Verification that the static analyzer compiles the Next.js routes correctly:
  ```bash
  npm run build
  ```
* **Page Pre-rendering Validation:** Verification that Next.js static pages collect and pre-render correct data schemas under various routes.
* **Manual Verification:** Developers run the application locally on the dev server (`npm run dev`) and test key flows (roster creation, leave overlaps, bill calculations, and document generation) manually to ensure the user interface is visual, interactive, and aligned with client specifications.

---

## 12. Setup & Installation

### 12.1 Prerequisites
Before installing the project, verify that your environment contains the following tools:
* **Node.js:** v18.0.0 or higher (LTS v20+ recommended)
* **npm:** v9.0.0 or higher
* **PostgreSQL:** v15+ (Local or Managed Instance)

### 12.2 Quick Start
Initialize your local environment using the following steps:

#### Step 1: Clone the Repository
```bash
git clone https://github.com/SyedArifulIslamEmon/Late-Sitting-Holiday-Night-Duty.git
cd Late-Sitting-Holiday-Night-Duty
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Configure Environment
Copy `.env.example` to `.env` and configure your database parameters:
```bash
cp .env.example .env
```

#### Step 4: Synchronize Database Schema
Push the schemas to your local database:
```bash
npx drizzle-kit push
```

#### Step 5: Seed the Database
Seed standard cells, holidays, and initial operator profiles:
```bash
npm run db:seed
```

#### Step 6: Start Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## 13. Environment Variables

| Variable | Required | Description |
| :--- | :---: | :--- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Secret key used to encrypt session cookies |
| `NEXTAUTH_URL` | Yes | Deployed application domain URL (e.g. `http://localhost:3000` for development) |
| `GEMINI_API_KEY` | Yes | Google Gemini API Key for OCR and bulk uploads |

---

## 14. Database Backups & Exporter

* **Export Database (Dump):** Export all records to `postgres_dump.json`:
  ```bash
  npm run db:dump
  ```
* **Import Database (Restore):** Wipe the target database clean and seed records from `postgres_dump.json`:
  ```bash
  npm run db:seed
  ```

---

## 15. Production Deployment

### Compile Static Package
To prepare the portal for deployment in a production environment, build the static package:
```bash
npm run build
```

### Start Server
Start the optimized Node.js server:
```bash
npm run start
```

---

## 16. Contributors & Licensing

* **Syed Ariful Islam Emon** (Lead Developer)
* **Online Banking Department, Janata Bank PLC.**

**License:** Proprietary Software | Online Banking Department, Janata Bank PLC. All rights reserved.
