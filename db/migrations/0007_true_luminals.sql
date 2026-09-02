CREATE TYPE "public"."offer_mapping_status" AS ENUM('HYPOTHESIS', 'REVIEWED', 'APPROVED', 'REJECTED', 'SUPERSEDED');--> statement-breakpoint
CREATE TABLE "offer_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"offer_id" text NOT NULL,
	"label" text NOT NULL,
	"status" "offer_mapping_status" DEFAULT 'HYPOTHESIS' NOT NULL,
	"evidence_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"explanation" text NOT NULL,
	"origin" text NOT NULL,
	"inference_id" uuid,
	"created_by" uuid NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_reason" text,
	"supersedes_mapping_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunity_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"state" jsonb NOT NULL,
	"actor_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commercial_opportunities" ADD COLUMN "closure_reason" text;--> statement-breakpoint
ALTER TABLE "commercial_opportunities" ADD COLUMN "hold_reason" text;--> statement-breakpoint
ALTER TABLE "commercial_opportunities" ADD COLUMN "review_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "commercial_opportunities" ADD COLUMN "target_persona" jsonb DEFAULT '{"role":null,"known_contact_id":null,"evidence_ids":[]}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "commercial_opportunities" ADD COLUMN "current_offer_mapping_id" uuid;--> statement-breakpoint
ALTER TABLE "problem_hypotheses" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "problem_hypotheses" ADD COLUMN "opportunity_id" uuid;--> statement-breakpoint
ALTER TABLE "problem_hypotheses" ADD COLUMN "supersedes_hypothesis_id" uuid;--> statement-breakpoint
ALTER TABLE "offer_mappings" ADD CONSTRAINT "offer_mappings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_mappings" ADD CONSTRAINT "offer_mappings_opportunity_id_commercial_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."commercial_opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_mappings" ADD CONSTRAINT "offer_mappings_created_by_actors_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_mappings" ADD CONSTRAINT "offer_mappings_reviewed_by_actors_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_versions" ADD CONSTRAINT "opportunity_versions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_versions" ADD CONSTRAINT "opportunity_versions_opportunity_id_commercial_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."commercial_opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_versions" ADD CONSTRAINT "opportunity_versions_actor_id_actors_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "offer_mappings_opportunity_status_idx" ON "offer_mappings" USING btree ("tenant_id","opportunity_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "opportunity_versions_number_uidx" ON "opportunity_versions" USING btree ("tenant_id","opportunity_id","version");--> statement-breakpoint
ALTER TABLE "problem_hypotheses" ADD CONSTRAINT "problem_hypotheses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE TRIGGER opportunity_versions_append_only BEFORE UPDATE OR DELETE ON opportunity_versions
FOR EACH ROW EXECUTE FUNCTION prevent_append_only_mutation();
