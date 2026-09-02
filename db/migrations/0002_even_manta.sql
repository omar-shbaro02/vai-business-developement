ALTER TABLE "evidence_items" ALTER COLUMN "verification_status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."verification_status";--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('RAW', 'REVIEWED', 'VERIFIED', 'REJECTED');--> statement-breakpoint
ALTER TABLE "evidence_items" ALTER COLUMN "verification_status" SET DATA TYPE "public"."verification_status" USING "verification_status"::"public"."verification_status";--> statement-breakpoint
ALTER TABLE "evidence_items" ADD COLUMN "normalized_value" jsonb;--> statement-breakpoint
ALTER TABLE "evidence_items" ADD COLUMN "review_notes" text;--> statement-breakpoint
ALTER TABLE "evidence_items" ADD COLUMN "supersedes_evidence_id" uuid;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "source_record_id" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "import_id" uuid;