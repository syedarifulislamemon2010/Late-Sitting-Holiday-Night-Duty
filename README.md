# Janata Bank Late-Sitting, Holiday, and Night Duty Portal (LHN Portal)

An enterprise-grade administrative and financial utility management portal built to automate late-sitting, holiday, and night duty assignments, calculate conveyance and entertainment allowance bill reports, manage executive seniority directories, handle official leave requests, and configure fine-grained role-based cell assignments for Janata Bank PLC.

---

## 📖 System Documentation Index

The system contains comprehensive technical, architectural, and deployment documentation suitable for IT audits and compliance reviews:

* 📄 **[Enterprise Specification (SRS, SDD, and Architecture)](file:///d:/Late-Sitting-Holiday-Night-Duty/docs/ENTERPRISE_SPEC.md):** The primary documentation package covering the Software Requirements Specification (SRS), Software Design Document (SDD), and System Architecture specifications under IEEE and ISO/IEC guidelines.
* 🏛️ **[System Architecture & Technical Specs](file:///d:/Late-Sitting-Holiday-Night-Duty/docs/ARCHITECTURE.md):** Detailed explanations of technical selections, core algorithmic engines (budget splitter, sandwich rule leave generator), and row-level access control boundary designs.
* 🚀 **[Production Deployment Guide](file:///d:/Late-Sitting-Holiday-Night-Duty/docs/DEPLOYMENT.md):** Instructions for bare-metal Red Hat Enterprise Linux (RHEL) deployments, including PostgreSQL auth configuration, Nginx reverse proxy directives, firewalld, and SELinux routing permissions.

---

## ⚙️ Installation & Developer Guide

### 1. Prerequisites
* **Node.js:** v18.0.0 or higher (LTS v20+ recommended)
* **PostgreSQL:** v15+ (Local or Managed Instance)
* **npm:** v9.0.0 or higher

### 2. Local Quick Start
Clone the repository, configure local environment variables, and boot the development server:
```bash
# Clone the repository
git clone https://github.com/SyedArifulIslamEmon/Late-Sitting-Holiday-Night-Duty.git
cd Late-Sitting-Holiday-Night-Duty

# Install node dependencies
npm install

# Set up environment configuration
cp .env.example .env

# Deploy local schema relations using Drizzle Kit
npx drizzle-kit push

# Seed initial database credentials, cells, and holidays
npm run db:seed

# Boot the local Next.js development server
npm run dev
```

### 3. Docker Compose Setup
Alternatively, deploy containerized instances of the portal and database:
```bash
# Build and start container instances
docker-compose up --build -d

# Sync schemas and seed database within container runtime
docker-compose exec app npx drizzle-kit push
docker-compose exec app npm run db:seed
```

### 4. RHEL OS-Level Connection Fix (pg_hba.conf)
RHEL systems restrict local TCP database loops to ident auth, which blocks password-based access. Update `/var/lib/pgsql/data/pg_hba.conf` or `/var/lib/pgsql/15/data/pg_hba.conf` to use password-based protocols:
```bash
sudo sed -i 's/ident/scram-sha-256/g' /var/lib/pgsql/data/pg_hba.conf
sudo sed -i 's/peer/scram-sha-256/g' /var/lib/pgsql/data/pg_hba.conf
sudo systemctl restart postgresql
```

---

## 📂 File Structure

The codebase is organized in a modular, layered structure separating APIs, repository query layers, business logic services, and UI layout contexts:

```text
Late-Sitting-Holiday-Night-Duty/
├── docs/                                  # Technical specifications and deployment runbooks
│   ├── ARCHITECTURE.md                    # Core algorithmic specs and technology rationales
│   ├── DEPLOYMENT.md                      # Production deployment guidelines for RHEL 8/9
│   └── ENTERPRISE_SPEC.md                 # Complete SRS, SDD, and Security documentation
├── public/                                # Public static images and browser assets
│   └── favicon.ico                        # System favicon shortcut icon
├── src/
│   ├── app/                               # Next.js App Router layer
│   │   ├── api/                           # API Route Handlers (REST Endpoints)
│   │   │   ├── audit/                     # System log tracking API
│   │   │   ├── auth/                      # NextAuth session configuration route
│   │   │   ├── cells/                     # Cell management & bulk import API
│   │   │   ├── documents/                 # PDF document compilers (Office Orders, Memos)
│   │   │   ├── duties/                    # Shift duty logging API
│   │   │   ├── employees/                 # Employee directory API (Enforces cell boundaries)
│   │   │   ├── executives/                # Executive rank and directory API
│   │   │   ├── holidays/                  # Holiday overrides & calendar config API
│   │   │   ├── leaves/                    # Casual/station leave processor API
│   │   │   ├── lunch-bills/               # Cell monthly lunch allowances API
│   │   │   ├── manual-documents/          # Hand-signed bank order manager
│   │   │   ├── office-orders/             # Roster office order register API
│   │   │   ├── profile/                   # Single session fetch profile helper
│   │   │   ├── trash/                     # Recycle bin recovery API (restore soft-deleted rows)
│   │   │   ├── upload/                    # File upload storage handler
│   │   │   └── users/                     # Bank cell operators administration API
│   │   ├── audit/                         # Audit log dashboard viewer UI
│   │   ├── billing/                       # Allowance ledgers and invoice tabs
│   │   ├── closing-bill/                  # Half-yearly closing billing sheets UI
│   │   ├── converter/                     # SutonnyMJ Bijoy to Unicode translator tool
│   │   ├── documents/                     # PDF viewer frames and document archives
│   │   ├── employees/                     # Employee list directory manager UI
│   │   ├── executive/                     # Executive seniority rank directory UI
│   │   ├── leave/                         # Casual leave form scheduler UI
│   │   ├── lunch-bill/                    # Monthly lunch bill details dashboard
│   │   ├── roster/                        # Swap-panel duty roster scheduler UI
│   │   ├── trash/                         # Soft-deleted items recovery UI
│   │   └── users/                         # User permissions editor dashboard
│   ├── components/                        # Universal shared visual components
│   │   ├── AuthGuard.tsx                  # Login screen with mascot validation check
│   │   ├── Navbar.tsx                     # Dynamic portal navbar header
│   │   └── Sidebar.tsx                    # Collapsible navigation menu
│   ├── context/                           # React state providers
│   │   ├── LayoutContext.tsx              # Roster view panel size toggle context
│   │   └── ProfileContext.tsx             # Operator profile data loader context
│   ├── db/                                # Persistent storage data model layer
│   │   ├── dump.ts                        # Exporter database records dump tool
│   │   ├── schema.ts                      # Drizzle relational schemas declarations
│   │   ├── seed.ts                        # Wipes and populates database from dump file
│   │   └── migrations/                    # Database version state files
│   ├── hooks/                             # Shared react custom hooks
│   │   └── useRealtime.ts                 # Web-socket status update wrapper
│   ├── lib/                               # Base utility helper scripts
│   │   ├── bengali-converter.ts           # Bijoy <-> Unicode converter engines
│   │   ├── db.ts                          # PostgreSQL connection initiator
│   │   ├── errors.ts                      # Universal error maps and code identifiers
│   │   ├── leave-calculator.ts            # Sandwich leave deduction calculator
│   │   ├── seniority.ts                   # Executive filing sort classification
│   │   └── sorting.ts                     # Designation ranking classification
│   ├── permissions/                       # Scoped role restrictions layers
│   │   └── rbac.ts                        # Role-based access rules parameters
│   ├── repositories/                      # Repository Layer (Data Access queries)
│   └── services/                          # Business Logic Service Layer
│       └── __tests__/                     # Vitest Service Unit Test Suites
│
├── Dockerfile                             # Next.js optimized docker container layout
├── docker-compose.yml                     # App and DB containers orchestrator script
├── drizzle.config.ts                      # Configuration rules for migrations generator
├── eslint.config.mjs                      # Code styling linter configurations
├── package.json                           # System dependencies and run scripts
├── postgres_dump.json                     # Database backup json file
└── tsconfig.json                          # TypeScript compiler settings
```

---

## 🔐 Environment Variables Configuration

Define the following parameters inside your local `.env` file:

| Variable | Required | Description |
| :--- | :---: | :--- |
| `DATABASE_URL` | Yes | PostgreSQL connection URI string (`postgresql://user:pass@host:port/db`) |
| `NEXTAUTH_SECRET` | Yes | Cryptographic salt used for signing JWT cookies |
| `NEXTAUTH_URL` | Yes | Local or production web address of the system (`http://localhost:3000`) |
| `GEMINI_API_KEY` | Yes | Google Gemini API Key used for processing OCR document scanning |

---

## 👥 Contributors

* **Syed Ariful Islam Emon**
