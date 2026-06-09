ALTER TABLE "ManualDocument" ADD COLUMN "uploadedBy" text;--> statement-breakpoint
ALTER TABLE "ManualDocument" ADD COLUMN "isVisibleToUsers" boolean DEFAULT false NOT NULL;