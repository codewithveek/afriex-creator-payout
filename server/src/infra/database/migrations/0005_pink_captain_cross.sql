CREATE TABLE IF NOT EXISTS "creator_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"currency" "currency" NOT NULL,
	"available_balance" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'session_token')
		AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'session_token_hash') THEN
		ALTER TABLE "customers" RENAME COLUMN "session_token" TO "session_token_hash";
	END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'download_token')
		AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'download_token_encrypted') THEN
		ALTER TABLE "orders" RENAME COLUMN "download_token" TO "download_token_encrypted";
	END IF;
END $$;--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_email_unique";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_session_token_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_customers_email";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_customers_session_token";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_orders_customer_email";--> statement-breakpoint
ALTER TABLE "creators" ALTER COLUMN "phone" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "creators" ALTER COLUMN "phone" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "email" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "customer_email" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "customer_name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "creators" ADD COLUMN IF NOT EXISTS "phone_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "email_hash" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_email_hash" varchar(64) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "download_token_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "download_token_expires_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'creator_balances_creator_id_creators_id_fk') THEN
		ALTER TABLE "creator_balances" ADD CONSTRAINT "creator_balances_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_creator_balances_creator_currency" ON "creator_balances" USING btree ("creator_id","currency");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_creator_balances_positive" ON "creator_balances" USING btree ("creator_id","available_balance");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_creators_phone_hash" ON "creators" USING btree ("phone_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_creators_user_id" ON "creators" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_customers_email_hash" ON "customers" USING btree ("email_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customers_session_token_hash" ON "customers" USING btree ("session_token_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_role_email" ON "users" USING btree ("role","email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_published_created" ON "products" USING btree ("published","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_creator_published" ON "products" USING btree ("creator_id","published");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_customer_email_hash" ON "orders" USING btree ("customer_email_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_customer_id" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_download_token_hash" ON "orders" USING btree ("download_token_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_creator_status_created" ON "orders" USING btree ("creator_id","status","created_at");
