CREATE TYPE "public"."currency" AS ENUM('USD', 'NGN', 'GHS', 'KES');--> statement-breakpoint
CREATE TYPE "public"."earning_status" AS ENUM('CONFIRMED', 'REVERSED');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'COMPLETED', 'REFUNDED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."payout_method_status" AS ENUM('PENDING', 'VERIFIED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."sale_status" AS ENUM('PENDING', 'PAID', 'REFUNDED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('CREATOR', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."withdrawal_status" AS ENUM('QUEUED', 'PROCESSING', 'PAID', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."withdrawal_trigger" AS ENUM('ON_DEMAND', 'SCHEDULED');--> statement-breakpoint
CREATE TABLE "creators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"available_balance" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"payout_currency" "currency" DEFAULT 'USD' NOT NULL,
	"payout_eligible" boolean DEFAULT false NOT NULL,
	"last_withdrawal_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creators_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "earnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"sale_id" uuid NOT NULL,
	"gross_amount" numeric(14, 2) NOT NULL,
	"platform_fee_percent" numeric(5, 2) NOT NULL,
	"platform_fee_amount" numeric(14, 2) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"currency" "currency" NOT NULL,
	"status" "earning_status" DEFAULT 'CONFIRMED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reversed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(150) NOT NULL,
	"role" "user_role" DEFAULT 'CREATOR' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "payout_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"afriex_customer_id" varchar(255) NOT NULL,
	"afriex_payment_method_id" varchar(255) NOT NULL,
	"currency" "currency" NOT NULL,
	"masked_account_number" varchar(8) NOT NULL,
	"bank_name" varchar(150),
	"encrypted_details_blob" text,
	"iv_base64" varchar(64),
	"status" "payout_method_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pool_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"currency" "currency" NOT NULL,
	"afriex_account_id" varchar(255) NOT NULL,
	"balance" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"payment_intent_id" varchar(255) NOT NULL,
	"gross_amount" numeric(14, 2) NOT NULL,
	"currency" "currency" NOT NULL,
	"status" "sale_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "withdrawals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"payout_method_id" uuid NOT NULL,
	"pool_account_id" uuid NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"currency" "currency" NOT NULL,
	"trigger" "withdrawal_trigger" NOT NULL,
	"status" "withdrawal_status" DEFAULT 'QUEUED' NOT NULL,
	"afriex_transaction_id" varchar(255),
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"failed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(14, 2) NOT NULL,
	"currency" "currency" DEFAULT 'USD' NOT NULL,
	"file_url" varchar(512),
	"file_name" varchar(255),
	"file_size" numeric(14, 0),
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"customer_id" uuid,
	"customer_email" varchar(255) NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"currency" "currency" NOT NULL,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"payment_session_id" varchar(255) NOT NULL,
	"download_token" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_payment_session_id_unique" UNIQUE("payment_session_id")
);
--> statement-breakpoint
ALTER TABLE "creators" ADD CONSTRAINT "creators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_methods" ADD CONSTRAINT "payout_methods_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_payout_method_id_payout_methods_id_fk" FOREIGN KEY ("payout_method_id") REFERENCES "public"."payout_methods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_pool_account_id_pool_accounts_id_fk" FOREIGN KEY ("pool_account_id") REFERENCES "public"."pool_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_creators_eligible_currency" ON "creators" USING btree ("payout_eligible","payout_currency");--> statement-breakpoint
CREATE INDEX "idx_customers_email" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_earnings_creator_created" ON "earnings" USING btree ("creator_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_earnings_sale" ON "earnings" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_payout_methods_creator" ON "payout_methods" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "idx_payout_methods_creator_status" ON "payout_methods" USING btree ("creator_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_pool_accounts_currency" ON "pool_accounts" USING btree ("currency");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_sales_payment_intent" ON "sales" USING btree ("payment_intent_id");--> statement-breakpoint
CREATE INDEX "idx_sales_creator_created" ON "sales" USING btree ("creator_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_sales_status" ON "sales" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_withdrawals_creator_created" ON "withdrawals" USING btree ("creator_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_withdrawals_status" ON "withdrawals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_withdrawals_pool_account" ON "withdrawals" USING btree ("pool_account_id");--> statement-breakpoint
CREATE INDEX "idx_withdrawals_afriex_transaction" ON "withdrawals" USING btree ("afriex_transaction_id");--> statement-breakpoint
CREATE INDEX "idx_products_creator" ON "products" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "idx_products_published" ON "products" USING btree ("published");--> statement-breakpoint
CREATE INDEX "idx_orders_customer_email" ON "orders" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "idx_orders_creator" ON "orders" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "idx_orders_product" ON "orders" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");