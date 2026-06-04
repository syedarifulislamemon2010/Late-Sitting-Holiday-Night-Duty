CREATE TABLE "AuditLog" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"action" text NOT NULL,
	"entityType" text,
	"entityId" text,
	"ipAddress" text,
	"macAddress" text,
	"userAgent" text,
	"details" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Cell" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Cell_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "ChatMessage" (
	"id" serial PRIMARY KEY NOT NULL,
	"chatId" integer NOT NULL,
	"senderId" integer NOT NULL,
	"message" text NOT NULL,
	"attachmentUrl" text,
	"attachmentName" text,
	"attachmentSize" integer,
	"isUnsent" boolean DEFAULT false NOT NULL,
	"deletedForUsers" text DEFAULT '[]' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ChatParticipant" (
	"id" serial PRIMARY KEY NOT NULL,
	"chatId" integer NOT NULL,
	"userId" integer NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"lastReadAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Chat" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"name" text,
	"avatar" text,
	"creatorId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Document" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"filePath" text NOT NULL,
	"fileSize" integer NOT NULL,
	"uploadedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Duty" (
	"id" serial PRIMARY KEY NOT NULL,
	"employeeId" integer NOT NULL,
	"type" text NOT NULL,
	"date" text NOT NULL,
	"description" text,
	"allowance1" double precision NOT NULL,
	"allowance2" double precision NOT NULL,
	"totalBill" double precision NOT NULL,
	"orderRef" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Employee" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"designation" text NOT NULL,
	"bankId" text,
	"fileNo" text,
	"mobile" text,
	"cellId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Executive" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"designation" text NOT NULL,
	"phone" text,
	"email" text,
	"bankId" text,
	"fileNo" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "FeedbackMessage" (
	"id" serial PRIMARY KEY NOT NULL,
	"feedbackId" integer NOT NULL,
	"senderId" integer NOT NULL,
	"message" text NOT NULL,
	"attachmentUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"userId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Holiday" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"name" text NOT NULL,
	"isWorkingDay" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Holiday_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "LeaveApplication" (
	"id" serial PRIMARY KEY NOT NULL,
	"leaveType" text NOT NULL,
	"startDate" text NOT NULL,
	"endDate" text NOT NULL,
	"applicationDate" text NOT NULL,
	"applicantName" text NOT NULL,
	"designation" text NOT NULL,
	"bankId" text NOT NULL,
	"fileNo" text,
	"cellName" text NOT NULL,
	"leaveLocation" text NOT NULL,
	"mobileNo" text NOT NULL,
	"selectedDistrict" text,
	"delegateId" text,
	"casualTotal" integer NOT NULL,
	"casualUsed" integer NOT NULL,
	"ordinaryTotal" integer NOT NULL,
	"ordinaryUsed" integer NOT NULL,
	"specialTotal" integer NOT NULL,
	"specialUsed" integer NOT NULL,
	"userId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LunchBill" (
	"id" serial PRIMARY KEY NOT NULL,
	"month" text NOT NULL,
	"cellId" integer NOT NULL,
	"workingDays" integer NOT NULL,
	"recordsJson" text NOT NULL,
	"generatedBy" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Notification" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"link" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OfficeOrder" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderRef" text NOT NULL,
	"orderDate" text NOT NULL,
	"category" text NOT NULL,
	"employeeName" text NOT NULL,
	"cellName" text,
	"dutiesJson" text NOT NULL,
	"contentJson" text,
	"status" text DEFAULT 'Printed' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "OfficeOrder_orderRef_unique" UNIQUE("orderRef")
);
--> statement-breakpoint
CREATE TABLE "Trash" (
	"id" serial PRIMARY KEY NOT NULL,
	"entityType" text NOT NULL,
	"entityId" integer NOT NULL,
	"name" text NOT NULL,
	"data" text NOT NULL,
	"deletedBy" text,
	"deletedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_UserCells" (
	"A" integer NOT NULL,
	"B" integer NOT NULL,
	CONSTRAINT "_UserCells_A_B_pk" PRIMARY KEY("A","B")
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'USER' NOT NULL,
	"mobile" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "User_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_User_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Duty" ADD CONSTRAINT "Duty_employeeId_Employee_id_fk" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_cellId_Cell_id_fk" FOREIGN KEY ("cellId") REFERENCES "public"."Cell"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "FeedbackMessage" ADD CONSTRAINT "FeedbackMessage_feedbackId_Feedback_id_fk" FOREIGN KEY ("feedbackId") REFERENCES "public"."Feedback"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "FeedbackMessage" ADD CONSTRAINT "FeedbackMessage_senderId_User_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "LunchBill" ADD CONSTRAINT "LunchBill_cellId_Cell_id_fk" FOREIGN KEY ("cellId") REFERENCES "public"."Cell"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "_UserCells" ADD CONSTRAINT "_UserCells_A_Cell_id_fk" FOREIGN KEY ("A") REFERENCES "public"."Cell"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "_UserCells" ADD CONSTRAINT "_UserCells_B_User_id_fk" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ChatParticipant_chatId_userId_key" ON "ChatParticipant" USING btree ("chatId","userId");--> statement-breakpoint
CREATE INDEX "Duty_orderRef_idx" ON "Duty" USING btree ("orderRef");--> statement-breakpoint
CREATE INDEX "LeaveApplication_userId_idx" ON "LeaveApplication" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "LunchBill_month_cellId_key" ON "LunchBill" USING btree ("month","cellId");--> statement-breakpoint
CREATE INDEX "Notification_userId_idx" ON "Notification" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "OfficeOrder_orderRef_idx" ON "OfficeOrder" USING btree ("orderRef");--> statement-breakpoint
CREATE INDEX "_UserCells_AB_unique" ON "_UserCells" USING btree ("A","B");--> statement-breakpoint
CREATE INDEX "_UserCells_B_index" ON "_UserCells" USING btree ("B");