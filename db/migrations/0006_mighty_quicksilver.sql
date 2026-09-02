ALTER TABLE "qualification_assessments" ADD COLUMN "confidence_factors" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "qualification_assessments" ADD COLUMN "supersedes_assessment_id" uuid;
--> statement-breakpoint
CREATE TRIGGER qualification_assessments_append_only BEFORE UPDATE OR DELETE ON qualification_assessments
FOR EACH ROW EXECUTE FUNCTION prevent_append_only_mutation();
