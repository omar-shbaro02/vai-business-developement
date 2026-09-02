ALTER TABLE "account_profiles" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "account_profiles" ADD COLUMN "locations" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "account_profiles" ADD COLUMN "industry_code" text;--> statement-breakpoint
ALTER TABLE "account_profiles" ADD COLUMN "industry_label" text;--> statement-breakpoint
ALTER TABLE "account_profiles" ADD COLUMN "industry_evidence_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "account_profiles" ADD COLUMN "size_context" jsonb;--> statement-breakpoint
ALTER TABLE "account_profiles" ADD COLUMN "context" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "account_profiles" ADD COLUMN "freshness" "freshness" DEFAULT 'UNKNOWN' NOT NULL;