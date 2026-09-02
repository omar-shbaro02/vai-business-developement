ALTER TABLE "commercial_opportunities" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."opportunity_status";--> statement-breakpoint
CREATE TYPE "public"."opportunity_status" AS ENUM('DRAFT', 'ACTIVE', 'ON_HOLD', 'CLOSED');--> statement-breakpoint
ALTER TABLE "commercial_opportunities" ALTER COLUMN "status" SET DATA TYPE "public"."opportunity_status" USING "status"::"public"."opportunity_status";