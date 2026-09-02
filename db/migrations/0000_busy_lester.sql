CREATE TYPE "public"."confidence" AS ENUM('HIGH', 'MEDIUM', 'LOW', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."freshness" AS ENUM('CURRENT', 'AGING', 'STALE', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."opportunity_status" AS ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'WON', 'LOST', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('P1', 'P2', 'P3', 'P4', 'HOLD', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('UNVERIFIED', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "access_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"type" text NOT NULL,
	"strength" "confidence" NOT NULL,
	"known_contact_id" uuid,
	"evidence_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_profiles" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tier" text NOT NULL,
	"tier_rule_version" text NOT NULL,
	"evidence_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "actors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"external_subject" text NOT NULL,
	"display_name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" uuid NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"request_id" text NOT NULL,
	"reason" text,
	"before" jsonb,
	"after" jsonb
);
--> statement-breakpoint
CREATE TABLE "commercial_outcomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"type" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"recorded_by" uuid NOT NULL,
	"supersedes_outcome_id" uuid
);
--> statement-breakpoint
CREATE TABLE "evidence_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"opportunity_id" uuid,
	"source_type" text NOT NULL,
	"source_reference" text,
	"captured_at" timestamp with time zone NOT NULL,
	"observed_at" timestamp with time zone,
	"evidence_type" text NOT NULL,
	"raw_value" jsonb NOT NULL,
	"confidence" "confidence" NOT NULL,
	"freshness" "freshness" NOT NULL,
	"verification_status" "verification_status" NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "human_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"system_priority_decision_id" uuid NOT NULL,
	"decision" text NOT NULL,
	"reason" text,
	"decided_by" uuid NOT NULL,
	"decided_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lifecycle_transitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"from_state" text NOT NULL,
	"to_state" text NOT NULL,
	"actor_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"supersedes_transition_id" uuid
);
--> statement-breakpoint
CREATE TABLE "commercial_opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "opportunity_status" NOT NULL,
	"problem_hypothesis_id" uuid NOT NULL,
	"current_assessment_id" uuid,
	"current_priority_decision_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_domains" (
	"tenant_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"source_type" text NOT NULL,
	"source_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_domains_organization_id_domain_pk" PRIMARY KEY("organization_id","domain")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"legal_name" text NOT NULL,
	"display_name" text NOT NULL,
	"source_type" text NOT NULL,
	"source_reference" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "priority_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"assessment_id" uuid NOT NULL,
	"priority" "priority" NOT NULL,
	"confidence" "confidence" NOT NULL,
	"factor_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rule_version" text NOT NULL,
	"calculated_at" timestamp with time zone NOT NULL,
	"supersedes_priority_decision_id" uuid
);
--> statement-breakpoint
CREATE TABLE "problem_hypotheses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"statement" text NOT NULL,
	"status" text NOT NULL,
	"evidence_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"validated_by" uuid,
	"validated_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qualification_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"dimensions" jsonb NOT NULL,
	"confidence" "confidence" NOT NULL,
	"missing_evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rule_version" text NOT NULL,
	"calculated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"priority_decision_id" uuid NOT NULL,
	"action_type" text NOT NULL,
	"status" text NOT NULL,
	"requires_human_approval" boolean DEFAULT true NOT NULL,
	"supporting_evidence_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recommendations_human_approval_check" CHECK ("recommendations"."requires_human_approval" = true)
);
--> statement-breakpoint
CREATE TABLE "rule_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"rule_type" text NOT NULL,
	"version" text NOT NULL,
	"definition" jsonb NOT NULL,
	"definition_hash" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"opportunity_id" uuid,
	"kind" text NOT NULL,
	"type" text NOT NULL,
	"value" jsonb NOT NULL,
	"evidence_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"model_metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "access_paths" ADD CONSTRAINT "access_paths_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_paths" ADD CONSTRAINT "access_paths_opportunity_id_commercial_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."commercial_opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_profiles" ADD CONSTRAINT "account_profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_profiles" ADD CONSTRAINT "account_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actors" ADD CONSTRAINT "actors_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_actors_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_outcomes" ADD CONSTRAINT "commercial_outcomes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_outcomes" ADD CONSTRAINT "commercial_outcomes_opportunity_id_commercial_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."commercial_opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_outcomes" ADD CONSTRAINT "commercial_outcomes_recorded_by_actors_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_opportunity_id_commercial_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."commercial_opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_created_by_actors_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_decisions" ADD CONSTRAINT "human_decisions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_decisions" ADD CONSTRAINT "human_decisions_opportunity_id_commercial_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."commercial_opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_decisions" ADD CONSTRAINT "human_decisions_system_priority_decision_id_priority_decisions_id_fk" FOREIGN KEY ("system_priority_decision_id") REFERENCES "public"."priority_decisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_decisions" ADD CONSTRAINT "human_decisions_decided_by_actors_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lifecycle_transitions" ADD CONSTRAINT "lifecycle_transitions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lifecycle_transitions" ADD CONSTRAINT "lifecycle_transitions_actor_id_actors_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_opportunities" ADD CONSTRAINT "commercial_opportunities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_opportunities" ADD CONSTRAINT "commercial_opportunities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_opportunities" ADD CONSTRAINT "commercial_opportunities_problem_hypothesis_id_problem_hypotheses_id_fk" FOREIGN KEY ("problem_hypothesis_id") REFERENCES "public"."problem_hypotheses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_opportunities" ADD CONSTRAINT "commercial_opportunities_created_by_actors_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_domains" ADD CONSTRAINT "organization_domains_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_domains" ADD CONSTRAINT "organization_domains_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_actors_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "priority_decisions" ADD CONSTRAINT "priority_decisions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "priority_decisions" ADD CONSTRAINT "priority_decisions_opportunity_id_commercial_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."commercial_opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "priority_decisions" ADD CONSTRAINT "priority_decisions_assessment_id_qualification_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."qualification_assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_hypotheses" ADD CONSTRAINT "problem_hypotheses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_hypotheses" ADD CONSTRAINT "problem_hypotheses_validated_by_actors_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_hypotheses" ADD CONSTRAINT "problem_hypotheses_created_by_actors_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qualification_assessments" ADD CONSTRAINT "qualification_assessments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qualification_assessments" ADD CONSTRAINT "qualification_assessments_opportunity_id_commercial_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."commercial_opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_opportunity_id_commercial_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."commercial_opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_priority_decision_id_priority_decisions_id_fk" FOREIGN KEY ("priority_decision_id") REFERENCES "public"."priority_decisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_versions" ADD CONSTRAINT "rule_versions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_versions" ADD CONSTRAINT "rule_versions_created_by_actors_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_opportunity_id_commercial_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."commercial_opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_paths_opportunity_idx" ON "access_paths" USING btree ("tenant_id","opportunity_id");--> statement-breakpoint
CREATE INDEX "account_profiles_tenant_tier_idx" ON "account_profiles" USING btree ("tenant_id","tier");--> statement-breakpoint
CREATE UNIQUE INDEX "actors_tenant_subject_uidx" ON "actors" USING btree ("tenant_id","external_subject");--> statement-breakpoint
CREATE INDEX "audit_resource_time_idx" ON "audit_events" USING btree ("tenant_id","resource_type","resource_id","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_actor_time_idx" ON "audit_events" USING btree ("tenant_id","actor_id","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_request_idx" ON "audit_events" USING btree ("tenant_id","request_id");--> statement-breakpoint
CREATE INDEX "outcomes_opportunity_time_idx" ON "commercial_outcomes" USING btree ("tenant_id","opportunity_id","occurred_at");--> statement-breakpoint
CREATE INDEX "evidence_org_captured_idx" ON "evidence_items" USING btree ("tenant_id","organization_id","captured_at");--> statement-breakpoint
CREATE INDEX "evidence_opportunity_idx" ON "evidence_items" USING btree ("tenant_id","opportunity_id");--> statement-breakpoint
CREATE INDEX "evidence_source_idx" ON "evidence_items" USING btree ("tenant_id","source_type","source_reference");--> statement-breakpoint
CREATE INDEX "human_decisions_opportunity_time_idx" ON "human_decisions" USING btree ("tenant_id","opportunity_id","decided_at");--> statement-breakpoint
CREATE INDEX "lifecycle_entity_time_idx" ON "lifecycle_transitions" USING btree ("tenant_id","entity_type","entity_id","occurred_at");--> statement-breakpoint
CREATE INDEX "opportunities_tenant_status_idx" ON "commercial_opportunities" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "opportunities_organization_idx" ON "commercial_opportunities" USING btree ("tenant_id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_domains_tenant_domain_uidx" ON "organization_domains" USING btree ("tenant_id","domain");--> statement-breakpoint
CREATE INDEX "organizations_tenant_name_idx" ON "organizations" USING btree ("tenant_id","display_name");--> statement-breakpoint
CREATE INDEX "organizations_source_idx" ON "organizations" USING btree ("tenant_id","source_type","source_reference");--> statement-breakpoint
CREATE INDEX "priority_decisions_opportunity_time_idx" ON "priority_decisions" USING btree ("tenant_id","opportunity_id","calculated_at");--> statement-breakpoint
CREATE INDEX "assessments_opportunity_time_idx" ON "qualification_assessments" USING btree ("tenant_id","opportunity_id","calculated_at");--> statement-breakpoint
CREATE INDEX "recommendations_opportunity_status_idx" ON "recommendations" USING btree ("tenant_id","opportunity_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "rule_versions_tenant_type_version_uidx" ON "rule_versions" USING btree ("tenant_id","rule_type","version");--> statement-breakpoint
CREATE INDEX "signals_org_kind_idx" ON "signals" USING btree ("tenant_id","organization_id","kind");