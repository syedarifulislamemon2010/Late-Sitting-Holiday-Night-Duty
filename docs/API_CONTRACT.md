# API Specification & OpenAPI Contract

This document provides a detailed catalog of REST API endpoints, JSON request/response payloads, and the formal OpenAPI 3.0.0 specification for the LHN Portal.

---

## 1. Endpoint Matrix Table

| Method | Endpoint | Request Payload (JSON Sample / Query) | Expected Response & Status |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/[...nextauth]` | `{ "username": "026795", "password": "..." }` | `200 OK` + Signed Session Cookie |
| **GET** | `/api/cells` | *None* | `200 OK` + List of Cells |
| **POST** | `/api/employees` | `{ "name": "Riazul", "designation": "SPO", "cellId": 1 }` | `201 Created` + Created Employee Object |
| **GET** | `/api/duties` | `?cellId=1&month=5&year=2026` | `200 OK` + Array of duties for target cell |
| **POST** | `/api/leaves` | `{ "applicantName": "...", "startDate": "2026-06-01", "endDate": "2026-06-05", "leaveType": "CASUAL" }` | `201 Created` + Calculated Leave Details |
| **POST** | `/api/documents/generate-bill-memo` | `{ "billRef": "JB/OBD/2026/12", "employeeName": "Riazul" }` | `200 OK` + Generated PDF Stream / File Path |

---

## 2. API Payload Specifications

### Authentication: `POST /api/auth/[...nextauth]`
```json
{
  "username": "026795",
  "password": "db_secure_password_123"
}
```
*Expected Response (Status 200 OK):*
```json
{
  "user": {
    "id": 6,
    "name": "জনাব সৈয়দ আরিফুল ইসলাম ইমন",
    "username": "026795",
    "role": "ADMIN",
    "cells": [
      { "id": 7, "name": "CBS Integrated Development Cell" },
      { "id": 9, "name": "R09 Development & Customization Cell" }
    ]
  }
}
```

### Leave Application Submission: `POST /api/leaves`
```json
{
  "applicantName": "জনাব মোঃ রিয়াজুল হাসান",
  "designation": "Senior Principal Officer (SPO)",
  "bankId": "028144",
  "fileNo": "JB-9831",
  "cellName": "CBS Integrated Development Cell",
  "leaveType": "CASUAL",
  "startDate": "2026-06-10",
  "endDate": "2026-06-15",
  "selectedDistrict": "ঢাকা",
  "delegateId": "27"
}
```
*Expected Response (Status 201 Created):*
```json
{
  "success": true,
  "leaveId": 45,
  "calculatedDays": 6,
  "sandwichedWeekends": 2,
  "deductedFromBalance": 4
}
```

### Bill Memo Generation: `POST /api/documents/generate-bill-memo`
```json
{
  "orderRef": "JB/OBD/LHN/2026/415",
  "orderDate": "2026-06-16",
  "category": "BILL_LATE_SITTING",
  "employeeName": "জনাব মোঃ রিয়াজুল হাসান",
  "cellName": "CBS Integrated Development Cell",
  "content": {
    "backingOrderRef": "JB/OBD/LHN/2026/415"
  },
  "dutyIds": [102, 103, 104, 105],
  "duties": [
    {
      "employeeId": "028144",
      "employeeName": "জনাব মোঃ রিয়াজুল হাসান",
      "designation": "SPO",
      "days": 4,
      "apyaonRate": 100,
      "totalApyaon": 400,
      "totalTransport": 800,
      "grandTotal": 1200,
      "datesFormatted": "১০-০৬-২০২৬, ১১-০৬-২০২৬, ১২-০৬-২০২৬, ১৩-০৬-২০২৬"
    }
  ]
}
```
*Expected Response (Status 200 OK):*
```json
{
  "success": true,
  "documentId": 76,
  "filePath": "/uploads/documents/BILL_LATE_SITTING_415.pdf",
  "totalAmount": 1200
}
```

---

## 3. OpenAPI 3.0.0 Specification (YAML Contract)

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
