# LHN Portal (Late-Sitting, Holiday, and Night Duty Enterprise Portal)

LHN Portal is an enterprise-grade utility management portal built to automate late-sitting, holiday, and night duty assignments, generate conveyance and entertainment bill reports, manage executive seniority directories, and handle official leave requests.

---

## 🏛️ Project Overview

### Purpose
The LHN Portal automates administrative tasks for teams working non-standard operational shifts. It automates duty schedules, manages allowance calculations, compiles audit-compliant bill sheets, handles leave requests, and integrates a secure communication channel for internal teams.

### Main Modules
1. **Duty Roster Management:** Assign, track, and monitor late-sitting, holiday, and night shift duties.
2. **Bill Memo Generator:** Dynamically compile conveyance and entertainment allowance bills based on actual shifts.
3. **Leave Processing Engine:** Generate casual, station, and special leaves with sandwich-rule calendar offsets.
4. **Executive Directory:** Manage AGM/DGM executive files, sorted by seniority and in-charge mapping.
5. **Secure Chat System:** Real-time communication channel using end-to-end server-side encryption.
6. **Trash & Recovery:** Audit-compliant soft-deletion bin for recovery of mistakenly deleted records.

---

## ⚙️ Technology Stack

* **Core Framework:** Next.js (App Router, Server Components)
* **Language:** TypeScript
* **Authentication:** Auth.js (NextAuth.js)
* **ORM:** Drizzle ORM
* **Database:** Supabase PostgreSQL
* **Realtime Synchronization:** Supabase Realtime
* **Styling & Layout:** Tailwind CSS 4.0, shadcn/ui
* **Caching & Session Storage:** Dragonfly / Redis
* **Icons:** Lucide React

---

## 💻 System Requirements

* **Node.js:** v18.0.0 or higher (LTS v20+ recommended)
* **npm:** v9.0.0 or higher
* **PostgreSQL:** v15+ (Neon Cloud / Supabase compatible)

---

## 🚀 Local Development Setup

Follow these steps to run the project locally on your machine:

### 1. Clone the Repository
```bash
git clone https://github.com/SyedArifulIslamEmon/Late-Sitting-Holiday-Night-Duty.git
cd Late-Sitting-Holiday-Night-Duty
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the template `.env.example` file and populate it with your local credentials:
```bash
cp .env.example .env
```
Update the `.env` file with your connection strings and API keys.

### 4. Database Setup
Synchronize your local schemas to the PostgreSQL instance:
```bash
npx drizzle-kit push
```

### 5. Seed Initial Data
Seed the database tables with default admin credentials, cells, employees, and holidays:
```bash
npm run db:seed
```

### 6. Start the Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`. Log in using:
* **Username:** `admin`
* **Password:** `123456`

---

## 🔑 Environment Variables

The portal uses the following environment variables (template configurations):

```env
# Connection details to PostgreSQL Database
DATABASE_URL="postgresql://username:password@hostname:5432/dbname?sslmode=require"

# Auth.js / NextAuth Session configurations
NEXTAUTH_SECRET="your-cryptographically-secure-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# Google Gemini API key for OCR parsing
GEMINI_API_KEY="your-google-gemini-api-key"

# Supabase public credentials for WebSocket Realtime features
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key"
```

---

## 🗄️ Database Setup & Migration Workflow

Drizzle ORM is used to map schema definitions. Manage changes with the following commands:

* **Push Schema Modifications:** Applies schema changes directly to the database without generating migration scripts. Ideal for rapid prototyping.
  ```bash
  npx drizzle-kit push
  ```
* **Generate SQL Migrations:** Generates SQL script files based on schema changes.
  ```bash
  npx drizzle-kit generate
  ```
* **Run SQL Migrations:** Executes all pending SQL migration files against the database.
  ```bash
  npx drizzle-kit migrate
  ```

---

## 🗂️ Existing Data Import & Recovery

The project includes scripts to safely dump and restore existing database records.

* **Database Backup (Dump):** Export database records to the `postgres_dump.json` file in the root folder:
  ```bash
  npm run db:dump
  ```
* **Database Restore (Seed):** Restore the contents from `postgres_dump.json` (performs cascading wipes, maps original primary key IDs, and resets serial sequences):
  ```bash
  npm run db:seed
  ```

---

## 🏗️ Production Build & Deployments

To package and serve the application in a production environment:

1. Compile the build:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm run start
   ```

---

## 🔄 Git Maintenance & Update Workflow

To update an active deployment safely:

```bash
# 1. Fetch latest changes
git pull origin main

# 2. Update node packages
npm install

# 3. Compile static optimizations
npm run build

# 4. Restart process manager (e.g. PM2)
pm2 restart lhn-portal
```

---

## 📁 Directory Structure

```text
Late-Sitting-Holiday-Night-Duty/
├── docs/                       # Comprehensive Architecture & Deployment Documentation
│   ├── ARCHITECTURE.md
│   └── DEPLOYMENT.md
├── public/                     # Static assets (Logos, Vector Icons, PDF Layout Fonts)
├── src/
│   ├── app/                    # Next.js App Router (Pages, Layouts, API Routes)
│   │   ├── api/                # Thin API Controllers
│   │   ├── billing/            # conveyance & entertainment allowance billing UI
│   │   ├── closing-bill/       # Half-yearly closing allowances UI
│   │   ├── documents/          # Memo and roster generation templates UI
│   │   ├── employees/          # Employee directory UI
│   │   ├── executive/          # Executive directory UI
│   │   ├── leave/              # Leave creation wizard UI
│   │   ├── roster/             # Duty rosters scheduling UI
│   │   ├── trash/              # Soft-deleted items recovery UI
│   │   └── users/              # Operator user directories UI
│   ├── components/             # Reusable UI Controls (shadcn primitives)
│   ├── db/                     # Drizzle config and schema declarations
│   ├── hooks/                  # Custom React hooks (realtime state, window sizing)
│   ├── lib/                    # Shared helper engines (audit logging, errors, AES encryption)
│   ├── permissions/            # RBAC role mapper (ADMIN, USER)
│   ├── repositories/           # Repository data access layers (Drizzle wrappers)
│   ├── services/               # Service layers (Business logic & calculations)
│   └── validations/            # Zod validation schemas
├── .env.example                # Template configuration file for development setups
├── drizzle.config.ts           # Drizzle compiler settings
├── next.config.ts              # Next.js build parameters
├── package.json                # Project dependencies
├── postgres_dump.json          # DB restore backup file (Git ignored)
└── tsconfig.json               # TypeScript compiler config
```

---

## 🔒 Security Notes

1. **Credentials Management:** Never check in `.env` files. Ensure `.gitignore` is updated to exclude `.env` files from commits.
2. **Secrets Protection:** Use cryptographically secure keys (at least 32 characters) for `NEXTAUTH_SECRET`.
3. **Database Security:** Enforce SSL connection modes (`?sslmode=require`) on all production PostgreSQL configurations.
4. **Data Backups:** Schedule CRON backups using `npm run db:dump` to save backups outside the application server environment.

---

## 🤝 Contributors

* **Syed Ariful Islam Emon** (https://github.com/SyedArifulIslamEmon)
* **Online Banking Department, Janata Bank PLC.**
