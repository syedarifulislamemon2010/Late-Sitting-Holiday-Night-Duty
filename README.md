<div align="center">

# 🏛️ জনতা ব্যাংক পিএলসি. (Janata Bank PLC)
### **লেট সিটিং, ছুটির দিনে ও রাত্রীকালীন ডিউটি ছুটির আবেদন পোর্টাল**
#### **Late-Sitting, Holiday, Night Duty & Leave Application Management System**

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18.6-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-1.0-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18?style=for-the-badge&logo=vitest)](https://vitest.dev/)

---

*An enterprise-grade administrative, financial utility, and duty management portal engineered exclusively for the **Online Banking Department** of **Janata Bank PLC**. It automates duty schedules, allowance ledger generation, leave management with sandwich rules, executive seniority hierarchy, **100% offline bundled PDF.js & native browser PDF preview**, **universal live on-screen document editing**, **system-wide editable DOCX exports**, **instant zero-latency dark/light theme switching**, **streamlined collapsible sidebar with floating tooltips**, **Ctrl+K Spotlight Search**, **PWA offline support**, **Bangla ⇄ English language toggle**, **zero-downtime bcrypt migration**, and **comprehensive 76-handler RBAC audit logging**.*

</div>

---

## 📌 Table of Contents

- [✨ Comprehensive Feature List](#-comprehensive-feature-list)
- [⚡ High-Performance Optimization Engine](#-high-performance-optimization-engine)
- [🏛️ System Architecture](#️-system-architecture)
- [⚙️ Tech Stack \& Technical Rationale](#️-tech-stack--technical-rationale)
- [🧠 Core Algorithmic Engines](#-core-algorithmic-engines)
- [📝 Universal Live Document Editor \& DOCX Export](#-universal-live-document-editor--docx-export)
- [📄 Document Archive & 100% Offline PDF Preview Engine](#-document-archive--100-offline-pdf-preview-engine)
- [🌓 Instant Zero-Latency Theme Engine](#-instant-zero-latency-theme-engine)
- [⚡ Single \& Bulk Duty Management with Conflict Resolution](#-single--bulk-duty-management-with-conflict-resolution)
- [🔍 Spotlight Command Palette (`Ctrl + K`)](#-spotlight-command-palette-ctrl--k)
- [📱 Progressive Web App (PWA) & Offline Support](#-progressive-web-app-pwa--offline-support)
- [🌐 Multi-Language (Bangla ⇄ English) \& Dual-Field Support](#-multi-language-bangla--english--dual-field-support)
- [💾 Database Schema \& Data Dictionary](#-database-schema--data-dictionary)
- [🌐 API Specifications \& RBAC Audit Matrix](#-api-specifications--rbac-audit-matrix)
- [📖 Operator \& User Manual](#-operator--user-manual)
- [🚀 Quick Start \& Development](#-quick-start--development)
- [📂 Production Deployment Guide (RHEL 8/9 + PM2 + Nginx)](#-production-deployment-guide-rhel-89--pm2--nginx)
- [🔄 Disaster Recovery (DR)](#-disaster-recovery-dr)
- [🛡️ Security \& Threat Modeling](#-security--threat-modeling)
- [🧪 Testing Strategy (444+ Test Cases)](#-testing-strategy-444-test-cases)
- [📜 Compliance Mapping Matrix](#-compliance-mapping-matrix)

---

## ✨ Comprehensive Feature List

- 📅 **Automated Duty Roster Management**: Schedule, track, and manage Late-Sitting (৳300/day), Holiday Duty (৳500/day), and Night Duty (৳1000/day) with instant allowance calculations.
- 🏛️ **Official Corporate Branding**: High-resolution Janata Bank PLC crest and bold corporate typography ("জনতা ব্যাংক পিএলসি. - লেট সিটিং, ছুটির দিনে ও রাত্রীকালীন ডিউটি ছুটির আবেদন পোর্টাল").
- 📄 **নথিপত্র ও অফিস আদেশ সংরক্ষণাগার (Document Archive & Safe Storage)**: Centralized repository for all office orders, bill memos, and manual uploads (vouchers, notes, sanction letters) with role-based access and ownership filtering.
- 🖨️ **100% Offline Intranet PDF & Native Viewer**: Bundled local `PDF.js` (`/vendor/pdfjs/`) eliminating external CDN dependencies, paired with an automatic native browser viewer fallback with dedicated Print and Download controls.
- 🌓 **Instant 0ms Theme Switching**: Powered by `next-themes` and a blocking inline `<head>` script that eliminates transition latency, allowing instant dark/light switching without flashing.
- 🧭 **Streamlined Collapsible Sidebar**: Single-list, decluttered navigation structure with smart viewport-aware floating tooltips in collapsed mode and role-based "সেলসমূহ" (`/cells`) navigation for Admins.
- ✉️ **ছুটির আবেদন (Leave Application Management)**: Automated leave generation conforming to bank date standards (`DD-MM-YYYY খ্রিঃ`, e.g. `২৮-১০-২০২৬ খ্রিঃ`), Sandwich Rule evaluation, delegate officer mapping, and printable bank letters.
- 📝 **Universal Live WYSIWYG Text Editor**: Click-and-type on-screen editing (`contentEditable`) of **ALL** generated documents (Leave, Roster, Billing, Lunch Bill, Hardware Requisition) directly in the browser preview.
- 📥 **Universal Microsoft Word (.docx) Export**: Programmatic export of all generated letters, forms, and statements into fully editable `.docx` files.
- 💰 **৳7,500 Budget Splitter Engine**: Automatically splits large allowance memos exceeding ৳7,500 into contiguous, audit-compliant sub-orders with non-colliding reference numbers.
- 👔 **কর্মকর্তা ও সেল ডিরেক্টরি (Employee & Cell Directory)**: Dynamic cell grouping, senior ranking hierarchy, executive panel with custom rank accents, inline quick-editing, and bulk operations.
- 📊 **সিস্টেম অ্যানালিটিক্স ড্যাশবোর্ড (System Analytics & Financial Auditing)**: Parallel Neon PostgreSQL query pipeline with SWR caching, synchronized billing ledger totals, cell budget breakdowns, and monthly performer metrics.
- 🔍 **Spotlight Command Palette (`Ctrl + K`)**: Global spotlight modal to locate any officer, bank ID, cell, or page in under 100 milliseconds.
- 📱 **Progressive Web App (PWA)**: Standalone desktop/mobile installation with offline service worker caching (`sw.js`).
- 🌐 **Bangla ⇄ English Dual-Language Engine**: Seamless transliteration with manual override fields (`nameEn`, `designationEn`) and a persistent **`BN | EN`** navbar toggle button.
- 🔒 **Zero-Downtime Bcrypt Password Hashing**: Dual-compatibility authentication engine that lazy-migrates legacy plaintext passwords to standard 60-character bcrypt salted hashes upon login.
- ⚠️ **Conflict Auto-Redirect & Overwrite Dialog**: Intelligent duplicate entry detection with 1-click options to overwrite or navigate directly to conflicting entries.
- 💻 **Hardware Requisition Portal**: Generate, track, and export hardware (UPS, Printer, Scanner, PC) requisitions for department officers.
- 📋 **TAZ Committee Form Engine**: Standardized bank committee resolution forms with real-time editing and printable formats.
- 🍱 **Lunch & Closing Allowance Billing**: Compute and format official lunch bills and monthly bill preparation statements.
- 🗑️ **Soft-Delete Recycle Bin & 30-Day Retention Alerts**: Restore accidentally deleted records without losing database integrity, complete with automated 30-day Admin warning notifications.
- 🛡️ **Exhaustive 76-Handler RBAC Audit Pipeline**: Comprehensive fail-open RBAC audit engine logging would-deny warnings across all routes while maintaining operational continuity.
- 🔔 **ইন-অ্যাপ নোটিফিকেশন সেন্টার (Notification Center)**: Real-time notification bell with unread pulse counters, category filters, and dropdown alerts.
- 💾 **ডাটাবেস ব্যাকআপ ও পুনরুদ্ধার (Database Backup & Restore)**: One-click JSON backup export and restore UI with transactional database rollbacks.

---

## ⚡ High-Performance Optimization Engine

### 1. Database Indexing (`pgTable` Composite Indexes)
Composite indexes in `src/db/schema.ts` reduce query times down to ~1ms:
```sql
CREATE INDEX idx_duties_emp_date ON "Duty" ("employeeId", "date");
CREATE INDEX Duty_orderRef_idx ON "Duty" ("orderRef");
CREATE INDEX LeaveApplication_bankId_idx ON "LeaveApplication" ("bankId");
```

### 2. In-Memory Reference Lookup & Dynamic Querying
- Database lookups in `src/repositories/holiday.repository.ts` utilize indexed date queries (`findByDate`, `findHolidaysByDates`) for minimal latency across holiday evaluations.

### 3. Dynamic Imports & Code Splitting (`next/dynamic`)
- Heavy client components like OCR roster parsing, PDF preview engines, and DOCX generators use `dynamic(() => import(...), { ssr: false })` to shrink initial JavaScript bundle sizes by over 50%.

### 4. Zero-Latency Theme Rendering
- Inline head script executes synchronously prior to first paint, reading `localStorage.getItem('theme')` to set the `dark` class instantly and eliminating theme flashing.

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
        Logic --> RbacAudit["Fail-Open RBAC Audit System"]:::server
        Logic --> RepoEngine["Repository Layer Query Engine"]:::server
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
| **Framework** | Next.js 16.4.3 (App Router) | High-performance React framework with hybrid SSR/SSG, standalone output, and API routing. |
| **UI Engine** | React 19.3 | State-of-the-art React UI library with optimized server actions and reactive hooks. |
| **Language** | TypeScript 6.0 | Strict compile-time type safety preventing runtime bugs across models and routes. |
| **Authentication** | Auth.js (NextAuth) + bcryptjs | Secure session validation with zero-downtime dual-compatible bcrypt password hashing. |
| **Database ORM** | Drizzle ORM 1.0 | Type-safe SQL query builder with zero cold-start latency and full PostgreSQL dialect support. |
| **Styling** | Tailwind CSS 4.3 | Modern utility-first styling with dark mode support and responsive design. |
| **Theme Engine** | next-themes | Instant zero-latency theme switching with synchronous `<head>` script injection. |
| **PDF Engine** | Bundled Local PDF.js 2.16 | Bundled locally in `public/vendor/pdfjs/` for 100% offline, air-gapped intranet readiness. |
| **DOCX Generator** | docx 9.x | Programmatic Microsoft Word (.docx) generation library for official bank letters and tables. |
| **Database** | PostgreSQL 18.6 | Enterprise relational database with strict constraints, relations, and indexed queries. |
| **Testing** | Vitest 4.1 | High-speed ESM-native test runner powering 444+ automated unit and integration tests. |

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
> * **Standard Formatting:** Leave letters format application dates using standard Bengali numerals and era notation: `DD-MM-YYYY খ্রিঃ` (e.g. `২৮-১০-২০২৬ খ্রিঃ`).

---

## 📝 Universal Live Document Editor & DOCX Export

> [!IMPORTANT]
> **Universal Document Customization**: The portal provides system-wide on-screen live text editing (`contentEditable`) and Microsoft Word (`.docx`) file exports across **ALL** document types.

### 1. In-App WYSIWYG Live Text Editor (All Modules)
- **Supported Documents**:
  - ✉️ Leave Applications (`/leave`)
  - 📜 Office Orders & Duty Allowance Bills (`/roster`)
  - 💻 Hardware Requisition Notes (`/hardware-requisition`)
  - 📋 TAZ Committee Forms (`/taz-committee-form`)
  - 🍱 Lunch Allowance Bill Sheets (`/lunch-bill`)
  - 📄 Bill Preparation & Closing Statements (`/closing-bill`)
- **Interactive Execution**: Clicking any line of text (Date, Recipient, Subject, Paragraphs, Tables, Signatures) inside the preview sheet enables instant editing directly in the browser.
- **Direct PDF Output**: Pressing **"ডাউনলোড পিডিএফ"** বা **"প্রিন্ট"** renders your modified text cleanly into the final PDF/Print output.

### 2. Microsoft Word (.docx) Document Generator (System-Wide)
- **Native Word Export**: Dedicated **"ডাউনলোড ওয়ার্ড (.docx)"** buttons are integrated into all modules.
- **Binary Generation**: Programmatically constructs `.docx` binary files with structured tables, headers, and footers ready for desktop editing in Microsoft Word.

---

## 📄 Document Archive & 100% Offline PDF Preview Engine

The **নথিপত্র ও অফিস আদেশ সংরক্ষণাগার** (`/documents`) serves as the central administrative repository for all generated and manual records:

1. **Air-Gapped Intranet PDF Rendering**:
   - `pdf.min.js` and `pdf.worker.min.js` are bundled locally in `public/vendor/pdfjs/`.
   - The application does not require any external internet connectivity (e.g. Cloudflare CDN) to render PDF previews.
2. **Dual-Layer Failover Architecture**:
   - The preview window fetches document binary data via base64 JSON endpoint (`/api/manual-documents/raw?id=...`).
   - If the endpoint encounters an error, the viewer automatically falls back to direct file streaming (`/uploads/manual/...`).
   - If canvas rendering is unsupported, the viewer seamlessly triggers the **Native Browser PDF Viewer** complete with top-bar **Print**, **Download**, and **Close** controls.
3. **Granular Ownership & Visibility Controls**:
   - Standard users can immediately view, preview, rename, and download documents they have uploaded (`doc.uploadedBy === user.username`).
   - Administrators can review all departmental documents and toggle public visibility (`isVisibleToUsers`) for organization-wide access.

---

## 🌓 Instant Zero-Latency Theme Engine

- **Eliminated Transition Delay**: Replaced legacy multi-second transition delays with an optimized `next-themes` implementation.
- **Synchronous `<head>` Script**: Evaluates system preferences and stored `localStorage` values prior to DOM rendering to avoid white flashes (FOUC).
- **Instant Response**: Clicking the theme switcher in the Navbar changes themes in 0 nanoseconds across all components, modals, and tables.

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

## 🌐 Multi-Language (Bangla ⇄ English) & Dual-Field Support

- **100% Full-Screen Dynamic Translation Engine (`LanguageProvider`)**: Clicking the **`BN | EN`** navbar toggle button instantly translates the entire application UI:
  - **Navigation & Sidebar**: Dashboard, Employees, Duty Roster, Bill Preparation, Lunch Bills, Closing Statements, Leave Applications, Hardware Requisitions, Cell Units, Audit Logs, and Recycle Bin.
  - **Duty Calendar & Date Digits**: Month titles (`August 2026` vs `আগস্ট ২০২৬`), weekdays (`Sunday` vs `রবিবার`), summary metrics, and calendar cell date digits (`1, 2, 3...` vs `১, ২, ৩...`).
  - **Employee Names & Designations**: Renders English spellings (`nameEn`, `designationEn`) in EN mode and Bangla in BN mode.
- **Dual-Field Support**: Officers' names and designations support both Bangla (`name`, `designation`) and English (`nameEn`, `designationEn`) fields.
- **Navbar Toggle Button**: Dedicated **`BN | EN`** button in the navbar allows 1-click language switching with persistent `localStorage` memory.

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

### 📋 Key Tables Overview

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
| `role` | `text` | ❌ No | Operator privilege (`ADMIN` / `USER` / `EMPLOYEE`) |
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

#### 5. Table: `manualDocuments` (Archived Documents)
| Column | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | `serial` | ❌ No | Primary key identifier |
| `name` | `varchar` | ❌ No | User-friendly document title |
| `filePath` | `text` | ❌ No | Storage path on disk |
| `fileSize` | `integer` | ❌ No | File size in bytes |
| `fileType` | `varchar` | ❌ No | File extension (`pdf`, `docx`, `png`, etc.) |
| `uploadedBy` | `varchar` | ❌ No | Username of uploader |
| `isVisibleToUsers` | `boolean` | ❌ No | Public visibility flag (Admin managed) |
| `uploadedAt` | `timestamp` | ❌ No | Timestamp of upload |

---

## 🌐 API Specifications & RBAC Audit Matrix

The portal implements 76+ App Router API handlers audited via `auditRbacRequest` (`src/lib/rbac-audit.ts` and `src/permissions/rbac.ts`). Documented in detail in [docs/rbac-observed-behavior.md](docs/rbac-observed-behavior.md).

```yaml
openapi: 3.0.0
info:
  title: Janata Bank LHN Portal API
  version: 2.0.0
paths:
  /api/auth/signin:
    post:
      summary: Operator Authentication & Bcrypt Lazy Migration
      responses:
        '200': { description: Session cookie established }
        '401': { description: Invalid bank ID or password }

  /api/duties:
    get:
      summary: Fetch Duty Records
    post:
      summary: Register Duty Assignments (With Conflict Resolution)
    put:
      summary: Update Duty Entry
    delete:
      summary: Soft Delete Duty Entry

  /api/manual-documents/raw:
    get:
      summary: Stream Raw Document Binary (Base64)
      parameters:
        - name: id
          in: query
          required: true
          schema: { type: integer }
      responses:
        '200': { description: Returns base64 payload }
        '403': { description: Forbidden if not owner or not visible }

  /api/leaves:
    get:
      summary: Fetch Leave Records
    post:
      summary: Process Leave Request with Sandwich Rule
```

---

## 📖 Operator & User Manual

### 1. Administrators
1. **User Management**: Navigate to **Users** -> **Add Operator**. Specify Bank ID, Role (`ADMIN`/`USER`/`EMPLOYEE`), and assigned operational Cell.
2. **Cell Management**: Navigate to **সেলসমূহ (`/cells`)** directly from the Sidebar (located above "কর্মকর্তাবৃন্দ") to configure cells and view officer counts.
3. **Document Archive Visibility**: In **নথিপত্র সংরক্ষণাগার (`/documents`)**, click the visibility pill to make uploaded circulars or orders accessible to all users.
4. **Recycle Bin**: Access **রিসাইকেল বিন (`/trash`)** to restore soft-deleted duty logs, employees, or office orders.

### 2. Cell Operators & Officers
1. **Duty Roster**: Select Cell, Category (Late Sitting / Holiday / Night Duty), Officers, and Dates. Multi-select checkboxes allow bulk deletion of obsolete logs.
2. **Leave Application**: Access **ছুটির আবেদন (`/leave`)**, choose leave type, specify dates, and select a covering officer. Dates automatically output as `DD-MM-YYYY খ্রিঃ`.
3. **Document Preview & Printing**: In **নথিপত্র সংরক্ষণাগার (`/documents`)**, click **"প্রিন্ট প্রিভিউ"** on any PDF or image to inspect and print via the local PDF.js or native browser viewer.

---

## 🚀 Quick Start & Development

### 1. Prerequisites
- Node.js (`>= 20.9.0` LTS required)
- PostgreSQL (v15+)

### 2. Setup
```bash
# Clone the repository
git clone https://github.com/syedarifulislamemon2010/Late-Sitting-Holiday-Night-Duty.git
cd Late-Sitting-Holiday-Night-Duty

# Install dependencies
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
# Push schema migrations
npx drizzle-kit push

# Seed initial development data (DEV ONLY)
npm run db:seed

# Start Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Production Deployment Guide (RHEL 8/9 + PM2 + Nginx)

Detailed runbook: [docs/runbooks/deploy.md](docs/runbooks/deploy.md).

### 1. Zero-Downtime Deployment Command
```bash
# Pull, install, build, and reload in one step:
git checkout package-lock.json && git pull origin main && npm run build && pm2 reload office-work
```

### 2. Production Verification Pipeline
```bash
# Verify TypeScript, Linting, 444+ Vitest tests, and Next.js Build:
npm run verify
```

### 3. Diagnostic Health Check
```bash
curl -I http://127.0.0.1:3000/api/health
```

---

## 🔄 Disaster Recovery (DR)

Disaster recovery drill runbook: [docs/runbooks/backup-restore-drill.md](docs/runbooks/backup-restore-drill.md).

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

- 🔒 **SQL Injection Defense**: Parameterized binding via Drizzle ORM.
- 🛡️ **Cross-Site Scripting (XSS)**: Automatic JSX escaping & DOMPurify sanitization.
- 🔑 **CSRF & Session Security**: HTTP-only, `SameSite=Strict` cookie policy with NextAuth.
- 🛡️ **Path Traversal Containment**: Strict boundary checks (`path.resolve` + `path.relative`) on `/api/manual-documents/raw` and `/uploads/[...path]`.
- 👁️ **Fail-Open RBAC Audit**: Real-time evaluation against 76 mapped actions logged without blocking valid operational workflows.
- 🔒 **Light-Mode Locked Login**: Corporate authentication screen styled to prevent unexpected dark mode color bleeds.

---

## 🧪 Testing Strategy (444+ Test Cases)

The application maintains 100% test pass rates across 32 test suites and 444+ test cases:

```bash
# Execute full Vitest suite
npx vitest run

# Execute strict TypeScript validation
npx tsc --noEmit --incremental false
```

---

## 📜 Compliance Mapping Matrix

| Regulatory Guideline | Control Scope | Implementation Mechanism |
| :--- | :--- | :--- |
| **Bangladesh Bank ICT Guidelines (Ch 4.2)** | User Authentication | Secured session authentication & salted bcrypt hashing |
| **Bangladesh Bank ICT Guidelines (Ch 5.1)** | Audit & Accountability | Database-backed audit trail for all CRUD actions |
| **ISO/IEC 27001 (A.12.4.1)** | System Event Logging | Centralized audit logging with IP & Browser tracing |
| **NIST SP 800-53 (AC-3)** | Access Control | Role-based & Cell-restricted access control with 76 mapped RBAC endpoints |

---

<div align="center">

Developed with ❤️ for **Janata Bank PLC — Online Banking Department**

</div>
