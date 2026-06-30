ALTER TABLE "customers" ADD COLUMN "session_token" varchar(64);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "session_expires_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_customers_session_token" ON "customers" USING btree ("session_token");--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_session_token_unique" UNIQUE("session_token");