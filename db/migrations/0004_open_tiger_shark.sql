CREATE TYPE "public"."import_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'DEAD_LETTER');--> statement-breakpoint
CREATE TABLE "background_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "job_status" DEFAULT 'PENDING' NOT NULL,
	"idempotency_key" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"last_error" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discovery_import_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"field" text,
	"code" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discovery_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"status" "import_status" DEFAULT 'PENDING' NOT NULL,
	"filename" text NOT NULL,
	"source_reference" text NOT NULL,
	"raw_storage_reference" text,
	"cleanup_after" timestamp with time zone,
	"permission_attested" boolean NOT NULL,
	"attestation_text" text NOT NULL,
	"created_by" uuid NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"accepted_count" integer DEFAULT 0 NOT NULL,
	"rejected_count" integer DEFAULT 0 NOT NULL,
	"duplicate_candidate_count" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "import_permission_attested_check" CHECK ("discovery_imports"."permission_attested" = true)
);
--> statement-breakpoint
CREATE TABLE "discovery_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"import_id" uuid,
	"source_type" text NOT NULL,
	"source_reference" text NOT NULL,
	"source_record_id" text NOT NULL,
	"legal_name" text NOT NULL,
	"display_name" text NOT NULL,
	"website" text,
	"domain" text,
	"raw_record" jsonb,
	"captured_at" timestamp with time zone NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"topic" text NOT NULL,
	"aggregate_type" text NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"idempotency_key" text NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "background_jobs" ADD CONSTRAINT "background_jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_import_errors" ADD CONSTRAINT "discovery_import_errors_import_id_discovery_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."discovery_imports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_imports" ADD CONSTRAINT "discovery_imports_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_imports" ADD CONSTRAINT "discovery_imports_created_by_actors_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_records" ADD CONSTRAINT "discovery_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_records" ADD CONSTRAINT "discovery_records_import_id_discovery_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."discovery_imports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_records" ADD CONSTRAINT "discovery_records_created_by_actors_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "background_jobs_tenant_idempotency_uidx" ON "background_jobs" USING btree ("tenant_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "background_jobs_claim_idx" ON "background_jobs" USING btree ("status","available_at","created_at");--> statement-breakpoint
CREATE INDEX "import_errors_import_row_idx" ON "discovery_import_errors" USING btree ("import_id","row_number");--> statement-breakpoint
CREATE INDEX "discovery_imports_tenant_status_idx" ON "discovery_imports" USING btree ("tenant_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discovery_records_source_uidx" ON "discovery_records" USING btree ("tenant_id","source_type","source_reference","source_record_id");--> statement-breakpoint
CREATE INDEX "discovery_records_domain_idx" ON "discovery_records" USING btree ("tenant_id","domain");--> statement-breakpoint
CREATE UNIQUE INDEX "outbox_tenant_idempotency_uidx" ON "outbox_events" USING btree ("tenant_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "outbox_unpublished_idx" ON "outbox_events" USING btree ("published_at","created_at");
--> statement-breakpoint
CREATE FUNCTION prevent_append_only_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER audit_events_append_only BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW EXECUTE FUNCTION prevent_append_only_mutation();
--> statement-breakpoint
CREATE TRIGGER priority_decisions_append_only BEFORE UPDATE OR DELETE ON priority_decisions
FOR EACH ROW EXECUTE FUNCTION prevent_append_only_mutation();
--> statement-breakpoint
CREATE TRIGGER human_decisions_append_only BEFORE UPDATE OR DELETE ON human_decisions
FOR EACH ROW EXECUTE FUNCTION prevent_append_only_mutation();
--> statement-breakpoint
CREATE TRIGGER commercial_outcomes_append_only BEFORE UPDATE OR DELETE ON commercial_outcomes
FOR EACH ROW EXECUTE FUNCTION prevent_append_only_mutation();
