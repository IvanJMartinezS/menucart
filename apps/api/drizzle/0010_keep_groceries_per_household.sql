-- Edited by hand: the column is filled in before it becomes NOT NULL, so groceries saved before
-- accounts existed are kept. They go to the first household registered; if there is none yet,
-- one is created for them, so this migration works on any database.
DROP INDEX "groceries_name_unique";--> statement-breakpoint
ALTER TABLE "groceries" ADD COLUMN "household_id" uuid;--> statement-breakpoint
INSERT INTO "households" ("name")
  SELECT 'Mi hogar'
  WHERE EXISTS (SELECT 1 FROM "groceries") AND NOT EXISTS (SELECT 1 FROM "households");--> statement-breakpoint
UPDATE "groceries"
  SET "household_id" = (SELECT "id" FROM "households" ORDER BY "created_at", "id" LIMIT 1);--> statement-breakpoint
ALTER TABLE "groceries" ALTER COLUMN "household_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "groceries" ADD CONSTRAINT "groceries_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "groceries_name_unique" ON "groceries" USING btree ("household_id",lower("name"));
