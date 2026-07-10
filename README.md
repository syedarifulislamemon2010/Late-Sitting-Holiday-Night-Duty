# Janata Bank Late-Sitting, Holiday, and Night Duty Portal (LHN Portal)

A production-ready administrative and financial utility management portal built specifically for the **Online Banking Department** of Janata Bank PLC. It automates late-sitting, holiday, and night duty assignments, computes conveyance and entertainment allowance bill ledgers, manages executive seniority directories, processes leave requests, and generates bank-compliant print layouts and PDFs.

---

## 🏛️ System Architecture & Design Patterns

The portal is designed using a modern Next.js **App Router** architecture, delivering a highly decoupled, reactive data flow between client and server layers.

```mermaid
graph TD
    %% Styling
    classDef client fill:#1e1b4b,stroke:#4f46e5,stroke-width:2px,color:#fff;
    classDef server fill:#312e81,stroke:#6366f1,stroke-width:2px,color:#fff;
    classDef storage fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef box fill:#1e293b,stroke:#475569,stroke-width:1px,color:#cbd5e1;

    subgraph Client["Next.js Client Layer (React Application)"]
        UI["React & TailwindCSS UI Components"]:::client --> State["React Hooks (useState, useEffect, Web Clipboard)"]:::client
        State --> Proxy["Next.js HTTP Request Proxy / API Fetch Call"]:::client
    end

    subgraph Server["Next.js Application Server (App Router Routes)"]
        Proxy --> Router["App Router Engine & Middleware"]:::server
        Router --> Auth["Session Cookies Validator & AuthGuard"]:::server
        Auth --> Endpoints["API Route Handlers (/api/*)"]:::server
        Endpoints --> BusinessLogic["Business Logic Controllers"]:::server
        
        %% Mechanisms
        BusinessLogic --> LimitSplitter["7,500 Bill Splitter Engine"]:::server
        BusinessLogic --> CalendarEngine["Calendar Working Days Engine"]:::server
        BusinessLogic --> CryptoEngine["AES-256 Crypto Engine"]:::server
        BusinessLogic --> PrintStyles["US-Legal PDF Print Renderer"]:::server
        BusinessLogic --> ExtensionFix["Extension Hydration Prevention Engine"]:::server
    end

    subgraph Storage["Database & Persistence Layer"]
        BusinessLogic --> Drizzle["Drizzle ORM Client Wrapper"]:::server
        Drizzle --> NeonPostgreSQL["PostgreSQL Database"]:::storage
    end

    class Client,Server,Storage box;
```

### ⚙️ Technical Rationale & Technology Selection

| Category | Technology | Rationale & Alternatives Comparison |
| :--- | :--- | :--- |
| **Core Framework** | Next.js (App Router) | State-of-the-art React framework offering Server Components, server-side rendering, and API route endpoints. Consolidates API endpoints and presentation layers into a single compiled codebase. |
| **Language** | TypeScript | Ensures compile-time type safety, preventing common runtime bugs and offering autocomplete guides for developers. |
| **Authentication** | Auth.js (NextAuth.js) | Fully client-owned, self-hosted session validation. No user limit or hidden costs. Integrates cleanly with local database schemas. |
| **ORM Client** | Drizzle ORM | Ultra-lightweight and type-safe SQL mapper. Significantly faster than Prisma with zero cold-start latency. |
| **Styling** | Tailwind CSS 4.0 | Utility-first styling with high performance and zero CSS runtime compilation. |
| **UI Components** | Custom Tailwind CSS | Custom high-fidelity components built with Tailwind for maximum flexibility and styling consistency. |
| **Cryptography** | Web Cryptography API | Native Web and Node crypto libraries. Encrypts sensitive logs and data using AES-256-CBC without external package dependencies. |

---

## 🧠 Core Algorithmic Mechanisms

### 1. ৳7,500 Budget Limit Splitter
Internal audit rules mandate that any single office order/bill memo with an entertainment expenditure exceeding ৳7,500 requires additional administrative clearance.
* **Mechanism:**
  - When a user compiles duties for a month, the Roster engine aggregates the total bill amount.
  - If the limit is exceeded, the engine splits the assignments into contiguous, chronological chunks.
  - It sorts duties chronologically and groups them into separate orders, keeping each order under the ৳7,500 limit.
  - To prevent date conflicts (collision) during sequential order generation, the engine assigns staggered unique reference dates, ensuring audit compliance.

### 2. Calendar Working Days Generator & Override Mechanism
Conveyance and lunch allowances require calculating active working days per month. However, public holidays shift yearly, and weekends may occasionally be declared as active working days.
* **Mechanism:**
  - The system reads weekends dynamically (Friday/Saturday) based on a date range.
  - It intersects these days with override records stored in the `Holiday` table.
  - **Override Logic:** If a calendar weekend matches a database override flagged with `isWorkingDay = true`, it is treated as a normal working day. Conversely, if a calendar weekday matches a holiday override, it is excluded from working days.

### 3. Leave Application Engine & Sandwich Rule
Casual and station leave forms must calculate total leave days dynamically, accounting for the "sandwich rule" (where weekends sandwiched between leave days are deducted from the user's leave balance).
* **Mechanism:**
  - The engine determines the interval between start and end dates.
  - It checks if weekends immediately precede or succeed the requested dates. If consecutive leaves sandwich a weekend, those weekends are programmatically deducted from the user's remaining balance.

---

## 💾 Database Schema & Relationships

The database utilizes optimized foreign-key relationships to maintain high referential integrity.

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

### 📋 Data Dictionary

#### 1. Table: `cells` (Cell Registry)
| Column | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | serial | No | Primary key identifier for the cell |
| `name` | text | No | Name of the operational cell (Unique) |
| `description` | text | Yes | Description of cell's responsibilities |
| `createdAt` | timestamp | No | Creation timestamp (default now) |

#### 2. Table: `users` (System Operators)
| Column | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | serial | No | Primary key identifier for the user |
| `username` | text | No | Unique login bank ID code (Unique) |
| `password` | text | No | Bcrypt-hashed user password |
| `name` | text | No | User's full name |
| `role` | text | No | Role designation (`ADMIN` or `USER`) |
| `mobile` | text | Yes | Contact number |
| `cellDuties` | text | Yes | Context role (`PRIMARY`, `ADDITIONAL`, `INCHARGE`) |
| `createdAt` | timestamp | No | Creation timestamp (default now) |

#### 3. Table: `employees` (Employee Directory)
| Column | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | serial | No | Primary key identifier for the employee |
| `name` | text | No | Full name of the employee |
| `designation` | text | No | Official designation (e.g., SPO, PO, Officer) |
| `bankId` | text | No | Alphanumeric bank ID (Unique) |
| `fileNo` | text | No | Employee file reference number |
| `mobile` | text | Yes | Contact number |
| `cellId` | integer | No | Foreign key referencing `cells.id` |
| `createdAt` | timestamp | No | Creation timestamp (default now) |

#### 4. Table: `duties` (Duty Assignments)
| Column | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | serial | No | Primary key identifier for the duty log |
| `employeeId` | integer | No | Foreign key referencing `employees.id` (cascade delete) |
| `type` | text | No | Shift type (`LATE_SITTING`, `HOLIDAY`, `NIGHT_SHIFT`) |
| `date` | timestamp | No | Date of duty |
| `allowanceRate`| integer | No | Rate in BDT (300, 500, 1000) |
| `orderRef` | text | Yes | Foreign key referencing `officeOrders.orderRef` |
| `createdAt` | timestamp | No | Creation timestamp (default now) |

#### 5. Table: `officeOrders` (Generated Orders)
| Column | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | serial | No | Primary key identifier |
| `orderRef` | text | No | Dynamic alphanumeric reference string (Unique) |
| `orderDate` | timestamp | No | Order compilation date |
| `category` | text | No | Associated duty category |
| `fileNo` | text | No | Roster reference file number |
| `details` | text | Yes | Roster notes |
| `status` | text | No | Roster state (`Generated`, `Printed`, `Modified`) |
| `compiledPayload`| jsonb | No | Frozen payload of duties and calculated allowances |
| `createdAt` | timestamp | No | Creation timestamp (default now) |

#### 6. Table: `leaveApplications` (Leave Log)
| Column | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | serial | No | Primary key identifier |
| `applicantName`| text | No | Employee name |
| `designation` | text | No | Designation |
| `bankId` | text | No | Bank ID |
| `fileNo` | text | No | File number |
| `cellName` | text | No | Cell name |
| `leaveType` | text | No | Leave type (`CASUAL`, `STATION`, `SPECIAL`) |
| `startDate` | timestamp | No | Leave start date |
| `endDate` | timestamp | No | Leave end date |
| `selectedDistrict`| text | Yes | Destination district station |
| `delegateId` | text | Yes | Stand-in delegate employee ID |
| `createdAt` | timestamp | No | Submission timestamp (default now) |

#### 7. Table: `auditLogs` (Security Trail)
| Column | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | serial | No | Primary key identifier |
| `username` | text | No | Identity of acting operator |
| `action` | text | No | Action type (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `RESTORE`) |
| `entityType` | text | Yes | Target database table name |
| `entityId` | text | Yes | Target record ID |
| `ipAddress` | text | Yes | Client IP address |
| `userAgent` | text | Yes | Browser signature |
| `details` | text | No | Detailed description in Bengali |
| `createdAt` | timestamp | No | Audit timestamp (default now) |

---

## 🌐 API Contract Specifications (OpenAPI 3.0.0)

```yaml
openapi: 3.0.0
info:
  title: Late-Sitting, Holiday, and Night Duty (LHN) API
  version: 1.0.0
  description: API contract definitions for cell-based automation registries and billing workflows at Janata Bank PLC.
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
                username:
                  type: string
                password:
                  type: string
              required: [username, password]
      responses:
        '200':
          description: Signed JWT Session cookie returned
        '401':
          description: Invalid credentials
  /api/duties:
    post:
      summary: Register Duty Assignment
      security:
        - cookieAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                employeeId:
                  type: integer
                dates:
                  type: array
                  items:
                    type: string
                    format: date
                type:
                  type: string
                  enum: [LATE_SITTING, HOLIDAY, NIGHT_SHIFT]
      responses:
        '201':
          description: Duty records created successfully
        '409':
          description: Leave collision or duplicate duty scheduling
  /api/leaves:
    post:
      summary: Submit Leave Application
      security:
        - cookieAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                bankId:
                  type: string
                startDate:
                  type: string
                  format: date
                endDate:
                  type: string
                  format: date
                leaveType:
                  type: string
                  enum: [CASUAL, STATION, SPECIAL]
      responses:
        '201':
          description: Leave application accepted and sandwich rules applied
  /api/documents/generate-bill-memo:
    post:
      summary: Compile and Split Bill Memo
      security:
        - cookieAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                orderRef:
                  type: string
                category:
                  type: string
                dutyIds:
                  type: array
                  items:
                    type: integer
      responses:
        '200':
          description: PDF Compiled successfully
```

---

## 🛡️ Security Architecture & Threat Modeling

### OWASP Security Controls Mapping
* **SQL Injection:** Prevented by Drizzle ORM's parameterized query bindings.
* **XSS:** Mitigated by React's automatic string-escaping during DOM renders.
* **CSRF:** NextAuth secure JWT session validation restricts third-party cross-site invocations.
* **Session Hijacking:** Authorization cookies are flagged as `HttpOnly`, `Secure`, and `SameSite=Strict`.
* **Brute Force:** In-memory token-bucket middleware rate-limits API endpoints to 10 requests per minute per IP.
* **Privilege Escalation:** API gateways perform explicit session checks on user role scopes before routing requests.

### STRIDE Threat Analysis
* **Spoofing:** Enforces NextAuth.js JWT authentication. Cookies are signed, encrypted, and restricted to loop hosts.
* **Tampering:** Server-side rate validation routines read rates directly from secure database schemas (`LATE_SITTING` = 300, `HOLIDAY` = 500, `NIGHT_SHIFT` = 1000), ignoring client-side rate injections.
* **Repudiation:** Every action is recorded inside an immutable database-backed `AuditLog` table and written to a secure local `audit.log` file on disk.
* **Information Disclosure:** Row-level cell filtering inside Drizzle queries (e.g. `inArray(employees.cellId, userCellIds)`) filters all responses based on verified user session profiles.

---

## 🧪 Testing Strategy & Execution Guide

The portal incorporates multiple tiers of testing to validate codebase robustness:

### 1. Vitest Unit Tests
Validates core math, business logic, and date validation functions (leave sandwiching, budget splits, and allowance calculations) in isolation:
```bash
npx vitest run
```
*Continuous Watch Mode:*
```bash
npm run test:watch
```

### 2. Integration Tests
Verifies database query mappings, relational integrity, soft-deletion triggers, and mock service integrations under Vitest environment configurations:
```bash
npm run test:integration
```

### 3. API Contract Tests
Validates backend REST endpoint responses, status codes, response headers, role-based cell scope filters, and JSON payload structures:
```bash
npm run test:contract
```

### 4. TypeScript Type Check
Ensures compile-time type safety across all frontend and backend components:
```bash
npx tsc --noEmit
```

---

## 📋 User Manual & Operator Guide

### 1. Administrators Guide

#### A. Creating User Accounts
1. Sign in to the portal using an account mapped to the `ADMIN` role.
2. Go to the **Users** directory screen.
3. Click the **Add Operator** button.
4. Input the user's details: name (in Bengali), unique login username (e.g., Bank ID code `026795`), Bcrypt password, mobile number, and cell assignments role configuration (**PRIMARY / মূল দায়িত্ব**, **ADDITIONAL / অতিরিক্ত দায়িত্ব**, or **INCHARGE / ইনচার্জ**).
5. Map the user to their corresponding **Cell(s)**.
6. Click **Submit** to create the user account.

#### B. Recycle Bin Recovery (Trash)
1. Go to the **Trash** / **রিসাইকেল বিন** screen from the sidebar menu.
2. Click the **Restore** button next to any soft-deleted item.
3. The item is serialized back to its original table, and all child relations are restored.

### 2. Cell Operators Guide

#### A. Duty Roster Assignment
1. Open the **Roster** / **ডিউটি রোস্টার** page from the left sidebar.
2. Select the **Duty Category** dropdown (e.g., Late Sitting / লেট সিটিং).
3. Select the target **Employee(s)**.
4. Select the **Date Range** on the calendar picker.
5. Click **Submit**.
   - *Validation Engine:* The system automatically checks for overlapping duty assignments or approved leaves. If collisions are found, the request is rejected with a Bengali description of the conflict.

#### B. Generating Monthly Billing Memos
1. Go to the **Billing** / **বিল নথি** page.
2. Select the mapped operational cell and billing period.
3. Click the **Create Bill Memo** button.
4. The system aggregates all unbilled duties for that cell:
   - Calculates conveyance and entertainment allowances based on shift categories (৳300/day for Late Sitting, ৳500/day for Holiday, ৳1000/day for Night Shift).
   - Enforces the ৳7,500 billing split limits: any total exceeding ৳7,500 is programmatically partitioned into chronological, compliant sub-orders with staggered reference dates.
5. Review and click **Print/Download** to compile standard high-density Legal-size PDF billing sheets.

---

## 🟢 Development Setup

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
Push schema structure and run seed migrations:
```bash
npm run db:push
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## 📂 Production Deployment Guide (RHEL 8/9)

### 1. PostgreSQL Configuration
Enable the PostgreSQL 15 AppStream module and install the packages:
```bash
sudo dnf module enable postgresql:15 -y
sudo dnf install postgresql-server postgresql-contrib -y
sudo postgresql-setup --initdb
sudo systemctl enable postgresql --now
```
Update local connection authentication inside `/var/lib/pgsql/data/pg_hba.conf` from `ident`/`peer` to `scram-sha-256`, restart the service, and initialize the database instance.

### 2. PM2 Node.js Process Management
Deploy the Next.js production build using PM2 to keep the service running persistently:
```bash
sudo npm install -g pm2
pm2 start npm --name "lhn-portal" -- run start -- -p 3000
pm2 startup systemd
pm2 save
```

### 3. Nginx Reverse Proxy
Install Nginx and configure it to route public port 80 traffic to Next.js on port 3000:
```nginx
server {
    listen 80;
    server_name your_server_ip_or_domain;

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

### 4. Firewall & SELinux Adjustments
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload
sudo setsebool -P httpd_can_network_connect 1
```

---

## 🔄 Disaster Recovery (DR) & Backup Restoration

### Bare-Metal Database Restoration
In the event of database failure or migration to a fresh host machine, restore records using the latest `postgres_dump.json` file:

1. **Clear Existing Schemas:**
   ```bash
   psql -U postgres -d neondb -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
   ```
2. **Migrate Table Structures:**
   ```bash
   npx drizzle-kit push
   ```
3. **Seed Backups & Reset Sequences:**
   ```bash
   npm run db:seed
   ```
   *The database seed script detects `postgres_dump.json` in the root folder, restores all records with original primary keys, and correctly increments Postgres sequence indexes to prevent duplicate key crashes.*

---

## 📜 Compliance Mapping Matrix

| Standard / Guidelines | Control Reference | System Implementation |
| :--- | :--- | :--- |
| **Bangladesh Bank ICT Security Guidelines** | Chapter 4.2: User Authentication | Secured NextAuth Credentials login |
| **Bangladesh Bank ICT Security Guidelines** | Chapter 5.1: Database Audits | Immutable database-backed audit log indexed by username |
| **ISO 27001** | A.12.4.1: Event Logging | Event auditing logged in database and written to file |
| **ISO 27001** | A.10.1.1: Cryptography | Cryptographic hashes on user records and encrypted internal files |
| **NIST SP 800-53** | AC-3: Access Enforcement | Cell boundaries (RBAC) enforced on REST API and DB queries |
