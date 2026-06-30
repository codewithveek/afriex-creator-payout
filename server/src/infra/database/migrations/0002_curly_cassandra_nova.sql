ALTER TABLE "creators" ADD COLUMN "phone" varchar(20) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "creators" ADD COLUMN "country" varchar(2) DEFAULT 'NG' NOT NULL;