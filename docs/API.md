# Janata Bank PLC. IT Duty & Billing Portal — API Documentation

This document outlines all 24 REST API endpoint modules available in the application (48 route handlers total), verified against the filesystem under `src/app/api/`, their input payloads, role constraints, and authentication requirements.

---

## 1. Authentication & System Core

### `GET /api/ping`
- **Auth:** Public (Unauthenticated)
- **Rate Limit:** Exempt
- **Description:** Basic liveness check executing `SELECT 1`.
- **Response:** `{ ok: true, timestamp: string }`

### `GET /api/health`
- **Auth:** Public (Unauthenticated)
- **Rate Limit:** Standard Bucket (Capacity: 300, Refill: 20 tokens/sec)
- **Description:** Structured diagnostic health check endpoint with database latency check.
- **Response:** `{ status: "ok" | "degraded", db: boolean, timestamp: string, responseTimeMs: number, version: string }`

### `ALL /api/auth/[...nextauth]`
- **Auth:** Public (Credentials provider & session endpoints)
- **Rate Limit:** Exempt
- **Description:** NextAuth authentication handlers (`csrf`, `session`, `signin`, `signout`, `providers`).

### `GET /api/profile`
- **Auth:** Authenticated User
- **Rate Limit:** Exempt
- **Description:** Returns currently authenticated user's profile, assigned cells, and permissions.

---

## 2. Employees & Hierarchy (`/api/employees`)

### `GET /api/employees`
- **Auth:** Authenticated User
- **Response:** Array of `Employee` objects with attached cell relations.

### `POST /api/employees`
- **Auth:** Admin
- **Validation Schema:** `employeeSchema` (`src/validations/employee.ts`)
- **Body:** `{ name, designation, cellId, bankId?, fileNo?, mobile? }`

### `GET /api/employees/[id]` | `PUT /api/employees/[id]` | `DELETE /api/employees/[id]`
- **Auth:** Admin (Delete performs soft-delete to Trash)

### `POST /api/employees/parse-image`
- **Auth:** Authenticated User
- **Description:** AI-assisted employee data extraction from uploaded scans using Gemini API.

---

## 3. Cells & Sections (`/api/cells`)

### `GET /api/cells`
- **Auth:** Authenticated User
- **Response:** List of departmental cells (cell 9 designates central administration).

### `POST /api/cells` | `PUT /api/cells/[id]` | `DELETE /api/cells/[id]`
- **Auth:** Admin

---

## 4. Duties & Rosters (`/api/duties`)

### `GET /api/duties`
- **Auth:** Authenticated User (Cell-scoped: non-admin users only view duties for their assigned cells).
- **Query Params:** `month`, `year`, `type`, `cellId`, `employeeId`, `orderRef`

### `POST /api/duties`
- **Auth:** Authenticated User (Scoped by cell unless Admin).
- **Validation Schema:** `dutyBatchSchema` (`src/validations/duty.ts`)
- **Body:**
  ```json
  {
    "assignments": [
      {
        "employeeId": 12,
        "date": "2026-05-10",
        "type": "LATE_SITTING",
        "description": "CBS Batch Processing"
      }
    ],
    "orderRef": "জবা/আইটিডি/২০২৬/...",
    "dutiesToDelete": []
  }
  ```

### `DELETE /api/duties/[id]`
- **Auth:** Authenticated User (Cell-scoped, moves to trash).

### `POST /api/duties/check-conflicts`
- **Auth:** Authenticated User
- **Description:** Pre-validates assignments for duplicate duty, late-sitting on holidays, or leave clashes.

### `POST /api/duties/parse-roster-image`
- **Auth:** Authenticated User
- **Description:** Vision-based roster parser extracting duty entries from images.

---

## 5. Office Orders & Bill Memos (`/api/office-orders`)

### `GET /api/office-orders`
- **Auth:** Authenticated User
- **Query Params:** `page`, `limit`, `search`, `category`, `cellName`

### `POST /api/office-orders`
- **Auth:** Authenticated User
- **Validation Schema:** `officeOrderSchema`
- **Body:** `{ orderRef, orderDate, category, employeeName, cellName, dutiesJson, contentJson, status }`

### `GET /api/office-orders/[id]` | `PUT /api/office-orders/[id]` | `DELETE /api/office-orders/[id]`
- **Auth:** Authenticated User (Scoped)

### `GET /api/office-orders/next-ref`
- **Auth:** Authenticated User
- **Description:** Generates the sequential official reference number for the next order.

### `GET /api/office-orders/raw`
- **Auth:** Authenticated User
- **Description:** Returns server-rendered pure HTML document for office orders and bill memos.

---

## 6. Document Generation Engine (`/api/documents/*`)

### `POST /api/documents/generate-office-order`
- **Auth:** Authenticated User
- **Body:** `{ orderRef, orderDate, category, cellName, employeeName, duties: [...] }`
- **Output:** Canonical A4 HTML document string.

### `POST /api/documents/generate-bill-memo`
- **Auth:** Authenticated User
- **Body:** `{ orderRef, orderDate, memoDate, cellName, totalAmount, transportRate, apyaonRate, ... }`
- **Output:** Canonical US-Legal Bill Memo HTML document string.

### `POST /api/documents/generate-lunch-bill`
- **Auth:** Authenticated User
- **Body:** `{ month, cellId, workingDays, employees: [...] }`
- **Output:** Standard Lunch Bill Statement HTML.

### `POST /api/documents/generate-closing-bill`
- **Auth:** Authenticated User
- **Body:** Closing bill calculation payload.

### `POST /api/documents/generate-employee-list`
- **Auth:** Authenticated User
- **Body:** Filtered employee report generation payload.

---

## 7. Leave Management (`/api/leaves`)

### `GET /api/leaves` | `POST /api/leaves`
- **Auth:** Authenticated User (Tracks Casual, Ordinary, and Special leaves).

### `GET /api/leaves/balance`
- **Auth:** Authenticated User
- **Query Params:** `bankId`, `year`
- **Description:** Returns casual leave entitlements and days used with sandwich rule logic.

### `POST /api/leaves/log-resolve-failed`
- **Auth:** Authenticated User
- **Description:** Logs failed leave balance lookups for audit review.

### `GET /api/leaves/[id]` | `DELETE /api/leaves/[id]`
- **Auth:** Authenticated User

---

## 8. Lunch Bills (`/api/lunch-bills`)

### `GET /api/lunch-bills` | `POST /api/lunch-bills`
- **Auth:** Authenticated User

### `GET /api/lunch-bills/leave-days`
- **Auth:** Authenticated User
- **Description:** Computes leaves within the bill month to subtract from lunch entitlements.

---

## 9. Executive Hierarchy & TAZ Committee

### `GET /api/executives` | `POST /api/executives` | `PUT /api/executives/[id]` | `DELETE /api/executives/[id]`
- **Auth:** Admin / Authenticated User

### `GET /api/taz-committee-forms` | `POST /api/taz-committee-forms` | `PUT /api/taz-committee-forms/[id]`
- **Auth:** Authenticated User (Software deployment authorization forms).

### `GET /api/hardware-requisitions` | `POST /api/hardware-requisitions` | `PUT /api/hardware-requisitions/[id]`
- **Auth:** Authenticated User (Hardware repair/procurement requisitions).

---

## 10. Administrative Tools & Maintenance

### `GET /api/analytics`
- **Auth:** Authenticated User (Cell-scoped aggregates).

### `GET /api/audit`
- **Auth:** Admin (Security audit trail).

### `GET /api/search`
- **Auth:** Authenticated User (Spotlight Ctrl+K search index).

### `GET /api/notifications`
- **Auth:** Authenticated User (Unread badges, 30-day trash expiry warnings).

### `GET /api/trash` | `POST /api/trash`
- **Auth:** Admin (Soft-delete restore and permanent deletion).

### `GET /api/users` | `POST /api/users` | `PUT /api/users/[id]` | `DELETE /api/users/[id]`
- **Auth:** Admin

### `GET /api/backup` | `POST /api/backup`
- **Auth:** Admin

### `GET /api/backup/cron`
- **Auth:** Bearer Token (`CRON_SECRET`)
- **Description:** Automated 24h background backup trigger.
