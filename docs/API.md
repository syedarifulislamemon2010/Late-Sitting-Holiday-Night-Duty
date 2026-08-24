# Janata Bank PLC. IT Duty & Billing Portal — API Documentation

This document outlines the REST API routes available in the application, their input payload requirements (validated via Zod schemas in `src/validations/`), authentication constraints, and response structures.

---

## 1. Authentication & System

### `GET /api/ping`
- **Description:** Basic liveness check with `SELECT 1`.
- **Response:** `{ ok: true, timestamp: string }`

### `GET /api/health`
- **Description:** Structured health check endpoint with database latency check.
- **Response:** `{ status: "ok" | "degraded", db: boolean, timestamp: string, responseTimeMs: number, version: string }`

---

## 2. Employees (`/api/employees`)

### `GET /api/employees`
- **Auth:** Authenticated User
- **Response:** Array of `Employee` objects with cell relations.

### `POST /api/employees`
- **Auth:** Admin
- **Validation Schema:** `employeeSchema` (`src/validations/employee.ts`)
- **Body:**
  ```json
  {
    "name": "string (min 1)",
    "designation": "string (min 1)",
    "cellId": "number (positive)",
    "bankId": "string (optional)",
    "fileNo": "string (optional)",
    "phone": "string (optional)",
    "email": "string (email, optional)"
  }
  ```

### `PUT /api/employees/[id]`
- **Auth:** Admin
- **Validation Schema:** `employeeSchema.partial()`
- **Body:** Partial employee fields to update.

### `DELETE /api/employees/[id]`
- **Auth:** Admin
- **Description:** Soft-deletes employee (moves to trash).

---

## 3. Duties (`/api/duties`)

### `GET /api/duties`
- **Query Params:** `month` (1-12), `year`, `type` (`LATE_SITTING` | `HOLIDAY` | `NIGHT_SHIFT`), `cellId`
- **Response:** Array of assigned duties with employee and cell relations.

### `POST /api/duties`
- **Validation Schema:** `dutyBatchSchema` / `dutySchema` (`src/validations/duty.ts`)
- **Body:**
  ```json
  {
    "assignments": [
      {
        "employeeId": 12,
        "date": "2026-05-10",
        "type": "LATE_SITTING"
      }
    ],
    "dutiesToDelete": [105]
  }
  ```

### `DELETE /api/duties/[id]`
- **Response:** `{ success: true }`

---

## 4. Office Orders & Billing (`/api/office-orders`)

### `GET /api/office-orders`
- **Query Params:** `category`, `status` (`DRAFT` | `APPROVED` | `BILLED`)
- **Response:** Array of generated Office Orders with nested duties.

### `POST /api/office-orders`
- **Validation Schema:** `officeOrderSchema` (`src/validations/officeOrder.ts`)
- **Body:**
  ```json
  {
    "category": "LATE_SITTING",
    "orderDate": "2026-05-15",
    "orderRef": "026795/05/2026",
    "duties": [...]
  }
  ```

---

## 5. Leaves (`/api/leaves`)

### `GET /api/leaves`
- **Response:** Array of Leave Applications.

### `POST /api/leaves`
- **Validation Schema:** `leaveSchema` (`src/validations/leave.ts`)
- **Body:**
  ```json
  {
    "employeeId": 12,
    "leaveType": "CASUAL",
    "startDate": "2026-06-01",
    "endDate": "2026-06-03",
    "reason": "Personal necessity",
    "stayLocation": "Dhaka",
    "delegateEmployeeId": 15
  }
  ```

---

## 6. Executives (`/api/executives`)

### `GET /api/executives`
- **Response:** List of DGMs and AGMs.

### `POST /api/executives`
- **Validation Schema:** `executiveSchema` (`src/validations/executive.ts`)
- **Body:**
  ```json
  {
    "name": "string",
    "designation": "উপ-মহাব্যবস্থাপক" | "সহকারী মহাব্যবস্থাপক",
    "bankId": "string (optional)",
    "fileNo": "string (optional)"
  }
  ```
