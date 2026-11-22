-- Edited by hand: the column is filled in before it becomes NOT NULL, so plans saved before
-- accounts existed are kept. They go to the first household registered; if there is none yet,
-- one is created for them, so this migration works on any database.
ALTER TABLE "plans" ADD COLUMN "household_id" uuid;--> statement-breakpoint
INSERT INTO "households" ("name")
  SELECT 'Mi hogar'
  WHERE EXISTS (SELECT 1 FROM "plans") AND NOT EXISTS (SELECT 1 FROM "households");--> statement-breakpoint
UPDATE "plans"
  SET "household_id" = (SELECT "id" FROM "households" ORDER BY "created_at", "id" LIMIT 1);--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "household_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Plans cannot overlap within a household, but two households can have plans on the same days.
-- Comparing the household (a uuid) with `=` inside a GiST index needs the `btree_gist` extension.
-- The index of the constraint also serves searches by household.
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "plans" DROP CONSTRAINT "plans_no_overlap";--> statement-breakpoint
ALTER TABLE "plans"
  ADD CONSTRAINT "plans_no_overlap"
  EXCLUDE USING gist ("household_id" WITH =, daterange("start_date", "end_date", '[]') WITH &&);
