-- Buyer accounts are gone: `users` is now the only identity, and an order points
-- at the account that bought it. Drop the old FK first — DROP TABLE ... CASCADE
-- would remove it silently and leave the generated DROP CONSTRAINT to fail.
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_customer_id_customers_id_fk";--> statement-breakpoint
-- Existing links point at customers rows, which no longer mean anything. Clearing
-- them loses nothing: orders carry the buyer's email, so signing in re-links them
-- (ordersRepository.linkGuestOrdersByEmail).
UPDATE "orders" SET "customer_id" = NULL WHERE "customer_id" IS NOT NULL;--> statement-breakpoint
DROP TABLE IF EXISTS "customers" CASCADE;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
