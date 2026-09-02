CREATE TYPE "public"."merge_candidate_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "organization_aliases" (
	"tenant_id" uuid NOT NULL,
	"canonical_organization_id" uuid NOT NULL,
	"alias_organization_id" uuid NOT NULL,
	"merge_event_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_aliases_tenant_id_alias_organization_id_pk" PRIMARY KEY("tenant_id","alias_organization_id"),
	CONSTRAINT "organization_alias_not_self_check" CHECK ("organization_aliases"."canonical_organization_id" <> "organization_aliases"."alias_organization_id")
);
--> statement-breakpoint
CREATE TABLE "organization_merge_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"source_organization_id" uuid NOT NULL,
	"target_organization_id" uuid NOT NULL,
	"score" text NOT NULL,
	"reasons" jsonb NOT NULL,
	"status" "merge_candidate_status" DEFAULT 'PENDING' NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_reason" text,
	CONSTRAINT "merge_candidate_not_self_check" CHECK ("organization_merge_candidates"."source_organization_id" <> "organization_merge_candidates"."target_organization_id")
);
--> statement-breakpoint
CREATE TABLE "organization_merge_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"canonical_organization_id" uuid NOT NULL,
	"alias_organization_id" uuid NOT NULL,
	"moved_relationships" jsonb NOT NULL,
	"approved_by" uuid NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reason" text NOT NULL,
	"reversed_by" uuid,
	"reversed_at" timestamp with time zone,
	"reversal_reason" text
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "merged_into_id" uuid;--> statement-breakpoint
ALTER TABLE "organization_aliases" ADD CONSTRAINT "organization_aliases_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_aliases" ADD CONSTRAINT "organization_aliases_canonical_organization_id_organizations_id_fk" FOREIGN KEY ("canonical_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_aliases" ADD CONSTRAINT "organization_aliases_alias_organization_id_organizations_id_fk" FOREIGN KEY ("alias_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_merge_candidates" ADD CONSTRAINT "organization_merge_candidates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_merge_candidates" ADD CONSTRAINT "organization_merge_candidates_source_organization_id_organizations_id_fk" FOREIGN KEY ("source_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_merge_candidates" ADD CONSTRAINT "organization_merge_candidates_target_organization_id_organizations_id_fk" FOREIGN KEY ("target_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_merge_candidates" ADD CONSTRAINT "organization_merge_candidates_reviewed_by_actors_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_merge_events" ADD CONSTRAINT "organization_merge_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_merge_events" ADD CONSTRAINT "organization_merge_events_candidate_id_organization_merge_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."organization_merge_candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_merge_events" ADD CONSTRAINT "organization_merge_events_canonical_organization_id_organizations_id_fk" FOREIGN KEY ("canonical_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_merge_events" ADD CONSTRAINT "organization_merge_events_alias_organization_id_organizations_id_fk" FOREIGN KEY ("alias_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_merge_events" ADD CONSTRAINT "organization_merge_events_approved_by_actors_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_merge_events" ADD CONSTRAINT "organization_merge_events_reversed_by_actors_id_fk" FOREIGN KEY ("reversed_by") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organization_aliases_canonical_idx" ON "organization_aliases" USING btree ("tenant_id","canonical_organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "merge_candidates_pair_pending_uidx" ON "organization_merge_candidates" USING btree ("tenant_id","source_organization_id","target_organization_id","status");--> statement-breakpoint
CREATE INDEX "merge_candidates_tenant_status_idx" ON "organization_merge_candidates" USING btree ("tenant_id","status","detected_at");--> statement-breakpoint
CREATE INDEX "merge_events_alias_idx" ON "organization_merge_events" USING btree ("tenant_id","alias_organization_id","approved_at");