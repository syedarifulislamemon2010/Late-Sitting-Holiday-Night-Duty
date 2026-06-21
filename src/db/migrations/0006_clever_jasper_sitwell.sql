ALTER TABLE "Employee" ADD COLUMN "userId" integer;--> statement-breakpoint
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "Employee_userId_idx" ON "Employee" USING btree ("userId");