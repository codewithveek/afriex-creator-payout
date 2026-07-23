CREATE TABLE IF NOT EXISTS "creator_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"currency" "currency" NOT NULL,
	"available_balance" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "creator_balances" ADD CONSTRAINT "creator_balances_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_creator_balances_creator_currency" ON "creator_balances" USING btree ("creator_id","currency");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_creator_balances_positive" ON "creator_balances" USING btree ("creator_id","available_balance");
--> statement-breakpoint
-- Backfill one balance row per creator from legacy single-currency column
INSERT INTO "creator_balances" ("creator_id", "currency", "available_balance", "created_at", "updated_at")
SELECT "id", "payout_currency", "available_balance", "created_at", "updated_at"
FROM "creators"
ON CONFLICT ("creator_id", "currency") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "download_token_expires_at" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_customer_id" ON "orders" USING btree ("customer_id");
