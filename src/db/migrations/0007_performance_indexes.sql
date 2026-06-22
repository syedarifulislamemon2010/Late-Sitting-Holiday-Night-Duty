-- Duty roster queries (filter by employee + date range)
CREATE INDEX IF NOT EXISTS idx_duties_employee_date
  ON "Duty"("employeeId", "date" DESC);

-- Duty type tab filtering
CREATE INDEX IF NOT EXISTS idx_duties_type_date
  ON "Duty"("type", "date" DESC);

-- Leave overlap detection — runs on EVERY duty assignment
CREATE INDEX IF NOT EXISTS idx_leaves_bankid_dates
  ON "LeaveApplication"("bankId", "startDate", "endDate");

-- Audit log pagination (admin page, most recent first)
CREATE INDEX IF NOT EXISTS idx_audit_created_desc
  ON "AuditLog"("createdAt" DESC);

-- Employee RBAC cell filtering
CREATE INDEX IF NOT EXISTS idx_employees_cell
  ON "Employee"("cellId");

-- Office order reference lookups
CREATE INDEX IF NOT EXISTS idx_duties_orderref
  ON "Duty"("orderRef")
  WHERE "orderRef" IS NOT NULL;

-- Leave date range queries
CREATE INDEX IF NOT EXISTS idx_leaves_dates
  ON "LeaveApplication"("startDate", "endDate");
