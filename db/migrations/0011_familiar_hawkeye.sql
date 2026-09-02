ALTER TABLE "human_decisions" ADD COLUMN "previous_state" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "human_decisions" ADD COLUMN "selected_state" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "human_decisions" ADD COLUMN "supporting_evidence_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;