CREATE TABLE "AuditLog" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"action" text NOT NULL,
	"entityType" text,
	"entityId" text,
	"ipAddress" text,
	"userAgent" text,
	"details" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "AuditLog_username_idx" ON "AuditLog" USING btree ("username");--> statement-breakpoint
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "Duty_employeeId_idx" ON "Duty" USING btree ("employeeId");--> statement-breakpoint
CREATE INDEX "Duty_date_idx" ON "Duty" USING btree ("date");--> statement-breakpoint
CREATE INDEX "Duty_type_idx" ON "Duty" USING btree ("type");--> statement-breakpoint
CREATE INDEX "Employee_cellId_idx" ON "Employee" USING btree ("cellId");--> statement-breakpoint
CREATE INDEX "Employee_bankId_idx" ON "Employee" USING btree ("bankId");--> statement-breakpoint
CREATE INDEX "LeaveApplication_startDate_idx" ON "LeaveApplication" USING btree ("startDate");--> statement-breakpoint
CREATE INDEX "LeaveApplication_endDate_idx" ON "LeaveApplication" USING btree ("endDate");--> statement-breakpoint
CREATE INDEX "LeaveApplication_bankId_idx" ON "LeaveApplication" USING btree ("bankId");