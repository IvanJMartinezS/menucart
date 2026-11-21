CREATE TABLE "failed_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"client" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "failed_attempts_lookup_idx" ON "failed_attempts" USING btree ("action","client","created_at");--> statement-breakpoint
CREATE INDEX "failed_attempts_created_at_idx" ON "failed_attempts" USING btree ("created_at");