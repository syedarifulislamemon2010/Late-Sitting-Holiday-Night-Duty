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

The project adopts a structured, layered architecture that separates presentation, database interactions, service logic, and configuration. Below is a detailed view of all files and folders in the repository:

```text
Late-Sitting-Holiday-Night-Duty/
├── docs/                                  # Architectural design and deployment manuals
│   ├── ARCHITECTURE.md                    # System architecture design & technical specs
│   └── DEPLOYMENT.md                      # Production deployment guidelines for RHEL
├── public/                                # Public static assets
│   └── favicon.ico                        # Portal shortcut icon
├── src/
│   ├── app/                               # Next.js App Router Layer
│   │   ├── api/                           # Backend Server API Handlers (REST Endpoints)
│   │   │   ├── audit/
│   │   │   │   └── route.ts               # Fetches user logs and system-wide audit reports
│   │   │   ├── auth/
│   │   │   │   ├── route.ts               # Custom cookie authentication & session controller
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts           # NextAuth.js configurations (Credentials Provider)
│   │   │   ├── cells/
│   │   │   │   ├── route.ts               # Lists cells or handles bulk cell CSV imports
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts           # Handles single-cell updates, retrievals, or deletions
│   │   │   ├── documents/
│   │   │   │   ├── route.ts               # Document archive manager
│   │   │   │   ├── generate-bill-memo/
│   │   │   │   │   └── route.ts           # Builds conveyance & entertainment bill PDFs
│   │   │   │   ├── generate-closing-bill/
│   │   │   │   │   └── route.ts           # Generates half-yearly closing allowance sheet PDFs
│   │   │   │   ├── generate-employee-list/
│   │   │   │   │   └── route.ts           # Exports employee list documents
│   │   │   │   ├── generate-lunch-bill/
│   │   │   │   │   └── route.ts           # Prepares monthly lunch bill PDFs
│   │   │   │   └── generate-office-order/
│   │   │   │       └── route.ts           # Compiles printable duty roster orders (A4 size)
│   │   │   ├── duties/
│   │   │   │   ├── route.ts               # Lists or bulk assigns shift duties
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts           # Modifies, views, or soft-deletes a specific duty
│   │   │   ├── employees/
│   │   │   │   ├── route.ts               # Employee CRUD API
│   │   │   │   ├── parse-image/
│   │   │   │   │   └── route.ts           # Gemini API OCR tool for scanning paper employee rosters
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts           # Updates or soft-deletes employees
│   │   │   ├── executives/
│   │   │   │   ├── route.ts               # Lists or registers senior executives
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts           # Performs updates/deletions on executive directory
│   │   │   ├── holidays/
│   │   │   │   ├── route.ts               # Lists, logs, or removes custom calendar holidays
│   │   │   │   └── parse/
│   │   │   │       └── route.ts           # OCR script for importing holidays from official orders
│   │   │   ├── leaves/
│   │   │   │   ├── route.ts               # Leave applications generator API
│   │   │   │   ├── log-resolve-failed/
│   │   │   │   │   └── route.ts           # Traces leave resolving crashes
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts           # Single leave operations
│   │   │   ├── lunch-bills/
│   │   │   │   └── route.ts               # Computes and registers monthly cell lunch allowances
│   │   │   ├── manual-documents/
│   │   │   │   ├── route.ts               # Uploads and displays hand-signed bank orders
│   │   │   │   └── raw/
│   │   │   │       └── route.ts           # Serves uploaded document files natively
│   │   │   ├── office-orders/
│   │   │   │   ├── route.ts               # Roster office orders registry API
│   │   │   │   ├── raw/
│   │   │   │   │   └── route.ts           # Renders formatted office order JSON payloads
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts           # Office order modifications
│   │   │   ├── trash/
│   │   │   │   └── route.ts               # Restores soft-deleted items (cells, staff, duties, etc.)
│   │   │   ├── upload/
│   │   │   │   └── route.ts               # Handles file uploads to storage bucket
│   │   │   └── users/
│   │   │   │   ├── route.ts               # Lists and registers bank cell operators
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts           # Alters operator permissions and profiles
│   │   │   ├── audit/                     # Audit logs viewer interface
│   │   │   │   └── page.tsx               # Renders immutable log table filters and audit details
│   │   │   ├── billing/                   # Conveyance and entertainment billing ledger UI
│   │   │   │   └── page.tsx               # Complex multi-tab dashboard for bills, ledger, and print
│   │   │   ├── closing-bill/              # Half-yearly closing allowances UI
│   │   │   │   └── page.tsx               # Multi-column allowance sheets builder
│   │   │   ├── converter/                 # SutonnyMJ to Unicode font converter page
│   │   │   │   └── page.tsx               # Bi-directional text translation GUI
│   │   │   ├── documents/                 # PDF previewing & document archive
│   │   │   │   ├── page.tsx               # Lists generated rosters and billing reports
│   │   │   │   └── preview/
│   │   │   │       └── page.tsx           # Renders A4/Legal print templates inside iframe modals
│   │   │   ├── employees/                 # Employee registry manager
│   │   │   │   └── page.tsx               # CRUD table with batch CSV/Image scanning imports
│   │   │   ├── executive/                 # Seniority directories viewer
│   │   │   │   └── page.tsx               # Renders ranked executive directories with seniority color tags
│   │   │   ├── leave/                     # Leave requests interface
│   │   │   │   ├── bangladesh_areas.ts    # Static list of districts and divisions
│   │   │   │   └── page.tsx               # Form generator applying sandwich-rules
│   │   │   ├── lunch-bill/                # Lunch allowance billing UI
│   │   │   │   └── page.tsx               # Form for logging monthly lunch days
│   │   │   ├── roster/                    # Duty rosters scheduling UI
│   │   │   │   └── page.tsx               # Drag-and-drop or checklist shift duty calendar scheduler
│   │   │   ├── trash/                     # Soft-deleted items recovery UI
│   │   │   │   └── page.tsx               # Recycle bin restoring deleted database entities
│   │   │   ├── users/                     # Operators directory UI
│   │   │   │   └── page.tsx               # Admin manager for mapping users to specific cells
│   │   │   ├── favicon.ico                # App icon
│   │   │   ├── globals.css                # Global CSS rules, custom scrollbars, and print layout styles
│   │   │   ├── layout.tsx                 # Core HTML viewport shell, Google font configurations
│   │   │   └── page.tsx                   # Main interactive dashboard, calendar, and JB rates guidelines
│   │   ├── components/                    # Core UI components
│   │   │   ├── AuthGuard.tsx              # Login screen featuring an interactive SVG dog mascot
│   │   │   ├── Navbar.tsx                 # Dynamic top header with user avatar, logout controls
│   │   │   └── Sidebar.tsx                # Left collapsible panel with responsive routing links
│   │   ├── db/                            # Database synchronization layer
│   │   │   ├── dump.ts                    # Backup dump exporter script
│   │   │   ├── schema.ts                  # Drizzle ORM model schema declarations
│   │   │   ├── seed.ts                    # Wipes, imports backup JSON, and resets Postgres key sequences
│   │   │   └── migrations/                # Schema state version SQL files
│   │   │       ├── 0000_tired_menace.sql  # Initial tables migration script
│   │   │       ├── 0001_huge_tusk.sql     # Additional columns for leaves
│   │   │       ├── 0002_stale_bucky.sql   # Lunch bill tables mapping
│   │   │       ├── 0003_nice_vance_astro.sql# Manual documents schema update
│   │   │       └── meta/                  # Kit journal schema snapshots
│   │   ├── hooks/                         # Custom React Hooks
│   │   │   └── useRealtime.ts             # Web socket / interval sync hook
│   │   ├── lib/                           # Core utilities
│   │   │   ├── audit.ts                   # Appends details to audit.log file
│   │   │   ├── auth-wrapper.ts            # Resolves user sessions (NextAuth or custom cookie fallback)
│   │   │   ├── bengali-converter.ts       # Bidirectional Bijoy ANSI <-> Unicode font mapper engine
│   │   │   ├── db.ts                      # Instantiates and configures PostgreSQL client connector
│   │   │   ├── errors.ts                  # Global error codes catalog, handles API error mapping
│   │   │   ├── seniority.ts               # Executive seniority sorting engine
│   │   │   └── sorting.ts                 # Employee designation ranking classifier
│   │   ├── permissions/                   # Access Control Layers
│   │   │   └── rbac.ts                    # Configures permission matrix for ADMIN vs USER
│   │   ├── repositories/                  # Repository Layer (Data Access Layer)
│   │   │   ├── duty.repository.ts         # Encapsulates Drizzle duty mutations
│   │   │   ├── employee.repository.ts     # Encapsulates Drizzle employee mutations
│   │   │   ├── holiday.repository.ts      # Encapsulates Drizzle holiday database queries
│   │   │   ├── leave.repository.ts        # Encapsulates Drizzle leave database queries
│   │   │   ├── officeOrder.repository.ts  # Encapsulates Drizzle office order database queries
│   │   │   └── user.repository.ts         # Encapsulates Drizzle user database queries
│   │   ├── services/                      # Service Layer (Business Logic Layer)
│   │   │   ├── duty.service.ts            # Allowance calculations, leave overlaps verification
│   │   │   ├── employee.service.ts        # Employee updates, batch import validations
│   │   │   ├── executive.service.ts       # Seniority formatting
│   │   │   ├── leave.service.ts           # Sandwich rules execution, dates overlap checks
│   │   │   └── officeOrder.service.ts     # ৳7,500 budget limit splitter logic, document compilers
│   │   └── validations/                   # Schema-driven validations using Zod
│   │       ├── duty.schema.ts             # Validates duty logs and edit requests
│   │       ├── employee.schema.ts         # Validates employee profile properties
│   │       ├── leave.schema.ts            # Validates leave durations and sandwich rules
│   │       └── officeOrder.schema.ts      # Validates office order compilation formats
├── drizzle.config.ts                      # Configuration file for Drizzle migrations generator
├── eslint.config.mjs                      # Lint rules specifications
├── next-env.d.ts                          # Next.js custom type definition file
├── next.config.ts                         # Custom Next.js build behaviors
├── package-lock.json                      # Locked dependency versions catalog
├── package.json                           # Dependency registry and build script entries
├── postcss.config.mjs                     # Tailwind CSS compilation configurator
├── postgres_dump.json                     # Local DB restore dump file
└── tsconfig.json                          # TypeScript compiler settings
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
    Client["Client Browser / Tailwind CSS UI"] -->|HTTP Requests| NextJS["Next.js App Router"]
    NextJS -->|API Endpoints| APIRoutes["src/app/api/*"]
    APIRoutes -->|Service Calls| Services["src/services/* (Business Logic)"]
    Services -->|Data Mutations| Repositories["src/repositories/* (Data Access)"]
    Repositories -->|Queries/Mutations| Drizzle["Drizzle ORM"]
    Drizzle -->|SQL Commands| PostgreSQL[("PostgreSQL Database")]
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

To maintain repository cleanliness, the following Git guidelines are implemented:
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

## 14. Database Setup & Configurations

Database structures and modifications are managed using Drizzle ORM:
* **Schema Synchronization:** Push current TypeScript schema structures directly to the database:
  ```bash
  npx drizzle-kit push
  ```
* **Generate Migrations:** Compare local schemas with previous migrations and generate new SQL files:
  ```bash
  npx drizzle-kit generate
  ```
* **Execute Migrations:** Run all unapplied SQL migration files against the target database:
  ```bash
  npx drizzle-kit migrate
  ```

---

## 15. Database Backup & Restore

The application includes automated backup scripts to preserve and restore data states:

### 15.1 Export Database (Dump)
Export all records to `postgres_dump.json` (saved locally in the root folder):
```bash
npm run db:dump
```

### 15.2 Import Database (Restore)
Wipe the target database clean and seed records from `postgres_dump.json` while matching primary key constraints:
```bash
npm run db:seed
```

---

## 16. Linux Deployment Guide

Follow these steps to deploy and run the LHN Portal on **RHEL 8/9**, **Rocky Linux**, or **AlmaLinux**:

### Step 1: Install Node.js & Git
```bash
# Enable Node.js repository (v20 LTS)
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs git
```

### Step 2: Configure Application Directory
```bash
cd /var/www
sudo git clone https://github.com/SyedArifulIslamEmon/Late-Sitting-Holiday-Night-Duty.git lhn-portal
cd lhn-portal
sudo npm install --omit=dev
```

### Step 3: Setup Environment & Process Manager
Install PM2 globally to run the node service in the background:
```bash
sudo npm install -y pm2 -g
```
Create a production `.env` file and configure server settings.

### Step 4: Build & Launch with PM2
```bash
# Compile code
npm run build

# Start PM2 process
pm2 start npm --name "lhn-portal" -- start

# Save PM2 state & enable launch on system reboot
pm2 save
pm2 startup
```

### Step 5: Nginx Reverse Proxy Setup
Install and configure Nginx to proxy requests from Port 80/443 to the local Port 3000:
```bash
sudo dnf install -y nginx
```
Create `/etc/nginx/conf.d/lhn-portal.conf`:
```nginx
server {
    listen 80;
    server_name lhn.janatabank.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable and start Nginx:
```bash
sudo systemctl enable --now nginx
```

### Step 6: Configure Firewall
Open HTTP and HTTPS ports in the system firewall:
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 17. Troubleshooting

* **Database Connection Failures:** Ensure `sslmode=require` is present in the connection string and check if the database host is accessible.
* **Missing Environment Variables:** Verify that all variables outlined in `.env.example` are populated in the system `.env` file.
* **Gemini API Errors:** Verify that the `GEMINI_API_KEY` is active and correct.
* **Build Failures:** Run `npx tsc --noEmit` and check for code type mismatch issues prior to building.

---

## 18. Maintenance Procedures

* **System Updates:** Pull updates from the main git branch, run `npm install`, compile the build via `npm run build`, and restart the service using `pm2 restart lhn-portal`.
* **Database Backups:** Schedule a nightly cron job to execute `npm run db:dump` and archive the generated `postgres_dump.json` to secure secondary storage.

---

## 19. Docker Containerization Setup

To simplify local development and deployment under a unified containerized environment, the LHN Portal is equipped with multi-stage Docker configurations.

### 19.1 Run Using Docker Compose (Recommended)
This spins up both the Next.js portal application and a local PostgreSQL 15 database instance side-by-side.

1. **Prerequisites:**
   Ensure Docker and Docker Compose are installed on your machine.

2. **Launch Containers:**
   Run the following command to build the app image and spin up the services:
   ```bash
   docker-compose up --build -d
   ```

3. **Database Migration and Seeding inside Docker:**
   Once the containers are running, run migrations and restore the database from the JSON dump:
   ```bash
   # Push Drizzle schema to the containerized database
   docker-compose exec app npx drizzle-kit push
   
   # Import database tables and records from postgres_dump.json
   docker-compose exec app npm run db:seed
   ```

4. **Access the App:**
   The portal will be live at `http://localhost:3000`.

### 19.2 Direct Docker Build
To build only the production Next.js image:
```bash
docker build -t lhn-portal .
```

---

## 20. Production Readiness Checklist

- [ ] Environment variables configured securely
- [ ] Database backed up and schema initialized
- [ ] SSL certificates configured in Nginx configuration
- [ ] PM2 process manager configured for autostart
- [ ] Audit logs write paths verified

---

## 21. Recent Updates (June 2026)

The LHN Portal has been updated with the following features and structural fixes in June 2026:
* **Monolithic Component Decomposition:** Broken down the 4,150+ lines monolithic `BillingPage` into modular components (`LedgerTab`, `OrdersTab`, `BillsTab`, `ReportsTab`, `BillPrintLayout`) under `src/app/billing/components/` to optimize compilation speeds.
* **Authentication Hardening:** Replaced unencrypted session cookie checks with jwt-validated NextAuth token validation inside `auth-wrapper.ts`.
* **Database Schema & Transactions:** Implemented database-backed `AuditLog` table with query indexes and wrapped all multi-operation service methods inside SQL transactions (`db.transaction()`) to guarantee atomic operations.
* **API Rate Limiting Middleware:** Added a Next.js middleware token-bucket rate limiter targeting auth and heavy document generation routes to mitigate brute-force and scraping vectors.
* **Centralized Error Webhooks:** Wired unhandled server exceptions (500) to dispatch automated Discord/Slack webhook warning alerts.
* **Automated Testing Suite:** Implemented Vitest environment with unit tests covering shift-rate calculations and leave sandwich-rule edge cases (`npx vitest run`).
* **UTF-8 BOM CSV Exports:** Added CSV/Excel reporting utility to the billing ledger dashboard with a UTF-8 BOM prefix, ensuring Bengali script renders correctly in spreadsheet applications.
* **Print Typography Standardization:** Replaced hardcoded `Kalpurush` font references with the standardized `'SolaimanLipi', 'Nikosh', 'Noto Sans Bengali', sans-serif` print stack across billing, roster, documents, and leave print pages, ensuring visual layout stability.

---

## 22. Contributors & Licensing

* **Syed Ariful Islam Emon** (Lead Developer)
* **Online Banking Department, Janata Bank PLC.**

**License:** Proprietary Software | Online Banking Department, Janata Bank PLC. All rights reserved.
