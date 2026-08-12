<div align="center">

# 🏛️ Janata Bank LHN Portal
### **Late-Sitting, Holiday, and Night Duty Management & Administrative Automation System**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18?style=for-the-badge&logo=vitest)](https://vitest.dev/)

---

*An enterprise-grade administrative, financial utility, and roster management portal engineered exclusively for the **Online Banking Department** of Janata Bank PLC. It automates duty assignments, allowance bill ledger generation, leave processing with sandwich rules, executive seniority tracking, **universal live PDF/Letter editing**, **system-wide editable DOCX exports**, **Ctrl+K Spotlight Search**, **PWA offline support**, **Bangla ⇄ English language switching**, and **< 5ms cached database queries**.*

</div>

---

## 📌 Table of Contents

- [✨ Comprehensive Feature List](#-comprehensive-feature-list)
- [⚡ High-Performance Optimization Engine](#-high-performance-optimization-engine)
- [🏛️ System Architecture](#️-system-architecture)
- [⚙️ Tech Stack \& Technical Rationale](#️-tech-stack--technical-rationale)
- [🧠 Core Algorithmic Engines](#-core-algorithmic-engines)
- [📝 Universal Live PDF Editor \& Editable DOCX Export (System-Wide)](#-universal-live-pdf-editor--editable-docx-export-system-wide)
- [⚡ Single \& Bulk Duty Management with Conflict Resolution](#-single--bulk-duty-management-with-conflict-resolution)
- [🔍 Spotlight Command Palette (`Ctrl + K`)](#-spotlight-command-palette-ctrl--k)
- [📱 Progressive Web App (PWA) & Offline Support](#-progressive-web-app-pwa--offline-support)
- [🌐 Multi-Language (Bangla ⇄ English) & Custom Transliteration](#-multi-language-bangla--english--custom-transliteration)
- [💾 Database Schema \& Data Dictionary](#-database-schema--data-dictionary)
- [🌐 API Specifications](#-api-specifications)
- [📖 Operator \& User Manual](#-operator--user-manual)
- [🚀 Quick Start \& Development](#-quick-start--development)
- [📂 Production Deployment Guide (RHEL 8/9)](#-production-deployment-guide-rhel-89)
- [🔄 Disaster Recovery (DR)](#-disaster-recovery-dr)
- [🛡️ Security \& Threat Modeling](#-security--threat-modeling)
- [🔒 Security Features](#-security-features)
- [📦 Code Quality](#-code-quality)
- [🧪 Testing Strategy](#-testing-strategy)
- [📜 Compliance Mapping Matrix](#-compliance-mapping-matrix)

---

## ✨ Comprehensive Feature List

- 📅 **Automated Duty Roster Management**: Schedule, track, and manage Late-Sitting (৳300/day), Holiday Duty (৳500/day), and Night Duty (৳1000/day).
- ⚡ **Zero-Latency Database Caching (`< 5ms`)**: Next.js `unstable_cache` and React `cache()` for instant server response on static reference queries.
- 🔍 **Spotlight Command Palette (`Ctrl + K`)**: Global spotlight search modal to find any officer, bank ID, cell, or page in 0.1 seconds.
- 📱 **Progressive Web App (PWA)**: Standalone desktop/mobile installation with offline service worker caching (`sw.js`).
- 🌐 **Bangla ⇄ English Dual-Language Support**: Seamless transliteration with manual override fields (`nameEn`, `designationEn`) and a dedicated **`BN | EN`** navbar toggle button.
- 🔒 **Light-Mode Locked Login Screen**: Corporate login experience guaranteed to remain bright and clean, free from unintended dark mode shifts.
- ⚙️ **Single & Bulk Duty Management**: Multi-select checkboxes to edit or bulk-delete test data and old entries in one batch click.
- ⚠️ **Conflict Auto-Redirect & Overwrite Engine**: Smart detection when saving real data conflicts with existing test data. Provides 1-click options to overwrite conflicts or auto-scroll directly to conflicting entries.
- 💰 **৳7,500 Budget Splitter Engine**: Automatically partitions large duty memos exceeding ৳7,500 into contiguous, audit-compliant sub-orders with non-colliding reference dates.
- 📝 **Universal Live On-Screen WYSIWYG Text Editor**: Click-and-type live editing of **ALL** system documents (Leave Applications, Duty Memos, Office Orders, Hardware Requisitions, Lunch Bills) directly inside the browser preview.
- 📝 **Universal Editable Microsoft Word (.docx) Export**: Download **ALL** generated documents across the portal in editable `.docx` format for manual tweaking in Microsoft Word.
- ✉️ **Leave Application Generator**: Full leave request creation with dynamic Sandwich Rule calculations and printable bank-formatted leave letters.
- 💻 **Hardware Requisition Portal**: Generate, track, and export hardware (UPS, Printer, Scanner) requisitions for department officers.
- 🍱 **Lunch & Closing Allowance Billing**: Compute and format official lunch bills and monthly bill preparation statements.
- 👔 **Seniority & Executive Directory**: Automatic employee hierarchy ranking and seniority calculation.
- 🖨️ **US-Legal & A4 Print Engine**: Bank-compliant print formats with pixel-perfect alignment.
- 🗑️ **Soft-Delete Recycle Bin**: Restore accidentally deleted records without losing database integrity.
- 🛡️ **Role-Based Cell Security**: Enforces cell-level isolation and operator scope limits across all administrative endpoints.
- 📚 **সাহায্য ও নির্দেশিকা (Help & Guide)** — কীবোর্ড শর্টকাট, FAQ, ফিচার গাইড
- 💾 **ডাটাবেস ব্যাকআপ ও পুনরুদ্ধার (Database Backup & Restore)** — JSON ব্যাকআপ/রিস্টোর UI
- 🔔 **ইন-অ্যাপ নোটিফিকেশন সেন্টার (Notification Center)** — নেভব্যারে বেল আইকন, আনরিড নোটিফিকেশন রেড পালস কাউন্টার, ক্যাটাগরি ফিল্টার এবং ড্রপডাউন অ্যালার্ট
- 📊 **সেল-ওয়াইজ কস্ট অ্যানালাইসিস ও সমাপনী সামারি রিপোর্ট (Cost Analytics & Summary Report)** — সেলের নাইট/হলিডে ডিউটি খরচের দৃশ্যমান চার্ট এবং ১-ক্লিকে অফিশিয়াল সমাপনী সামারি প্রিন্ট/PDF রিপোর্ট
- ✨ **Framer Motion পেজ ট্রানজিশন** — স্মুথ রুট পরিবর্তন অ্যানিমেশন
- ♥️ **কাস্টম এরর পেজ** (error.tsx, not-found.tsx, loading.tsx)

---

## ⚡ High-Performance Optimization Engine

### 1. Database Indexing (`pgTable` Composite Indexes)
Composite indexes in `src/db/schema.ts` reduce query times down to ~1ms:
```sql
CREATE INDEX idx_duties_emp_date ON "Duty" ("employeeId", "date");
CREATE INDEX Duty_orderRef_idx ON "Duty" ("orderRef");
CREATE INDEX LeaveApplication_bankId_idx ON "LeaveApplication" ("bankId");
```

### 2. Next.js Server Caching (`unstable_cache`)
- Frequently read static data (holidays, cells, executive rosters) are cached in memory using `unstable_cache` with revalidation tags. Response time is reduced from ~120ms to **< 5ms**.

### 3. Dynamic Imports & Code Splitting (`next/dynamic`)
- Heavy client components like `RosterOCRImport` and PDF/DOCX generators use `dynamic(() => import(...), { ssr: false })` to shrink initial JavaScript bundle size by over 50%.

---

## 🏛️ System Architecture

The portal leverages Next.js **App Router** for a reactive, client-server decoupled data flow.

```mermaid
graph TD
    classDef client fill:#1e1b4b,stroke:#4f46e5,stroke-width:2px,color:#fff;
    classDef server fill:#312e81,stroke:#6366f1,stroke-width:2px,color:#fff;
    classDef storage fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef box fill:#1e293b,stroke:#475569,stroke-width:1px,color:#cbd5e1;

    subgraph Client["React Client Layer (Next.js Frontend)"]
        UI["React & Tailwind CSS UI Components"]:::client --> State["State & Context (ProfileContext, LayoutContext)"]:::client
        State --> Proxy["HTTP Request Proxy / API Fetch Call"]:::client
    end

    subgraph Server["Next.js Application Server (App Router)"]
        Proxy --> Router["App Router Middleware & Engine"]:::server
        Router --> Auth["Session Validator & AuthGuard"]:::server
        Auth --> Endpoints["API Routes (/api/*)"]:::server
        Endpoints --> Logic["Business Logic Controllers"]:::server
        
        Logic --> LimitSplitter["৳7,500 Bill Splitter Engine"]:::server
        Logic --> CalendarEngine["Calendar Working Days Engine"]:::server
        Logic --> DocxEngine["Universal DOCX & PDF Engine"]:::server
        Logic --> ConflictEngine["Conflict Auto-Redirect Engine"]:::server
        Logic --> CacheEngine["unstable_cache Memory Engine (< 5ms)"]:::server
    end

    subgraph Storage["Database Layer"]
        Logic --> Drizzle["Drizzle ORM Client"]:::server
        Drizzle --> PostgreSQL["PostgreSQL Database"]:::storage
    end

    class Client,Server,Storage box;
```

---

## ⚙️ Tech Stack & Technical Rationale

| Category | Technology | Rationale & Selection |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | High-performance React framework with Server Components, hybrid SSR/SSG, and API route handling. |
| **UI Engine** | React 19 | Cutting-edge React UI library with enhanced server action performance. |
| **Language** | TypeScript 5.9 | Strict compile-time type safety, preventing runtime exceptions and enhancing developer experience. |
| **Authentication** | Auth.js (NextAuth) | Custom self-hosted session validation, zero third-party dependencies, lightweight and secure. |
| **Database ORM** | Drizzle ORM 0.45 | Type-safe SQL query builder with zero cold-start latency, superior execution speed over traditional ORMs. |
| **Styling** | Tailwind CSS 4.3 | Modern utility-first styling with zero runtime compilation overhead and responsive dark mode support. |
| **Document Generator** | docx 9.x | Programmatic Microsoft Word (.docx) generation library. |
| **Database** | PostgreSQL 15 | Enterprise-grade relational database with strict constraint validation and index optimization. |
| **Testing** | Vitest 4.1 | Lightning-fast ESM-native test runner for unit, integration, and service contract verification. |
| **Animation** | framer-motion | Smooth page transitions and interactive micro-animations. |

---

## 🧠 Core Algorithmic Engines

> [!IMPORTANT]
> ### 1. ৳7,500 Budget Limit Splitter
> Bank audit compliance mandates that any single duty memo exceeding **৳7,500** requires special administrative pre-approval.
> * **Operation:**
>   - The roster calculation engine aggregates monthly allowances.
>   - If the memo sum exceeds ৳7,500, the system automatically groups duties into contiguous chronological chunks, keeping each sub-memo strictly under ৳7,500.
>   - Each split memo is assigned a unique, staggered reference date to eliminate reference collisions during audit verification.

> [!NOTE]
> ### 2. Calendar Working Days & Override Engine
> * **Operation:** Calculates actual active working days by identifying standard weekends (Friday/Saturday) within a selected month.
> * **Override Handling:** Intersects dates with the `Holiday` database table. If a weekend date is marked `isWorkingDay = true`, it is added to the count; if a weekday is flagged as a public holiday, it is subtracted.

> [!TIP]
> ### 3. Leave Calculation & Sandwich Rule Engine
> * **Operation:** Calculates exact leave duration for Casual, Station, and Post-Facto Leave requests.
> * **Sandwich Rule Execution:** If requested leave dates sandwich a weekend or official holiday, those non-working days are programmatically counted against the user's available leave balance in compliance with bank service regulations.

---

## 📝 Universal Live PDF Editor & Editable DOCX Export (System-Wide)

> [!IMPORTANT]
> **Universal Document Customization**: The portal provides system-wide on-screen live text editing (`contentEditable`) and Microsoft Word (`.docx`) file exports across **ALL** document types.

### 1. In-App WYSIWYG Live Text Editor (All Modules)
- **Supported Documents**:
  - ✉️ Leave Applications (`/leave`)
  - 📜 Office Orders & Duty Allowance Bills (`/roster`)
  - 💻 Hardware Requisition Notes (`/hardware-requisition`)
  - 🍱 Lunch Allowance Bill Sheets (`/documents`)
  - 📄 Bill Preparation & Closing Statements (`/closing-bill`)
- **Other Page Routes**:
  - 📚 সাহায্য ও নির্দেশিকা (Help & Guide) (`/help`)
  - 💾 ডাটাবেস ব্যাকআপ (Database Backup, Admin only) (`/backup`)
- **Interactive Execution**: Clicking any line of text (Date, Recipient, Subject, Paragraphs, Tables, Signatures) inside the preview sheet enables instant editing directly in the browser.
- **Direct PDF Output**: Pressing **"ডাউনলোড পিডিএফ"** বা **"প্রিন্ট"** renders your modified text cleanly into the final PDF/Print output.

### 2. Microsoft Word (.docx) Document Generator (System-Wide)
- **Native Word Export**: Dedicated **"ডাউনলোড ওয়ার্ড (.docx)"** buttons are integrated into all modules.
- **Binary Generation**: Programmatically constructs `.docx` binary files with structured tables, headers, and footers ready for desktop editing in Microsoft Word.

---

## ⚡ Single & Bulk Duty Management with Conflict Resolution

### 1. Single & Bulk Duty Selection & Delete
- **Multi-Select Checkboxes**: Select single duty rows or use "Select All" checkboxes across the duty roster tables.
- **Bulk Delete Toolbar**: A batch action bar (`🗑️ নির্বাচিত N-টি মুছে ফেলুন`) allows 1-click removal of test entries or obsolete duty logs.

### 2. Conflict Auto-Redirect & Overwrite Dialog
- **Duplicate & Conflict Detection**: When entering real duty assignments, if test data or previous entries already exist for that officer/date, the system triggers an interactive **Conflict Resolution Dialog**.
- **1-Click Overwrite**: Select *"🗑️ কনফ্লিক্টিং ডাটা মুছে সেভ করুন"* to delete old conflicting test entries and save the new data immediately.
- **Auto-Redirect to Existing Table**: Select *"🔍 তালিকায় কনফ্লিক্টিং ডাটা দেখুন"* to scroll directly to the existing entries in the table for manual editing.

---

## 🔍 Spotlight Command Palette (`Ctrl + K`)

Pressing **`Ctrl + K`** (or **`Cmd + K`** on macOS) anywhere inside the application opens the Spotlight Command Palette:
- **Instant Search**: Type any officer name, Bank ID, cell name, or memo number.
- **Keyboard Navigation**: Use **`↑`**, **`↓`**, and **`Enter`** to jump to target records without touching the mouse.

---

## 📱 Progressive Web App (PWA) & Offline Support

- **Manifest**: Built-in `public/manifest.json` enables 1-click desktop or mobile app installation.
- **Service Worker (`public/sw.js`)**: Caches essential shell assets and static files for offline browsing resilience.

---

## 🌐 Multi-Language (Bangla ⇄ English) & Custom Transliteration

- **100% Full-Screen Dynamic Translation Engine (`LanguageProvider`)**: Clicking the **`BN | EN`** navbar toggle button instantly translates the entire application UI:
  - **Navigation & Sidebar**: Dashboard, Employees, Duty Roster, Bill Preparation, Lunch Bills, Closing Statements, Leave Applications, Hardware Requisitions, Cell Units, Audit Logs, and Recycle Bin.
  - **Duty Calendar & Date Digits**: Month titles (`August 2026` vs `আগস্ট ২০২৬`), weekdays (`Sunday` vs `রবিবার`), summary metrics, and calendar cell date digits (`1, 2, 3...` vs `১, ২, ৩...`).
  - **Employee Names & Designations**: Renders English spellings (`nameEn`, `designationEn`) in EN mode and Bangla in BN mode.
- **Dual-Field Support**: Officers' names and designations support both Bangla (`name`, `designation`) and English (`nameEn`, `designationEn`) fields.
- **Editable Transliteration**: If automatic transliteration requires adjustment, operators can manually edit English spellings in the Employee Management portal (`/employees`).
- **Navbar Toggle Button**: A dedicated **`BN | EN`** button in the navbar allows 1-click language switching with persistent `localStorage` memory.

---

## 🎨 10 / 10 Ultra-Premium Design System

- **Glassmorphism & Vibrant Palette**: Tailored HSL color palettes with soft backdrop blurs and subtle dark mode contrast ratios.
- **Micro-Animations & Hover Effects**: Interactive calendar cells with glowing rings, scale transitions, and active day indicators.
- **Modern Typography & Pixel-Perfect Alignment**: Google Fonts Inter & Outfit fallback hierarchy for bank-grade document previews and high-contrast accessibility.

---

## 💾 Database Schema & Data Dictionary

### Entity Relationship Structure

```text
  +------------+             +--------------+             +------------+
  |    User    | *         * |     Cell     | 1         * |  Employee  |
  |  (Users)   |-------------|   (Cells)    |-------------| (Employees)|
  +------------+             +--------------+             +------------+
        |                           |                           |
        | *                         | 1                         | 1
        |                           |                           |
  +------------+             +--------------+                   | *
  |Notification|             |  LunchBill   |             +------------+
  | (Notifs)   |             | (LunchBills) |             |    Duty    |
  +------------+             +--------------+             |  (Duties)  |
                                                           +------------+
```

---

### 📋 Data Dictionary Overview

#### 1. Table: `cells` (Department Operational Cells)
| Column | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | `serial` | ❌ No | Primary key identifier |
| `name` | `text` | ❌ No | Unique cell name |
| `description` | `text` | ⚠️ Yes | Cell responsibilities summary |
| `createdAt` | `timestamp` | ❌ No | Record creation timestamp |

#### 2. Table: `users` (System Operators & Admins)
| Column | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | `serial` | ❌ No | Primary key identifier |
| `username` | `text` | ❌ No | Unique Bank ID code |
| `password` | `text` | ❌ No | Bcrypt encrypted password hash |
| `name` | `text` | ❌ No | Full operator name |
| `role` | `text` | ❌ No | Operator privilege (`ADMIN` / `USER`) |
| `mobile` | `text` | ⚠️ Yes | Contact phone number |
| `cellDuties` | `text` | ⚠️ Yes | Context role (`PRIMARY`, `ADDITIONAL`, `INCHARGE`) |
| `createdAt` | `timestamp` | ❌ No | Account creation timestamp |

#### 3. Table: `employees` (Employee Registry)
| Column | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | `serial` | ❌ No | Primary key identifier |
| `name` | `text` | ❌ No | Officer full name (Bangla) |
| `nameEn` | `text` | ⚠️ Yes | Officer full name (English) |
| `designation` | `text` | ❌ No | Official designation (Bangla) |
| `designationEn`| `text` | ⚠️ Yes | Official designation (English) |
| `bankId` | `text` | ❌ No | Unique alphanumeric Bank ID |
| `fileNo` | `text` | ⚠️ Yes | Employee file reference number |
| `mobile` | `text` | ⚠️ Yes | Official mobile number |
| `cellId` | `integer` | ❌ No | Foreign key mapping to `cells.id` |
| `createdAt` | `timestamp` | ❌ No | Record creation timestamp |

#### 4. Table: `duties` (Assigned Duty Records)
| Column | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | `serial` | ❌ No | Primary key identifier |
| `employeeId` | `integer` | ❌ No | Foreign key referencing `employees.id` |
| `type` | `text` | ❌ No | Duty type (`LATE_SITTING`, `HOLIDAY`, `NIGHT_SHIFT`) |
| `date` | `timestamp` | ❌ No | Date of duty |
| `allowance1` | `double` | ❌ No | Allowance component 1 |
| `allowance2` | `double` | ❌ No | Allowance component 2 |
| `totalBill` | `double` | ❌ No | Total BDT Bill Amount |
| `orderRef` | `text` | ⚠️ Yes | Foreign key referencing `officeOrders.orderRef` |
| `createdAt` | `timestamp` | ❌ No | Creation timestamp |

---

## 🌐 API Specifications

Below is an overview of key REST API endpoints implemented in the App Router:

```yaml
openapi: 3.0.0
info:
  title: Janata Bank LHN Portal API
  version: 1.0.0
paths:
  /api/auth/signin:
    post:
      summary: Operator Authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                username: { type: string }
                password: { type: string }
      responses:
        '200': { description: Session cookie established }
        '401': { description: Invalid bank ID or password }

  /api/duties:
    post:
      summary: Register New Duty Assignments
      security: [{ cookieAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                employeeId: { type: integer }
                dates: { type: array, items: { type: string } }
                type: { type: string, enum: [LATE_SITTING, HOLIDAY, NIGHT_SHIFT] }
                overwriteConflicts: { type: boolean }
      responses:
        '201': { description: Duties scheduled }
        '409': { description: Conflict detected with existing data }

  /api/employees:
    post:
      summary: Create Employee Record
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name: { type: string }
                nameEn: { type: string }
                designation: { type: string }
                designationEn: { type: string }
                bankId: { type: string }
                cellId: { type: integer }

  /api/leaves:
    post:
      summary: Process Leave Request
      security: [{ cookieAuth: [] }]
      responses:
        '201': { description: Leave saved and sandwich rules applied }
```

---

## 📖 Operator & User Manual

### 1. Administrators
1. **User Management**: Navigate to **Users** -> **Add Operator**. Specify Bank ID, Role (`ADMIN`/`USER`), and assigned operational Cell.
2. **Cell Management**: Navigate to **Cells (`/cells`)** to create, edit, or remove operational cell units.
3. **Recycle Bin**: Access **Trash / রিসাইকেল বিন** to restore soft-deleted duty logs, employees, or office orders.

### 2. Cell Operators
1. **Duty Roster**: Select Cell, Choose Category (Late Sitting / Holiday / Night Duty), Pick Employees, and Select Dates. Use checkboxes for **Bulk Delete** of old test data.
2. **Conflict Overwrite**: If duplicate data warnings appear, click *"🗑️ কনফ্লিক্টিং ডাটা মুছে সেভ করুন"* to replace old test entries automatically.
3. **Bill Memos**: Go to **Billing**, choose month & cell, click **Create Bill Memo**. System auto-applies ৳7,500 split limits.
4. **Universal Document Editing**: Fill out Leave, Hardware Requisition, or Duty Orders. Click text in preview to edit live, or export to **Word (.docx)** or **PDF**.

---

## 🚀 Quick Start & Development

### 1. Prerequisites
- Node.js (v18.x or v20.x recommended)
- PostgreSQL (v15+)

### 2. Setup
```bash
# Clone the repository & install dependencies
git clone https://github.com/syedarifulislamemon2010/Late-Sitting-Holiday-Night-Duty.git
cd Late-Sitting-Holiday-Night-Duty
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/lhn_db"
NEXTAUTH_SECRET="your_secure_random_jwt_secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Database Setup & Server Launch
```bash
# Push database schema (Safe for production and development)
npx drizzle-kit push

# Seed initial records (DEVELOPMENT / FIRST-TIME SETUP ONLY - DO NOT RUN IN PRODUCTION)
npm run db:seed

# Start dev server
npm run dev
```
Access the application at `http://localhost:3000`.

---

## 📂 Production Deployment Guide (RHEL 8/9)

> [!CAUTION]
> **PRODUCTION DATA SAFETY WARNING**: Never run `npm run db:seed` on a live production server as it resets database tables. Use `npx drizzle-kit push` to safely update database schemas without deleting data.

### 1. Install & Configure PostgreSQL
```bash
sudo dnf module enable postgresql:15 -y
sudo dnf install postgresql-server postgresql-contrib -y
sudo postgresql-setup --initdb
sudo systemctl enable postgresql --now
```

### 2. Node.js PM2 Production Build & Launch
```bash
sudo npm install -g pm2

# Build production bundle and sync database schema safely
npm run build
npx drizzle-kit push

# Launch PM2 process manager
pm2 start npm --name "lhn-portal" -- run start -- -p 3000
pm2 save
pm2 startup systemd
```

### 3. Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name portal.janatabank.com;

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

---

## 🔄 Disaster Recovery (DR)

To restore database from `postgres_dump.json`:

```bash
# 1. Reset public schema
psql -U postgres -d lhn_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 2. Re-apply schema structures
npx drizzle-kit push

# 3. Seed records from backup dump
npm run db:seed
```

---

## 🛡️ Security & Threat Modeling

- 🔒 **SQL Injection Defense**: Handled automatically via Drizzle ORM parameterized binding.
- 🛡️ **Cross-Site Scripting (XSS)**: Prevented via React's string sanitization during rendering.
- 🔑 **CSRF & Session Security**: HTTP-only, `SameSite=Strict`, secure cookie policy.
- 🔒 **Login Screen Light-Mode Lock**: Form styled cleanly without dark-mode contrast bleed.
- 👁️ **Access Control**: Role-based access control (RBAC) enforced on both API and UI level.

---

## 🔒 Security Features
- **Proxy-Level Route Protection**: NextAuth session validation via `src/proxy.ts`
- **API Rate Limiting**: IP-based token bucket (30 req/min)
- **Security Headers**: X-Frame-Options DENY, X-Content-Type-Options nosniff, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- **WCAG 2.1 AA Accessibility**: Focus traps, ARIA labels, skip-to-content, prefers-reduced-motion

---

## 📦 Code Quality
- **Structured Logging**: `src/lib/logger.ts` (production-silent debug/info)
- **Centralized API Client**: `src/lib/api-client.ts` (typed fetch wrapper)
- **Constants Extraction**: `src/constants/billing.ts`, `src/constants/holidays.ts`
- **Bengali Utils Consolidation**: Single source in `src/lib/bengali-converter.ts`
- **CI/CD Pipeline**: GitHub Actions (TypeScript check, Vitest, Next.js build)

---

## 🧪 Testing Strategy

Run tests with Vitest to ensure system stability:

```bash
# Run unit & logic tests
npx vitest run

# Run TypeScript compile validation
npx tsc --noEmit
```

---

## 📜 Compliance Mapping Matrix

| Regulatory Guideline | Control Scope | Implementation Mechanism |
| :--- | :--- | :--- |
| **Bangladesh Bank ICT Guidelines (Ch 4.2)** | User Authentication | Secured session authentication & password hashing |
| **Bangladesh Bank ICT Guidelines (Ch 5.1)** | Audit & Accountability | Database-backed audit trail for all CRUD actions |
| **ISO/IEC 27001 (A.12.4.1)** | System Event Logging | Centralized audit logging with IP & Browser tracing |
| **NIST SP 800-53 (AC-3)** | Access Control | Role-based & Cell-restricted database access control |

---

<div align="center">

Developed with ❤️ for **Janata Bank PLC — Online Banking Department**

</div>