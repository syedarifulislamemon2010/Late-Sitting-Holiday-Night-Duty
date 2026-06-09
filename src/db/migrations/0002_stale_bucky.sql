CREATE TABLE "ManualDocument" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"filePath" text NOT NULL,
	"fileSize" integer NOT NULL,
	"fileType" text NOT NULL,
	"uploadedAt" timestamp DEFAULT now() NOT NULL
);
