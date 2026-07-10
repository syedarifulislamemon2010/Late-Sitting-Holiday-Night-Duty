# Janata Bank Late-Sitting, Holiday, and Night Duty Portal (LHN Portal)

A production-ready administrative and financial utility management portal built specifically for the **Online Banking Department** of Janata Bank PLC. It automates late-sitting, holiday, and night duty assignments, computes conveyance and entertainment allowance bill ledgers, manages executive seniority directories, processes leave requests, and generates bank-compliant print layouts and PDFs.

---

## Key Features Implemented

### 1. Unified Dashboard & Analytics
* **Summary Metrics**: High-density stat cards displaying active duties, monthly costs, pending orders, and active staff counts.
* **Allowance Trends & Distribution**: Interactive charts (rendered client-side using Recharts) mapping duty category distribution and cell-wise cost breakdowns.
* **Interactive Duty Calendar**: Upgraded calendar to support intuitive single-date selection with an interactive popup modal (`DutySelectionModal`) providing contextual options: Late Sitting / Night Shift on working days, and Holiday Duty / Night Shift / Both on weekends/holidays, with immediate save/delete operations and conflict prevention.
* **My Portal**: Personalized dashboard for individual bank officers to view their personal scheduled duties, monthly allowance credits, and leave balances in a read-only secure view.
* **Premium Collapsible Sidebar**: Collapsible navigation menu upgraded to a premium design featuring sleek glassmorphism backdrop blur, vertical active-state glowing indicators, animated hover tooltips, dot markers, and a dedicated user account footer card displaying user name, role, and a logout shortcut.

### 2. Duty Roster Scheduler
* **Dual Scheduling Modes**:
  * **Employee-wise Mode**: Select an employee and schedule multiple dates.
  * **Date-wise Mode**: Select a date and batch-select employees.
* **Collision Check Engine**: Automatically blocks duplicate duties on the same date and rejects duties scheduled during approved leaves.
* **Bangla Calendar DatePicker**: Integrated custom calendar displaying weekends (Friday & Saturday) and holidays in red.

### 3. Billing Ledger & Office Orders
* **Programmatic Splitter**: Programmatically detects any single billing order exceeding the ৳7,500 audit threshold and splits it chronologically into separate compliant orders with staggered reference serials.
* **High-Density Document Formats**:
  * **A4 Office Orders**: Aligns with official template specs (logo left, department right, double blue header line, boxed metadata block, justified body paragraph, 5-column details table, and bottom-left signature).
  * **Legal Billing Memos**: Standardised right-aligned department header, subject title, justified body, summary totals row, bottom-right signature, and left-aligned routing copy list.
* **PDF Exporter**: Puppeteer-based server-side routes generating pixel-perfect PDFs from HTML templates matching front-end previews.

### 4. Leave & Requisition Management
* **Entitlement Tracker**: Enforces balancing limits across Casual (CL), Earned (Ordinary), and Special leaves. Defaults Earned leave balance to 120.
* **Sandwich Rule Deductions**: Automatically identifies and includes sandwiched weekends/holidays in casual leave balance deductions.
* **Covering Officer Delegation**: Form flow to select and assign active cell officers as covering delegates during leaves.
* **Printable Leave Requests**: Standardised high-density print format matching official bank letters.

### 5. Hardware Requisition & TAZ Committee Form
* **Repair Request Form**: Operational workflow for reporting and requesting repair assignments for damaged hardware tools.
* **TAZ Committee Form**: Fully compliant Data Extraction/Change/Update Request Form for T24 Live Area featuring dynamic implementer table grids (scaling based on team members count), working-day validation calendar, signing opinion sheets, and pixel-perfect A4 printing layout matching Janata Bank CDC guidelines.
* **Print-to-Paper Layout**: Instantly generates standardized paper-sized hardware requisitions and TAZ form templates.

### 6. Recycle Bin (Trash Directory)
* **Soft Deletions**: Enforces programmatic soft-deletes across all data models (Employees, Duties, Cells, Users).
* **Restoration Panels**: Dedicated admin-only recycling directories allowing instant, click-to-restore capabilities.

### 7. Security & Auditing Log
* **Mutable Action Tracking**: System logs capture all CRUD operations, including user identity, affected rows, cell scope, and timestamps.
* **Scope Enforcements**: User roles restrict operations strictly to their mapped division/cell boundaries.

---

## Tech Stack & Libraries

* **Core Framework**: Next.js 16.2.6 (App Router, Turbopack)
* **Runtime / Compiler**: React 19.2.4 & TypeScript 5
* **CSS & Styling**: Tailwind CSS v4 with unified HSL color scales and custom animations
* **Database & ORM**: Drizzle ORM v0.31 with Postgres Client (neon-compatible)
* **Charting**: Recharts v3.8.1
* **Test Suite**: Vitest v4.1.8

---

## Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@host:port/database"
NEXTAUTH_SECRET="your_nextauth_secret_token"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Initialize & Seed Database
Push schema schema structure and run seed migrations:
```bash
npm run db:push
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

### 5. Run Test Suites
```bash
npm run test
```
