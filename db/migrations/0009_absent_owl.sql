ALTER TABLE "priority_decisions" ALTER COLUMN "priority" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."priority";--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('P1_PURSUE_NOW', 'P2_DEVELOP', 'P3_MONITOR', 'P4_LOW_PRIORITY', 'INSUFFICIENT_EVIDENCE', 'DISQUALIFIED');--> statement-breakpoint
ALTER TABLE "priority_decisions" ALTER COLUMN "priority" SET DATA TYPE "public"."priority" USING "priority"::"public"."priority";--> statement-breakpoint
ALTER TABLE "priority_decisions" ADD COLUMN "positive_factors" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "priority_decisions" ADD COLUMN "negative_factors" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "priority_decisions" ADD COLUMN "missing_evidence" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "priority_decisions" ADD COLUMN "disqualifying_rules" jsonb DEFAULT '[]'::jsonb NOT NULL;