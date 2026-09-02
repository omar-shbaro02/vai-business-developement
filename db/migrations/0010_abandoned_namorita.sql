ALTER TABLE "recommendations" ADD COLUMN "description" text NOT NULL;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "reason" text NOT NULL;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "material_uncertainties" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "confidence" "confidence" NOT NULL;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "explanation_origin" text NOT NULL;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "inference_id" uuid;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "expires_at" timestamp with time zone;