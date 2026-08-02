<div align="center">

# 🏛️ Janata Bank LHN Portal
### **Late-Sitting, Holiday, and Night Duty Management System**

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.38-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18?style=for-the-badge&logo=vitest)](https://vitest.dev/)

---

*A production-ready administrative, financial utility, and roster management portal built exclusively for the **Online Banking Department** of Janata Bank PLC. It automates duty scheduling, allowance bill ledger generation, leave processing with sandwich rules, executive seniority tracking, and audit-compliant print layouts.*

</div>

---

## 📌 Table of Contents

- [✨ Key Features](#-key-features)
- [🏛️ System Architecture](#️-system-architecture)
- [⚙️ Tech Stack \& Technical Rationale](#️-tech-stack--technical-rationale)
- [🧠 Core Algorithmic Mechanisms](#-core-algorithmic-mechanisms)
- [💾 Database Schema \& Data Dictionary](#-database-schema--data-dictionary)
- [🌐 API Specifications](#-api-specifications)
- [🛡️ Security \& Threat Modeling](#️-security--threat-modeling)
- [🧪 Testing Strategy](#-testing-strategy)
- [📖 Operator \& User Manual](#-operator--user-manual)
- [🚀 Quick Start \& Development](#-quick-start--development)
- [📂 Production Deployment Guide](#-production-deployment-guide-rhel-89)
- [🔄 Disaster Recovery (DR)](#-disaster-recovery-dr)
- [📜 Compliance Mapping Matrix](#-compliance-mapping-matrix)

---

## ✨ Key Features

- 📅 **Automated Duty Roster Management**: Assign and track Late-Sitting (৳300/day), Holiday Duty (৳500/day), and Night Duty (৳1000/day).
- 💰 **৳7,500 Budget Splitter Engine**: Automatically partitions large duty memos exceeding ৳7,500 into contiguous, audit-compliant sub-orders with non-colliding reference dates.
- 📆 **Working Days \& Holiday Override**: Dynamic calculation of working days per month with custom calendar overrides for special workdays/holidays.
- ✉️ **Leave Application Generator**: Full leave request creation with dynamic Sandwich Rule calculations and printable bank-formatted leave letters.
- 👔 **Seniority \& Executive Directory**: Automatic employee hierarchy ranking and seniority calculation.
- 🖨️ **US-Legal Print \& PDF Rendering**: Bank-compliant print formats with pixel-perfect alignment for official records.
- 🗑️ **Soft-Delete Recycle Bin**: Restore accidentally deleted records without losing database integrity.
- 🛡️ **Role-Based Cell Security**: Enforces cell-level isolation and operator scope limits across all administrative endpoints.

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
        UI["React & Tailwind CSS UI Components"]:::client --> State["State & Context (ProfileContext, Hooks)"]:::client
        State --> Proxy["HTTP Request Proxy / API Fetch Call"]:::client
    end

    subgraph Server["Next.js Application Server (App Router)"]
        Proxy --> Router["App Router Middleware & Engine"]:::server
        Router --> Auth["Session Validator & AuthGuard"]:::server
        Auth --> Endpoints["API Routes (/api/*)"]:::server
        Endpoints --> Logic["Business Logic Controllers"]:::server
        
        Logic --> LimitSplitter["৳7,500 Bill Splitter Engine"]:::server
        Logic --> CalendarEngine["Calendar Working Days Engine"]:::server
        Logic --> CryptoEngine["AES-256 Crypto Engine"]:::server
        Logic --> PrintStyles["US-Legal PDF Print Renderer"]:::server
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
| **Framework** | Next.js 15 (App Router) | High-performance React framework with Server Components, hybrid SSR/SSG, and API route handling. |
| **Language** | TypeScript 5 | Strict compile-time type safety, preventing runtime exceptions and enhancing developer experience. |
| **Authentication** | Auth.js (NextAuth) | Custom self-hosted session validation, zero third-party dependencies, lightweight and secure. |
| **Database ORM** | Drizzle ORM | Type-safe SQL query builder with zero cold-start latency, superior execution speed over traditional ORMs. |
| **Styling** | Tailwind CSS 4 | Modern utility-first styling with zero runtime compilation overhead and responsive dark mode support. |
| **Database** | PostgreSQL 15 | Enterprise-grade relational database with strict constraint validation and index optimization. |
| **Testing** | Vitest | Lightning-fast ESM-native test runner for unit, integration, and service contract verification. |

---

## 🧠 Core Algorithmic Mechanisms

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
| `name` | `text` | ❌ No | Officer full name |
| `designation` | `text` | ❌ No | Official designation |
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
| `allowanceRate`| `integer` | ❌ No | BDT Rate (৳300, ৳500, ৳1000) |
| `orderRef` | `text` | ⚠️ Yes | Foreign key referencing `officeOrders.orderRef` |
| `createdAt` | `timestamp` | ❌ No | Creation timestamp |

#### 5. Table: `officeOrders` (Generated Bill Memos)
| Column | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | `serial` | ❌ No | Primary key identifier |
| `orderRef` | `text` | ❌ No | Unique memo reference code |
| `orderDate` | `timestamp` | ❌ No | Compilation date |
| `category` | `text` | ❌ No | Duty category string |
| `fileNo` | `text` | ❌ No | Department file reference |
| `status` | `text` | ❌ No | Order status (`Generated`, `Printed`, `Modified`) |
| `compiledPayload`| `jsonb` | ❌ No | Immutable snapshot of duties & rates |
| `createdAt` | `timestamp` | ❌ No | Creation timestamp |

#### 6. Table: `leaveApplications` (Leave Audit Trail)
| Column | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | `serial` | ❌ No | Primary key identifier |
| `applicantName`| `text` | ❌ No | Applicant full name |
| `designation` | `text` | ❌ No | Applicant designation |
| `bankId` | `text` | ❌ No | Applicant Bank ID |
| `leaveType` | `text` | ❌ No | Type (`CASUAL`, `STATION_LEAVE`, `POST_FACTO`) |
| `startDate` | `timestamp` | ❌ No | Leave start date |
| `endDate` | `timestamp` | ❌ No | Leave end date |
| `applicationDate`| `timestamp`| ❌ No | Application submission date |
| `createdAt` | `timestamp` | ❌ No | Submission timestamp |

#### 7. Table: `auditLogs` (Security Trail)
| Column | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | `serial` | ❌ No | Primary key identifier |
| `username` | `text` | ❌ No | Operator identity |
| `action` | `text` | ❌ No | Action (`CREATE`, `UPDATE`, `DELETE`, `RESTORE`) |
| `entityType` | `text` | ⚠️ Yes | Target entity table |
| `entityId` | `text` | ⚠️ Yes | Target record ID |
| `ipAddress` | `text` | ⚠️ Yes | Client IP address |
| `details` | `text` | ❌ No | Comprehensive Bengali audit summary |
| `createdAt` | `timestamp` | ❌ No | Audit timestamp |

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
      responses:
        '201': { description: Duties scheduled }
        '409': { description: Collision with existing duty or leave }

  /api/leaves:
    post:
      summary: Process Leave Request
      security: [{ cookieAuth: [] }]
      responses:
        '201': { description: Leave saved and sandwich rules applied }
```

---

## 🛡️ Security & Threat Modeling

### OWASP Security Controls
- 🔒 **SQL Injection Defense**: Handled automatically via Drizzle ORM parameterized binding.
- 🛡️ **Cross-Site Scripting (XSS)**: Prevented via React's string sanitization during rendering.
- 🔑 **CSRF & Session Security**: HTTP-only, `SameSite=Strict`, secure cookie policy.
- ⚡ **Rate Limiting**: IP-based token-bucket rate limiting on critical API endpoints.
- 👁️ **Access Control**: Role-based access control (RBAC) enforced on both API and UI level.

### STRIDE Assessment

| Threat Type | Mitigation Implementation |
| :--- | :--- |
| **Spoofing** | Strict JWT session validation with automatic timeout. |
| **Tampering** | Fixed server-side allowance calculation rates (৳300, ৳500, ৳1000). |
| **Repudiation** | Immutable dual-logging (PostgreSQL `auditLogs` + local file stream). |
| **Information Disclosure** | Cell-based row-level filtering applied to all queries. |

---

## 🧪 Testing Strategy

Run tests with Vitest to ensure system stability:

```bash
# Run unit & logic tests
npx vitest run

# Run in continuous watch mode
npm run test:watch

# Run integration tests
npm run test:integration

# Run TypeScript compile validation
npx tsc --noEmit
```

---

## 📖 Operator & User Manual

### 1. Administrators
1. **User Management**: Navigate to **Users** -> **Add Operator**. Specify Bank ID, Role (`ADMIN`/`USER`), and assigned operational Cell.
2. **Recycle Bin**: Access **Trash / রিসাইকেল বিন** to restore soft-deleted duty logs, employees, or office orders.

### 2. Cell Operators
1. **Duty Roster**: Select Cell, Choose Category (Late Sitting / Holiday / Night Duty), Pick Employees, and Select Dates.
2. **Bill Memos**: Go to **Billing**, choose month & cell, click **Create Bill Memo**. System auto-applies ৳7,500 split limits.
3. **Leave Applications**: Fill out leave requests with backdate support and auto-sandwich calculations.

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
# Push database schema & seed initial records
npm run db:push
npm run db:seed

# Start dev server
npm run dev
```
Access the application at `http://localhost:3000`.

---

## 📂 Production Deployment Guide (RHEL 8/9)

### 1. Install & Configure PostgreSQL
```bash
sudo dnf module enable postgresql:15 -y
sudo dnf install postgresql-server postgresql-contrib -y
sudo postgresql-setup --initdb
sudo systemctl enable postgresql --now
```

### 2. Node.js PM2 Process Setup
```bash
sudo npm install -g pm2
npm run build
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