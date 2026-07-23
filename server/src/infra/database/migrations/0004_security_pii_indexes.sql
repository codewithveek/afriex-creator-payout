-- Security: PII encryption columns, blind indexes, session/token hashes, extra indexes

-- Creators phone blind index
ALTER TABLE "creators" ALTER COLUMN "phone" TYPE text USING "phone"::text;
--> statement-breakpoint
ALTER TABLE "creators" ADD COLUMN IF NOT EXISTS "phone_hash" varchar(64);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_creators_phone_hash" ON "creators" USING btree ("phone_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_creators_user_id" ON "creators" USING btree ("user_id");
--> statement-breakpoint

-- Customers: widen email/name for ciphertext; add email_hash; replace session token with hash
ALTER TABLE "customers" ALTER COLUMN "email" TYPE text USING "email"::text;
--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "name" TYPE text USING "name"::text;
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "email_hash" varchar(64);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "session_token_hash" varchar(64);
--> statement-breakpoint
-- Backfill placeholder hashes for existing rows (app will re-hash on next login/write)
UPDATE "customers" SET "email_hash" = encode(sha256(lower(trim("email"))::bytea), 'hex') WHERE "email_hash" IS NULL OR "email_hash" = '';
--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "email_hash" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_customers_email_hash" ON "customers" USING btree ("email_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customers_session_token_hash" ON "customers" USING btree ("session_token_hash");
--> statement-breakpoint
-- Drop obsolete unique on plaintext email if present (email is now ciphertext)
DROP INDEX IF EXISTS "idx_customers_email";
--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN IF EXISTS "session_token";
--> statement-breakpoint

-- Orders: PII encryption + email hash + download token hash
ALTER TABLE "orders" ALTER COLUMN "customer_email" TYPE text USING "customer_email"::text;
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "customer_name" TYPE text USING "customer_name"::text;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_email_hash" varchar(64) DEFAULT '';
--> statement-breakpoint
UPDATE "orders" SET "customer_email_hash" = encode(sha256(lower(trim("customer_email"))::bytea), 'hex')
  WHERE "customer_email_hash" IS NULL OR "customer_email_hash" = '';
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "customer_email_hash" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "download_token_hash" varchar(64);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "download_token_encrypted" text;
--> statement-breakpoint
-- Legacy raw tokens: hash for verification (encryption backfill happens on renew/complete in app)
UPDATE "orders" SET "download_token_hash" = encode(sha256(convert_to("download_token", 'UTF8')), 'hex')
  WHERE "download_token" IS NOT NULL AND "download_token_hash" IS NULL;
--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN IF EXISTS "download_token";
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_orders_customer_email";
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_customer_email_hash" ON "orders" USING btree ("customer_email_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_download_token_hash" ON "orders" USING btree ("download_token_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_creator_status_created" ON "orders" USING btree ("creator_id","status","created_at");
--> statement-breakpoint
-- Drop unique constraint on customers.email if it still targets plaintext column
ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_email_unique";
--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_email_key";
--> statement-breakpoint

-- Products listing indexes
CREATE INDEX IF NOT EXISTS "idx_products_published_created" ON "products" USING btree ("published","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_creator_published" ON "products" USING btree ("creator_id","published");
--> statement-breakpoint

-- Users admin filters
CREATE INDEX IF NOT EXISTS "idx_users_role_email" ON "users" USING btree ("role","email");
