ALTER TYPE "public"."withdrawal_status" ADD VALUE 'UNKNOWN';--> statement-breakpoint
ALTER TABLE "creators" DROP COLUMN "available_balance";